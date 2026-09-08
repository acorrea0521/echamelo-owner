import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLiveKitToken } from "@/lib/livekit/token";

// Issues the LiveKit access token for a stream. Three things are decided here
// and never by the caller:
//
//   * identity — taken from the session. It used to come from the request
//     body as `viewer-<streamId>`, which gave every viewer of a stream the
//     same LiveKit identity, and LiveKit disconnects the earlier participant
//     when a duplicate identity joins: only one viewer could watch at a time.
//   * canPublish — only the seller who owns the stream may publish video.
//   * circuit — a demo stream is reachable only by demo accounts, and a real
//     stream only by real ones (see migration 0028). Without this check the
//     RLS isolation would still be bypassable through the video layer.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const streamId = body?.streamId as string | undefined;

  if (!streamId) {
    return NextResponse.json({ error: "Falta el stream." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: stream }, { data: profile }] = await Promise.all([
    admin.from("streams").select("id, seller_id, is_demo").eq("id", streamId).maybeSingle(),
    admin.from("profiles").select("username, is_demo").eq("id", user.id).maybeSingle(),
  ]);

  if (!stream || !profile) {
    return NextResponse.json({ error: "Stream no encontrado." }, { status: 404 });
  }

  if (stream.is_demo !== profile.is_demo) {
    return NextResponse.json(
      { error: "Este live no está disponible para tu cuenta." },
      { status: 403 },
    );
  }

  try {
    const token = await createLiveKitToken({
      // The room has always been named after the stream id — the clients
      // connect by that name, so it stays as it is.
      roomName: streamId,
      identity: user.id,
      name: profile.username,
      canPublish: stream.seller_id === user.id,
    });

    return NextResponse.json({ token, url: process.env.NEXT_PUBLIC_LIVEKIT_URL });
  } catch (err) {
    console.error("Token generation error:", err);
    return NextResponse.json({ error: "No se pudo generar el acceso al video." }, { status: 500 });
  }
}
