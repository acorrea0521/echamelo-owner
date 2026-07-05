import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

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
      status: "rejected",
      admin_reviewer_id: admin.id,
      reviewed_at: new Date().toISOString(),
      rejected_reason: reason,
    })
    .eq("id", id)
    .select("seller_id")
    .single();

  if (error || !application) {
    return NextResponse.json({ error: "No se pudo rechazar." }, { status: 400 });
  }

  await adminClient.from("profiles").update({ seller_status: "rechazado" }).eq("id", application.seller_id);

  return NextResponse.json({ ok: true });
}
