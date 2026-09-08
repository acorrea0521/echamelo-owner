import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", user.id)
    .eq("status", "paid")
    // Simulated sales don't create a real balance to withdraw.
    .eq("is_simulated", false);

  if (!count) {
    return NextResponse.json({ error: "No tienes saldo pendiente." }, { status: 400 });
  }

  // payout_requested_at is server-managed (migration 0030 revokes it from
  // `authenticated`), so this write goes through the service-role client. The
  // caller is still pinned to their own row by user.id above.
  await createAdminClient()
    .from("profiles")
    .update({ payout_requested_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
