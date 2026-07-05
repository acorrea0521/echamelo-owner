import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

// Sends the application back to the seller with a note on what to fix.
// seller_applications RLS allows the seller to edit/resubmit only while
// status is 'draft' or 'changes_requested' (see migration 0011).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const reason = body?.reason as string | undefined;
  if (!reason) {
    return NextResponse.json({ error: "Se requiere un motivo." }, { status: 400 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: application, error } = await adminClient
    .from("seller_applications")
    .update({
      status: "changes_requested",
      admin_reviewer_id: admin.id,
      reviewed_at: new Date().toISOString(),
      rejected_reason: reason,
    })
    .eq("id", id)
    .select("seller_id")
    .single();

  if (error || !application) {
    return NextResponse.json({ error: "No se pudo procesar." }, { status: 400 });
  }

  await adminClient
    .from("profiles")
    .update({ seller_status: "cambios_solicitados" })
    .eq("id", application.seller_id);

  return NextResponse.json({ ok: true });
}
