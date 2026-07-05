import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Service-role client that bypasses RLS entirely. Server-only by construction
// (the `server-only` import throws a build error if ever pulled into a client
// bundle). Used exclusively by /admin routes and webhook handlers — every
// caller must independently re-verify profiles.is_admin before using this.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
