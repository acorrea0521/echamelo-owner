"use client";

import { useEffect, useState } from "react";
import { Shield, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

type Moderator = { userId: string; username: string };
type UserResult = { id: string; username: string };

export function ModeratorManagePanel({ streamId }: { streamId: string }) {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  async function loadModerators() {
    const supabase = createClient();
    const { data } = await supabase
      .from("stream_moderators")
      .select("user_id, moderator:profiles!stream_moderators_user_id_fkey(username)")
      .eq("stream_id", streamId);
    setModerators((data ?? []).map((m) => ({ userId: m.user_id, username: m.moderator?.username ?? "?" })));
  }

  useEffect(() => {
    loadModerators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((body) => setResults(body.users ?? []));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function addModerator(user: UserResult) {
    setAdding(user.id);
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    await supabase
      .from("stream_moderators")
      .insert({ stream_id: streamId, user_id: user.id, added_by: authUser.id });
    setQuery("");
    setResults([]);
    setAdding(null);
    loadModerators();
  }

  async function removeModerator(userId: string) {
    const supabase = createClient();
    await supabase.from("stream_moderators").delete().eq("stream_id", streamId).eq("user_id", userId);
    setModerators((prev) => prev.filter((m) => m.userId !== userId));
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <Shield className="h-4 w-4 text-primary" />
        Moderadores
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar usuario por nombre..."
        className="h-9 text-sm"
      />

      {results.length > 0 && (
        <div className="flex flex-col gap-1">
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => addModerator(u)}
              disabled={adding === u.id}
              className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-left text-xs"
            >
              @{u.username}
              <span className="text-primary">Agregar</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {moderators.map((m) => (
          <div key={m.userId} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-xs">
            @{m.username}
            <button onClick={() => removeModerator(m.userId)} aria-label="Quitar moderador">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}
        {moderators.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin moderadores todavía.</p>
        )}
      </div>
    </div>
  );
}
