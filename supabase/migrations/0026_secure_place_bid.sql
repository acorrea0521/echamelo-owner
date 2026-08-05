-- P0 security fix, step 1 of 2 (additive — safe to apply before deploying app code).
--
-- Problem: place_bid() is granted to `authenticated`, so any signed-in buyer
-- can call it directly via PostgREST (/rest/v1/rpc/place_bid) and become the
-- highest bidder WITHOUT the Stripe pre-authorization hold that
-- app/api/bids/place creates. The money invariant ("no winning bid without
-- authorized funds") lived only in the Next.js route, while the authoritative
-- mutation was reachable separately. Confirmed by the Supabase security advisor.
--
-- Fix: this service-role-only variant takes the bidder id as an explicit
-- parameter (no auth.uid()) and is callable ONLY by the server route, which
-- authorizes the Stripe hold first. Step 2 (0027) revokes the old client-
-- callable place_bid AFTER the app deploy switches to this function.
--
-- It also closes the hold/bid amount race: p_amount_cents is now ALWAYS the
-- amount the Stripe hold was authorized for. For quick bids it must equal the
-- current minimum-next amount computed under the row lock — if another bid
-- landed in between, we raise 'bid_amount_changed' so the route cancels the
-- hold and the client retries. The recorded bid can never exceed its hold.
create or replace function public.place_bid_secure(
  p_listing_id uuid,
  p_bidder_id uuid,
  p_amount_cents int,
  p_is_quick boolean
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
  v_min_next_cents int;
  v_final_amount int;
  v_remaining_seconds numeric;
  v_new_ends_at timestamptz;
  v_has_payment_method boolean;
  v_buyer_status text;
  v_buyer_created_at timestamptz;
  v_threshold_cents int;
  v_suspicious_window_minutes int;
  v_requires_verification boolean;
  v_previous_bidder_id uuid;
  v_bid_id uuid;
begin
  if p_bidder_id is null then
    raise exception 'not_authenticated';
  end if;

  select stripe_payment_method_id is not null, buyer_status, created_at
    into v_has_payment_method, v_buyer_status, v_buyer_created_at
  from public.profiles where id = p_bidder_id;

  if not coalesce(v_has_payment_method, false) then
    raise exception 'no_payment_method';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;

  if v_listing.id is null then
    raise exception 'listing_not_found';
  end if;
  if v_listing.status <> 'active' then
    raise exception 'auction_not_active';
  end if;
  if v_listing.auction_ends_at is null or now() >= v_listing.auction_ends_at then
    raise exception 'auction_ended';
  end if;
  if v_listing.seller_id = p_bidder_id then
    raise exception 'cannot_bid_on_own_listing';
  end if;

  v_min_next_cents := case
    when v_listing.current_highest_bid_cents is null then v_listing.starting_price_cents
    else v_listing.current_highest_bid_cents + 2000
  end;

  -- p_amount_cents is the Stripe-authorized hold amount (minus shipping).
  -- Quick bid: must match the min computed under the lock exactly, else the
  -- price moved between authorization and here — reject, never over-commit.
  if p_is_quick then
    if p_amount_cents <> v_min_next_cents then
      raise exception 'bid_amount_changed';
    end if;
  else
    if p_amount_cents < v_min_next_cents then
      raise exception 'bid_too_low';
    end if;
  end if;
  v_final_amount := p_amount_cents;

  select (value #>> '{}')::int into v_threshold_cents
  from public.app_settings where key = 'buyer_verification_threshold_cents';
  select (value #>> '{}')::int into v_suspicious_window_minutes
  from public.app_settings where key = 'new_account_suspicious_window_minutes';

  v_requires_verification := v_buyer_status <> 'verificado' and (
    v_final_amount > coalesce(v_threshold_cents, 50000)
    or v_listing.requires_verified_buyers
    or (
      v_buyer_created_at > now() - (coalesce(v_suspicious_window_minutes, 60) || ' minutes')::interval
      and v_final_amount > coalesce(v_threshold_cents, 50000)
    )
  );

  if v_requires_verification then
    raise exception 'identity_verification_required';
  end if;

  v_previous_bidder_id := v_listing.current_highest_bidder_id;

  insert into public.bids (listing_id, bidder_id, amount_cents, is_quick_bid)
  values (p_listing_id, p_bidder_id, v_final_amount, p_is_quick)
  returning id into v_bid_id;

  if v_listing.auction_type = 'continua' then
    v_remaining_seconds := extract(epoch from (v_listing.auction_ends_at - now()));
    v_new_ends_at := now() + (least(v_remaining_seconds + 3, 15) || ' seconds')::interval;
  else
    v_new_ends_at := v_listing.auction_ends_at;
  end if;

  -- A real bid always displaces a bot leader.
  update public.listings
  set current_highest_bid_cents = v_final_amount,
      current_highest_bidder_id = p_bidder_id,
      current_bot_bidder_name = null,
      auction_ends_at = v_new_ends_at,
      updated_at = now()
  where id = p_listing_id
  returning * into v_listing;

  return jsonb_build_object(
    'listing', to_jsonb(v_listing),
    'previous_highest_bidder_id', v_previous_bidder_id,
    'bid_id', v_bid_id
  );
end;
$$;

-- Service-role only: the browser must never be able to reach this.
revoke all on function public.place_bid_secure(uuid, uuid, int, boolean)
  from public, anon, authenticated;
grant execute on function public.place_bid_secure(uuid, uuid, int, boolean)
  to service_role;
