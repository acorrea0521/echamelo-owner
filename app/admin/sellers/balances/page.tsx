import { createAdminClient } from "@/lib/supabase/admin";
import { TransferButton } from "@/components/admin/TransferButton";
import { cn } from "@/lib/utils";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

export default async function AdminSellerBalancesPage() {
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select(
      "seller_id, seller_payout_cents, seller:profiles!orders_seller_id_fkey(username, display_name, stripe_payouts_enabled, payout_requested_at)",
    )
    .eq("status", "paid");

  const bySeller = new Map<
    string,
    { username: string; displayName: string | null; payoutsEnabled: boolean; requestedAt: string | null; balanceCents: number }
  >();

  for (const o of orders ?? []) {
    if (!o.seller) continue;
    const existing = bySeller.get(o.seller_id);
    if (existing) {
      existing.balanceCents += o.seller_payout_cents ?? 0;
    } else {
      bySeller.set(o.seller_id, {
        username: o.seller.username,
        displayName: o.seller.display_name,
        payoutsEnabled: o.seller.stripe_payouts_enabled,
        requestedAt: o.seller.payout_requested_at,
        balanceCents: o.seller_payout_cents ?? 0,
      });
    }
  }

  const sellers = Array.from(bySeller.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => Number(Boolean(b.requestedAt)) - Number(Boolean(a.requestedAt)) || b.balanceCents - a.balanceCents);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Saldo por vendedor</h1>
      <p className="text-xs text-muted-foreground">
        Solo vendedores con saldo pendiente (órdenes pagadas aún no transferidas).
      </p>

      <div className="flex flex-col gap-2">
        {sellers.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">
                @{s.username} {s.requestedAt && <span className="text-gold">· solicitó pago</span>}
              </span>
              <span className="text-lg font-bold text-gold">{formatCents(s.balanceCents)}</span>
              <span
                className={cn(
                  "w-fit rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  s.payoutsEnabled ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive",
                )}
              >
                {s.payoutsEnabled ? "Banco conectado" : "Sin banco conectado"}
              </span>
            </div>
            {s.payoutsEnabled && <TransferButton sellerId={s.id} />}
          </div>
        ))}
        {sellers.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No hay saldos pendientes.
          </p>
        )}
      </div>
    </div>
  );
}
