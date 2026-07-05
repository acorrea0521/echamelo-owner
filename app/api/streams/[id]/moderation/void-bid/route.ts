import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// See void_bid() in supabase/migrations/0020 — the practical equivalent of
// "reject a bid" that's compatible with the live, time-critical auction
// engine: invalidates a bid after the fact and atomically recomputes the
// listing's current-highest from the next valid bid.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const bidId = body?.bidId as string | undefined;
  if (!bidId) {
    return NextResponse.json({ error: "Falta el id de la puja." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("void_bid", { p_bid_id: bidId, p_actor_id: user.id });
  const result = data as { voided: boolean; reason?: string } | null;

  if (error) {
    return NextResponse.json({ error: "No se pudo anular la puja." }, { status: 500 });
  }
  if (!result?.voided) {
    return NextResponse.json({ error: result?.reason ?? "No se pudo anular la puja." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
