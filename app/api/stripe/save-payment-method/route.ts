import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

// Called after the client confirms a SetupIntent. Persists the resulting
// payment method as the buyer's default and records it on the profile —
// presence of stripe_payment_method_id is what gates bidding eligibility.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { paymentMethodId } = await request.json().catch(() => ({}));
  if (!paymentMethodId) {
    return NextResponse.json({ error: "Falta el método de pago." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No se encontró el cliente de Stripe." }, { status: 404 });
  }

  await stripe.customers.update(profile.stripe_customer_id, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const { error } = await supabase
    .from("profiles")
    .update({ stripe_payment_method_id: paymentMethodId })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar el método de pago." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
