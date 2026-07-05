-- Server-authoritative bid placement. Row-locks the listing to prevent
-- concurrent-bid races, validates auction state and payment-method
-- eligibility, and applies the correct anti-snipe rule per auction_type.
create or replace function public.place_bid(
  p_listing_id uuid,
  p_amount_cents int,
  p_is_quick boolean
)
returns public.listings
language plpgsql
security definer set search_path = public
as $$
declare
  v_bidder_id uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_min_next_cents int;
  v_final_amount int;
  v_remaining_seconds numeric;
  v_new_ends_at timestamptz;
  v_has_payment_method boolean;
begin
  if v_bidder_id is null then
    raise exception 'not_authenticated';
  end if;

  select (stripe_payment_method_id is not null) into v_has_payment_method
  from public.profiles where id = v_bidder_id;

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
  if v_listing.seller_id = v_bidder_id then
    raise exception 'cannot_bid_on_own_listing';
  end if;

  v_min_next_cents := case
    when v_listing.current_highest_bid_cents is null then v_listing.starting_price_cents
    else ceil(v_listing.current_highest_bid_cents * 1.10)::int
  end;

  if p_is_quick then
    v_final_amount := v_min_next_cents;
  else
    if p_amount_cents < v_min_next_cents then
      raise exception 'bid_too_low';
    end if;
    v_final_amount := p_amount_cents;
  end if;

  insert into public.bids (listing_id, bidder_id, amount_cents, is_quick_bid)
  values (p_listing_id, v_bidder_id, v_final_amount, p_is_quick);

  -- Anti-snipe: Muerte Súbita never resets; Continua adds +3s capped at 15s remaining.
  if v_listing.auction_type = 'continua' then
    v_remaining_seconds := extract(epoch from (v_listing.auction_ends_at - now()));
    v_new_ends_at := now() + (least(v_remaining_seconds + 3, 15) || ' seconds')::interval;
  else
    v_new_ends_at := v_listing.auction_ends_at;
  end if;

  update public.listings
  set current_highest_bid_cents = v_final_amount,
      current_highest_bidder_id = v_bidder_id,
      auction_ends_at = v_new_ends_at,
      updated_at = now()
  where id = p_listing_id
  returning * into v_listing;

  return v_listing;
end;
$$;

revoke execute on function public.place_bid(uuid, int, boolean) from public;
grant execute on function public.place_bid(uuid, int, boolean) to authenticated;

-- Seller starts the auction on a queued listing.
create or replace function public.start_auction(p_listing_id uuid)
returns public.listings
language plpgsql
security definer set search_path = public
as $$
declare
  v_seller_id uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_duration_seconds int;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;

  if v_listing.id is null then
    raise exception 'listing_not_found';
  end if;
  if v_listing.seller_id <> v_seller_id then
    raise exception 'not_the_seller';
  end if;
  if v_listing.status <> 'queued' then
    raise exception 'listing_not_queued';
  end if;

  v_duration_seconds := case when v_listing.auction_type = 'continua' then 15 else 10 end;

  update public.listings
  set status = 'active',
      auction_started_at = now(),
      auction_ends_at = now() + (v_duration_seconds || ' seconds')::interval,
      updated_at = now()
  where id = p_listing_id
  returning * into v_listing;

  update public.streams
  set current_listing_id = p_listing_id
  where id = v_listing.stream_id;

  return v_listing;
end;
$$;

revoke execute on function public.start_auction(uuid) from public;
grant execute on function public.start_auction(uuid) to authenticated;

-- Idempotent auction close: pure DB state transition, no external calls.
-- Safe to call more than once (e.g. from both a client timer and the
-- pg_cron backstop) — only acts while status = 'active'.
create or replace function public.close_auction(p_listing_id uuid)
returns public.listings
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
  v_winning_bid public.bids%rowtype;
  v_platform_fee_cents int;
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

  update public.listings
  set status = 'sold', winning_bid_id = v_winning_bid.id, updated_at = now()
  where id = p_listing_id
  returning * into v_listing;

  insert into public.orders (
    listing_id, buyer_id, seller_id, winning_bid_id,
    item_price_cents, shipping_cost_cents, platform_fee_cents,
    total_charged_cents, status
  ) values (
    p_listing_id, v_listing.current_highest_bidder_id, v_listing.seller_id, v_winning_bid.id,
    v_listing.current_highest_bid_cents, v_listing.shipping_cost_cents, v_platform_fee_cents,
    v_listing.current_highest_bid_cents + v_listing.shipping_cost_cents, 'pending_payment'
  );

  return v_listing;
end;
$$;

revoke execute on function public.close_auction(uuid) from public;

-- Sweeps all expired-but-still-active listings. Runs on pg_cron as a
-- backstop; the primary close path is client-triggered (any viewer's
-- countdown hitting 0 calls the close API route), see app/api/auctions.
create or replace function public.sweep_expired_auctions()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing_id uuid;
begin
  for v_listing_id in
    select id from public.listings
    where status = 'active' and auction_ends_at < now()
  loop
    perform public.close_auction(v_listing_id);
  end loop;
end;
$$;

revoke execute on function public.sweep_expired_auctions() from public;
