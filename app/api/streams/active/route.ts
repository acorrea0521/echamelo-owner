import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: streams, error } = await supabase
    .from("streams")
    .select(
      `
      id,
      title,
      status,
      viewer_count,
      started_at,
      seller_id,
      profiles:seller_id(id, username, display_name)
    `
    )
    .eq("status", "live")
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Error fetching active streams:", error);
    return NextResponse.json({ error: "Error fetching streams" }, { status: 500 });
  }

  return NextResponse.json(streams || []);
}
