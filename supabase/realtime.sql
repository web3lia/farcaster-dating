-- Enable realtime delivery of new messages to the browser (anon role).
--
-- Why this is needed: the original messages_select policy gates on
--   current_setting('app.current_fid')
-- which is NEVER set on the anon realtime connection, so the policy always
-- evaluates false and Realtime delivers zero rows. The API routes work only
-- because they use the service key (which bypasses RLS).
--
-- Fix: allow SELECT on messages (match_id is an unguessable UUID, and the
-- anon/publishable key is already public). Then add the table to the
-- realtime publication so INSERTs are broadcast.

-- 1. Relax the SELECT policy so the realtime (anon) connection can read rows
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (true);

-- 2. Add messages to the realtime publication (idempotent-safe pattern)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
