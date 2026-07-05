"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { verifyBuyerIdentity } from "@/lib/stripe/verifyBuyerIdentity";
import { LoadingState } from "@/components/ui/loading";

export default function VerifiedBuyerPage() {
  const router = useRouter();
  const [buyerStatus, setBuyerStatus] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("buyer_status")
        .eq("id", user.id)
        .single();
      setBuyerStatus(profile?.buyer_status ?? "nuevo");
    });
  }, []);

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    const result = await verifyBuyerIdentity();
    setVerifying(false);
    if (result === "verificado") {
      setBuyerStatus("verificado");
      router.refresh();
    } else if (result === "error") {
      setError("No se pudo iniciar la verificación. Intenta de nuevo.");
    }
  }

  const isVerified = buyerStatus === "verificado";

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/account"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold">Comprador verificado</h1>
      </div>

      {buyerStatus === null ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center">
        <span
          className={
            isVerified
              ? "flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary"
              : "flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted-foreground"
          }
        >
          <BadgeCheck className="h-7 w-7" />
        </span>
        <p className="text-sm font-semibold">
          {isVerified ? "Tu identidad está verificada" : "Aún no verificas tu identidad"}
        </p>
        <p className="text-xs text-muted-foreground">
          Algunos vendedores solo aceptan pujas de compradores verificados. Verificar tu identidad
          toma un par de minutos e incluye una foto de tu identificación.
        </p>

        {!isVerified && (
          <Button onClick={handleVerify} disabled={verifying} className="mt-2 h-10 w-full">
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar identidad"}
          </Button>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
