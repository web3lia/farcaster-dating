-- Grant schema usage to all app roles (service_role included — it has BYPASSRLS
-- but still needs table-level GRANTs, which are two separate things in Postgres)
grant usage on schema public to anon, authenticated, service_role;

-- Grant table permissions
grant select, insert, update on public.profiles  to anon, authenticated, service_role;
grant select, insert         on public.swipes     to anon, authenticated, service_role;
grant select, insert         on public.matches    to anon, authenticated, service_role;
grant select, insert, update on public.messages   to anon, authenticated, service_role;

-- Grant sequence usage (needed for uuid_generate_v4 inserts)
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Grant execute on our custom function
grant execute on function public.check_and_create_match(integer, integer)
  to anon, authenticated, service_role;

-- Ensure future tables auto-grant too (so this never bites again)
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
