-- ── Multi-intent: single `intent` → `intents text[]` ───────────────────
-- Lets a profile pick several goals at once (e.g. Romance + Networking).
-- Safe for existing profiles: each row's current `intent` is carried over
-- as a one-element array. The old `intent` column is kept for now (can be
-- dropped later once nothing reads it).

-- 1. Add the array column. NOT NULL DEFAULT backfills every existing row
--    with ['networking'] first…
alter table public.profiles
  add column if not exists intents text[] not null default array['networking'];

-- 2. …then carry over each profile's actual current intent as [intent].
--    (intent is NOT NULL with a default, so this is safe for all rows.)
update public.profiles
  set intents = array[intent];

-- 3. Validate every element is one of the allowed goals (empty array is OK).
alter table public.profiles drop constraint if exists profiles_intents_valid;
alter table public.profiles add constraint profiles_intents_valid
  check (intents <@ array['romance', 'friendship', 'networking']::text[]);

-- Note: the legacy scalar `intent` column is intentionally left in place for
-- backward compatibility during the code rollout. To remove it later:
--   alter table public.profiles drop column intent;
