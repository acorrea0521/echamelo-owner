-- Reconciles schema that exists in the live database but was never captured in
-- a migration file — it was applied out of band (dashboard SQL editor), so the
-- migration chain in git could not rebuild the database: a staging environment,
-- a fresh branch database or a restore would come up missing a whole table and
-- eight columns, and the bidding routes would fail on first use.
--
-- What was missing, found by replaying 0001-0028 onto an empty Postgres and
-- diffing the result against the live schema:
--
--   * public.bid_holds — the entire table. app/api/bids/place writes every
--     Stripe pre-authorization here and lib/stripe/chargeOrder captures and
--     releases from it, so without it no real bid can be placed at all.
--   * listings.bot_bid_count, listings.current_bot_bidder_name — read and
--     written by place_bot_bid() and place_bid_secure(), both of which are in
--     versioned migrations (0021, 0026) that reference columns nothing creates.
--   * chat_messages.bot_name — bot chat lines (see components/stream/ChatPanel).
--   * profiles.buyer_identity_session_id — Stripe Identity session for buyers.
--   * streams.auction_type, auction_seconds, category_id, is_private,
--     notify_followers, scheduled_at, tags — stream-level scheduling and
--     auction defaults.
--
-- EVERY statement here is a no-op against a database that already has these
-- objects, so applying this to production changes nothing. It only fills in a
-- database being built from scratch. Nothing new is constrained either: no
-- unique index or check constraint is added to a table that already exists,
-- precisely so this can never fail on existing production rows.
--
-- Caveat worth knowing: because these objects were never in a migration, their
-- original defaults could not be recovered from anything in the repository. The
-- defaults chosen below for the columns no application code reads yet
-- (auction_seconds, is_private, notify_followers, tags) are reasonable
-- reconstructions, not the live values. Anywhere the app does read a column,
-- the type and nullability come from types/database.types.ts, which is
-- generated from the live database.

-- ---------------------------------------------------------------------------
-- bid_holds
-- ---------------------------------------------------------------------------
-- One row per Stripe pre-authorization behind a bid. Written exclusively by the
-- service-role client from route handlers (same posture as orders), so RLS is
-- on with no client write policy; bidders may read their own holds.
do $$
begin
  if to_regclass('public.bid_holds') is null then
    create table public.bid_holds (
      id uuid primary key default gen_random_uuid(),
      listing_id uuid not null references public.listings (id) on delete cascade,
      bidder_id uuid not null references public.profiles (id),
      bid_id uuid references public.bids (id),
      amount_cents int not null check (amount_cents > 0),
      stripe_payment_intent_id text not null,
      status text not null default 'authorized'
        check (status in ('authorized', 'released', 'captured', 'failed')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    -- Every lookup in app/api/bids/place and lib/stripe/chargeOrder is either
    -- "this listing's still-authorized holds" or "the hold behind this bid".
    create index bid_holds_listing_status_idx
      on public.bid_holds (listing_id, status);
    create index bid_holds_bid_id_idx
      on public.bid_holds (bid_id);

    alter table public.bid_holds enable row level security;

    create policy "bidders can read their own holds"
      on public.bid_holds for select
      using (auth.uid() = bidder_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- listings: bot bidding bookkeeping
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists bot_bid_count int not null default 0,
  add column if not exists current_bot_bidder_name text;

-- ---------------------------------------------------------------------------
-- chat_messages: bot-authored lines
-- ---------------------------------------------------------------------------
alter table public.chat_messages
  add column if not exists bot_name text;

-- ---------------------------------------------------------------------------
-- profiles: Stripe Identity session for buyer verification
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists buyer_identity_session_id text;

-- ---------------------------------------------------------------------------
-- streams: scheduling and per-stream auction defaults
-- ---------------------------------------------------------------------------
alter table public.streams
  add column if not exists category_id uuid references public.categories (id),
  add column if not exists scheduled_at timestamptz,
  add column if not exists is_private boolean not null default false,
  add column if not exists notify_followers boolean not null default false,
  add column if not exists tags text[] not null default '{}',
  add column if not exists auction_seconds int not null default 30,
  add column if not exists auction_type text not null default 'muerte_subita';

-- The matching check constraint only goes on when this migration is the one
-- that created the column — never onto a live table, where an unexpected
-- existing value would abort the whole migration.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'streams_auction_type_check'
  ) and not exists (
    select 1 from public.streams where auction_type not in ('muerte_subita', 'continua')
  ) then
    alter table public.streams
      add constraint streams_auction_type_check
      check (auction_type in ('muerte_subita', 'continua'));
  end if;
end $$;
