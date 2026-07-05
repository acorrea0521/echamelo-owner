import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { rateLimit } from "@/lib/rate-limit";

// Pre-authorization on every bid (see project_echamelo_business_rules "Buyer
// tiered verification"): Stripe authorization must happen BEFORE place_bid()
// commits the bid — never the reverse — so the DB never shows a "winning"
// bid with no real funds backing it. Order of operations:
//   1. optimistic verification-required check (avoid a pointless Stripe call)
//   2. release the bidder's own prior hold on this listing, if any
//   3. authorize a new hold for bid + shipping (manual capture)
//   4. call place_bid() — the authoritative, row-locked validation
//   5. on success: record the hold, release the previous highest bidder's hold
//   6. on rejection: cancel the hold we just created
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const listingId = body?.listingId as string | undefined;
  const isQuick = Boolean(body?.isQuick);
  const requestedAmountCents = isQuick ? null : Math.round(Number(body?.amountCents));

  if (!listingId || (!isQuick && !Number.isFinite(requestedAmountCents))) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Each authorized bid opens a Stripe PaymentIntent, so a runaway client
  // is both a money/abuse and a rate concern. 20 bids / 10s is far above any
  // legitimate human tapping quick-bid, but stops scripted floods.
  const limited = rateLimit(`bid:${user.id}`, 20, 10_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Estás pujando demasiado rápido. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const admin = createAdminClient();

  const { data: listing } = await admin
    .from("listings")
    .select("id, status, starting_price_cents, current_highest_bid_cents, shipping_cost_cents, requires_verified_buyers")
    .eq("id", listingId)
    .single();

  if (!listing || listing.status !== "active") {
    return NextResponse.json({ error: "Esta subasta no está activa." }, { status: 400 });
  }

  const minNextCents = listing.current_highest_bid_cents
    ? listing.current_highest_bid_cents + 2000
    : listing.starting_price_cents;
  const bidAmountCents = isQuick ? minNextCents : (requestedAmountCents as number);

  const { data: buyer } = await admin
    .from("profiles")
    .select("buyer_status, created_at, stripe_customer_id, stripe_payment_method_id")
    .eq("id", user.id)
    .single();

  if (!buyer?.stripe_customer_id || !buyer?.stripe_payment_method_id) {
    return NextResponse.json({ error: "Necesitas una tarjeta guardada para pujar." }, { status: 400 });
  }

  if (await isVerificationRequired(admin, buyer, listing.requires_verified_buyers, bidAmountCents)) {
    return NextResponse.json({ error: "identity_verification_required" }, { status: 400 });
  }

  // Release this buyer's own prior hold on this listing before creating a new one.
  const { data: ownPriorHold } = await admin
    .from("bid_holds")
    .select("id, stripe_payment_intent_id")
    .eq("listing_id", listingId)
    .eq("bidder_id", user.id)
    .eq("status", "authorized")
    .maybeSingle();

  if (ownPriorHold) {
    await stripe.paymentIntents.cancel(ownPriorHold.stripe_payment_intent_id).catch(() => null);
    await admin.from("bid_holds").update({ status: "released" }).eq("id", ownPriorHold.id);
  }

  const holdAmountCents = bidAmountCents + listing.shipping_cost_cents;
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: holdAmountCents,
      currency: "mxn",
      customer: buyer.stripe_customer_id,
      payment_method: buyer.stripe_payment_method_id,
      capture_method: "manual",
      off_session: true,
      confirm: true,
      metadata: { listing_id: listingId, bidder_id: user.id },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo autorizar tu tarjeta." }, { status: 400 });
  }

  const { data: rpcResult, error } = await supabase.rpc("place_bid", {
    p_listing_id: listingId,
    p_amount_cents: bidAmountCents,
    p_is_quick: isQuick,
  });

  if (error) {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => null);
    return NextResponse.json({ error: mapBidError(error.message) }, { status: 400 });
  }

  const result = rpcResult as { listing: unknown; previous_highest_bidder_id: string | null; bid_id: string };

  await admin.from("bid_holds").insert({
    listing_id: listingId,
    bidder_id: user.id,
    bid_id: result.bid_id,
    amount_cents: holdAmountCents,
    stripe_payment_intent_id: paymentIntent.id,
    status: "authorized",
  });

  if (result.previous_highest_bidder_id && result.previous_highest_bidder_id !== user.id) {
    const { data: loserHold } = await admin
      .from("bid_holds")
      .select("id, stripe_payment_intent_id")
      .eq("listing_id", listingId)
      .eq("bidder_id", result.previous_highest_bidder_id)
      .eq("status", "authorized")
      .maybeSingle();

    if (loserHold) {
      await stripe.paymentIntents.cancel(loserHold.stripe_payment_intent_id).catch(() => null);
      await admin.from("bid_holds").update({ status: "released" }).eq("id", loserHold.id);
    }
  }

  return NextResponse.json({ listing: result.listing });
}

async function isVerificationRequired(
  admin: ReturnType<typeof createAdminClient>,
  buyer: { buyer_status: string; created_at: string },
  requiresVerifiedBuyers: boolean,
  amountCents: number,
) {
  if (buyer.buyer_status === "verificado") return false;
  if (requiresVerifiedBuyers) return true;

  const { data: settings } = await admin
    .from("app_settings")
    .select("key, value")
    .in("key", ["buyer_verification_threshold_cents", "new_account_suspicious_window_minutes"]);

  const thresholdCents = Number(settings?.find((s) => s.key === "buyer_verification_threshold_cents")?.value ?? 50000);
  const windowMinutes = Number(settings?.find((s) => s.key === "new_account_suspicious_window_minutes")?.value ?? 60);

  if (amountCents > thresholdCents) return true;

  const accountAgeMs = Date.now() - new Date(buyer.created_at).getTime();
  if (accountAgeMs < windowMinutes * 60_000 && amountCents > thresholdCents) return true;

  return false;
}

function mapBidError(message: string) {
  if (message.includes("identity_verification_required")) return "identity_verification_required";
  if (message.includes("no_payment_method")) return "Necesitas una tarjeta guardada para pujar.";
  if (message.includes("auction_not_active")) return "Esta subasta no está activa.";
  if (message.includes("auction_ended")) return "La subasta ya terminó.";
  if (message.includes("bid_too_low")) return "Tu puja es menor al mínimo permitido.";
  if (message.includes("cannot_bid_on_own_listing")) return "No puedes pujar en tu propio producto.";
  if (message.includes("listing_not_found")) return "Producto no encontrado.";
  return "No se pudo procesar tu puja.";
}
