import { ShieldCheck } from "lucide-react";

// Marks the platform's official/verified admin account (as opposed to any
// other manually-seeded admin) — a blue shield shown before their username.
export function OfficialBadge({ className }: { className?: string }) {
  return (
    <ShieldCheck
      aria-label="Administrador oficial"
      className={className ?? "h-3.5 w-3.5 shrink-0 text-blue-500"}
      fill="currentColor"
      stroke="white"
      strokeWidth={1.5}
    />
  );
}
