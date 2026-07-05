import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargeOrderForListing } from "@/lib/stripe/chargeOrder";

// Called by any connected viewer's client-side countdown the moment it hits
// 0 (first caller wins — close_auction() is idempotent and only acts once).
// Closes the auction DB-side, and if it sold, charges the winning buyer's
// saved card immediately in the same request. pg_cron's sweep_expired_auctions
// is a DB-only backstop for when no client is present to trigger this.
export async function POST(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: listing, error } = await admin.rpc("close_auction", { p_listing_id: listingId });

  if (error || !listing) {
    return NextResponse.json({ error: "No se pudo cerrar la subasta." }, { status: 400 });
  }

  if (listing.status === "sold") {
    const order = await chargeOrderForListing(listingId);
    return NextResponse.json({ listing, order });
  }

  return NextResponse.json({ listing });
}
