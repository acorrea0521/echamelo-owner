import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

// Platform-wide moderation action (mute/block/unblock) against a user.
// stream_id is null here — per-stream mute (from a live chat) is a separate,
// narrower action that would pass a stream_id; this route is the admin-panel
// "block this account everywhere" path.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action as "mute" | "block" | "unblock" | undefined;
  if (!action || !["mute", "block", "unblock"].includes(action)) {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const { id: targetId } = await params;
  const adminClient = createAdminClient();

  if (action !== "unblock") {
    await adminClient.from("moderation_actions").insert({
      actor_id: admin.id,
      target_id: targetId,
      action_type: action,
    });
  }

  if (action === "block") {
    await adminClient.from("profiles").update({ buyer_status: "bloqueado" }).eq("id", targetId);
  } else if (action === "unblock") {
    await adminClient.from("profiles").update({ buyer_status: "nuevo" }).eq("id", targetId);
  }

  return NextResponse.json({ ok: true });
}
