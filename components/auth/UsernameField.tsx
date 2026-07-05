"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UsernameField({
  value,
  onChange,
  onAvailabilityChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange: (available: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const username = value.trim().toLowerCase();
    if (!username) {
      setStatus("idle");
      onAvailabilityChange(false);
      return;
    }

    setStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const body = await res.json();
        setStatus(body.available ? "available" : "unavailable");
        setReason(body.reason ?? null);
        onAvailabilityChange(!!body.available);
      } catch {
        setStatus("idle");
        onAvailabilityChange(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="username">Nombre de usuario</Label>
      <div className="relative">
        <Input
          id="username"
          required
          placeholder="tu_usuario"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          autoComplete="off"
          className="pr-9"
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          {status === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {status === "available" && <Check className="h-4 w-4 text-emerald-500" />}
          {status === "unavailable" && <X className="h-4 w-4 text-destructive" />}
        </div>
      </div>
      {status === "unavailable" && (
        <p className="text-xs text-destructive">{reason ?? "Este nombre de usuario ya está en uso."}</p>
      )}
    </div>
  );
}
