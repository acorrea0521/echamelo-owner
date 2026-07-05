"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export function TransferButton({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTransfer() {
    if (!confirm("¿Transferir el saldo pendiente de este vendedor ahora?")) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/sellers/${sellerId}/transfer`, { method: "POST" });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "No se pudo transferir.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleTransfer}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        Transferir
      </button>
      {error && <p className="max-w-[160px] text-right text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
