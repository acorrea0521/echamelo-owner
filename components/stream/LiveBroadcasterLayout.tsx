"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

export function LiveBroadcasterLayout({ streamId }: { streamId: string }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const getToken = async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamId }),
        });
        const data = await res.json();
        setToken(data.token);
        setUrl(data.url);

        // Mark stream as live
        await fetch(`/api/streams/${streamId}/go-live`, { method: "POST" });
      } catch (err) {
        console.error("Error:", err);
      }
    };
    getToken();
  }, [streamId]);

  if (!token || !url) {
    return (
      <div style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={url}
      data-lk-theme="dark"
      style={{
        height: "100vh",
        width: "100%",
      }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
