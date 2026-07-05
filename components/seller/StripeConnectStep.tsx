"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StripeConnectStep({
  sellerStatus,
  chargesEnabled,
}: {
  sellerStatus: string;
  chargesEnabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (chargesEnabled) {
    return (
      <div className="flex flex-col items-center gap-3">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <p className="text-sm font-semibold">Tu cuenta bancaria está conectada.</p>
        <Button onClick={() => router.push("/home")} className="mt-2 w-full">
          Continuar a ECHAMELO
        </Button>
      </div>
    );
  }

  if (sellerStatus !== "aprobado_pendiente_stripe" && sellerStatus !== "activo") {
    return (
      <p className="text-sm text-muted-foreground">
        Esta sección se habilita una vez que tu solicitud de vendedor sea aprobada.
      </p>
    );
  }

  async function handleConnect() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/connect/onboarding-link", { method: "POST" });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "No se pudo iniciar la conexión con Stripe.");
      setLoading(false);
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleConnect} disabled={loading} className="h-11 w-full gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
        {loading ? "Redirigiendo..." : "Conectar con Stripe"}
      </Button>
    </div>
  );
}
