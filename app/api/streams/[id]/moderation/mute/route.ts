import { NextResponse } from "next/server";
import { requireStreamModerator } from "@/lib/supabase/requireStreamModerator";
import { createAdminClient } from "@/lib/supabase/admin";

// Chat-only mute — target can still watch and bid, just can't post. See
// stream_bans for a full kick/ban.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: streamId } = await params;
  const moderator = await requireStreamModerator(streamId);
  if (!moderator) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const targetUserId = body?.userId as string | undefined;
  const muted = body?.muted as boolean | undefined;
  if (!targetUserId || typeof muted !== "boolean") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (muted) {
    await admin
      .from("stream_chat_mutes")
      .upsert({ stream_id: streamId, user_id: targetUserId, muted_by: moderator.id }, { onConflict: "stream_id,user_id" });
  } else {
    await admin.from("stream_chat_mutes").delete().eq("stream_id", streamId).eq("user_id", targetUserId);
  }

  await admin.from("moderation_actions").insert({
    stream_id: streamId,
    actor_id: moderator.id,
    target_id: targetUserId,
    action_type: muted ? "mute" : "unmute",
  });

  return NextResponse.json({ ok: true });
}
