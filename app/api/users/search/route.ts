import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Regular users never see admin accounts in search results — the only path
// to reach admin is a support ticket (see project_echamelo_business_rules).
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `%${q}%`)
    .neq("id", user.id)
    .limit(20);

  if (!me?.is_admin) {
    query = query.eq("is_admin", false);
  }

  const { data: users } = await query;
  return NextResponse.json({ users: users ?? [] });
}
