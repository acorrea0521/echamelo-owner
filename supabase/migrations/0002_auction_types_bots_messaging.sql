-- Adds the two-auction-type model (Muerte Súbita / Continua), per-seller
-- bot config, and buyer-seller direct messaging — decided after reviewing
-- the reference prototype (see project memory
-- "project-echamelo-prototype-reference"). Supersedes the single
-- anti-snipe auction model from 0001_init.sql's original design notes.

-- ---------------------------------------------------------------------------
-- listings.auction_type
-- ---------------------------------------------------------------------------
alter table public.listings
  add column auction_type text not null default 'muerte_subita'
    check (auction_type in ('muerte_subita', 'continua'));

-- ---------------------------------------------------------------------------
-- bot_configs (per-seller auction bot settings; simulated bidding only,
-- never generates a real charge)
-- ---------------------------------------------------------------------------
create table public.bot_configs (
  seller_id uuid primary key references public.profiles (id) on delete cascade,
  enabled boolean not null default false,
  max_bots int not null default 0 check (max_bots >= 0 and max_bots <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bot_configs enable row level security;

create policy "sellers manage their own bot config"
  on public.bot_configs for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- conversations / messages (buyer-seller DMs, separate from live-stream chat)
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id),
  seller_id uuid not null references public.profiles (id),
  listing_id uuid references public.listings (id),
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_buyer_idx on public.conversations (buyer_id);
create index conversations_seller_idx on public.conversations (seller_id);

alter table public.conversations enable row level security;

create policy "participants can read their conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "participants can create conversations they're part of"
  on public.conversations for insert
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "participants can update their conversations"
  on public.conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "participants can read messages in their conversations"
  on public.messages for select
  using (
    auth.uid() in (
      select buyer_id from public.conversations where id = conversation_id
      union
      select seller_id from public.conversations where id = conversation_id
    )
  );

create policy "participants can send messages in their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and auth.uid() in (
      select buyer_id from public.conversations where id = conversation_id
      union
      select seller_id from public.conversations where id = conversation_id
    )
  );
