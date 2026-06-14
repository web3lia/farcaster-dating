-- ── Single-use SIWF nonces ──────────────────────────────────────────────
-- Server issues a nonce, stores it here, and consumes (deletes) it on
-- successful sign-in. This prevents replay: a signature can only be used once,
-- and only against a nonce we recently issued.

create table if not exists public.auth_nonces (
  nonce      text primary key,
  created_at timestamptz not null default now()
);

-- Only the server (service_role) ever touches nonces. No anon/authenticated
-- grants → the table is unreachable from the public key. RLS on as defense in
-- depth (service_role bypasses RLS but still needs the explicit grants below).
alter table public.auth_nonces enable row level security;

grant select, insert, delete on public.auth_nonces to service_role;
