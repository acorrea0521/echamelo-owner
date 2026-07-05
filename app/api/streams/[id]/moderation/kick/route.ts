import { NextResponse } from "next/server";
import { requireStreamModerator } from "@/lib/supabase/requireStreamModerator";
import { createAdminClient } from "@/lib/supabase/admin";
import { kickParticipant } from "@/lib/livekit/room";

// Removes a viewer from the room and bans them from rejoining — LiveKit
// disconnects any active session, stream_bans blocks future token issuance
// (see /api/livekit/token). Distinct from a chat-only mute.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: streamId } = await params;
  const moderator = await requireStreamModerator(streamId);
  if (!moderator) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const targetUserId = body?.userId as string | undefined;
  if (!targetUserId) {
    return NextResponse.json({ error: "Falta el usuario." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: stream } = await admin
    .from("streams")
    .select("livekit_room_name, seller_id")
    .eq("id", streamId)
    .single();

  if (!stream) {
    return NextResponse.json({ error: "Transmisión no encontrada." }, { status: 404 });
  }
  if (targetUserId === stream.seller_id) {
    return NextResponse.json({ error: "No puedes expulsar al vendedor." }, { status: 400 });
  }

  await admin
    .from("stream_bans")
    .upsert({ stream_id: streamId, user_id: targetUserId, banned_by: moderator.id }, { onConflict: "stream_id,user_id" });

  await kickParticipant(stream.livekit_room_name, targetUserId);

  await admin.from("moderation_actions").insert({
    stream_id: streamId,
    actor_id: moderator.id,
    target_id: targetUserId,
    action_type: "kick",
  });

  return NextResponse.json({ ok: true });
}
