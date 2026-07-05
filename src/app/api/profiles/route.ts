import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: swiped } = await authed.supabase
    .from("swipes")
    .select("swiped_fid")
    .eq("swiper_fid", authed.fid);

  const swipedFids = (swiped ?? []).map((s: { swiped_fid: number }) => s.swiped_fid);
  swipedFids.push(authed.fid); // exclude self

  const { data: profiles, error } = await authed.supabase
    .from("profiles")
    .select("*")
    .eq("show_in_discovery", true)
    .not("fid", "in", `(${swipedFids.join(",")})`)
    .order("follower_count", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const candidates = profiles ?? [];

  // Find which candidates have superliked the viewer.
  const candidateFids = candidates.map((p: { fid: number }) => p.fid);
  let superlikeMap: Record<number, string | null> = {};
  if (candidateFids.length > 0) {
    // Service role bypasses RLS so we can read swipes directed AT the viewer
    // (swiper_fid belongs to another user, which the viewer's own policy blocks).
    // Scoped tightly: only superlikes where swiped_fid = verified viewer fid.
    const service = createServiceClient();
    const { data: superlikeRows } = await service
      .from("swipes")
      .select("swiper_fid, superlike_message")
      .eq("swiped_fid", authed.fid)
      .eq("direction", "superlike")
      .in("swiper_fid", candidateFids);
    for (const row of superlikeRows ?? []) {
      superlikeMap[row.swiper_fid] = row.superlike_message ?? null;
    }
  }

  const enriched = candidates.map((p: { fid: number }) => ({
    ...p,
    superliked_you: p.fid in superlikeMap,
    superlike_message: superlikeMap[p.fid] ?? null,
  }));

  // Superlikes float to top of deck, then sort by follower_count descending.
  type Enriched = { superliked_you: boolean; follower_count: number; fid: number; superlike_message: string | null };
  (enriched as Enriched[]).sort((a, b) => {
    if (a.superliked_you !== b.superliked_you) return a.superliked_you ? -1 : 1;
    return b.follower_count - a.follower_count;
  });

  return NextResponse.json({ profiles: enriched });
}
