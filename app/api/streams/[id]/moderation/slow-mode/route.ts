import { NextResponse } from "next/server";
import { requireStreamModerator } from "@/lib/supabase/requireStreamModerator";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SLOW_MODE_SECONDS = 300;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: streamId } = await params;
  const moderator = await requireStreamModerator(streamId);
  if (!moderator) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const seconds = body?.seconds as number | undefined;
  if (typeof seconds !== "number" || seconds < 0 || seconds > MAX_SLOW_MODE_SECONDS) {
    return NextResponse.json({ error: `Debe ser entre 0 y ${MAX_SLOW_MODE_SECONDS} segundos.` }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("streams").update({ chat_slow_mode_seconds: Math.round(seconds) }).eq("id", streamId);
  await admin.from("moderation_actions").insert({
    stream_id: streamId,
    actor_id: moderator.id,
    action_type: "slow_mode",
    metadata: { seconds: Math.round(seconds) },
  });

  return NextResponse.json({ ok: true });
}
