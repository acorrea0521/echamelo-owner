import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEMO_MIN_PASSWORD_LENGTH,
  DEMO_USERNAME_RE,
  demoEmailFor,
  normalizeUsername,
} from "@/lib/demo";

// Creates a demo (sandbox) account from the admin panel: a real auth user with
// a real username + password that lives in the closed demo circuit (see
// migration 0028). Demo sellers are approved on the spot — there is no
// application to review and no Stripe Connect to onboard, because a demo sale
// never moves money. Demo buyers are marked 'verificado' so no identity or
// card prompt can ever block them.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const role = body?.role as "buyer" | "seller" | undefined;
  const username = normalizeUsername(String(body?.username ?? ""));
  const password = String(body?.password ?? "");
  const displayName = String(body?.displayName ?? "").trim() || username;
  const categoryId = (body?.categoryId as string | undefined) || null;

  if (role !== "buyer" && role !== "seller") {
    return NextResponse.json({ error: "Elige comprador o vendedor." }, { status: 400 });
  }
  if (!DEMO_USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "El usuario debe tener 3 a 20 caracteres: minúsculas, números o guion bajo." },
      { status: 400 },
    );
  }
  if (password.length < DEMO_MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${DEMO_MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 },
    );
  }
  if (role === "seller" && !categoryId) {
    return NextResponse.json(
      { error: "Un vendedor necesita una categoría para poder transmitir." },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  const { data: taken } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (taken) {
    return NextResponse.json({ error: "Ese nombre de usuario ya existe." }, { status: 409 });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: demoEmailFor(username),
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "No se pudo crear la cuenta." },
      { status: 400 },
    );
  }

  // handle_new_user() already inserted the profile row with a derived
  // username; overwrite it with what the admin actually typed and flip the
  // account into the demo circuit.
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      role,
      is_demo: true,
      category_id: categoryId,
      seller_status: role === "seller" ? "activo" : "no_aplicado",
      buyer_status: "verificado",
    })
    .eq("id", created.user.id);

  if (profileError) {
    // Never leave an auth user behind without a usable profile.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "No se pudo configurar el perfil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: created.user.id, username });
}
