import { NextResponse } from "next/server";
import { requireStreamModerator } from "@/lib/supabase/requireStreamModerator";
import { createAdminClient } from "@/lib/supabase/admin";
import { listLiveKitParticipants } from "@/lib/livekit/room";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: streamId } = await params;
  const moderator = await requireStreamModerator(streamId);
  if (!moderator) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: stream } = await admin
    .from("streams")
    .select("livekit_room_name")
    .eq("id", streamId)
    .single();

  if (!stream) {
    return NextResponse.json({ error: "Transmisión no encontrada." }, { status: 404 });
  }

  const liveParticipants = await listLiveKitParticipants(stream.livekit_room_name);
  const userIds = liveParticipants.map((p) => p.identity).filter(Boolean);

  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", userIds)
    : { data: [] };

  const { data: mutes } = await admin.from("stream_chat_mutes").select("user_id").eq("stream_id", streamId);
  const mutedIds = new Set((mutes ?? []).map((m) => m.user_id));

  const participants = liveParticipants.map((p) => {
    const profile = profiles?.find((pr) => pr.id === p.identity);
    return {
      userId: p.identity,
      username: profile?.username ?? "?",
      displayName: profile?.display_name ?? profile?.username ?? "Usuario",
      isMuted: mutedIds.has(p.identity),
    };
  });

  return NextResponse.json({ participants });
}
