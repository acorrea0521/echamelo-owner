"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function BotConfigPanel({
  sellerId,
  initialEnabled,
  initialMaxBots,
}: {
  sellerId: string;
  initialEnabled: boolean;
  initialMaxBots: number;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [maxBots, setMaxBots] = useState(initialMaxBots || 3);
  const [saving, setSaving] = useState(false);

  async function save(patch: { enabled?: boolean; max_bots?: number }) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("bot_configs").upsert({
      seller_id: sellerId,
      enabled: patch.enabled ?? enabled,
      max_bots: patch.max_bots ?? maxBots,
    });
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Pujas simuladas</span>
        </div>
        <button
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            save({ enabled: next });
          }}
          disabled={saving}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-surface-2",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              enabled ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Genera pujas simuladas para mantener tus subastas activas. Nunca cobra dinero real — si un
        bot queda ganando al cerrar, el producto se marca como no vendido.
      </p>
      {enabled && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">
            Máximo de pujas simuladas por producto: <span className="font-semibold text-foreground">{maxBots}</span>
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={maxBots}
            onChange={(e) => setMaxBots(Number(e.target.value))}
            onMouseUp={() => save({ max_bots: maxBots })}
            onTouchEnd={() => save({ max_bots: maxBots })}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
