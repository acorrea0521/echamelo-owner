"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Timer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { verifyBuyerIdentity } from "@/lib/stripe/verifyBuyerIdentity";
import { SlideToBid } from "@/components/stream/SlideToBid";
import { CustomBidModal } from "@/components/stream/CustomBidModal";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

type ListingState = {
  id: string;
  title: string;
  status: string;
  startingPriceCents: number;
  currentHighestBidCents: number | null;
  currentHighestBidderId?: string | null;
  currentBotBidderName?: string | null;
  auctionEndsAt: string | null;
};

export function BidBar({ listing: initialListing }: { listing: ListingState }) {
  const [listing, setListing] = useState(initialListing);
  const [msRemaining, setMsRemaining] = useState(() => remainingMs(initialListing.auctionEndsAt));
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const closeFiredRef = useRef(false);
  const pendingBidRef = useRef<{ isQuick: boolean; amountCents?: number } | null>(null);

  useEffect(() => {
    setListing(initialListing);
    closeFiredRef.current = false;
  }, [initialListing.id]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`listing-${listing.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "listings", filter: `id=eq.${listing.id}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setListing((prev) => ({
            ...prev,
            status: row.status as string,
            currentHighestBidCents: row.current_highest_bid_cents as number | null,
            currentHighestBidderId: row.current_highest_bidder_id as string | null,
            currentBotBidderName: row.current_bot_bidder_name as string | null,
            auctionEndsAt: row.auction_ends_at as string | null,
          }));
          closeFiredRef.current = false;
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing.id]);

  const triggerClose = useCallback(async () => {
    if (closeFiredRef.current) return;
    closeFiredRef.current = true;
    await fetch(`/api/auctions/${listing.id}/close`, { method: "POST" });
  }, [listing.id]);

  useEffect(() => {
    const tick = () => {
      const remaining = remainingMs(listing.auctionEndsAt);
      setMsRemaining(remaining);
      if (remaining <= 0 && listing.status === "active") {
        triggerClose();
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [listing.auctionEndsAt, listing.status, triggerClose]);

  // Opportunistic bot-bid check — purely cosmetic engagement, see
  // place_bot_bid() for the actual eligibility rules (no-ops silently if
  // the seller hasn't enabled bots). Any connected viewer can trigger it.
  useEffect(() => {
    if (listing.status !== "active") return;
    const interval = setInterval(() => {
      fetch(`/api/auctions/${listing.id}/bot-tick`, { method: "POST" }).catch(() => null);
    }, 2500);
    return () => clearInterval(interval);
  }, [listing.id, listing.status]);

  const currentBidCents = listing.currentHighestBidCents ?? listing.startingPriceCents;
  const minNextBidCents = listing.currentHighestBidCents
    ? listing.currentHighestBidCents + 2000
    : listing.startingPriceCents;
  const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
  const ended = listing.status !== "active" || msRemaining <= 0;

  async function placeBid(isQuick: boolean, amountCents?: number) {
    setError(null);
    setNeedsVerification(false);
    setPlacing(true);
    const res = await fetch("/api/bids/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: listing.id,
        isQuick,
        amountCents: isQuick ? undefined : amountCents,
      }),
    });
    const data = await res.json();
    setPlacing(false);
    if (!res.ok) {
      if (data.error === "identity_verification_required") {
        setNeedsVerification(true);
        pendingBidRef.current = { isQuick, amountCents };
        setError("Esta puja requiere verificar tu identidad.");
        return;
      }
      setError(data.error ?? "No se pudo procesar tu puja.");
      return;
    }
    setShowCustomModal(false);
  }

  async function handleVerifyAndRetry() {
    setVerifying(true);
    const result = await verifyBuyerIdentity();
    setVerifying(false);
    if (result !== "verificado") {
      setError("No se pudo verificar tu identidad.");
      return;
    }
    setNeedsVerification(false);
    setError(null);
    const pending = pendingBidRef.current;
    pendingBidRef.current = null;
    if (pending) await placeBid(pending.isQuick, pending.amountCents);
  }

  return (
    <div className="mx-3 mb-3 flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/60 p-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-xs text-white/70">{listing.title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">{formatCents(currentBidCents)}</span>
            <span className="text-[10px] text-white/50">
              {!listing.currentHighestBidderId && listing.currentBotBidderName
                ? `${listing.currentBotBidderName} lidera`
                : "puja actual"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white">
          <Timer className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold tabular-nums">{secondsRemaining}s</span>
        </div>
      </div>

      {!ended && (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCustomModal(true)}
            disabled={placing}
            variant="outline"
            className="h-13 shrink-0 rounded-full border-white/20 bg-transparent px-4 text-xs text-white hover:bg-white/10"
          >
            Personalizada
          </Button>
          <SlideToBid
            label={`Puja: ${formatCents(minNextBidCents)}`}
            onConfirm={() => placeBid(true)}
            disabled={placing}
            loading={placing}
          />
        </div>
      )}

      <CustomBidModal
        open={showCustomModal}
        minCents={minNextBidCents}
        placing={placing}
        onClose={() => setShowCustomModal(false)}
        onConfirm={(amountCents) => placeBid(false, amountCents)}
      />

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      {needsVerification && (
        <Button
          onClick={handleVerifyAndRetry}
          disabled={verifying}
          className="h-9 gap-1.5 rounded-full bg-gold text-xs font-bold text-gold-foreground hover:bg-gold/90"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {verifying ? "Verificando..." : "Verificar identidad y continuar"}
        </Button>
      )}
    </div>
  );
}

function remainingMs(auctionEndsAt: string | null) {
  if (!auctionEndsAt) return 0;
  return new Date(auctionEndsAt).getTime() - Date.now();
}
