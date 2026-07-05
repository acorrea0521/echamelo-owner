"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminBotConfig({
  sellerId,
  initialEnabled,
  initialMaxBots,
}: {
  sellerId: string;
  initialEnabled: boolean;
  initialMaxBots: number;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [maxBots, setMaxBots] = useState(initialMaxBots || 3);
  const [saving, setSaving] = useState(false);

  async function save(patch: { enabled?: boolean; max_bots?: number }) {
    setSaving(true);
    await fetch(`/api/admin/sellers/${sellerId}/bot-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: patch.enabled ?? enabled, max_bots: patch.max_bots ?? maxBots }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-2 py-1.5">
      <Bot className="h-3.5 w-3.5 shrink-0 text-primary" />
      <button
        onClick={() => {
          const next = !enabled;
          setEnabled(next);
          save({ enabled: next });
        }}
        disabled={saving}
        className={cn("relative h-4 w-8 shrink-0 rounded-full transition-colors", enabled ? "bg-primary" : "bg-border")}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
            enabled ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
      {enabled && (
        <input
          type="number"
          min={0}
          max={100}
          value={maxBots}
          onChange={(e) => setMaxBots(Number(e.target.value))}
          onBlur={() => save({ max_bots: maxBots })}
          className="h-6 w-12 rounded border border-border bg-transparent px-1 text-center text-[11px]"
        />
      )}
    </div>
  );
}
