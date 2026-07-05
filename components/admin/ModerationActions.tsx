"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, VolumeX, Undo2 } from "lucide-react";

export function ModerationActions({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: "mute" | "block" | "unblock") {
    setLoading(action);
    await fetch(`/api/admin/users/${userId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    router.refresh();
  }

  if (isBlocked) {
    return (
      <button
        onClick={() => act("unblock")}
        disabled={loading !== null}
        className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary"
      >
        <Undo2 className="h-3 w-3" />
        {loading === "unblock" ? "..." : "Desbloquear"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => act("mute")}
        disabled={loading !== null}
        title="Silenciar"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-gold"
      >
        <VolumeX className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => act("block")}
        disabled={loading !== null}
        title="Bloquear"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-destructive"
      >
        <Ban className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
