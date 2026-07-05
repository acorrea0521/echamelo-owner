import { createAdminClient } from "@/lib/supabase/admin";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { AdminBotConfig } from "@/components/admin/AdminBotConfig";
import { OfficialBadge } from "@/components/ui/OfficialBadge";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = { buyer: "Comprador", seller: "Vendedor" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const { q, role } = await searchParams;
  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select(
      "id, username, display_name, role, is_admin, is_official_admin, seller_status, buyer_status, stripe_charges_enabled, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (role) query = query.eq("role", role);
  if (q) query = query.ilike("username", `%${q}%`);

  const { data: users } = await query;

  const sellerIds = (users ?? []).filter((u) => u.role === "seller").map((u) => u.id);
  const { data: botConfigs } = sellerIds.length
    ? await admin.from("bot_configs").select("seller_id, enabled, max_bots").in("seller_id", sellerIds)
    : { data: [] };
  const botConfigBySeller = new Map((botConfigs ?? []).map((b) => [b.seller_id, b]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Usuarios</h1>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por usuario..."
          className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm"
        />
        <select
          name="role"
          defaultValue={role ?? ""}
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="buyer">Compradores</option>
          <option value="seller">Vendedores</option>
        </select>
        <button type="submit" className="h-9 rounded-lg bg-surface px-3 text-sm font-medium">
          Filtrar
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {(users ?? []).map((u) => (
          <div
            key={u.id}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  {u.is_official_admin && <OfficialBadge />}
                  <span className="truncate text-sm font-semibold">@{u.username}</span>
                  {u.is_admin && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {u.role ? ROLE_LABELS[u.role] : "Sin rol"}
                  {u.role === "seller" && ` · ${u.seller_status}`}
                  {u.role === "buyer" && ` · ${u.buyer_status}`}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {u.role === "seller" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      u.stripe_charges_enabled ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground",
                    )}
                  >
                    {u.stripe_charges_enabled ? "Banco OK" : "Sin banco"}
                  </span>
                )}
                {!u.is_admin && <ModerationActions userId={u.id} isBlocked={u.buyer_status === "bloqueado"} />}
              </div>
            </div>
            {u.role === "seller" && (
              <AdminBotConfig
                sellerId={u.id}
                initialEnabled={botConfigBySeller.get(u.id)?.enabled ?? false}
                initialMaxBots={botConfigBySeller.get(u.id)?.max_bots ?? 3}
              />
            )}
          </div>
        ))}
        {(!users || users.length === 0) && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin resultados.
          </p>
        )}
      </div>
    </div>
  );
}
