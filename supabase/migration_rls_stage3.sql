-- ── Stage 3: real RLS policies driven by the verified fid in the JWT ─────
-- The browser now carries an authenticated session whose JWT has
-- app_metadata.fid (Stage 2). These policies scope every table by that fid.
--
-- App impact: the API routes use the service key (BYPASSRLS), so profiles/
-- swipes/matches behaviour is unchanged. The ONE thing that changes
-- immediately is messages realtime (browser is authenticated): we replace the
-- public `using(true)` with participant-only — closing the DM read leak.

-- Helper: the verified fid from the JWT, or null for anon/service.
create or replace function public.auth_fid() returns int
  language sql stable
  as $$ select nullif(auth.jwt() -> 'app_metadata' ->> 'fid', '')::int $$;

grant execute on function public.auth_fid() to anon, authenticated, service_role;

-- ── PROFILES: public read; write only your own row ──────────────────────
drop policy if exists "profiles_read"   on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_read" on public.profiles
  for select using (true);
create policy "profiles_insert" on public.profiles
  for insert with check (auth_fid() = fid);
create policy "profiles_update" on public.profiles
  for update using (auth_fid() = fid) with check (auth_fid() = fid);

-- ── SWIPES: only your own (who you liked stays private) ─────────────────
drop policy if exists "swipes_select" on public.swipes;
drop policy if exists "swipes_insert" on public.swipes;

create policy "swipes_select" on public.swipes
  for select using (auth_fid() = swiper_fid);
create policy "swipes_insert" on public.swipes
  for insert with check (auth_fid() = swiper_fid);

-- ── MATCHES: only participants can read (no direct user insert; created by
--    the SECURITY DEFINER RPC / service key) ──────────────────────────────
drop policy if exists "matches_select" on public.matches;

create policy "matches_select" on public.matches
  for select using (auth_fid() in (user1_fid, user2_fid));

-- ── MESSAGES: only participants of the match — CLOSES the DM leak ────────
drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;

create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and auth_fid() in (m.user1_fid, m.user2_fid)
    )
  );
create policy "messages_insert" on public.messages
  for insert with check (
    sender_fid = auth_fid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and auth_fid() in (m.user1_fid, m.user2_fid)
    )
  );
