import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargeOrderForListing } from "@/lib/stripe/chargeOrder";

// Vercel Cron: sweep and charge all orders left in pending_payment state
// (from auctions closed by pg_cron with no active viewers to trigger the HTTP
// close route). Runs periodically (configured in vercel.json) and charges any
// orphaned orders that didn't get a chance to be captured client-side.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: pendingOrders, error } = await admin
    .from("orders")
    .select("id, listing_id, status")
    .eq("status", "pending_payment");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch pending orders", details: error }, { status: 500 });
  }

  const results = {
    total: pendingOrders?.length ?? 0,
    charged: 0,
    failed: 0,
    details: [] as Array<{
      listing_id: string;
      order_id: string;
      status: "paid" | "failed";
      error?: string;
    }>,
  };

  for (const order of pendingOrders ?? []) {
    try {
      const result = await chargeOrderForListing(order.listing_id);

      if (result?.status === "paid") {
        results.charged++;
        results.details.push({
          listing_id: order.listing_id,
          order_id: order.id,
          status: "paid",
        });
      } else {
        results.failed++;
        results.details.push({
          listing_id: order.listing_id,
          order_id: order.id,
          status: "failed",
          error: "Charge declined or no payment method",
        });
      }
    } catch (err) {
      results.failed++;
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      results.details.push({
        listing_id: order.listing_id,
        order_id: order.id,
        status: "failed",
        error: errorMsg,
      });
      console.error(`[sweep-orders] Failed to charge order ${order.id}:`, err);
    }
  }

  return NextResponse.json(results);
}
