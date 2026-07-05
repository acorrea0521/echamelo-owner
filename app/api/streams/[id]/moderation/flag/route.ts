import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Any authenticated viewer can flag suspicious activity for admin review —
// unlike the other moderation actions this isn't moderator-gated, it's the
// reporting mechanism that feeds the moderator/admin queue.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id: streamId } = await params;
  const body = await request.json().catch(() => null);
  const targetUserId = body?.userId as string | undefined;
  const reason = body?.reason as string | undefined;
  if (!targetUserId || !reason?.trim()) {
    return NextResponse.json({ error: "Falta el usuario o el motivo." }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("moderation_actions").insert({
    stream_id: streamId,
    actor_id: user.id,
    target_id: targetUserId,
    action_type: "flag",
    metadata: { reason: reason.trim().slice(0, 500) },
  });

  return NextResponse.json({ ok: true });
}
