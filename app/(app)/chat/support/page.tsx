"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  conversation_id: string | null;
  created_at: string;
};

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/support-tickets")
      .then((res) => res.json())
      .then((b) => setTickets(b.tickets ?? []));
  }, []);

  async function submit() {
    if (!subject.trim() || !body.trim()) {
      setError("Completa el asunto y el mensaje.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/support-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const b = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(b.error ?? "No se pudo crear el ticket.");
      return;
    }
    setSubject("");
    setBody("");
    fetch("/api/support-tickets")
      .then((res) => res.json())
      .then((b) => setTickets(b.tickets ?? []));
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/chat")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold">Soporte</h1>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LifeBuoy className="h-4 w-4 text-gold" />
          Crear ticket
        </div>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe tu problema..." rows={4} />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button onClick={submit} disabled={loading} className="h-10">
          {loading ? "Enviando..." : "Enviar ticket"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground/90">Tus tickets</h2>
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{t.subject}</span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(t.created_at).toLocaleDateString("es-MX")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  t.status === "closed" ? "bg-surface-2 text-muted-foreground" : "bg-gold/15 text-gold",
                )}
              >
                {t.status === "closed" ? "Cerrado" : "Abierto"}
              </span>
              {t.conversation_id && (
                <button
                  onClick={() => router.push(`/chat/${t.conversation_id}`)}
                  className="text-xs font-semibold text-primary"
                >
                  Ver chat
                </button>
              )}
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin tickets todavía.
          </p>
        )}
      </div>
    </div>
  );
}
