"use client";

import { useEffect, useState } from "react";
import { Shield, X, UserX, MicOff, Mic, PauseCircle, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Participant = { userId: string; username: string; displayName: string; isMuted: boolean };

export function ModeratorPanel({
  streamId,
  initialChatPaused,
  initialSlowModeSeconds,
}: {
  streamId: string;
  initialChatPaused: boolean;
  initialSlowModeSeconds: number;
}) {
  const [open, setOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatPaused, setChatPaused] = useState(initialChatPaused);
  const [slowModeSeconds, setSlowModeSeconds] = useState(String(initialSlowModeSeconds));
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/streams/${streamId}/participants`)
      .then((res) => res.json())
      .then((body) => setParticipants(body.participants ?? []))
      .finally(() => setLoading(false));
  }, [open, streamId]);

  async function toggleChatPause() {
    const next = !chatPaused;
    setChatPaused(next);
    await fetch(`/api/streams/${streamId}/moderation/chat-pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: next }),
    });
  }

  async function applySlowMode() {
    const seconds = Math.max(0, Math.min(300, Math.round(Number(slowModeSeconds) || 0)));
    setSlowModeSeconds(String(seconds));
    await fetch(`/api/streams/${streamId}/moderation/slow-mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds }),
    });
  }

  async function toggleMute(participant: Participant) {
    setBusyUserId(participant.userId);
    await fetch(`/api/streams/${streamId}/moderation/mute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: participant.userId, muted: !participant.isMuted }),
    });
    setParticipants((prev) =>
      prev.map((p) => (p.userId === participant.userId ? { ...p, isMuted: !p.isMuted } : p)),
    );
    setBusyUserId(null);
  }

  async function kick(participant: Participant) {
    setBusyUserId(participant.userId);
    await fetch(`/api/streams/${streamId}/moderation/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: participant.userId }),
    });
    setParticipants((prev) => prev.filter((p) => p.userId !== participant.userId));
    setBusyUserId(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Panel de moderación"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
      >
        <Shield className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="flex max-h-[80dvh] w-full max-w-md flex-col gap-4 rounded-t-3xl bg-background p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold">
                <Shield className="h-4 w-4 text-primary" />
                Panel de moderación
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-surface p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {chatPaused ? (
                  <PauseCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <PlayCircle className="h-4 w-4 text-primary" />
                )}
                {chatPaused ? "Chat en pausa" : "Chat activo"}
              </div>
              <Button size="sm" variant={chatPaused ? "default" : "outline"} onClick={toggleChatPause}>
                {chatPaused ? "Reanudar" : "Pausar"}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl bg-surface p-3">
              <span className="text-sm font-medium">Modo lento (segundos)</span>
              <div className="flex items-center gap-2">
                <Input
                  value={slowModeSeconds}
                  onChange={(e) => setSlowModeSeconds(e.target.value)}
                  inputMode="numeric"
                  className="h-8 w-16 text-center"
                />
                <Button size="sm" variant="outline" onClick={applySlowMode}>
                  Aplicar
                </Button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              <span className="text-xs font-semibold text-muted-foreground">
                Espectadores conectados ({participants.length})
              </span>
              {loading && (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              {!loading && participants.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Sin espectadores conectados.</p>
              )}
              {participants.map((p) => (
                <div key={p.userId} className="flex items-center justify-between rounded-xl bg-surface p-2.5">
                  <span className="truncate text-sm">@{p.username}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleMute(p)}
                      disabled={busyUserId === p.userId}
                      aria-label={p.isMuted ? "Quitar silencio" : "Silenciar"}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full",
                        p.isMuted ? "bg-gold/20 text-gold" : "bg-surface-2 text-foreground/70",
                      )}
                    >
                      {p.isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => kick(p)}
                      disabled={busyUserId === p.userId}
                      aria-label="Expulsar"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 text-destructive"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
