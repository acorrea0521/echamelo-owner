-- Per-stream moderator grants (seller assigns trusted viewers as mods for
-- their room). Not a global role — scoped to one stream, mirroring how
-- Whatnot moderators only have authority in the channel that added them.
create table public.stream_moderators (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (stream_id, user_id)
);

alter table public.stream_moderators enable row level security;

create policy "anyone can see who moderates a stream"
  on public.stream_moderators for select using (true);

create policy "stream owner manages their moderators"
  on public.stream_moderators for all
  using (auth.uid() in (select seller_id from public.streams where id = stream_id))
  with check (auth.uid() in (select seller_id from public.streams where id = stream_id));

-- True for stream mods, the stream's own seller, and platform admins — the
-- three tiers that should pass every moderation RLS check in this migration.
create or replace function public.is_stream_moderator(p_stream_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.stream_moderators
    where stream_id = p_stream_id and user_id = p_user_id
  ) or exists (
    select 1 from public.streams
    where id = p_stream_id and seller_id = p_user_id
  ) or exists (
    select 1 from public.profiles where id = p_user_id and is_admin = true
  );
$$;

-- Kicked users — blocks rejoining the room (LiveKit token issuance and RLS
-- both check this), distinct from a chat-only mute.
create table public.stream_bans (
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (stream_id, user_id)
);

alter table public.stream_bans enable row level security;

create policy "anyone can check a stream ban"
  on public.stream_bans for select using (true);

-- Chat-muted users — can still watch and bid, just can't post. Separate
-- table from bans so the two capabilities are independently toggleable.
create table public.stream_chat_mutes (
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  muted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (stream_id, user_id)
);

alter table public.stream_chat_mutes enable row level security;

create policy "anyone can check a stream chat mute"
  on public.stream_chat_mutes for select using (true);

-- Stream-wide chat controls
alter table public.streams
  add column chat_paused boolean not null default false,
  add column chat_slow_mode_seconds int not null default 0;

-- Widen moderation_actions to cover the new action types; stream-level
-- actions (pause/slow-mode) have no single target user, so target_id must
-- become nullable. metadata carries action-specific context (slow-mode
-- seconds, flag reason, voided bid id).
alter table public.moderation_actions
  drop constraint moderation_actions_action_type_check,
  add constraint moderation_actions_action_type_check
    check (action_type in ('mute','unmute','block','unblock','kick','chat_delete','pause_chat','resume_chat','slow_mode','flag','bid_void'));
alter table public.moderation_actions alter column target_id drop not null;
alter table public.moderation_actions add column metadata jsonb;

drop policy "stream owners manage moderation actions in their stream" on public.moderation_actions;
create policy "moderators manage moderation actions in their stream"
  on public.moderation_actions for all
  using (auth.uid() = actor_id and (stream_id is null or public.is_stream_moderator(stream_id, auth.uid())))
  with check (auth.uid() = actor_id and (stream_id is null or public.is_stream_moderator(stream_id, auth.uid())));

-- Chat: moderators (not just sender/seller) can soft-delete messages.
drop policy "stream owners can soft-delete messages in their stream" on public.chat_messages;
create policy "senders, sellers, and moderators can soft-delete chat messages"
  on public.chat_messages for update
  using (
    auth.uid() = sender_id
    or public.is_stream_moderator(stream_id, auth.uid())
  )
  with check (
    auth.uid() = sender_id
    or public.is_stream_moderator(stream_id, auth.uid())
  );

-- Chat: enforce ban / mute / pause / slow-mode directly at the RLS layer, so
-- these can't be bypassed by talking to Postgres directly instead of the
-- app — same "server-authoritative" posture as the bidding RPCs. Moderators
-- and the seller are exempt from pause/slow-mode (they still can't post if
-- individually muted or banned, which shouldn't happen but is left
-- consistent on purpose).
drop policy "authenticated non-blocked users can send chat messages" on public.chat_messages;
create policy "chat insert respects ban, mute, pause, and slow mode"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id
    and (select buyer_status from public.profiles where id = auth.uid()) is distinct from 'bloqueado'
    and not exists (
      select 1 from public.stream_bans
      where stream_id = chat_messages.stream_id and user_id = auth.uid()
    )
    and not exists (
      select 1 from public.stream_chat_mutes
      where stream_id = chat_messages.stream_id and user_id = auth.uid()
    )
    and (
      public.is_stream_moderator(chat_messages.stream_id, auth.uid())
      or (
        not (select chat_paused from public.streams where id = chat_messages.stream_id)
        and not exists (
          select 1 from public.chat_messages m2
          where m2.stream_id = chat_messages.stream_id
            and m2.sender_id = auth.uid()
            and m2.created_at > now() - (
              make_interval(secs => (select chat_slow_mode_seconds from public.streams where id = chat_messages.stream_id))
            )
        )
      )
    )
  );

-- Bid voiding — the practical equivalent of "reject a bid" that's compatible
-- with the live, time-critical anti-snipe auction engine (see place_bid()):
-- rather than gate bids behind manual approval, a moderator can invalidate
-- an individual bid after the fact and the listing's current-highest is
-- atomically recomputed from the next valid bid.
alter table public.bids add column voided_at timestamptz;

create or replace function public.void_bid(p_bid_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_bid record;
  v_listing record;
  v_next record;
begin
  select * into v_bid from public.bids where id = p_bid_id for update;
  if v_bid is null or v_bid.voided_at is not null then
    return jsonb_build_object('voided', false, 'reason', 'not_found_or_already_voided');
  end if;

  select * into v_listing from public.listings where id = v_bid.listing_id for update;
  if not public.is_stream_moderator(v_listing.stream_id, p_actor_id) then
    return jsonb_build_object('voided', false, 'reason', 'not_authorized');
  end if;

  update public.bids set voided_at = now() where id = p_bid_id;

  if v_listing.current_highest_bidder_id is not distinct from v_bid.bidder_id
     and v_listing.current_highest_bid_cents is not distinct from v_bid.amount_cents then
    select * into v_next
      from public.bids
      where listing_id = v_listing.id and voided_at is null and id <> p_bid_id
      order by amount_cents desc, created_at asc
      limit 1;

    update public.listings
    set current_highest_bid_cents = v_next.amount_cents,
        current_highest_bidder_id = v_next.bidder_id
    where id = v_listing.id;
  end if;

  insert into public.moderation_actions (stream_id, actor_id, target_id, action_type, metadata)
  values (v_listing.stream_id, p_actor_id, v_bid.bidder_id, 'bid_void', jsonb_build_object('bid_id', p_bid_id, 'amount_cents', v_bid.amount_cents));

  return jsonb_build_object('voided', true);
end;
$$;

revoke all on function public.void_bid(uuid, uuid) from public, anon, authenticated;
grant execute on function public.void_bid(uuid, uuid) to service_role;
