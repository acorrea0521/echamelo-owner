import { createAdminClient } from "@/lib/supabase/admin";
import { TicketActions } from "@/components/admin/TicketActions";

export default async function AdminTicketsPage() {
  const admin = createAdminClient();

  const { data: tickets } = await admin
    .from("support_tickets")
    .select("id, subject, body, status, conversation_id, created_at, user:profiles!support_tickets_user_id_fkey(username)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: true });

  const open = (tickets ?? []).filter((t) => t.status === "open");
  const closed = (tickets ?? []).filter((t) => t.status === "closed");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold">Tickets de soporte</h1>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border bg-surface p-3">
          <span className="text-2xl font-bold text-gold">{open.length}</span>
          <p className="text-[11px] text-muted-foreground">Abiertos</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <span className="text-2xl font-bold text-primary">{closed.length}</span>
          <p className="text-[11px] text-muted-foreground">Resueltos</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground/90">Abiertos</h2>
        {open.map((t) => (
          <div key={t.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{t.subject}</span>
                <span className="text-xs text-muted-foreground">
                  @{t.user?.username} · {new Date(t.created_at).toLocaleDateString("es-MX")}
                </span>
              </div>
              <TicketActions ticketId={t.id} status={t.status} conversationId={t.conversation_id} />
            </div>
            <p className="text-xs text-muted-foreground">{t.body}</p>
          </div>
        ))}
        {open.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin tickets abiertos.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground/90">Resueltos</h2>
        {closed.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{t.subject}</span>
              <span className="text-xs text-muted-foreground">@{t.user?.username}</span>
            </div>
            <TicketActions ticketId={t.id} status={t.status} conversationId={t.conversation_id} />
          </div>
        ))}
        {closed.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin tickets resueltos todavía.
          </p>
        )}
      </div>
    </div>
  );
}
