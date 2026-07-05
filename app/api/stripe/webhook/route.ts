import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

// Single Stripe webhook endpoint for the whole app. Currently handles Stripe
// Identity verification results for the seller KYC flow; payment-related
// events (payment_intent.*, account.updated for Connect) get added here in
// the Stripe Connect & payments phase.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "identity.verification_session.verified": {
      const session = event.data.object as Stripe.Identity.VerificationSession;

      if (session.metadata?.context === "buyer") {
        const buyerId = session.metadata.supabase_user_id;
        if (buyerId) {
          await admin
            .from("profiles")
            .update({ buyer_status: "verificado", identity_verified_at: new Date().toISOString() })
            .eq("id", buyerId);
        }
        break;
      }

      const full = await stripe.identity.verificationSessions.retrieve(session.id, {
        expand: ["verified_outputs"],
      });
      const outputs = full.verified_outputs;
      const extractedName = [outputs?.first_name, outputs?.last_name].filter(Boolean).join(" ") || null;

      const { data: application } = await admin
        .from("seller_applications")
        .update({ stripe_identity_status: "verified", identity_extracted_name: extractedName })
        .eq("stripe_identity_session_id", session.id)
        .select("seller_id")
        .single();

      if (application) {
        await admin
          .from("profiles")
          .update({ identity_verified_at: new Date().toISOString() })
          .eq("id", application.seller_id);
      }
      break;
    }
    case "identity.verification_session.requires_input":
    case "identity.verification_session.canceled": {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const status = event.type.endsWith("canceled") ? "canceled" : "requires_input";

      if (session.metadata?.context === "buyer") {
        const buyerId = session.metadata.supabase_user_id;
        if (buyerId && status === "canceled") {
          await admin.from("profiles").update({ buyer_status: "nuevo" }).eq("id", buyerId);
        }
        break;
      }

      await admin
        .from("seller_applications")
        .update({ stripe_identity_status: status })
        .eq("stripe_identity_session_id", session.id);
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const { data: seller } = await admin
        .from("profiles")
        .update({
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
        })
        .eq("stripe_account_id", account.id)
        .select("id, seller_status")
        .single();

      // Content/identity was already approved and now Connect banking is
      // done too — this is the final gate to a fully "activo" seller.
      if (seller && seller.seller_status === "aprobado_pendiente_stripe" && account.charges_enabled) {
        await admin.from("profiles").update({ seller_status: "activo" }).eq("id", seller.id);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
