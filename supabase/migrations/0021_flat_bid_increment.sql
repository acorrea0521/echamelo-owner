-- Switch from a 10% multiplicative bid increment to a flat +$20 MXN step,
-- for both real and bot bids so the two stay consistent with each other.
create or replace function public.place_bid(p_listing_id uuid, p_amount_cents integer, p_is_quick boolean)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_bidder_id uuid := auth.uid();
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
  if v_bidder_id is null then
    raise exception 'not_authenticated';
  end if;

  select stripe_payment_method_id is not null, buyer_status, created_at
    into v_has_payment_method, v_buyer_status, v_buyer_created_at
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
    else v_listing.current_highest_bid_cents + 2000
  end;

  if p_is_quick then
    v_final_amount := v_min_next_cents;
  else
    if p_amount_cents < v_min_next_cents then
      raise exception 'bid_too_low';
    end if;
    v_final_amount := p_amount_cents;
  end if;

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
  values (p_listing_id, v_bidder_id, v_final_amount, p_is_quick)
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
      current_highest_bidder_id = v_bidder_id,
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
$function$;

create or replace function public.place_bot_bid(p_listing_id uuid, p_bot_name text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_listing public.listings%rowtype;
  v_bot_enabled boolean;
  v_max_bots int;
  v_last_real_bid_at timestamptz;
  v_min_next_cents int;
  v_remaining_seconds numeric;
  v_new_ends_at timestamptz;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;

  if v_listing.id is null or v_listing.status <> 'active' then
    return jsonb_build_object('placed', false);
  end if;
  if v_listing.auction_ends_at is null then
    return jsonb_build_object('placed', false);
  end if;

  v_remaining_seconds := extract(epoch from (v_listing.auction_ends_at - now()));
  if v_remaining_seconds <= 2 then
    return jsonb_build_object('placed', false);
  end if;

  select enabled, max_bots into v_bot_enabled, v_max_bots
  from public.bot_configs where seller_id = v_listing.seller_id;

  if not coalesce(v_bot_enabled, false) or coalesce(v_max_bots, 0) <= 0 then
    return jsonb_build_object('placed', false);
  end if;
  if v_listing.bot_bid_count >= v_max_bots then
    return jsonb_build_object('placed', false);
  end if;

  select max(created_at) into v_last_real_bid_at
  from public.bids where listing_id = p_listing_id;

  if v_last_real_bid_at is not null and v_last_real_bid_at > now() - interval '5 seconds' then
    return jsonb_build_object('placed', false);
  end if;

  v_min_next_cents := case
    when v_listing.current_highest_bid_cents is null then v_listing.starting_price_cents
    else v_listing.current_highest_bid_cents + 2000
  end;

  if v_listing.auction_type = 'continua' then
    v_new_ends_at := now() + (least(v_remaining_seconds + 3, 15) || ' seconds')::interval;
  else
    v_new_ends_at := v_listing.auction_ends_at;
  end if;

  update public.listings
  set current_highest_bid_cents = v_min_next_cents,
      current_highest_bidder_id = null,
      current_bot_bidder_name = p_bot_name,
      bot_bid_count = bot_bid_count + 1,
      auction_ends_at = v_new_ends_at,
      updated_at = now()
  where id = p_listing_id
  returning * into v_listing;

  return jsonb_build_object('placed', true, 'listing', to_jsonb(v_listing));
end;
$function$;
