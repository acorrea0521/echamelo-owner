create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'sweep-expired-auctions',
  '10 seconds',
  $$select public.sweep_expired_auctions();$$
);
