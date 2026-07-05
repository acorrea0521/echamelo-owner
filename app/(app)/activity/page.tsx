"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gavel, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingState, ErrorState } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  status: string;
  total_charged_cents: number;
  created_at: string;
  listing: { title: string; image_urls: string[] } | null;
  seller: { username: string } | null;
};

type Bid = {
  id: string;
  amount_cents: number;
  created_at: string;
  listing: {
    id: string;
    title: string;
    image_urls: string[];
    status: string;
    current_highest_bid_cents: number | null;
    current_highest_bidder_id: string | null;
  } | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-gold/15 text-gold",
  payout_processing: "bg-gold/15 text-gold",
  paid: "bg-primary/15 text-primary",
  completed: "bg-primary/15 text-primary",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-surface-2 text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  payout_processing: "Procesando",
  paid: "Pagada",
  completed: "Completada",
  failed: "Fallida",
  refunded: "Reembolsada",
};

const FILTERS = [
  { id: "all", label: "Todas", statuses: null },
  { id: "in_progress", label: "En proceso", statuses: ["pending_payment", "payout_processing"] },
  { id: "completed", label: "Completadas", statuses: ["paid", "completed"] },
  { id: "refunds", label: "Reembolsos", statuses: ["refunded"] },
] as const;

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

export default function ActivityPage() {
  const [tab, setTab] = useState<"purchases" | "bids">("purchases");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        const user = data.user;
        if (!user) {
          setStatus("ready");
          return;
        }
        setUserId(user.id);

        const [ordersRes, bidsRes] = await Promise.all([
          supabase
            .from("orders")
            .select(
              "id, status, total_charged_cents, created_at, listing:listings(title, image_urls), seller:profiles!orders_seller_id_fkey(username)",
            )
            .eq("buyer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("bids")
            .select(
              "id, amount_cents, created_at, listing:listings!bids_listing_id_fkey(id, title, image_urls, status, current_highest_bid_cents, current_highest_bidder_id)",
            )
            .eq("bidder_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

        if (ordersRes.error || bidsRes.error) {
          setStatus("error");
          return;
        }
        setOrders(ordersRes.data ?? []);
        setBids(bidsRes.data ?? []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const activeFilter = FILTERS.find((f) => f.id === filter)!;
  const filteredOrders = activeFilter.statuses
    ? orders.filter((o) => (activeFilter.statuses as readonly string[]).includes(o.status))
    : orders;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <h1 className="text-lg font-bold">Actividad</h1>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("purchases")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-1 pb-2 text-sm font-semibold",
            tab === "purchases" ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
          )}
        >
          <ShoppingBag className="h-4 w-4" />
          Compras
        </button>
        <button
          onClick={() => setTab("bids")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-1 pb-2 text-sm font-semibold",
            tab === "bids" ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
          )}
        >
          <Gavel className="h-4 w-4" />
          Pujas
        </button>
      </div>

      {tab === "purchases" && (
        <>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                  filter === f.id
                    ? "border-transparent bg-foreground text-background"
                    : "border-border bg-surface text-foreground/80",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {status === "loading" && <LoadingState />}
            {status === "error" && <ErrorState />}
            {status === "ready" && filteredOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {o.listing?.image_urls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.listing.image_urls[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLES[o.status])}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                  <span className="truncate text-sm font-semibold">{o.listing?.title ?? "Producto"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCents(o.total_charged_cents)} · {new Date(o.created_at).toLocaleDateString("es-MX")}
                  </span>
                  <span className="text-xs text-muted-foreground">De @{o.seller?.username}</span>
                </div>
              </div>
            ))}
            {status === "ready" && filteredOrders.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Sin compras aquí todavía.
              </p>
            )}
          </div>
        </>
      )}

      {tab === "bids" && (
        <div className="flex flex-col gap-2">
          {status === "loading" && <LoadingState />}
          {status === "error" && <ErrorState />}
          {status === "ready" && bids.map((b) => {
            const listing = b.listing;
            let statusLabel = "Finalizada";
            let statusClass = "bg-surface-2 text-muted-foreground";
            if (listing?.status === "active") {
              const winning = listing.current_highest_bidder_id === userId;
              statusLabel = winning ? "Ganando" : "Superado";
              statusClass = winning ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive";
            }

            return (
              <Link
                key={b.id}
                href={listing ? `/stream/${listing.id}` : "#"}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {listing?.image_urls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.image_urls[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold", statusClass)}>
                    {statusLabel}
                  </span>
                  <span className="truncate text-sm font-semibold">{listing?.title ?? "Producto"}</span>
                  <span className="text-xs text-muted-foreground">
                    Tu puja: {formatCents(b.amount_cents)} · {new Date(b.created_at).toLocaleDateString("es-MX")}
                  </span>
                </div>
              </Link>
            );
          })}
          {status === "ready" && bids.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Sin pujas todavía.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
