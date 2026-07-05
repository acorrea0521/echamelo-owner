create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'seller_live',
  stream_id uuid references public.streams(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users read their own notifications"
on public.notifications for select
using (auth.uid() = user_id);

create policy "users mark their own notifications read"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Fan out a notification to every follower when a seller goes live. Runs as
-- SECURITY DEFINER so it bypasses RLS the same way place_bid()/place_bot_bid()
-- do -- clients never insert notifications directly.
create or replace function public.handle_stream_went_live()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, stream_id)
  select follower_id, 'seller_live', new.id
  from public.follows
  where followee_id = new.seller_id;
  return null;
end;
$$;

drop trigger if exists stream_went_live_trigger on public.streams;
create trigger stream_went_live_trigger
after update of status on public.streams
for each row
when (new.status = 'live' and old.status is distinct from 'live')
execute function public.handle_stream_went_live();

alter publication supabase_realtime add table public.notifications;
