"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, HandCoins, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RequestPayoutButton({ alreadyRequested }: { alreadyRequested: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (alreadyRequested) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <CheckCircle2 className="h-4 w-4" />
        Ya solicitaste tu pago — en revisión
      </div>
    );
  }

  async function handleRequest() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/earnings/request-payout", { method: "POST" });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "No se pudo solicitar el pago.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button onClick={handleRequest} disabled={loading} className="h-11 gap-2 bg-gold text-gold-foreground hover:bg-gold/90">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandCoins className="h-4 w-4" />}
        {loading ? "Enviando..." : "Solicitar pago"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
