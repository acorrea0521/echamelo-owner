import "server-only";
import { createClient } from "@/lib/supabase/server";

// Defense-in-depth admin check for API routes — middleware.ts already
// blocks non-admins from /admin pages, but every admin API route
// independently re-verifies is_admin before touching the service-role
// client (see lib/supabase/admin.ts).
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;

  return user;
}
