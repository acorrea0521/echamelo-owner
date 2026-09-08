-- Closes two ways a signed-in user could grant themselves privileges by
-- talking to PostgREST directly, both found while reviewing the demo-circuit
-- work in 0028.
--
-- 1. profiles has exactly one UPDATE policy — "users can update their own
--    profile", USING (auth.uid() = id) — with no WITH CHECK and no column
--    restriction. A user can PATCH their own row and set ANY column on it:
--
--      is_admin        -> full admin panel, including creating and deleting
--                         accounts through /api/admin/*
--      is_demo         -> step into (or out of) the demo circuit at will,
--                         which is what 0028's isolation rests on
--      buyer_status    -> 'verificado' defeats the identity-verification gate
--                         in place_bid_secure()
--      seller_status   -> 'activo' skips application review and goes live
--      stripe_*_enabled-> marks their own Connect account as payout-ready
--      payout_requested_at, identity_verified_at, followers_count, ...
--
--    RLS cannot restrict columns, but Postgres column privileges can and
--    PostgREST honours them: a PATCH touching a column the caller may not
--    update is rejected outright.
--
--    Note the order below. A column-level REVOKE does NOT carve a hole in a
--    table-level GRANT — Postgres keeps the broader privilege and the revoke
--    silently does nothing. Supabase grants `all on all tables` to anon and
--    authenticated, so the table-level UPDATE must be dropped first and the
--    editable columns granted back explicitly. (Verified the wrong way round
--    first: with the revoke alone, every escalation above still succeeded.)
--
--    The service-role client is unaffected — it holds its own grants — so the
--    admin routes and the Stripe webhook keep working. The four server-side
--    routes that used the caller's session to write privileged columns now use
--    the service-role client instead; see the commit.
--
-- 2. A demo seller could PATCH listings.is_demo = false (or a real seller the
--    reverse) and move a row across circuits. 0028 stamps is_demo on INSERT
--    and only guards SELECT, while "sellers manage their own listings" is FOR
--    ALL — so the stamp was never enforced on UPDATE. A listing moved into the
--    real circuit would authorize and capture real cards.

-- ---------------------------------------------------------------------------
-- 1. Only the columns that are actually the user's to edit
-- ---------------------------------------------------------------------------
revoke update on public.profiles from anon, authenticated;

-- Everything a person legitimately changes about themselves, and nothing else.
-- The stripe_* id columns stay writable because their own onboarding routes
-- set them and forging one is useless: a fake payment method still has to
-- clear a real Stripe authorization before any bid is recorded.
grant update (
  username,
  display_name,
  avatar_url,
  bio,
  role,
  category_id,
  phone,
  default_shipping_address,
  stripe_account_id,
  stripe_customer_id,
  stripe_payment_method_id,
  buyer_identity_session_id,
  updated_at
) on public.profiles to authenticated;

-- Anonymous callers have no business updating a profile at all.

-- ---------------------------------------------------------------------------
-- 2. A row cannot change circuit after it is created
-- ---------------------------------------------------------------------------
-- RESTRICTIVE, so it AND-s with the existing seller-ownership policies instead
-- of replacing them. USING blocks the escape, WITH CHECK blocks the entry.
create policy "streams cannot change circuit"
  on public.streams as restrictive for update
  using (is_demo = public.viewer_is_demo())
  with check (is_demo = public.viewer_is_demo());

create policy "listings cannot change circuit"
  on public.listings as restrictive for update
  using (is_demo = public.viewer_is_demo())
  with check (is_demo = public.viewer_is_demo());
