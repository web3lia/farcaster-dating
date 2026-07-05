import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fid = authed.fid;

  // FUTURE PREMIUM GATE — remove this limit check when the caller has an active
  // premium subscription. Uses a 86400s sliding window; can be swapped to UTC
  // midnight reset (matching the superlike pattern) if needed later.
  const service = createServiceClient();
  const { data: rateLimitOk, error: rpcError } = await service.rpc("check_rate_limit", {
    p_identifier: `${fid}:undo`,
    p_max_requests: 1,
    p_window_seconds: 86400,
  });
  if (!rpcError && rateLimitOk === false) {
    return NextResponse.json(
      { error: "undo_limit", message: "You're out of undos today — come back tomorrow ✨" },
      { status: 429 }
    );
  }
  // Fail-open if RPC errors — proceed to undo rather than blocking the user.

  // Find the caller's most recent swipe.
  const { data: lastSwipe } = await authed.supabase
    .from("swipes")
    .select("id, swiped_fid")
    .eq("swiper_fid", fid)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastSwipe) {
    return NextResponse.json({ error: "nothing_to_undo" }, { status: 404 });
  }

  const { swiped_fid } = lastSwipe;

  // Remove any match created by this swipe (messages cascade via FK).
  const { data: match } = await service
    .from("matches")
    .select("id")
    .or(`and(user1_fid.eq.${fid},user2_fid.eq.${swiped_fid}),and(user1_fid.eq.${swiped_fid},user2_fid.eq.${fid})`)
    .maybeSingle();

  if (match) {
    await service.from("matches").delete().eq("id", match.id);
  }

  // Delete the swipe row.
  await authed.supabase.from("swipes").delete().eq("id", lastSwipe.id);

  // Return the restored profile (fresh — no stale superlike/match state).
  const { data: profile } = await service
    .from("profiles")
    .select("*")
    .eq("fid", swiped_fid)
    .single();

  return NextResponse.json({ profile: profile ?? null });
}
