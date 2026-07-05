-- Private bucket: RFC document, inventory photos, and pitch video are
-- sensitive/PII-adjacent, unlike the public listing-images/avatars buckets.
insert into storage.buckets (id, name, public)
values ('seller-applications', 'seller-applications', false)
on conflict (id) do nothing;

create policy "sellers upload their own application files"
  on storage.objects for insert
  with check (
    bucket_id = 'seller-applications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sellers read their own application files"
  on storage.objects for select
  using (
    bucket_id = 'seller-applications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sellers delete their own application files"
  on storage.objects for delete
  using (
    bucket_id = 'seller-applications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
