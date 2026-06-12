-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Profiles table
create table if not exists public.profiles (
  id          uuid default uuid_generate_v4() primary key,
  fid         integer unique not null,
  username    text not null,
  display_name text not null,
  pfp_url     text default '',
  bio         text default '',
  follower_count integer default 0,
  following_count integer default 0,
  age         integer,
  gender      text,
  looking_for text,
  interests   text[] default '{}',
  location    text,
  show_in_discovery boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Swipes table
create table if not exists public.swipes (
  id          uuid default uuid_generate_v4() primary key,
  swiper_fid  integer not null references public.profiles(fid) on delete cascade,
  swiped_fid  integer not null references public.profiles(fid) on delete cascade,
  direction   text check (direction in ('like','nope','superlike')) not null,
  created_at  timestamptz default now(),
  unique (swiper_fid, swiped_fid)
);

-- Matches table
create table if not exists public.matches (
  id          uuid default uuid_generate_v4() primary key,
  user1_fid   integer not null references public.profiles(fid) on delete cascade,
  user2_fid   integer not null references public.profiles(fid) on delete cascade,
  created_at  timestamptz default now(),
  unique (user1_fid, user2_fid)
);

-- Messages table
create table if not exists public.messages (
  id          uuid default uuid_generate_v4() primary key,
  match_id    uuid not null references public.matches(id) on delete cascade,
  sender_fid  integer not null references public.profiles(fid) on delete cascade,
  content     text not null,
  type        text check (type in ('text','image','cast_embed')) default 'text',
  read        boolean default false,
  created_at  timestamptz default now()
);

-- Indexes
create index if not exists idx_swipes_swiper on public.swipes(swiper_fid);
create index if not exists idx_swipes_swiped on public.swipes(swiped_fid);
create index if not exists idx_matches_user1 on public.matches(user1_fid);
create index if not exists idx_matches_user2 on public.matches(user2_fid);
create index if not exists idx_messages_match on public.messages(match_id, created_at);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Function: check and create match after a like
create or replace function public.check_and_create_match(
  p_swiper_fid integer,
  p_swiped_fid integer
) returns uuid language plpgsql security definer as $$
declare
  v_match_id uuid;
begin
  -- Check if swiped person already liked swiper
  if exists (
    select 1 from public.swipes
    where swiper_fid = p_swiped_fid
      and swiped_fid = p_swiper_fid
      and direction in ('like', 'superlike')
  ) then
    -- Ensure consistent ordering
    insert into public.matches (user1_fid, user2_fid)
    values (least(p_swiper_fid, p_swiped_fid), greatest(p_swiper_fid, p_swiped_fid))
    on conflict do nothing
    returning id into v_match_id;
  end if;
  return v_match_id;
end;
$$;

-- RLS policies
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (true);
create policy "profiles_update" on public.profiles for update
  using (fid = (current_setting('app.current_fid', true))::integer);

-- Swipes: only the swiper can see and create their swipes
create policy "swipes_select" on public.swipes for select
  using (swiper_fid = (current_setting('app.current_fid', true))::integer);
create policy "swipes_insert" on public.swipes for insert
  with check (swiper_fid = (current_setting('app.current_fid', true))::integer);

-- Matches: participants can see their matches
create policy "matches_select" on public.matches for select
  using (
    user1_fid = (current_setting('app.current_fid', true))::integer
    or user2_fid = (current_setting('app.current_fid', true))::integer
  );

-- Messages: participants in the match can read/write
create policy "messages_select" on public.messages for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_fid = (current_setting('app.current_fid', true))::integer
          or m.user2_fid = (current_setting('app.current_fid', true))::integer)
    )
  );
create policy "messages_insert" on public.messages for insert
  with check (
    sender_fid = (current_setting('app.current_fid', true))::integer
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_fid = (current_setting('app.current_fid', true))::integer
          or m.user2_fid = (current_setting('app.current_fid', true))::integer)
    )
  );
