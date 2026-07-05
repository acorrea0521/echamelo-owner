import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createListingSchema } from "@/lib/validation/listing";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = createListingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { stream_id, ...rest } = parsed.data;

  const { data: stream } = await supabase
    .from("streams")
    .select("id, seller_id")
    .eq("id", stream_id)
    .single();

  if (!stream || stream.seller_id !== user.id) {
    return NextResponse.json({ error: "Transmisión no encontrada." }, { status: 404 });
  }

  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("stream_id", stream_id);

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      stream_id,
      seller_id: user.id,
      queue_position: count ?? 0,
      ...rest,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo crear el producto." }, { status: 500 });
  }

  return NextResponse.json({ listing });
}
