import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestPayoutButton } from "@/components/seller/RequestPayoutButton";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

export default async function EarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, payout_requested_at")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller") redirect("/home");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, item_price_cents, shipping_cost_cents, seller_payout_cents, created_at")
    .eq("seller_id", user.id)
    .in("status", ["paid", "completed"])
    .order("created_at", { ascending: false });

  const pending = (orders ?? []).filter((o) => o.status === "paid");
  const completed = (orders ?? []).filter((o) => o.status === "completed");
  const pendingCents = pending.reduce((sum, o) => sum + (o.seller_payout_cents ?? 0), 0);
  const paidOutCents = completed.reduce((sum, o) => sum + (o.seller_payout_cents ?? 0), 0);

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <h1 className="text-lg font-bold">Mis ganancias</h1>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
        <span className="text-xs text-muted-foreground">Saldo pendiente de transferir</span>
        <span className="text-3xl font-bold text-gold">{formatCents(pendingCents)}</span>
        <span className="text-xs text-muted-foreground">
          {pending.length} {pending.length === 1 ? "venta" : "ventas"} pagadas por compradores, aún no
          transferidas a tu cuenta bancaria.
        </span>

        {pendingCents > 0 && (
          <div className="mt-2">
            <RequestPayoutButton alreadyRequested={Boolean(profile?.payout_requested_at)} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <span className="text-sm text-muted-foreground">Total transferido históricamente</span>
        <span className="text-sm font-semibold text-primary">{formatCents(paidOutCents)}</span>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground/90">Historial de ventas</h2>
        {(orders ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aún no tienes ventas.
          </p>
        ) : (
          (orders ?? []).map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{formatCents(o.seller_payout_cents ?? 0)}</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("es-MX")}
                </span>
              </div>
              <span
                className={
                  o.status === "completed"
                    ? "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary"
                    : "rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold"
                }
              >
                {o.status === "completed" ? "Transferido" : "Pendiente"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
