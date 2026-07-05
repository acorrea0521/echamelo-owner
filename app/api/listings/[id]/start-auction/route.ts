import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("start_auction", { p_listing_id: id });

  if (error) {
    const message = error.message.includes("not_the_seller")
      ? "No autorizado."
      : error.message.includes("listing_not_queued")
        ? "Este producto ya no está en cola."
        : "No se pudo iniciar la subasta.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ listing: data });
}
