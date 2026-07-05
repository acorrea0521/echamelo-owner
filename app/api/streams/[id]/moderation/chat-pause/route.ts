import { NextResponse } from "next/server";
import { requireStreamModerator } from "@/lib/supabase/requireStreamModerator";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: streamId } = await params;
  const moderator = await requireStreamModerator(streamId);
  if (!moderator) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const paused = body?.paused as boolean | undefined;
  if (typeof paused !== "boolean") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("streams").update({ chat_paused: paused }).eq("id", streamId);
  await admin.from("moderation_actions").insert({
    stream_id: streamId,
    actor_id: moderator.id,
    action_type: paused ? "pause_chat" : "resume_chat",
  });

  return NextResponse.json({ ok: true });
}
