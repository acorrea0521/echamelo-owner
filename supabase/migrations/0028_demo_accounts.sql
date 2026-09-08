-- Demo (sandbox) accounts created from the admin panel.
--
-- A demo account is a real auth user with a real username + password, but it
-- lives in a CLOSED CIRCUIT that never touches money:
--
--   * demo sellers' streams/listings are visible ONLY to demo buyers, and
--     demo buyers see ONLY demo streams/listings — neither side can see the
--     other, in either direction;
--   * demo buyers bid with no saved card and no identity verification;
--   * winning a demo auction produces a SIMULATED order — no Stripe hold, no
--     capture, no payout — flagged with orders.is_simulated so real revenue,
--     commission and seller-balance reporting stays clean.
--
-- The circuit is enforced here at the RLS layer, not just in the app, so it
-- holds even if someone talks to PostgREST directly (same server-authoritative
-- posture as the bidding RPCs). Admin pages read through the service-role
-- client, which bypasses RLS and therefore still sees both circuits.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
alter table public.profiles add column is_demo boolean not null default false;
alter table public.streams add column is_demo boolean not null default false;
alter table public.listings add column is_demo boolean not null default false;
alter table public.orders add column is_simulated boolean not null default false;

create index profiles_is_demo_idx on public.profiles (is_demo) where is_demo;
create index streams_is_demo_status_idx on public.streams (is_demo, status);
create index listings_is_demo_idx on public.listings (is_demo) where is_demo;
create index orders_is_simulated_idx on public.orders (is_simulated) where is_simulated;

-- Existing rows are all real accounts, so the `false` default backfills
-- correctly — no demo account can exist before this migration.

-- ---------------------------------------------------------------------------
-- Which circuit is the caller in?
-- ---------------------------------------------------------------------------
-- Used inside RLS policies, so it must stay executable by anon/authenticated.
-- It only ever reports on the caller's own account (profiles are publicly
-- readable already), so exposing it as an RPC leaks nothing.
create function public.viewer_is_demo()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select p.is_demo from public.profiles p where p.id = auth.uid()), false);
$$;

grant execute on function public.viewer_is_demo() to anon, authenticated;

-- Streams and listings inherit their circuit from the seller who owns them,
-- stamped at insert so every visibility check is a plain column comparison
-- instead of a join.
create function public.stamp_demo_from_seller()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.is_demo := coalesce((select p.is_demo from public.profiles p where p.id = new.seller_id), false);
  return new;
end;
$$;

revoke execute on function public.stamp_demo_from_seller() from public;

create trigger streams_stamp_demo
  before insert on public.streams
  for each row execute function public.stamp_demo_from_seller();

create trigger listings_stamp_demo
  before insert on public.listings
  for each row execute function public.stamp_demo_from_seller();

-- ---------------------------------------------------------------------------
-- Circuit isolation (RESTRICTIVE policies)
-- ---------------------------------------------------------------------------
-- These are AND-ed with the existing permissive policies rather than replacing
-- them, so the ban/mute/pause/slow-mode chat rules from 0020 and the seller
-- ownership rules from 0001 keep working untouched.
create policy "streams stay inside the viewer's circuit"
  on public.streams as restrictive for select
  using (is_demo = public.viewer_is_demo());

create policy "listings stay inside the viewer's circuit"
  on public.listings as restrictive for select
  using (is_demo = public.viewer_is_demo());

create policy "bids stay inside the viewer's circuit"
  on public.bids as restrictive for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = bids.listing_id and l.is_demo = public.viewer_is_demo()
    )
  );

create policy "chat reads stay inside the viewer's circuit"
  on public.chat_messages as restrictive for select
  using (
    exists (
      select 1 from public.streams s
      where s.id = chat_messages.stream_id and s.is_demo = public.viewer_is_demo()
    )
  );

create policy "chat writes stay inside the viewer's circuit"
  on public.chat_messages as restrictive for insert
  with check (
    exists (
      select 1 from public.streams s
      where s.id = chat_messages.stream_id and s.is_demo = public.viewer_is_demo()
    )
  );

-- ---------------------------------------------------------------------------
-- Bidding: demo buyers bid without a card, and never across circuits
-- ---------------------------------------------------------------------------
-- Same contract as 0026 (service-role only, called by app/api/bids/place after
-- it authorizes a Stripe hold) with two additions:
--   * a demo bidder skips the payment-method and identity-verification gates
--     entirely — there is no money behind a demo bid, so there is nothing to
--     authorize and nothing to verify;
--   * bidder and listing must be in the SAME circuit. This is the backstop
--     that keeps a real buyer from ever winning a demo auction (which would
--     charge a real card) and a demo buyer from ever winning a real one.
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
  v_is_demo_bidder boolean;
  v_threshold_cents int;
  v_suspicious_window_minutes int;
  v_requires_verification boolean;
  v_previous_bidder_id uuid;
  v_bid_id uuid;
begin
  if p_bidder_id is null then
    raise exception 'not_authenticated';
  end if;

  select stripe_payment_method_id is not null, buyer_status, created_at, is_demo
    into v_has_payment_method, v_buyer_status, v_buyer_created_at, v_is_demo_bidder
  from public.profiles where id = p_bidder_id;

  select * into v_listing from public.listings where id = p_listing_id for update;

  if v_listing.id is null then
    raise exception 'listing_not_found';
  end if;

  -- Circuit check first: a cross-circuit bid is never valid, whatever else
  -- is true about the bidder or the listing.
  if coalesce(v_is_demo_bidder, false) <> v_listing.is_demo then
    raise exception 'demo_circuit_mismatch';
  end if;

  if not coalesce(v_is_demo_bidder, false) and not coalesce(v_has_payment_method, false) then
    raise exception 'no_payment_method';
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

  -- For a real bid p_amount_cents is the Stripe-authorized hold amount (minus
  -- shipping). Quick bid: must match the min computed under the lock exactly,
  -- else the price moved between authorization and here — reject, never
  -- over-commit.
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

  -- Identity verification exists to protect real money. A demo bid has none,
  -- and demo accounts have no way to complete Stripe Identity anyway.
  if not coalesce(v_is_demo_bidder, false) then
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

revoke all on function public.place_bid_secure(uuid, uuid, int, boolean)
  from public, anon, authenticated;
grant execute on function public.place_bid_secure(uuid, uuid, int, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- Closing: a demo auction settles itself, with no payment path at all
-- ---------------------------------------------------------------------------
-- A real sale is created 'pending_payment' and captured afterwards by
-- lib/stripe/chargeOrder. A demo sale skips that entirely: the order is born
-- 'paid' and flagged is_simulated, so no code path — not the close route, not
-- the cron sweep — ever reaches Stripe with it. seller_payout_cents is filled
-- in so the demo seller's own earnings screen looks real; admin balances and
-- payout requests filter simulated orders out.
create or replace function public.close_auction(p_listing_id uuid)
returns public.listings
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
  v_winning_bid public.bids%rowtype;
  v_platform_fee_cents int;
  v_total_cents int;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;

  if v_listing.id is null or v_listing.status <> 'active' then
    return v_listing;
  end if;
  if v_listing.auction_ends_at is null or now() < v_listing.auction_ends_at then
    return v_listing;
  end if;

  if v_listing.current_highest_bidder_id is null then
    update public.listings set status = 'unsold', updated_at = now()
    where id = p_listing_id
    returning * into v_listing;
    return v_listing;
  end if;

  select * into v_winning_bid from public.bids
  where listing_id = p_listing_id
  order by amount_cents desc, created_at asc
  limit 1;

  v_platform_fee_cents := round(v_listing.current_highest_bid_cents * 0.08);
  v_total_cents := v_listing.current_highest_bid_cents + v_listing.shipping_cost_cents;

  update public.listings
  set status = 'sold', winning_bid_id = v_winning_bid.id, updated_at = now()
  where id = p_listing_id
  returning * into v_listing;

  insert into public.orders (
    listing_id, buyer_id, seller_id, winning_bid_id,
    item_price_cents, shipping_cost_cents, platform_fee_cents,
    total_charged_cents, status, is_simulated, stripe_fee_cents, seller_payout_cents
  ) values (
    p_listing_id, v_listing.current_highest_bidder_id, v_listing.seller_id, v_winning_bid.id,
    v_listing.current_highest_bid_cents, v_listing.shipping_cost_cents, v_platform_fee_cents,
    v_total_cents,
    case when v_listing.is_demo then 'paid' else 'pending_payment' end,
    v_listing.is_demo,
    case when v_listing.is_demo then 0 else null end,
    case when v_listing.is_demo then v_total_cents - v_platform_fee_cents else null end
  );

  return v_listing;
end;
$$;

revoke execute on function public.close_auction(uuid) from public;
