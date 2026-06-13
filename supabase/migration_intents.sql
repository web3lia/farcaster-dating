-- ── Intents & goals (Bumble-style, crypto-adapted) ──────────────────────
-- Adds three nullable columns with safe defaults so existing profiles
-- (yours + your friend's) keep working — they backfill to the defaults.

-- intent: primary goal. Defaults to 'networking' (the skip-default).
alter table public.profiles
  add column if not exists intent text not null default 'networking';

-- about: free-text "about me", capped at 300 chars.
alter table public.profiles
  add column if not exists about text not null default '';

-- prompt_answer: answer to the guided prompt, capped at 200 chars.
alter table public.profiles
  add column if not exists prompt_answer text not null default '';

-- Constrain intent to the three allowed values
alter table public.profiles
  drop constraint if exists profiles_intent_check;
alter table public.profiles
  add constraint profiles_intent_check
  check (intent in ('romance', 'friendship', 'networking'));

-- Length limits (allow empty; cap lengths)
alter table public.profiles
  drop constraint if exists profiles_about_len;
alter table public.profiles
  add constraint profiles_about_len
  check (char_length(about) <= 300);

alter table public.profiles
  drop constraint if exists profiles_prompt_len;
alter table public.profiles
  add constraint profiles_prompt_len
  check (char_length(prompt_answer) <= 200);

-- No new GRANTs needed: column privileges are inherited from the existing
-- table grant (select, insert, update on profiles), so the app keeps working.
