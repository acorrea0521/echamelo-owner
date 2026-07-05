import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Called only after the client has already connected to LiveKit and
// confirmed it published camera/mic tracks — see components/stream/BroadcasterPanel.tsx.
// The room itself is created earlier, in /api/livekit/token, so that a
// client-side publish failure never leaves the DB saying "live" with no
// actual broadcast happening.
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

  if (stream.status === "live") {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("streams")
    .update({ status: "live", started_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "No se pudo iniciar la transmisión." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
