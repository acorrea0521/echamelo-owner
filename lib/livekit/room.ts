import "server-only";
import { RoomServiceClient } from "livekit-server-sdk";

const roomService = new RoomServiceClient(
  process.env.NEXT_PUBLIC_LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!,
);

export async function ensureLiveKitRoom(roomName: string) {
  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 5 * 60, // seconds — auto-clean if the seller crashes without stopping
    maxParticipants: 500,
  });
}

export async function deleteLiveKitRoom(roomName: string) {
  try {
    await roomService.deleteRoom(roomName);
  } catch {
    // Already gone (e.g. emptyTimeout already cleaned it up) — fine to ignore.
  }
}

export async function kickParticipant(roomName: string, identity: string) {
  try {
    await roomService.removeParticipant(roomName, identity);
  } catch {
    // Not currently connected — fine, the ban row still blocks rejoining.
  }
}

export async function listLiveKitParticipants(roomName: string) {
  try {
    return await roomService.listParticipants(roomName);
  } catch {
    return [];
  }
}
