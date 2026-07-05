-- Supabase auto-grants EXECUTE to anon/authenticated via default privileges;
-- revoking from PUBLIC alone doesn't strip those direct grants.
revoke all on function public.place_bid(uuid, int, boolean) from public, anon, authenticated;
grant execute on function public.place_bid(uuid, int, boolean) to authenticated;

revoke all on function public.start_auction(uuid) from public, anon, authenticated;
grant execute on function public.start_auction(uuid) to authenticated;

revoke all on function public.close_auction(uuid) from public, anon, authenticated;

revoke all on function public.sweep_expired_auctions() from public, anon, authenticated;
