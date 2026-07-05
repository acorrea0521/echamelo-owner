"use client";

import { useParams } from "next/navigation";
import { LiveViewerLayout } from "@/components/stream/LiveViewerLayout";
import { EchameloCSSProvider } from "@/components/stream/EchameloCSSProvider";

export default function StreamPage() {
  const params = useParams();
  const streamId = params.streamId as string;

  return (
    <EchameloCSSProvider>
      <LiveViewerLayout streamId={streamId} />
    </EchameloCSSProvider>
  );
}
