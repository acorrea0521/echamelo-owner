import { createAdminClient } from "@/lib/supabase/admin";
import { DemoUserForm } from "@/components/admin/DemoUserForm";
import { DeleteDemoUserButton } from "@/components/admin/DeleteDemoUserButton";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

export default async function AdminDemoPage() {
  const admin = createAdminClient();

  const [{ data: categories }, { data: demoUsers }, { data: simulatedOrders }, { data: allSimulated }] =
    await Promise.all([
    admin.from("categories").select("id, name").order("sort_order"),
    admin
      .from("profiles")
      .select("id, username, display_name, role, created_at")
      .eq("is_demo", true)
      .order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select("id, total_charged_cents, seller_id, buyer_id, created_at")
      .eq("is_simulated", true)
      .order("created_at", { ascending: false })
      .limit(20),
    // The list above is capped at 20; the tile and the total must count every
    // simulated sale, not just the page being shown.
    admin.from("orders").select("total_charged_cents").eq("is_simulated", true),
  ]);

  const sellers = (demoUsers ?? []).filter((u) => u.role === "seller");
  const buyers = (demoUsers ?? []).filter((u) => u.role === "buyer");
  const simulatedTotalCents = (allSimulated ?? []).reduce(
    (sum, o) => sum + o.total_charged_cents,
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">Cuentas demo</h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Circuito cerrado: los lives de estos vendedores <strong>solo</strong> los ven estos
          compradores, y estos compradores <strong>no ven</strong> ningún live real. Pujan sin
          tarjeta y sin verificación de identidad, y lo que ganan genera una orden simulada — nunca
          pasa por Stripe ni suma a tus ingresos o saldos reales.
        </p>
      </div>

      <DemoUserForm categories={categories ?? []} />

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3">
          <span className="text-2xl font-bold">{sellers.length}</span>
          <span className="text-[11px] text-muted-foreground">Vendedores demo</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3">
          <span className="text-2xl font-bold">{buyers.length}</span>
          <span className="text-[11px] text-muted-foreground">Compradores demo</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3">
          <span className="text-2xl font-bold">{allSimulated?.length ?? 0}</span>
          <span className="text-[11px] text-muted-foreground">Ventas simuladas</span>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Cuentas ({demoUsers?.length ?? 0})</h2>
        {(demoUsers ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">Todavía no hay cuentas demo.</p>
        )}
        <ul className="flex flex-col gap-2">
          {(demoUsers ?? []).map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  @{user.username}
                  {user.display_name && user.display_name !== user.username && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {user.display_name}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {user.role === "seller" ? "Vendedor" : "Comprador"} ·{" "}
                  {new Date(user.created_at).toLocaleDateString("es-MX")}
                </span>
              </div>
              <DeleteDemoUserButton userId={user.id} username={user.username} />
            </li>
          ))}
        </ul>
      </section>

      {(simulatedOrders ?? []).length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">
            Últimas ventas simuladas{(allSimulated?.length ?? 0) > 20 ? " (20 de " + allSimulated!.length + ")" : ""}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {formatCents(simulatedTotalCents)} en total — excluido de Resumen, Órdenes y Saldos.
          </p>
          <ul className="flex flex-col gap-1.5">
            {(simulatedOrders ?? []).map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("es-MX")}
                </span>
                <span className="font-medium">{formatCents(order.total_charged_cents)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
