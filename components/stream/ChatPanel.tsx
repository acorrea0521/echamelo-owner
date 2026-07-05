"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Share2, Send, Bot, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type ChatMessage = { id: string; senderId: string | null; sender: string; body: string; isBot: boolean };

export function ChatPanel({
  streamId,
  isModerator = false,
  initialChatPaused = false,
}: {
  streamId: string;
  isModerator?: boolean;
  initialChatPaused?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [chatPaused, setChatPaused] = useState(initialChatPaused);
  const usernameCache = useRef<Map<string, string>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("chat_messages")
      .select("id, sender_id, bot_name, body, sender:profiles!chat_messages_sender_id_fkey(username)")
      .eq("stream_id", streamId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (!data) return;
        for (const m of data) {
          if (m.sender_id && m.sender?.username) usernameCache.current.set(m.sender_id, m.sender.username);
        }
        setMessages(
          data.map((m) => ({
            id: m.id,
            senderId: m.sender_id,
            sender: m.bot_name ?? m.sender?.username ?? "?",
            body: m.body,
            isBot: Boolean(m.bot_name),
          })),
        );
      });

    const streamChannel = supabase
      .channel(`stream-chat-controls-${streamId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "streams", filter: `id=eq.${streamId}` },
        (payload) => {
          setChatPaused(Boolean((payload.new as { chat_paused: boolean }).chat_paused));
        },
      )
      .subscribe();

    const channel = supabase
      .channel(`chat-${streamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `stream_id=eq.${streamId}` },
        async (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string | null;
            bot_name: string | null;
            body: string;
            is_deleted: boolean;
          };
          if (row.is_deleted) return;

          if (row.bot_name) {
            setMessages((prev) => [...prev, { id: row.id, senderId: null, sender: row.bot_name!, body: row.body, isBot: true }]);
            return;
          }

          if (!row.sender_id) return;

          let username = usernameCache.current.get(row.sender_id);
          if (!username) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", row.sender_id)
              .single();
            username = profile?.username ?? "?";
            usernameCache.current.set(row.sender_id, username);
          }

          setMessages((prev) => [
            ...prev,
            { id: row.id, senderId: row.sender_id, sender: username!, body: row.body, isBot: false },
          ]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `stream_id=eq.${streamId}` },
        (payload) => {
          const row = payload.new as { id: string; is_deleted: boolean };
          if (row.is_deleted) {
            setMessages((prev) => prev.filter((m) => m.id !== row.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(streamChannel);
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  async function deleteMessage(messageId: string) {
    const supabase = createClient();
    await supabase.from("chat_messages").update({ is_deleted: true }).eq("id", messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }

    const { error } = await supabase.from("chat_messages").insert({ stream_id: streamId, sender_id: user.id, body });
    setSending(false);
    if (error) {
      setSendError("No se pudo enviar. Es posible que estés silenciado o que el chat esté en pausa.");
      return;
    }
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <div ref={listRef} className="flex max-h-40 max-w-[75%] flex-col gap-1.5 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className="group flex items-start gap-1.5 rounded-2xl bg-black/40 px-3 py-1.5 backdrop-blur"
          >
            <p className="text-xs leading-snug text-white">
              <span
                className={
                  message.isBot
                    ? "inline-flex items-center gap-1 font-semibold text-white/50"
                    : "font-semibold text-primary"
                }
              >
                {message.isBot && <Bot className="h-3 w-3" />}
                {message.sender}
              </span>{" "}
              <span className="text-white/90">{message.body}</span>
            </p>
            {isModerator && !message.isBot && (
              <button
                onClick={() => deleteMessage(message.id)}
                aria-label="Eliminar mensaje"
                className="ml-auto shrink-0 text-white/40 opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {sendError && <p className="text-[11px] text-destructive">{sendError}</p>}

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            disabled={chatPaused && !isModerator}
            placeholder={chatPaused && !isModerator ? "El chat está en pausa..." : "Comentario..."}
            maxLength={500}
            className="h-7 border-none bg-transparent p-0 text-xs text-white placeholder:text-white/50 focus-visible:ring-0"
          />
          <button onClick={sendMessage} disabled={!draft.trim() || sending || (chatPaused && !isModerator)}>
            <Send className="h-4 w-4 shrink-0 text-primary" />
          </button>
        </div>
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
          <Share2 className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
          <Heart className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
