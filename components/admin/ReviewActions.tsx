"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewActions({ applicationId, status }: { applicationId: string; status: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "reject" | "changes">("idle");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "submitted" && status !== "in_review") {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Esta solicitud ya fue procesada ({status}).
      </p>
    );
  }

  async function approve() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/seller-applications/${applicationId}/approve`, {
      method: "POST",
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo aprobar.");
      return;
    }
    router.push("/admin/sellers");
    router.refresh();
  }

  async function submitReason(kind: "reject" | "changes") {
    if (!reason.trim()) {
      setError("Escribe un motivo.");
      return;
    }
    setLoading(true);
    setError(null);
    const endpoint = kind === "reject" ? "reject" : "request-changes";
    const res = await fetch(`/api/admin/seller-applications/${applicationId}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo procesar.");
      return;
    }
    router.push("/admin/sellers");
    router.refresh();
  }

  if (mode !== "idle") {
    return (
      <div className="flex flex-col gap-2">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={mode === "reject" ? "Motivo del rechazo..." : "¿Qué debe corregir el vendedor?"}
          rows={3}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setMode("idle")}>
            Cancelar
          </Button>
          <Button
            disabled={loading}
            className="flex-1"
            onClick={() => submitReason(mode)}
          >
            {loading ? "Enviando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => setMode("reject")}
        >
          <X className="h-4 w-4" />
          Rechazar
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-1.5 border-gold/40 text-gold hover:bg-gold/10"
          onClick={() => setMode("changes")}
        >
          <RotateCcw className="h-4 w-4" />
          Cambios
        </Button>
        <Button disabled={loading} className="flex-1 gap-1.5" onClick={approve}>
          <Check className="h-4 w-4" />
          Aprobar
        </Button>
      </div>
    </div>
  );
}
