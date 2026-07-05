"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Primary: plays a real first-person POV video of arms catching flying
 * boxes (see /public/splash/catch.mp4 — not committed yet, drop it in when
 * ready). Falls back automatically to a simple CSS "catch" animation if
 * that file is missing or fails to load, so the app never breaks waiting
 * on the asset.
 *
 * Either path shares the same outer contract: wait for both the visual
 * sequence to finish AND the /api/streams/preview fetch to resolve, then
 * fade out and call onDone.
 */

const MIN_DURATION_MS = 3000;
const PACKAGE_DELAYS = [0, 120, 240];
const VIDEO_SRC = "/splash/catch.mp4";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // CSS-fallback path only needs a fixed timer; the video path resolves
  // animDone from the video's own "ended"/error events instead.
  useEffect(() => {
    if (!videoFailed) return;
    const timer = setTimeout(() => setAnimDone(true), MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, [videoFailed]);

  useEffect(() => {
    fetch("/api/streams/preview")
      .then(() => setDataReady(true))
      .catch(() => setDataReady(true));
  }, []);

  useEffect(() => {
    if (!animDone || !dataReady) return;
    setFadingOut(true);
    const timer = setTimeout(onDone, 350);
    return () => clearTimeout(timer);
  }, [animDone, dataReady, onDone]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background transition-opacity duration-300",
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      {!videoFailed ? (
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          onEnded={() => setAnimDone(true)}
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <div className="relative flex h-64 w-64 items-center justify-center">
          {/* Flying packages */}
          {PACKAGE_DELAYS.map((delay, i) => (
            <Package
              key={i}
              className="animate-splash-fly-in absolute h-10 w-10 text-[#b08968]"
              style={{ animationDelay: `${delay}ms`, left: `${40 + i * 8}%`, top: 0 }}
            />
          ))}

          {/* Logo pop-in at the catch point */}
          <div className="animate-splash-logo-pop animate-splash-celebrate absolute bottom-16 h-20 w-20 overflow-hidden rounded-2xl bg-black">
            <Image
              src="/brand/logo.jpg"
              alt="¡ECHAMELO!"
              width={80}
              height={80}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Arms reaching up from the bottom, catch-bounce on impact */}
          <div className="animate-splash-arms-catch absolute bottom-0 flex w-full items-end justify-center gap-8">
            <div className="h-14 w-3 -rotate-[20deg] rounded-full bg-foreground/80" />
            <div className="h-14 w-3 rotate-[20deg] rounded-full bg-foreground/80" />
          </div>
        </div>
      )}

      <span
        className={cn(
          "z-10 text-2xl font-black tracking-tight text-white drop-shadow-lg",
          videoFailed ? "mt-6 text-primary drop-shadow-none" : "absolute bottom-10",
        )}
      >
        ¡ECHAMELO!
      </span>
    </div>
  );
}
