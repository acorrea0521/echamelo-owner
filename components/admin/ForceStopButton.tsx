"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Square } from "lucide-react";

export function ForceStopButton({ streamId }: { streamId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStop() {
    if (!confirm("¿Finalizar esta transmisión ahora mismo?")) return;
    setLoading(true);
    await fetch(`/api/admin/streams/${streamId}/force-stop`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleStop}
      disabled={loading}
      className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive"
    >
      <Square className="h-3 w-3" />
      {loading ? "..." : "Finalizar"}
    </button>
  );
}
