alter publication supabase_realtime add table public.chat_messages;

-- Blocked users can't send chat messages platform-wide (see moderation_actions).
drop policy "authenticated users can send chat messages" on public.chat_messages;
create policy "authenticated non-blocked users can send chat messages"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id
    and not exists (
      select 1 from public.profiles where id = auth.uid() and buyer_status = 'bloqueado'
    )
  );
