import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(request: Request) {
  try {
    const { streamId, identity } = await request.json();

    if (!streamId || !identity) {
      return NextResponse.json({ error: "Missing streamId or identity" }, { status: 400 });
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity,
        name: identity,
        ttl: 3600,
      }
    );

    token.addGrant({
      room: streamId,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    return NextResponse.json({ token: token.toJwt() });
  } catch (err) {
    console.error("Token generation error:", err);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
