"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  streamId: string | null;
  isRead: boolean;
  createdAt: string;
  sellerLabel: string;
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      userId = user.id;

      const { data: rows } = await supabase
        .from("notifications")
        .select(
          "id, stream_id, is_read, created_at, stream:streams(seller:profiles!streams_seller_id_fkey(username, display_name))",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setNotifications((rows ?? []).map(shape));
    });

    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        async (payload) => {
          const row = payload.new as { user_id: string; id: string; stream_id: string | null; is_read: boolean; created_at: string };
          if (row.user_id !== userId) return;

          const { data: full } = await supabase
            .from("notifications")
            .select(
              "id, stream_id, is_read, created_at, stream:streams(seller:profiles!streams_seller_id_fkey(username, display_name))",
            )
            .eq("id", row.id)
            .single();

          if (full) setNotifications((prev) => [shape(full), ...prev]);
        },
      )
      .subscribe();

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleOpenNotification(n: Notification) {
    if (!n.isRead) {
      const supabase = createClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    setOpen(false);
    if (n.streamId) router.push(`/stream/${n.streamId}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Notificaciones"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground/80"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 flex max-h-80 w-72 flex-col overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
          {notifications.length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">Sin notificaciones todavía.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleOpenNotification(n)}
              className={cn(
                "flex items-center gap-2 border-b border-border p-3 text-left last:border-b-0",
                !n.isRead && "bg-primary/5",
              )}
            >
              <Radio className="h-4 w-4 shrink-0 text-live" />
              <span className="text-xs">
                <span className="font-semibold">{n.sellerLabel}</span> está en vivo
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function shape(row: {
  id: string;
  stream_id: string | null;
  is_read: boolean;
  created_at: string;
  stream: { seller: { username: string; display_name: string | null } | null } | null;
}): Notification {
  return {
    id: row.id,
    streamId: row.stream_id,
    isRead: row.is_read,
    createdAt: row.created_at,
    sellerLabel: row.stream?.seller?.display_name ?? row.stream?.seller?.username ?? "Un vendedor",
  };
}
