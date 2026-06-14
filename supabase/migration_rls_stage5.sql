-- ── Stage 5: revoke excess anon grants ────────────────────────────────────
-- All write paths now require a user JWT (authenticated role). The anon role
-- only needs SELECT on profiles for the realtime subscription fallback.
-- Revoking insert/update/delete from anon hardens the surface even if RLS
-- is ever misconfigured.

revoke insert, update, delete on public.profiles from anon;
revoke select, insert, update, delete on public.swipes   from anon;
revoke select, insert, delete         on public.matches  from anon;
revoke select, insert, update, delete on public.messages from anon;
revoke execute on function public.check_and_create_match(integer, integer) from anon;
revoke execute on function public.auth_fid() from anon;

-- authenticated role keeps full access (RLS still enforces per-user scoping)
grant select, insert, update on public.profiles  to authenticated;
grant select, insert, update on public.swipes    to authenticated;
grant select, insert         on public.matches   to authenticated;
grant select, insert, update on public.messages  to authenticated;
grant execute on function public.check_and_create_match(integer, integer) to authenticated;
grant execute on function public.auth_fid() to authenticated;

-- service_role keeps full access for server-side admin operations
grant select, insert, update, delete on public.profiles  to service_role;
grant select, insert, update, delete on public.swipes    to service_role;
grant select, insert, update, delete on public.matches   to service_role;
grant select, insert, update, delete on public.messages  to service_role;

-- anon keeps SELECT on profiles only — needed for public Farcaster profile lookups
grant select on public.profiles to anon;
