import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: stream } = await supabase
    .from("streams")
    .select("id, title, status, viewer_count, created_at, started_at, ended_at")
    .eq("id", id)
    .single();

  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  return NextResponse.json(stream);
}
