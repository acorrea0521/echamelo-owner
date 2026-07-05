"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageCircle, LifeBuoy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { OfficialBadge } from "@/components/ui/OfficialBadge";
import { LoadingState, ErrorState } from "@/components/ui/loading";

type Conversation = {
  id: string;
  isSupport: boolean;
  isClosed: boolean;
  updatedAt: string;
  otherUser: { id: string; username: string; avatar_url: string | null; is_official_admin?: boolean } | null;
};

type UserResult = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export default function ChatInboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  function loadConversations() {
    setStatus("loading");
    fetch("/api/conversations")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((body) => {
        setConversations(body.conversations ?? []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((body) => setResults(body.users ?? []))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function startConversation(targetUserId: string) {
    setStarting(targetUserId);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const body = await res.json();
    setStarting(null);
    if (res.ok) router.push(`/chat/${body.conversationId}`);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <h1 className="text-lg font-bold">Chat</h1>

      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar usuario por nombre..."
          className="h-6 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="flex flex-col gap-1">
          {searching && <p className="px-2 text-xs text-muted-foreground">Buscando...</p>}
          {!searching && results.length === 0 && (
            <p className="px-2 text-xs text-muted-foreground">Sin resultados.</p>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => startConversation(u.id)}
              disabled={starting === u.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={u.avatar_url ?? undefined} />
                <AvatarFallback className="bg-surface-2 text-xs">{u.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{u.username}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium">Soporte</span>
        </div>
        <button
          onClick={() => router.push("/chat/support")}
          className="text-xs font-semibold text-primary"
        >
          Crear ticket
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState onRetry={loadConversations} />}
        {status === "ready" &&
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/chat/${c.id}`)}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={c.otherUser?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-surface-2 text-xs">
                  {(c.otherUser?.username ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1 truncate text-sm font-semibold">
                  {c.otherUser?.is_official_admin && <OfficialBadge />}
                  {c.isSupport ? "Soporte ECHAMELO" : `@${c.otherUser?.username ?? "?"}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.isClosed ? "Cerrada" : "Activa"}
                </span>
              </div>
              <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        {status === "ready" && conversations.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aún no tienes conversaciones. Busca a alguien para empezar a chatear.
          </p>
        )}
      </div>
    </div>
  );
}
