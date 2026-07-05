"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsRight, Gavel, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const THUMB_SIZE = 44;
const TRACK_PADDING = 4;
const CONFIRM_THRESHOLD = 0.75;

// No gesture library in this project — plain Pointer Events cover drag +
// touch uniformly, which is all a single-axis slide-to-confirm needs.
export function SlideToBid({
  label,
  onConfirm,
  disabled,
  loading,
}: {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Pointer events dispatched back-to-back (real touch input, or tests)
  // can land in the same React batch, so `dragX`/`maxX` state read inside
  // handlePointerUp may still reflect the pre-drag render. Track the live
  // values in refs, updated synchronously, so the threshold check is
  // never fooled by a stale closure.
  const dragXRef = useRef(0);
  const maxXRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      setDragX(0);
      dragXRef.current = 0;
    }
  }, [loading]);

  const measure = useCallback(() => {
    const width = trackRef.current?.getBoundingClientRect().width ?? 0;
    const next = Math.max(0, width - THUMB_SIZE - TRACK_PADDING * 2);
    setMaxX(next);
    maxXRef.current = next;
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled || loading) return;
    measure();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING - THUMB_SIZE / 2;
    const clamped = Math.min(maxXRef.current, Math.max(0, x));
    dragXRef.current = clamped;
    setDragX(clamped);
  }

  function handlePointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const max = maxXRef.current;
    if (max > 0 && dragXRef.current / max >= CONFIRM_THRESHOLD) {
      dragXRef.current = max;
      setDragX(max);
      onConfirm();
    } else {
      dragXRef.current = 0;
      setDragX(0);
    }
  }

  const progress = maxX > 0 ? dragX / maxX : 0;

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-13 w-full select-none overflow-hidden rounded-full border border-gold/40 bg-gold/15",
        (disabled || loading) && "opacity-50",
      )}
      style={{ height: 52, padding: TRACK_PADDING }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gold"
        style={{
          width: dragX + THUMB_SIZE + TRACK_PADDING * 2,
          transition: dragging ? "none" : "width 200ms ease-out",
        }}
      />

      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 text-sm font-bold text-gold [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
        style={{ opacity: 1 - progress * 1.4 }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
        {!loading && <ChevronsRight className="h-4 w-4" />}
      </span>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "absolute top-1/2 flex items-center justify-center rounded-full bg-gold-foreground text-gold shadow-lg",
          disabled || loading ? "cursor-not-allowed" : "cursor-grab touch-none active:cursor-grabbing",
        )}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          left: TRACK_PADDING + dragX,
          transform: "translateY(-50%)",
          transition: dragging ? "none" : "left 200ms ease-out",
        }}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gavel className="h-5 w-5" />}
      </div>
    </div>
  );
}
