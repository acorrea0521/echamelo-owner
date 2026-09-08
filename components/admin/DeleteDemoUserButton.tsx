"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteDemoUserButton({ userId, username }: { userId: string; username: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(`¿Eliminar la cuenta demo @${username}? No se puede deshacer.`)) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/demo-users/${userId}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "No se pudo eliminar.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={remove}
        disabled={busy}
        title="Eliminar cuenta demo"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  );
}
