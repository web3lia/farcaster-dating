import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyMatch, notifySuperlike } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { swiped_fid, direction, superlike_message } = await req.json();
  if (!swiped_fid || !direction) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // swiper_fid is the verified fid from the token; RLS enforces it too.
  const swiper_fid = authed.fid;

  // Safety net: ensure the swiper has a profiles row before inserting the swipe.
  // Uses ignoreDuplicates so it's a no-op for existing rows (zero overhead).
  // Prevents FK violations for users whose session outlived their profile row
  // (e.g. after a DB migration or partial onboarding).
  {
    const svc = createServiceClient();
    const { error: profileErr } = await svc
      .from("profiles")
      .upsert(
        { fid: swiper_fid, username: `fid_${swiper_fid}`, display_name: "Farcaster User", pfp_url: "", bio: "", follower_count: 0, following_count: 0 },
        { onConflict: "fid", ignoreDuplicates: true }
      );
    if (profileErr) console.error("[swipes] profile safety-upsert failed:", profileErr.message);
  }

  // FUTURE PREMIUM GATE — remove this limit check when the caller has an active
  // premium subscription. Reset uses UTC midnight; could be made timezone-aware
  // later if users find the reset timing confusing.
  if (direction === "superlike") {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    const { count } = await authed.supabase
      .from("swipes")
      .select("*", { count: "exact", head: true })
      .eq("swiper_fid", swiper_fid)
      .eq("direction", "superlike")
      .gte("created_at", todayUtc.toISOString());

    if ((count ?? 0) >= 1) {
      return NextResponse.json(
        { error: "superlike_limit", message: "You're out of superlikes today — come back tomorrow ✨" },
        { status: 429 }
      );
    }
  }

  const { error: swipeError } = await authed.supabase
    .from("swipes")
    .upsert(
      {
        swiper_fid,
        swiped_fid,
        direction,
        superlike_message: direction === "superlike" ? (superlike_message ?? null) : null,
      },
      { onConflict: "swiper_fid,swiped_fid" }
    );

  if (swipeError) {
    return NextResponse.json({ error: swipeError.message }, { status: 403 });
  }

  // Superlike notification — fire-and-forget before match check
  if (direction === "superlike") {
    notifySuperlike(swiped_fid, superlike_message ?? null);
  }

  // Check for a mutual match (the RPC is SECURITY DEFINER, so it can read both
  // sides' swipes and insert the match regardless of the caller's RLS).
  let match = null;
  if (direction === "like" || direction === "superlike") {
    const { data } = await authed.supabase.rpc("check_and_create_match", {
      p_swiper_fid: swiper_fid,
      p_swiped_fid: swiped_fid,
    });

    if (data) {
      // The caller is a participant, so matches_select lets them read it.
      const { data: matchData } = await authed.supabase
        .from("matches")
        .select("*, user1:profiles!matches_user1_fid_fkey(*), user2:profiles!matches_user2_fid_fkey(*)")
        .eq("id", data)
        .single();
      match = matchData;

      // Match notifications — fire-and-forget
      if (match) {
        notifyMatch(
          match.id,
          match.user1_fid,
          match.user1?.display_name ?? "Someone",
          match.user2_fid,
          match.user2?.display_name ?? "Someone",
        );
      }
    }
  }

  return NextResponse.json({ success: true, match });
}
