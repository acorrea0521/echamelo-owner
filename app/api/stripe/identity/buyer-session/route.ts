import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { rateLimit } from "@/lib/rate-limit";

// Buyer-side Stripe Identity verification, separate from the seller KYC
// path (app/api/stripe/identity/session). Triggered on-demand from BidBar
// when place_bid() rejects with identity_verification_required — see
// project_echamelo_business_rules "Buyer tiered verification" for the
// trigger conditions.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Each Identity session costs money at Stripe — cap creation hard.
  const limited = rateLimit(`identity:${user.id}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
  }

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    options: {
      document: {
        allowed_types: ["driving_license", "passport", "id_card"],
        require_live_capture: true,
        require_matching_selfie: true,
      },
    },
    metadata: { supabase_user_id: user.id, context: "buyer" },
  });

  await supabase
    .from("profiles")
    .update({ buyer_identity_session_id: session.id })
    .eq("id", user.id);

  return NextResponse.json({ clientSecret: session.client_secret });
}
