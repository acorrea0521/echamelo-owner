"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { Video, Loader2, Maximize2, Minimize2 } from "lucide-react";

// Subscribe-only viewer surface. Fetches a viewer token for this stream,
// joins the LiveKit room, and attaches the seller's published video track.
export function VideoPlayer({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "waiting" | "error">(
    "connecting",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    let room: Room | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamId }),
        });
        if (!res.ok) throw new Error("token failed");
        const { token, url } = await res.json();
        if (cancelled) return;

        room = new Room();

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication) => {
          if (publication.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
            setStatus("connected");
          }
        });
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
          setStatus("waiting");
        });

        await room.connect(url, token);
        if (cancelled) {
          room.disconnect();
          return;
        }
        setStatus("waiting");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    connect();

    return () => {
      cancelled = true;
      room?.disconnect();
    };
  }, [streamId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-2 to-black"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={status === "connected" ? "h-full w-full object-cover" : "hidden"}
      />
      {status !== "connected" && (
        <div className="flex flex-col items-center gap-2 text-white/40">
          {status === "connecting" && <Loader2 className="h-8 w-8 animate-spin" />}
          {status === "waiting" && <Video className="h-10 w-10" />}
          {status === "error" && <Video className="h-10 w-10" />}
          <span className="text-xs">
            {status === "connecting" && "Conectando..."}
            {status === "waiting" && "Esperando video del vendedor..."}
            {status === "error" && "No se pudo conectar a la transmisión."}
          </span>
        </div>
      )}
      {status === "connected" && (
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors z-50"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-6 w-6" />
          ) : (
            <Maximize2 className="h-6 w-6" />
          )}
        </button>
      )}
    </div>
  );
}
