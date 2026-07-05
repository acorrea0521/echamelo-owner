import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const enabled = Boolean(body?.enabled);
  const maxBots = Math.max(0, Math.min(100, Number(body?.max_bots ?? 0)));

  const { id: sellerId } = await params;
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("bot_configs")
    .upsert({ seller_id: sellerId, enabled, max_bots: maxBots });

  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar la configuración de bots." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
