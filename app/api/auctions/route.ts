import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { streamId, productCode, auctionType, startPrice, shipping } = await request.json();

  if (!streamId || !productCode || !auctionType || startPrice === undefined) {
    return NextResponse.json({ error: "Campos requeridos faltantes." }, { status: 400 });
  }

  // Verify user owns this stream
  const { data: stream } = await supabase
    .from("streams")
    .select("id, seller_id")
    .eq("id", streamId)
    .single();

  if (!stream || stream.seller_id !== user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  // Create auction
  const { data: auction, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title: productCode,
      description: `Tipo: ${auctionType}`,
      starting_price_cents: Math.round(startPrice * 100),
      auction_type: auctionType,
      status: "live",
      stream_id: streamId,
      shipping_cost_cents: Math.round((shipping || 0) * 100),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating auction:", error);
    return NextResponse.json({ error: "No se pudo crear la subasta." }, { status: 500 });
  }

  return NextResponse.json({ id: auction.id });
}
