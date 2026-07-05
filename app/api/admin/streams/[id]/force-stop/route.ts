import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteLiveKitRoom } from "@/lib/livekit/room";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: stream } = await adminClient
    .from("streams")
    .select("id, livekit_room_name, status")
    .eq("id", id)
    .single();

  if (!stream) {
    return NextResponse.json({ error: "Transmisión no encontrada." }, { status: 404 });
  }

  await deleteLiveKitRoom(stream.livekit_room_name);

  const { error } = await adminClient
    .from("streams")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "No se pudo finalizar la transmisión." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
