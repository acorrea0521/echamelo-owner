import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

// Creates (or reuses, while still processable) a Stripe Identity
// VerificationSession restricted to MX documents, returns the client_secret
// the browser uses with stripe.verifyIdentity() (hosted modal, no redirect).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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
    metadata: { supabase_user_id: user.id },
  });

  await supabase
    .from("seller_applications")
    .update({
      stripe_identity_session_id: session.id,
      stripe_identity_status: session.status,
    })
    .eq("seller_id", user.id);

  return NextResponse.json({ clientSecret: session.client_secret });
}
