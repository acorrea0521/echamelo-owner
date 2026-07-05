import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id: ticketId } = await params;
  const adminClient = createAdminClient();

  const { data: ticket } = await adminClient
    .from("support_tickets")
    .select("conversation_id")
    .eq("id", ticketId)
    .single();

  if (ticket?.conversation_id) {
    await adminClient.from("conversations").update({ is_closed: true }).eq("id", ticket.conversation_id);
  }

  await adminClient
    .from("support_tickets")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", ticketId);

  return NextResponse.json({ ok: true });
}
