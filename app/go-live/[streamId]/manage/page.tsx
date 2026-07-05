"use client";

import { useParams } from "next/navigation";
import { LiveBroadcasterLayout } from "@/components/stream/LiveBroadcasterLayout";
import { EchameloCSSProvider } from "@/components/stream/EchameloCSSProvider";

export default function ManageStreamPage() {
  const params = useParams();
  const streamId = params.streamId as string;

  return (
    <EchameloCSSProvider>
      <LiveBroadcasterLayout streamId={streamId} />
    </EchameloCSSProvider>
  );
}
