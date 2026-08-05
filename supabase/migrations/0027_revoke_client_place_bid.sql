-- P0 security fix, step 2 of 2 — APPLY ONLY AFTER the app deploy that switches
-- app/api/bids/place to place_bid_secure() (migration 0026). Applying this
-- first would break live bidding.
--
-- Closes the PostgREST bypass: signed-in users could call
-- /rest/v1/rpc/place_bid directly and register bids with no Stripe hold.
revoke all on function public.place_bid(uuid, int, boolean)
  from public, anon, authenticated;

-- Also flagged by the Supabase security advisor: trigger functions must not
-- be client-callable RPCs. They only ever run as triggers, which don't need
-- EXECUTE grants for the calling role.
revoke all on function public.handle_follow_change() from public, anon, authenticated;
revoke all on function public.handle_stream_went_live() from public, anon, authenticated;
