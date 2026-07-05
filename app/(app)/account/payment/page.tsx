import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CreditCard, Truck, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

type ShippingAddress = { fullName?: string; line1?: string; city?: string; state?: string; postalCode?: string };

export default async function AccountPaymentHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_payment_method_id, default_shipping_address")
    .eq("id", user.id)
    .single();

  let cardSummary = "Sin tarjeta guardada";
  if (profile?.stripe_payment_method_id) {
    try {
      const pm = await stripe.paymentMethods.retrieve(profile.stripe_payment_method_id);
      if (pm.card) {
        cardSummary = `${pm.card.brand} •••• ${pm.card.last4} — ${pm.card.exp_month}/${pm.card.exp_year}`;
      }
    } catch {
      cardSummary = "Tarjeta guardada";
    }
  }

  const address = profile?.default_shipping_address as ShippingAddress | null;
  const shippingSummary = address?.line1
    ? `${address.line1}, ${address.city} ${address.state ?? ""} ${address.postalCode ?? ""}`.trim()
    : "Sin dirección guardada";

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/account"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold">Pago y envío</h1>
      </div>

      <p className="text-xs text-muted-foreground">
        Esto es necesario para pujar, ordenar o comprar un producto en una transmisión. Se cobra a
        tu tarjeta si una puja u oferta es aceptada.
      </p>

      <div className="flex flex-col gap-2">
        <Link href="/account/payment/card" className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground/80">
            <CreditCard className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium">Método de pago</span>
            <span className="truncate text-xs text-muted-foreground">{cardSummary}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link href="/account/payment/shipping" className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground/80">
            <Truck className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium">Dirección de envío</span>
            <span className="truncate text-xs text-muted-foreground">{shippingSummary}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
