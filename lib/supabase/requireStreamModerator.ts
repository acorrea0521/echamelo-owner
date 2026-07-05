import "server-only";
import { createClient } from "@/lib/supabase/server";

// Defense-in-depth check for stream-moderation API routes — the same
// is_stream_moderator() logic is enforced again inside RLS/void_bid() for
// direct-write paths, but routes with side effects outside Postgres (LiveKit
// kicks) need it re-verified here too before touching the service-role client.
export async function requireStreamModerator(streamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: isModerator } = await supabase.rpc("is_stream_moderator", {
    p_stream_id: streamId,
    p_user_id: user.id,
  });

  if (!isModerator) return null;

  return user;
}
