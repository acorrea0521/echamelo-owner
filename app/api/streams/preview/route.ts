import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lightweight prefetch used by the splash screen: warms the live-streams
// query while the catch animation plays, so /home renders instantly once
// the splash fades out. Intentionally minimal (count + a few ids), not the
// full feed payload — Home itself still does its own real query.
export async function GET() {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("streams")
    .select("id", { count: "exact" })
    .eq("status", "live")
    .limit(6);

  return NextResponse.json({ liveCount: count ?? 0, ids: data?.map((s) => s.id) ?? [] });
}
