-- Storage buckets for listing images and avatars, both public-read with
-- writes scoped to the uploader's own folder (path: <bucket>/<user_id>/...).
insert into storage.buckets (id, name, public)
values
  ('listing-images', 'listing-images', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "public read listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "sellers upload their own listing images"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sellers manage their own listing images"
  on storage.objects for update
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sellers delete their own listing images"
  on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users manage their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
