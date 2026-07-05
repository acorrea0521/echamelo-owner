-- Keeps profiles.followers_count/following_count in sync with the follows
-- table regardless of how a row gets inserted/deleted (client RLS insert,
-- admin, etc.) — see project_echamelo_business_rules "Follow a seller".
create or replace function public.handle_follow_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.followee_id;
  elsif TG_OP = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.followee_id;
  end if;
  return null;
end;
$$;

drop trigger if exists follows_count_trigger on public.follows;
create trigger follows_count_trigger
after insert or delete on public.follows
for each row execute function public.handle_follow_change();
