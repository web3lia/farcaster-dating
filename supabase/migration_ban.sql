-- Full-ban support: a banned user cannot sign in or appear in discovery.
-- Backward-compatible: default false means no existing user is affected.
alter table public.profiles
  add column if not exists banned boolean not null default false;
