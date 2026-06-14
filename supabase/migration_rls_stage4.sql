-- ── Stage 4: add the missing swipes UPDATE policy ───────────────────────
-- The swipes API upserts (insert-or-update on re-swipe), which needs an UPDATE
-- policy in addition to insert. Without it, re-swiping the same profile (the
-- ON CONFLICT DO UPDATE path) is rejected by RLS. Scope it to your own swipes.

create policy "swipes_update" on public.swipes
  for update using (auth_fid() = swiper_fid) with check (auth_fid() = swiper_fid);
