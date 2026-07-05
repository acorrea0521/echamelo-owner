import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { identifier, password } = await request.json().catch(() => ({}));

  if (!identifier || !password) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }

  const supabase = await createClient();
  let email: string = identifier;

  if (!EMAIL_RE.test(identifier)) {
    // Not an email — resolve the username to its account email via the
    // admin client (auth.users is never exposed to the anon/RLS client).
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("username", identifier.trim().toLowerCase())
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }
    email = userData.user.email;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
