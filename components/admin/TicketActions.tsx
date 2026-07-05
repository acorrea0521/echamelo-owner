"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, CheckCircle2 } from "lucide-react";

export function TicketActions({
  ticketId,
  status,
  conversationId,
}: {
  ticketId: string;
  status: string;
  conversationId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function openChat() {
    setLoading("open");
    const res = await fetch(`/api/admin/tickets/${ticketId}/open`, { method: "POST" });
    const body = await res.json();
    setLoading(null);
    if (res.ok) router.push(`/chat/${body.conversationId}`);
  }

  async function closeTicket() {
    setLoading("close");
    await fetch(`/api/admin/tickets/${ticketId}/close`, { method: "POST" });
    setLoading(null);
    router.refresh();
  }

  if (status === "closed") {
    return (
      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Resuelto
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={openChat}
        disabled={loading !== null}
        className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary"
      >
        <MessageSquarePlus className="h-3 w-3" />
        {conversationId ? "Ver chat" : "Abrir chat"}
      </button>
      <button
        onClick={closeTicket}
        disabled={loading !== null}
        className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
      >
        Cerrar
      </button>
    </div>
  );
}
