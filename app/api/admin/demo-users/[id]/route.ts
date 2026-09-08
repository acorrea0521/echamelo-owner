import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

// Deletes a demo account for good. Guarded on is_demo so this route can never
// be pointed at a real user, whatever id is passed in.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, is_demo")
    .eq("id", id)
    .maybeSingle();

  if (!profile?.is_demo) {
    return NextResponse.json({ error: "Esa cuenta no es de demo." }, { status: 400 });
  }

  // profiles.id cascades from auth.users, and streams/listings/orders cascade
  // or block from there — deleting the auth user is the single entry point.
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar: la cuenta ya tiene actividad ligada." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
