import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", id)
    .single();

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
  if (listing.status !== "queued") {
    return NextResponse.json({ error: "Solo se pueden cancelar productos en cola." }, { status: 409 });
  }

  const { error } = await supabase.from("listings").update({ status: "cancelled" }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: "No se pudo cancelar el producto." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
