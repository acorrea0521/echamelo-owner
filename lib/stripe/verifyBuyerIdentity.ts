"use client";

import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Launches Stripe Identity's hosted modal for the current buyer, then syncs
// the result back (see /api/stripe/identity/buyer-session/sync doc comment
// for why the sync call is needed on top of the webhook).
export async function verifyBuyerIdentity(): Promise<"verificado" | "cancelled" | "error"> {
  const stripe = await stripePromise;
  const res = await fetch("/api/stripe/identity/buyer-session", { method: "POST" });
  const { clientSecret } = await res.json();
  if (!stripe || !clientSecret) return "error";

  const { error } = await stripe.verifyIdentity(clientSecret);
  if (error) return "cancelled";

  const syncRes = await fetch("/api/stripe/identity/buyer-session/sync", { method: "POST" });
  const { buyerStatus } = await syncRes.json();
  return buyerStatus === "verificado" ? "verificado" : "cancelled";
}
