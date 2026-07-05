import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { rateLimit } from "@/lib/rate-limit";

// Creates (or reuses) a Stripe Customer for the current buyer and returns a
// SetupIntent client secret so the browser can collect + save a card via
// Stripe Elements, without charging anything yet.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const limited = rateLimit(`setup-intent:${user.id}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: setupIntent.client_secret });
}
