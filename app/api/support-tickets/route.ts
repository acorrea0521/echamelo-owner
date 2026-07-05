import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, body, status, conversation_id, created_at, closed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ tickets: tickets ?? [] });
}

// Creating a ticket is the only way a regular user reaches admin — see
// project_echamelo_business_rules. This never opens a conversation by
// itself; an admin does that from /admin/tickets.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subject = (body?.subject as string | undefined)?.trim();
  const message = (body?.body as string | undefined)?.trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "Completa el asunto y el mensaje." }, { status: 400 });
  }

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, subject, body: message })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo crear el ticket." }, { status: 500 });
  }

  return NextResponse.json({ ticketId: ticket.id });
}
