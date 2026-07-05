"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

const LIVEKIT_URL = "wss://echamelo-iqtjzlgs.livekit.cloud";

export function LiveViewerLayout({ streamId }: { streamId: string }) {
  const [token, setToken] = useState("");

  useEffect(() => {
    const generateToken = async () => {
      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamId, identity: `viewer-${streamId}` }),
        });
        if (response.ok) {
          const data = await response.json();
          setToken(data.token);
        } else {
          console.error("Error fetching token:", response.status);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    generateToken();
  }, [streamId]);

  if (!token) {
    return <div style={{ width: "100%", height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Cargando...</div>;
  }

  return (
    <LiveKitRoom video={true} audio={true} token={token} serverUrl={LIVEKIT_URL} data-lk-theme="dark" style={{ height: "100vh", width: "100%" }}>
      <VideoConference />
    </LiveKitRoom>
  );
}
