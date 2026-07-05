import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [
    { count: liveStreams },
    { count: totalUsers },
    { count: pendingApplications },
    { data: settledOrders },
  ] = await Promise.all([
    admin.from("streams").select("id", { count: "exact", head: true }).eq("status", "live"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("seller_applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "in_review"]),
    // 'paid' = captured, not yet transferred to the seller; 'completed' =
    // already transferred (see /api/admin/sellers/[id]/transfer). Both count
    // toward GMV; only 'paid' counts toward "pending to transfer."
    admin
      .from("orders")
      .select("total_charged_cents, platform_fee_cents, stripe_fee_cents, seller_payout_cents, status")
      .in("status", ["paid", "completed"]),
  ]);

  const gmvCents = (settledOrders ?? []).reduce((sum, o) => sum + o.total_charged_cents, 0);
  const platformFeeCents = (settledOrders ?? []).reduce((sum, o) => sum + o.platform_fee_cents, 0);
  const stripeFeeCents = (settledOrders ?? []).reduce((sum, o) => sum + (o.stripe_fee_cents ?? 0), 0);
  const pendingPayoutCents = (settledOrders ?? [])
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + (o.seller_payout_cents ?? 0), 0);
  const stripeFeePercent = gmvCents > 0 ? (stripeFeeCents / gmvCents) * 100 : 0;

  const stats = [
    { label: "Streams en vivo", value: liveStreams ?? 0, href: "/admin/streams" },
    { label: "Usuarios totales", value: totalUsers ?? 0, href: "/admin/users" },
    { label: "Solicitudes pendientes", value: pendingApplications ?? 0, href: "/admin/sellers" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold">Resumen</h1>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3"
          >
            <span className="text-2xl font-bold">{stat.value}</span>
            <span className="text-[11px] text-muted-foreground">{stat.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground/90">Ventas (GMV)</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total vendido (pagado)</span>
          <span className="font-semibold">{formatCents(gmvCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Comisión de la plataforma (8%)</span>
          <span className="font-semibold text-primary">{formatCents(platformFeeCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Stripe Fee {gmvCents > 0 && `(~${stripeFeePercent.toFixed(1)}%)`}
          </span>
          <span className="font-semibold text-destructive">{formatCents(stripeFeeCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pendiente de transferir a vendedores</span>
          <span className="font-semibold text-gold">{formatCents(pendingPayoutCents)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Stripe Fee es el costo real de procesamiento (lo absorbe el vendedor).{" "}
          <Link href="/admin/sellers/balances" className="text-primary underline">
            Ver saldo por vendedor y transferir
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
