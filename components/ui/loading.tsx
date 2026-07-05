import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Centered spinner for full-screen / section loading states.
export function LoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16 text-muted-foreground", className)}>
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

// Inline error message for failed data loads, with an optional retry.
export function ErrorState({
  message = "No se pudo cargar. Intenta de nuevo.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-16 text-center", className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold text-primary">
          Reintentar
        </button>
      )}
    </div>
  );
}
