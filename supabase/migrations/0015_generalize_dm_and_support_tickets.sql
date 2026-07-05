-- conversations was originally buyer/seller-shaped (unused so far — safe to
-- restructure). Generalizing to any-two-users DMs per the new requirement:
-- any user can chat with any other non-admin user (found by username
-- search); only admin may initiate a conversation that includes an admin —
-- regular users cannot reach admin directly except via support tickets.
drop policy if exists "participants can read their conversations" on conversations;
drop policy if exists "participants can create conversations they're part of" on conversations;
drop policy if exists "participants can update their conversations" on conversations;

alter table conversations rename column buyer_id to user_a_id;
alter table conversations rename column seller_id to user_b_id;
alter table conversations add column is_support boolean not null default false;

drop index if exists conversations_buyer_idx;
drop index if exists conversations_seller_idx;
create index conversations_user_a_idx on conversations (user_a_id);
create index conversations_user_b_idx on conversations (user_b_id);

-- One regular DM thread per pair; support tickets can open multiple over time.
create unique index conversations_unique_dm
  on conversations (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id))
  where is_support = false;

create policy "participants can read their conversations"
  on conversations for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "participants can create conversations they're part of"
  on conversations for insert
  with check (
    (auth.uid() = user_a_id or auth.uid() = user_b_id)
    and (
      (select is_admin from profiles where id = auth.uid()) = true
      or not exists (
        select 1 from profiles where id in (user_a_id, user_b_id) and is_admin = true
      )
    )
  );

create policy "participants can update their conversations"
  on conversations for update
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Support tickets: the only path a regular user has to reach admin. Admin
-- opens a conversation for a ticket, then closes both when resolved.
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id),
  subject text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  conversation_id uuid references conversations (id),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index support_tickets_status_idx on support_tickets (status, created_at);

alter table support_tickets enable row level security;

create policy "users read their own tickets"
  on support_tickets for select
  using (auth.uid() = user_id);

create policy "users create their own tickets"
  on support_tickets for insert
  with check (auth.uid() = user_id);
-- Ticket status changes and conversation linking are admin-only, done via
-- the service-role client (see lib/supabase/admin.ts) — no client update policy.
