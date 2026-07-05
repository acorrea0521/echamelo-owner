import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createStreamSchema } from "@/lib/validation/stream";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const id = randomUUID();
  const { data: stream, error } = await supabase
    .from("streams")
    .insert({
      id,
      seller_id: user.id,
      title: "Mi Transmisión en Vivo",
      livekit_room_name: `stream-${id}`,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo crear la transmisión." }, { status: 500 });
  }

  return NextResponse.json({ stream });
}
