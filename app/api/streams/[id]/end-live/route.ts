import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: stream } = await supabase
    .from("streams")
    .select("id, seller_id, status")
    .eq("id", id)
    .single();

  if (!stream || stream.seller_id !== user.id) {
    return NextResponse.json({ error: "Transmisión no encontrada." }, { status: 404 });
  }

  const { error } = await supabase
    .from("streams")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "No se pudo terminar la transmisión." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
