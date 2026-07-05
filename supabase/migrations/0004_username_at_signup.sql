-- Signup now collects a user-chosen username (validated for availability
-- client-side before submit). Passed via signUp() options.data.username;
-- falls back to the old auto-generated username if absent for any reason.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6)
    ),
    split_part(new.email, '@', 1),
    nullif(new.raw_user_meta_data ->> 'role', '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
