import { AccessToken } from "livekit-server-sdk";

export async function createLiveKitToken({
  roomName,
  identity,
  name,
  canPublish,
}: {
  roomName: string;
  identity: string;
  name?: string;
  canPublish: boolean;
}) {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity,
    name,
    ttl: "1h",
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish,
    canPublishData: true,
    canSubscribe: true,
  });
  return at.toJwt();
}
