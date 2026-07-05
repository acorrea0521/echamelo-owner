"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/nav/NotificationBell";

export function TopBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Link href="/home" className="flex items-center gap-1.5">
        <span className="text-lg font-black tracking-tight text-primary">
          ¡ECHAMELO!
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="Panel de administrador"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary"
          >
            <ShieldCheck className="h-4 w-4" />
          </Link>
        )}
        <Link
          href="/chat"
          aria-label="Chat"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
        <NotificationBell />
        <button
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground/80 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
