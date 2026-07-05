import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const text = (body?.body as string | undefined)?.trim();
  if (!text) {
    return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("is_closed")
    .eq("id", id)
    .single();

  if (conversation?.is_closed) {
    return NextResponse.json({ error: "Esta conversación está cerrada." }, { status: 409 });
  }

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: id, sender_id: user.id, body: text });

  if (error) {
    return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 400 });
  }

  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);

  return NextResponse.json({ ok: true });
}
