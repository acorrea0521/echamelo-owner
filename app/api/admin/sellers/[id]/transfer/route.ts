import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

// Manually transfers a seller's full pending balance (sum of seller_payout_cents
// across their 'paid' orders) to their Stripe Connect account, then marks
// those orders 'completed'. See project_echamelo_business_rules "Seller payouts".
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id: sellerId } = await params;
  const adminClient = createAdminClient();

  const { data: seller } = await adminClient
    .from("profiles")
    .select("stripe_account_id, stripe_payouts_enabled")
    .eq("id", sellerId)
    .single();

  if (!seller?.stripe_account_id || !seller.stripe_payouts_enabled) {
    return NextResponse.json(
      { error: "El vendedor no tiene una cuenta de Stripe Connect lista para recibir pagos." },
      { status: 400 },
    );
  }

  const { data: pendingOrders } = await adminClient
    .from("orders")
    .select("id, seller_payout_cents")
    .eq("seller_id", sellerId)
    .eq("status", "paid");

  const totalCents = (pendingOrders ?? []).reduce((sum, o) => sum + (o.seller_payout_cents ?? 0), 0);

  if (!pendingOrders || pendingOrders.length === 0 || totalCents <= 0) {
    return NextResponse.json({ error: "No hay saldo pendiente para este vendedor." }, { status: 400 });
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: totalCents,
      currency: "mxn",
      destination: seller.stripe_account_id,
      metadata: { seller_id: sellerId, order_count: String(pendingOrders.length) },
    });

    await adminClient
      .from("orders")
      .update({ status: "completed", stripe_transfer_id: transfer.id })
      .in(
        "id",
        pendingOrders.map((o) => o.id),
      );

    await adminClient.from("profiles").update({ payout_requested_at: null }).eq("id", sellerId);

    return NextResponse.json({ ok: true, transferId: transfer.id, amountCents: totalCents });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la transferencia con Stripe." }, { status: 500 });
  }
}
