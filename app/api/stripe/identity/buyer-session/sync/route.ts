import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

// Same-request fallback for local dev where STRIPE_WEBHOOK_SECRET isn't
// configured — called right after stripe.verifyIdentity() resolves in the
// browser, so the UI doesn't have to wait on a webhook that will never
// arrive locally. In production the webhook keeps this in sync regardless.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("buyer_identity_session_id, buyer_status")
    .eq("id", user.id)
    .single();

  if (!profile?.buyer_identity_session_id || profile.buyer_status === "verificado") {
    return NextResponse.json({ buyerStatus: profile?.buyer_status ?? "nuevo" });
  }

  const session = await stripe.identity.verificationSessions.retrieve(profile.buyer_identity_session_id);

  if (session.status === "verified") {
    // buyer_status gates how much a buyer may bid before verifying, so it is
    // server-managed (see migration 0030) — written with the service-role
    // client, only after Stripe itself reported the session verified.
    await createAdminClient()
      .from("profiles")
      .update({ buyer_status: "verificado", identity_verified_at: new Date().toISOString() })
      .eq("id", user.id);
    return NextResponse.json({ buyerStatus: "verificado" });
  }

  return NextResponse.json({ buyerStatus: profile.buyer_status });
}
