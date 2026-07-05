"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function PaymentMethodStep({ onComplete }: { onComplete: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe/setup-intent", { method: "POST" })
      .then((res) => res.json())
      .then((body) => {
        if (body.clientSecret) setClientSecret(body.clientSecret);
        else setError("No se pudo iniciar el registro de pago.");
      })
      .catch(() => setError("No se pudo iniciar el registro de pago."));
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-xs">Preparando formulario de pago...</span>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
      <PaymentForm onComplete={onComplete} />
    </Elements>
  );
}

function PaymentForm({ onComplete }: { onComplete: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "No se pudo guardar tu método de pago.");
      setSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;

    if (!paymentMethodId) {
      setError("No se pudo confirmar el método de pago.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/stripe/save-payment-method", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError("No se pudo guardar tu método de pago.");
      return;
    }

    onComplete();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CreditCard className="h-4 w-4 text-gold" />
        Agrega tu método de pago
      </div>
      <p className="text-xs text-muted-foreground">
        Necesitas una tarjeta guardada para poder pujar en las subastas. No se te cobrará nada
        ahora.
      </p>

      <PaymentElement />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!stripe || submitting}
        className="h-11 bg-gold text-gold-foreground hover:bg-gold/90"
      >
        {submitting ? "Guardando..." : "Guardar tarjeta"}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3" />
        Tus datos de tarjeta están protegidos por Stripe.
      </p>
    </div>
  );
}
