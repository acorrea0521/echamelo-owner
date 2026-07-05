import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

export async function POST(request: Request) {
  const body = await request.text();
  const authHeader = request.headers.get("Authorization");

  let event;
  try {
    event = await receiver.receive(body, authHeader ?? undefined);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  if (
    (event.event === "participant_joined" || event.event === "participant_left") &&
    event.room?.name
  ) {
    const admin = createAdminClient();
    const { count } = await admin
      .from("streams")
      .select("id", { count: "exact", head: true })
      .eq("livekit_room_name", event.room.name)
      .eq("status", "live");

    // Prefer LiveKit's own room participant count when available (accounts
    // for the broadcaster occupying one slot); fall back to the delta event.
    const numParticipants = event.room.numParticipants ?? 0;
    const viewerCount = Math.max(0, numParticipants - 1);

    if (count) {
      await admin
        .from("streams")
        .update({ viewer_count: viewerCount })
        .eq("livekit_room_name", event.room.name);
    }
  }

  return NextResponse.json({ ok: true });
}
