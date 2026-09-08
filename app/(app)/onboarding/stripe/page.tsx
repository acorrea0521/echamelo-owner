import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StripeConnectStep } from "@/components/seller/StripeConnectStep";
import { stripe } from "@/lib/stripe/client";

export default async function StripeOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("profiles")
    .select("seller_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_account_id")
    .eq("id", user.id)
    .single();

  // Returning from Stripe's hosted onboarding: sync directly instead of
  // waiting on the account.updated webhook, which isn't configured for
  // local dev (STRIPE_WEBHOOK_SECRET empty) — same gap as the LiveKit
  // webhook noted elsewhere. In production the webhook keeps this in sync
  // continuously; this is just a same-request fallback for the return trip.
  if (done === "1" && profile?.stripe_account_id && !profile.stripe_charges_enabled) {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    // These flags and seller_status are server-managed (migration 0030): a
    // seller must not be able to mark their own account payout-ready. The
    // values come from Stripe, so the write uses the service-role client.
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
      })
      .eq("id", user.id);

    if (profile.seller_status === "aprobado_pendiente_stripe" && account.charges_enabled) {
      await admin.from("profiles").update({ seller_status: "activo" }).eq("id", user.id);
    }

    const { data: refreshed } = await supabase
      .from("profiles")
      .select("seller_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_account_id")
      .eq("id", user.id)
      .single();
    profile = refreshed;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-lg font-black tracking-tight text-primary">¡ECHAMELO!</span>
      <h1 className="text-xl font-bold">Conecta tu cuenta bancaria</h1>
      <p className="text-sm text-muted-foreground">
        Usamos Stripe para depositarte directamente. Tu CLABE, INE y RFC se capturan en la página
        segura de Stripe — nunca pasan por nuestros servidores.
      </p>

      <StripeConnectStep
        sellerStatus={profile?.seller_status ?? "no_aplicado"}
        chargesEnabled={profile?.stripe_charges_enabled ?? false}
      />
    </div>
  );
}
