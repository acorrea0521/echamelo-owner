import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      "id, user_a_id, user_b_id, is_support, is_closed, updated_at, a:profiles!conversations_buyer_id_fkey(id, username, avatar_url, is_official_admin), b:profiles!conversations_seller_id_fkey(id, username, avatar_url, is_official_admin)",
    )
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const shaped = (conversations ?? []).map((c) => ({
    id: c.id,
    isSupport: c.is_support,
    isClosed: c.is_closed,
    updatedAt: c.updated_at,
    otherUser: c.user_a_id === user.id ? c.b : c.a,
  }));

  return NextResponse.json({ conversations: shaped });
}

// Finds or creates a regular (non-support) DM with the target user. The
// "only admin may contact a user, users may not reach admin" rule is
// enforced by the conversations INSERT RLS policy itself — this route just
// forwards the caller's session and maps the resulting error.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const targetUserId = body?.targetUserId as string | undefined;
  if (!targetUserId || targetUserId === user.id) {
    return NextResponse.json({ error: "Usuario inválido." }, { status: 400 });
  }

  const [a, b] = [user.id, targetUserId].sort();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("is_support", false)
    .or(`and(user_a_id.eq.${a},user_b_id.eq.${b}),and(user_a_id.eq.${b},user_b_id.eq.${a})`)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_a_id: user.id, user_b_id: targetUserId })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "No puedes iniciar una conversación con este usuario." }, { status: 403 });
  }

  return NextResponse.json({ conversationId: created.id });
}
