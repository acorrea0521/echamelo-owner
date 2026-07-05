"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEP_CENTS = 2000; // $20 MXN, matches the flat quick-bid increment

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

export function CustomBidModal({
  open,
  minCents,
  placing,
  onClose,
  onConfirm,
}: {
  open: boolean;
  minCents: number;
  placing: boolean;
  onClose: () => void;
  onConfirm: (amountCents: number) => void;
}) {
  const [amountCents, setAmountCents] = useState(minCents);

  useEffect(() => {
    if (open) setAmountCents(minCents);
  }, [open, minCents]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-t-3xl bg-background p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Puja personalizada</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setAmountCents((v) => Math.max(minCents, v - STEP_CENTS))}
            disabled={amountCents <= minCents}
            aria-label="Disminuir"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-foreground disabled:opacity-40"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="min-w-[9ch] text-center text-3xl font-black tabular-nums">
            {formatCents(amountCents)}
          </span>
          <button
            onClick={() => setAmountCents((v) => v + STEP_CENTS)}
            aria-label="Aumentar"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-foreground"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Mínimo {formatCents(minCents)} · incrementos de {formatCents(STEP_CENTS)}
        </p>

        <Button
          onClick={() => onConfirm(amountCents)}
          disabled={placing}
          className="h-12 gap-1.5 rounded-full bg-gold text-sm font-bold text-gold-foreground hover:bg-gold/90"
        >
          {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Confirmar puja de {formatCents(amountCents)}
        </Button>
      </div>
    </div>
  );
}
