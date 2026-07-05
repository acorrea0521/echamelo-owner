import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

// Creates (or reuses) a Stripe Express connected account for the seller and
// returns a fresh hosted Account Link URL. Express + hosted onboarding means
// the seller's CLABE/INE/RFC are captured directly by Stripe — Échamelo
// never touches those fields (see project_echamelo_business_rules memory).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller") {
    return NextResponse.json({ error: "Solo vendedores." }, { status: 403 });
  }

  let accountId = profile.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "MX",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { supabase_user_id: user.id },
    });
    accountId = account.id;
    await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
  }

  const origin = new URL(request.url).origin;
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/onboarding/stripe`,
    return_url: `${origin}/onboarding/stripe?done=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
