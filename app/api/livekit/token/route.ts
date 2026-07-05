import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLiveKitToken } from "@/lib/livekit/token";
import { ensureLiveKitRoom } from "@/lib/livekit/room";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { streamId } = await request.json().catch(() => ({}));
  if (!streamId) {
    return NextResponse.json({ error: "Falta streamId." }, { status: 400 });
  }

  const { data: stream } = await supabase
    .from("streams")
    .select("id, seller_id, livekit_room_name")
    .eq("id", streamId)
    .single();

  if (!stream) {
    return NextResponse.json({ error: "Transmisión no encontrada." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  const isBroadcaster = stream.seller_id === user.id;

  if (!isBroadcaster) {
    const { data: ban } = await supabase
      .from("stream_bans")
      .select("user_id")
      .eq("stream_id", streamId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (ban) {
      return NextResponse.json({ error: "Fuiste expulsado de esta transmisión." }, { status: 403 });
    }
  }

  if (isBroadcaster) {
    // Ensure the room exists (with our custom emptyTimeout) before the
    // broadcaster joins. Deliberately does NOT touch streams.status —
    // that only flips to 'live' once the client confirms it actually
    // published a track, keeping the DB in sync with reality.
    try {
      await ensureLiveKitRoom(stream.livekit_room_name);
    } catch {
      return NextResponse.json({ error: "No se pudo preparar la sala de video." }, { status: 502 });
    }
  }

  const token = await createLiveKitToken({
    roomName: stream.livekit_room_name,
    identity: user.id,
    name: profile?.display_name ?? profile?.username ?? "Usuario",
    canPublish: isBroadcaster,
  });

  return NextResponse.json({ token, url: process.env.NEXT_PUBLIC_LIVEKIT_URL });
}
