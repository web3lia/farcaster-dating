-- Grant schema usage to anon and authenticated roles
grant usage on schema public to anon, authenticated;

-- Grant table permissions
grant select, insert, update on public.profiles  to anon, authenticated;
grant select, insert         on public.swipes     to anon, authenticated;
grant select, insert         on public.matches    to anon, authenticated;
grant select, insert, update on public.messages   to anon, authenticated;

-- Grant sequence usage (needed for uuid_generate_v4 inserts)
grant usage, select on all sequences in schema public to anon, authenticated;

-- Grant execute on our custom function
grant execute on function public.check_and_create_match(integer, integer) to anon, authenticated;
