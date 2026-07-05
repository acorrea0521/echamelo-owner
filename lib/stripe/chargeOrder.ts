import "server-only";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Captures the winning buyer's pre-authorized hold the moment an order is
// created from a won auction — no separate buyer confirmation step (see
// project_echamelo_business_rules "Payment timing on auction win" and
// "Buyer tiered verification"). Every bid already has a manual-capture
// PaymentIntent behind it (see app/api/bids/place), so closing an auction
// is a capture of the winner's existing hold, not a brand-new charge.
// Idempotent: only acts on orders still 'pending_payment'.
//
// Seller Connect onboarding isn't built for transfers yet, so the captured
// amount stays on the platform account for now (no transfer_data/destination).
export async function chargeOrderForListing(listingId: string) {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, buyer_id, winning_bid_id, item_price_cents, shipping_cost_cents, platform_fee_cents, total_charged_cents, status",
    )
    .eq("listing_id", listingId)
    .single();

  if (!order || order.status !== "pending_payment") {
    return order ?? null;
  }

  // Safety net: release any other still-authorized holds on this listing
  // (should already be empty in the normal case — outbid holds are released
  // immediately by app/api/bids/place — this only catches stragglers, e.g.
  // a release call that failed mid-request).
  const { data: otherHolds } = await admin
    .from("bid_holds")
    .select("id, stripe_payment_intent_id")
    .eq("listing_id", listingId)
    .eq("status", "authorized")
    .neq("bid_id", order.winning_bid_id);

  for (const hold of otherHolds ?? []) {
    await stripe.paymentIntents.cancel(hold.stripe_payment_intent_id).catch(() => null);
    await admin.from("bid_holds").update({ status: "released" }).eq("id", hold.id);
  }

  const { data: winningHold } = await admin
    .from("bid_holds")
    .select("id, stripe_payment_intent_id, amount_cents")
    .eq("bid_id", order.winning_bid_id)
    .eq("status", "authorized")
    .maybeSingle();

  if (!winningHold) {
    // No live hold backing the winning bid (shouldn't happen under normal
    // operation) — fail rather than silently charging an unauthorized amount.
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return { ...order, status: "failed" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.capture(winningHold.stripe_payment_intent_id, {
      expand: ["latest_charge.balance_transaction"],
    });
    const status = paymentIntent.status === "succeeded" ? "paid" : "failed";

    // Real Stripe processing fee, captured once at payment time (not
    // re-fetched later) so per-seller payout math is a pure DB read — see
    // project_echamelo_business_rules "Seller payouts".
    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    const balanceTransaction = charge?.balance_transaction as Stripe.BalanceTransaction | null;
    const stripeFeeCents = balanceTransaction?.fee ?? 0;
    const sellerPayoutCents =
      status === "paid"
        ? order.total_charged_cents - order.platform_fee_cents - stripeFeeCents
        : null;

    await admin
      .from("orders")
      .update({
        status,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_fee_cents: stripeFeeCents,
        seller_payout_cents: sellerPayoutCents,
      })
      .eq("id", order.id);
    await admin
      .from("bid_holds")
      .update({ status: status === "paid" ? "captured" : "failed" })
      .eq("id", winningHold.id);

    return { ...order, status, stripe_payment_intent_id: paymentIntent.id };
  } catch {
    // Capture failed (hold expired past Stripe's 7-day window, card issue
    // since authorization, etc). Mark failed; no auto-retry here.
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    await admin.from("bid_holds").update({ status: "failed" }).eq("id", winningHold.id);
    return { ...order, status: "failed" };
  }
}
