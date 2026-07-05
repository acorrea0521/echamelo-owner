"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LiveViewerLayout } from "@/components/stream/LiveViewerLayout";
import { EchameloCSSProvider } from "@/components/stream/EchameloCSSProvider";

export default function StreamPage() {
  const params = useParams();
  const [streamId, setStreamId] = useState<string | null>(null);

  useEffect(() => {
    if (params.streamId) {
      setStreamId(params.streamId as string);
    }
  }, [params.streamId]);

  if (!streamId) {
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
        Cargando transmisión...
      </div>
    );
  }

  return (
    <EchameloCSSProvider>
      <LiveViewerLayout streamId={streamId} />
    </EchameloCSSProvider>
  );
}
