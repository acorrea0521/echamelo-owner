import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

// Opens (or reuses) the support conversation for a ticket — the one and
// only way admin-initiated contact happens for a support request. Multiple
// tickets from the same user can share conversations over time, but each
// ticket tracks its own linked conversation_id.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id: ticketId } = await params;
  const adminClient = createAdminClient();

  const { data: ticket } = await adminClient
    .from("support_tickets")
    .select("id, user_id, conversation_id, status")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado." }, { status: 404 });
  }

  if (ticket.conversation_id) {
    // Re-opening a previously closed thread for this ticket.
    await adminClient.from("conversations").update({ is_closed: false }).eq("id", ticket.conversation_id);
    return NextResponse.json({ conversationId: ticket.conversation_id });
  }

  const { data: conversation, error } = await adminClient
    .from("conversations")
    .insert({ user_a_id: admin.id, user_b_id: ticket.user_id, is_support: true })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo abrir el chat." }, { status: 500 });
  }

  await adminClient.from("support_tickets").update({ conversation_id: conversation.id }).eq("id", ticketId);

  return NextResponse.json({ conversationId: conversation.id });
}
