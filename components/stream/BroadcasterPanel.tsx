"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Room, RoomEvent, Track, type LocalTrack } from "livekit-client";
import { Radio, Square, Mic, MicOff, Video as VideoIcon, VideoOff, Loader2, SwitchCamera, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BroadcasterPanel({
  streamId,
  initialStatus,
}: {
  streamId: string;
  initialStatus: "scheduled" | "live" | "ended";
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);

  const [status, setStatus] = useState(initialStatus);
  const [connecting, setConnecting] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!isFullscreen) {
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen();
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
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  async function handleGoLive() {
    setConnecting(true);
    setError(null);

    let room: Room | null = null;

    try {
      const tokenRes = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId }),
      });
      const tokenBody = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenBody.error ?? "No se pudo preparar la transmisión.");
      const { token, url } = tokenBody;

      room = new Room();
      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        const track = publication.track as LocalTrack | undefined;
        if (publication.kind === Track.Kind.Video && track && videoRef.current) {
          track.attach(videoRef.current);
        }
      });

      await room.connect(url, token);
      // Only mark the stream "live" in the DB once we've actually
      // published — a client-side camera/mic failure below must not
      // leave the DB out of sync with reality.
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);

      const devices = await Room.getLocalDevices("videoinput");
      setCameras(devices);
      const currentDeviceId = room.localParticipant
        .getTrackPublication(Track.Source.Camera)
        ?.track?.mediaStreamTrack.getSettings().deviceId;
      const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId);
      setActiveCameraIndex(currentIndex >= 0 ? currentIndex : 0);

      const goLiveRes = await fetch(`/api/streams/${streamId}/go-live`, { method: "POST" });
      const goLiveBody = await goLiveRes.json();
      if (!goLiveRes.ok) throw new Error(goLiveBody.error ?? "No se pudo iniciar.");

      roomRef.current = room;
      setStatus("live");
    } catch (err) {
      room?.disconnect();
      setError(err instanceof Error ? err.message : "No se pudo iniciar la transmisión.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleStop() {
    setConnecting(true);
    roomRef.current?.disconnect();
    roomRef.current = null;
    await fetch(`/api/streams/${streamId}/stop`, { method: "POST" });
    setConnecting(false);
    setStatus("ended");
    router.push("/go-live");
  }

  async function toggleMic() {
    const next = !micOn;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  }

  async function toggleCam() {
    const next = !camOn;
    await roomRef.current?.localParticipant.setCameraEnabled(next);
    setCamOn(next);
  }

  async function switchCamera() {
    const room = roomRef.current;
    if (!room || cameras.length < 2 || switchingCamera) return;
    setSwitchingCamera(true);
    const nextIndex = (activeCameraIndex + 1) % cameras.length;
    try {
      await room.switchActiveDevice("videoinput", cameras[nextIndex].deviceId);
      setActiveCameraIndex(nextIndex);
    } catch {
      setError("No se pudo cambiar de cámara.");
    } finally {
      setSwitchingCamera(false);
    }
  }

  if (status === "ended") {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div
        ref={videoContainerRef}
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={status === "live" ? "h-full w-full object-cover" : "hidden"}
        />
        {status !== "live" && (
          <div className="flex h-full items-center justify-center text-white/30">
            <Radio className="h-8 w-8" />
          </div>
        )}
        {status === "live" && (
          <span className="absolute left-2 top-2 rounded-md bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            En vivo
          </span>
        )}
        {status === "live" && (
          <button
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 p-3 rounded-lg bg-black/80 hover:bg-black text-white transition-colors z-50 flex items-center justify-center"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            type="button"
          >
            {isFullscreen ? (
              <Minimize2 className="h-6 w-6" />
            ) : (
              <Maximize2 className="h-6 w-6" />
            )}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status === "live" ? (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            aria-label={micOn ? "Silenciar micrófono" : "Activar micrófono"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-foreground/80"
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleCam}
            aria-label={camOn ? "Apagar cámara" : "Encender cámara"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-foreground/80"
          >
            {camOn ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              disabled={switchingCamera || !camOn}
              aria-label="Cambiar cámara"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-foreground/80 disabled:opacity-40"
            >
              <SwitchCamera className="h-4 w-4" />
            </button>
          )}
          <Button
            onClick={handleStop}
            disabled={connecting}
            variant="destructive"
            className="ml-auto h-10 gap-1.5"
          >
            <Square className="h-3.5 w-3.5" />
            Terminar transmisión
          </Button>
        </div>
      ) : (
        <Button onClick={handleGoLive} disabled={connecting} className="h-11 gap-2">
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          {connecting ? "Conectando..." : "Ir en vivo"}
        </Button>
      )}
    </div>
  );
}
