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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, category_id, seller_status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller") {
    return NextResponse.json({ error: "Solo los vendedores pueden crear transmisiones." }, { status: 403 });
  }
  if (!profile.category_id) {
    return NextResponse.json({ error: "Selecciona una categoría antes de continuar." }, { status: 403 });
  }
  if (profile.seller_status !== "activo") {
    return NextResponse.json(
      { error: "Tu cuenta de vendedor aún no está aprobada por completo." },
      { status: 403 },
    );
  }

  const parsed = createStreamSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const id = randomUUID();
  const { data: stream, error } = await supabase
    .from("streams")
    .insert({
      id,
      seller_id: user.id,
      title: parsed.data.title,
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
