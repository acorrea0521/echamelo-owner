import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBotName, randomBotPhrase } from "@/lib/bots/names";

// Called opportunistically by any connected viewer's client while an
// auction is active (same "any viewer can trigger it" pattern as
// /api/auctions/[listingId]/close) — no-ops unless the seller has bots
// enabled and every rule in place_bot_bid() is satisfied. Bots never touch
// the `bids` ledger or charge money; see project_echamelo_business_rules.
export async function POST(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { listingId } = await params;
  const admin = createAdminClient();

  const { data: listing } = await admin
    .from("listings")
    .select("id, stream_id, current_bot_bidder_name")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return NextResponse.json({ placed: false });
  }

  const botName = randomBotName(listing.current_bot_bidder_name);

  const { data, error } = await admin.rpc("place_bot_bid", {
    p_listing_id: listingId,
    p_bot_name: botName,
  });

  if (error) {
    return NextResponse.json({ placed: false });
  }

  const result = data as { placed: boolean; listing?: unknown };

  if (result.placed && Math.random() < 0.5) {
    await admin.from("chat_messages").insert({
      stream_id: listing.stream_id,
      bot_name: botName,
      body: randomBotPhrase(),
    });
  }

  return NextResponse.json(result);
}
