-- ECHAMELO initial schema: profiles, categories, streams, listings, bids,
-- orders, chat_messages, moderation_actions, follows.
-- RLS is enabled on every table. Admin access bypasses RLS entirely via the
-- service-role client (lib/supabase/admin.ts), not per-table admin policies.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text not null default 'flame',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories are publicly readable"
  on public.categories for select
  using (true);

insert into public.categories (name, slug, icon, sort_order) values
  ('Moda', 'moda', 'shirt', 0),
  ('Joyería', 'joyeria', 'gem', 1),
  ('Tecnología', 'tecnologia', 'smartphone', 2),
  ('Artesanías', 'artesanias', 'flower-2', 3),
  ('Gaming', 'gaming', 'gamepad-2', 4);

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  -- Null until the user completes /onboarding/role; drives middleware redirects.
  role text check (role in ('buyer', 'seller')),
  is_admin boolean not null default false,
  category_id uuid references public.categories (id),
  stripe_account_id text,
  stripe_customer_id text,
  stripe_charges_enabled boolean not null default false,
  stripe_payouts_enabled boolean not null default false,
  followers_count int not null default 0,
  following_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- New auth.users row -> corresponding profiles row. Role is picked up from
-- the signUp() options.data.role metadata set by the role-select step on
-- /signup, if present, and left null otherwise (redirects to /onboarding/role).
-- Username defaults to the local part of the email; the user can change it later.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), new.id::text) || '_' || substr(new.id::text, 1, 6),
    split_part(new.email, '@', 1),
    nullif(new.raw_user_meta_data ->> 'role', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- This is a trigger function, not a public API. Postgres grants EXECUTE to
-- the PUBLIC pseudo-role (inherited by anon/authenticated) by default, which
-- Supabase exposes as a callable REST RPC endpoint
-- (/rest/v1/rpc/handle_new_user) — revoke it explicitly.
revoke execute on function public.handle_new_user() from public;

-- ---------------------------------------------------------------------------
-- streams
-- ---------------------------------------------------------------------------
create table public.streams (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id),
  title text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  livekit_room_name text not null unique,
  current_listing_id uuid,
  started_at timestamptz,
  ended_at timestamptz,
  viewer_count int not null default 0,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.streams enable row level security;

create policy "streams are publicly readable"
  on public.streams for select
  using (true);

create policy "sellers manage their own streams"
  on public.streams for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams (id) on delete cascade,
  seller_id uuid not null references public.profiles (id),
  category_id uuid references public.categories (id),
  title text not null,
  description text not null,
  image_urls text[] not null default '{}',
  starting_price_cents int not null check (starting_price_cents > 0),
  shipping_cost_cents int not null default 0 check (shipping_cost_cents >= 0),
  status text not null default 'queued'
    check (status in ('queued', 'active', 'sold', 'unsold', 'cancelled')),
  queue_position int not null default 0,
  current_highest_bid_cents int,
  current_highest_bidder_id uuid references public.profiles (id),
  auction_started_at timestamptz,
  auction_ends_at timestamptz,
  winning_bid_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one active auction per stream at a time.
create unique index listings_one_active_per_stream
  on public.listings (stream_id)
  where status = 'active';

alter table public.streams
  add constraint streams_current_listing_fk
  foreign key (current_listing_id) references public.listings (id);

alter table public.listings enable row level security;

create policy "listings are publicly readable"
  on public.listings for select
  using (true);

create policy "sellers manage their own listings"
  on public.listings for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- bids (append-only; all writes go through the place_bid() RPC added in the
-- bidding-engine migration, never direct client inserts)
-- ---------------------------------------------------------------------------
create table public.bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  bidder_id uuid not null references public.profiles (id),
  amount_cents int not null check (amount_cents > 0),
  is_quick_bid boolean not null default false,
  created_at timestamptz not null default now()
);

create index bids_listing_amount_idx
  on public.bids (listing_id, amount_cents desc, created_at);

alter table public.listings
  add constraint listings_winning_bid_fk
  foreign key (winning_bid_id) references public.bids (id);

alter table public.bids enable row level security;

create policy "bids are publicly readable"
  on public.bids for select
  using (true);

create policy "no direct client writes to bids"
  on public.bids for insert
  with check (false);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings (id),
  buyer_id uuid not null references public.profiles (id),
  seller_id uuid not null references public.profiles (id),
  winning_bid_id uuid not null references public.bids (id),
  item_price_cents int not null,
  shipping_cost_cents int not null,
  platform_fee_cents int not null,
  stripe_fee_cents int,
  total_charged_cents int not null,
  seller_payout_cents int,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'payout_processing', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "buyers and sellers can read their own orders"
  on public.orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- No client insert/update policy: orders are written exclusively by the
-- service-role client from webhook/checkout route handlers.

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "chat messages are publicly readable"
  on public.chat_messages for select
  using (true);

create policy "authenticated users can send chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = sender_id);

create policy "stream owners can soft-delete messages in their stream"
  on public.chat_messages for update
  using (
    auth.uid() = sender_id
    or auth.uid() in (select seller_id from public.streams where id = stream_id)
  );

-- ---------------------------------------------------------------------------
-- moderation_actions
-- ---------------------------------------------------------------------------
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid references public.streams (id),
  actor_id uuid not null references public.profiles (id),
  target_id uuid not null references public.profiles (id),
  action_type text not null check (action_type in ('mute', 'block')),
  created_at timestamptz not null default now()
);

alter table public.moderation_actions enable row level security;

create policy "stream owners manage moderation actions in their stream"
  on public.moderation_actions for all
  using (
    auth.uid() = actor_id
    and (
      stream_id is null
      or auth.uid() in (select seller_id from public.streams where id = stream_id)
    )
  )
  with check (auth.uid() = actor_id);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id),
  followee_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id)
);

alter table public.follows enable row level security;

create policy "follows are publicly readable"
  on public.follows for select
  using (true);

create policy "users manage their own follows"
  on public.follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);
