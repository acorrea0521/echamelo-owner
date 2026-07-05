"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Plus, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", label: "Inicio", icon: Home, isCenter: false },
  { href: "/categories", label: "Categorías", icon: LayoutGrid, isCenter: false },
  { href: "/go-live", label: "Transmitir", icon: Plus, isCenter: true },
  { href: "/activity", label: "Actividad", icon: Heart, isCenter: false },
  { href: "/account", label: "Cuenta", icon: User, isCenter: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isCenter }) => {
          const active = pathname?.startsWith(href);

          if (isCenter) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="brand-gradient -mt-6 flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-primary/30"
              >
                <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-muted-foreground transition-colors",
                active && "text-primary",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
