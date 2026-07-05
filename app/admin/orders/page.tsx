import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-gold/15 text-gold",
  paid: "bg-primary/15 text-primary",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-surface-2 text-muted-foreground",
  completed: "bg-primary/15 text-primary",
  payout_processing: "bg-gold/15 text-gold",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagada",
  failed: "Fallida",
  refunded: "Reembolsada",
  completed: "Completada",
  payout_processing: "Procesando pago a vendedor",
};

export default async function AdminOrdersPage() {
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select(
      "id, status, item_price_cents, shipping_cost_cents, platform_fee_cents, total_charged_cents, created_at, stripe_payment_intent_id, buyer:profiles!orders_buyer_id_fkey(username), seller:profiles!orders_seller_id_fkey(username)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Órdenes</h1>

      <div className="flex flex-col gap-2">
        {(orders ?? []).map((o) => (
          <div key={o.id} className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{formatCents(o.total_charged_cents)}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLES[o.status])}>
                {STATUS_LABELS[o.status] ?? o.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                @{o.buyer?.username} → @{o.seller?.username}
              </span>
              <span>{new Date(o.created_at).toLocaleDateString("es-MX")}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>Producto: {formatCents(o.item_price_cents)}</span>
              <span>Envío: {formatCents(o.shipping_cost_cents)}</span>
              <span>Comisión: {formatCents(o.platform_fee_cents)}</span>
            </div>
            {o.stripe_payment_intent_id && (
              <span className="truncate text-[10px] text-muted-foreground/70">
                {o.stripe_payment_intent_id}
              </span>
            )}
          </div>
        ))}
        {(!orders || orders.length === 0) && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin órdenes.
          </p>
        )}
      </div>
    </div>
  );
}
