import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = { mute: "Silenciado", block: "Bloqueado" };

export default async function AdminModerationPage() {
  const admin = createAdminClient();

  const { data: actions } = await admin
    .from("moderation_actions")
    .select(
      "id, action_type, created_at, actor:profiles!moderation_actions_actor_id_fkey(username), target:profiles!moderation_actions_target_id_fkey(username, buyer_status)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Moderación</h1>
      <p className="text-xs text-muted-foreground">
        Historial de acciones de moderación. Silenciar/bloquear usuarios se hace desde{" "}
        <a href="/admin/users" className="text-primary underline">
          Usuarios
        </a>
        .
      </p>

      <div className="flex flex-col gap-2">
        {(actions ?? []).map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3"
          >
            <div className="flex flex-col gap-0.5 text-sm">
              <span>
                @{a.actor?.username} → @{a.target?.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleString("es-MX")}
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                a.action_type === "block" ? "bg-destructive/15 text-destructive" : "bg-gold/15 text-gold",
              )}
            >
              {ACTION_LABELS[a.action_type] ?? a.action_type}
            </span>
          </div>
        ))}
        {(!actions || actions.length === 0) && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin acciones de moderación todavía.
          </p>
        )}
      </div>
    </div>
  );
}
