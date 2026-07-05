import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

// Approves content/identity only — the seller still needs to finish Stripe
// Connect banking before seller_status flips to 'activo' (done by the
// account.updated webhook / the onboarding return-trip fallback).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: application, error } = await adminClient
    .from("seller_applications")
    .update({
      status: "approved",
      admin_reviewer_id: admin.id,
      reviewed_at: new Date().toISOString(),
      rejected_reason: null,
    })
    .eq("id", id)
    .select("seller_id")
    .single();

  if (error || !application) {
    return NextResponse.json({ error: "No se pudo aprobar." }, { status: 400 });
  }

  await adminClient
    .from("profiles")
    .update({ seller_status: "aprobado_pendiente_stripe" })
    .eq("id", application.seller_id);

  return NextResponse.json({ ok: true });
}
