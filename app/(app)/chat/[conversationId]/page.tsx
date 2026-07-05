"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { OfficialBadge } from "@/components/ui/OfficialBadge";

type Message = { id: string; sender_id: string; body: string; created_at: string };
type OtherUser = { username: string; is_official_admin: boolean } | null;

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [isSupport, setIsSupport] = useState(false);
  const [otherUser, setOtherUser] = useState<OtherUser>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setSelfId(uid);

      const { data: conversation } = await supabase
        .from("conversations")
        .select(
          "is_closed, is_support, user_a_id, user_b_id, a:profiles!conversations_buyer_id_fkey(username, is_official_admin), b:profiles!conversations_seller_id_fkey(username, is_official_admin)",
        )
        .eq("id", params.conversationId)
        .single();

      if (conversation) {
        setClosed(conversation.is_closed);
        setIsSupport(conversation.is_support);
        setOtherUser(conversation.user_a_id === uid ? conversation.b : conversation.a);
      }
    });

    fetch(`/api/conversations/${params.conversationId}/messages`)
      .then((res) => res.json())
      .then((body) => setMessages(body.messages ?? []));

    const channel = supabase
      .channel(`conversation-${params.conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${params.conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.conversationId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    const res = await fetch(`/api/conversations/${params.conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!res.ok) setDraft(body);
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => router.push("/chat")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="flex items-center gap-1 text-sm font-semibold">
          {otherUser?.is_official_admin && <OfficialBadge />}
          {isSupport ? "Soporte ECHAMELO" : otherUser ? `@${otherUser.username}` : "Conversación"}
        </span>
        {closed && (
          <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Cerrada
          </span>
        )}
      </div>

      <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.sender_id === selfId
                ? "ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "mr-auto max-w-[75%] rounded-2xl rounded-bl-sm bg-surface px-3 py-2 text-sm"
            }
          >
            {m.body}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">Sin mensajes todavía.</p>
        )}
      </div>

      {!closed && (
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Escribe un mensaje..."
            maxLength={1000}
            className="h-10 flex-1 rounded-full"
          />
          <button
            onClick={sendMessage}
            disabled={!draft.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
