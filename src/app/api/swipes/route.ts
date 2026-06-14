import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";

export async function POST(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { swiped_fid, direction } = await req.json();
  if (!swiped_fid || !direction) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // swiper_fid is the verified fid from the token; RLS enforces it too.
  const swiper_fid = authed.fid;

  const { error: swipeError } = await authed.supabase
    .from("swipes")
    .upsert({ swiper_fid, swiped_fid, direction }, { onConflict: "swiper_fid,swiped_fid" });

  if (swipeError) {
    return NextResponse.json({ error: swipeError.message }, { status: 403 });
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
    }
  }

  return NextResponse.json({ success: true, match });
}
