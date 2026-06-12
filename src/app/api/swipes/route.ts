import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { swiper_fid, swiped_fid, direction } = await req.json();

  if (!swiper_fid || !swiped_fid || !direction) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Insert swipe
  const { error: swipeError } = await supabase
    .from("swipes")
    .upsert({ swiper_fid, swiped_fid, direction }, { onConflict: "swiper_fid,swiped_fid" });

  if (swipeError) {
    return NextResponse.json({ error: swipeError.message }, { status: 500 });
  }

  // Check for match if liked
  let match = null;
  if (direction === "like" || direction === "superlike") {
    const { data } = await supabase.rpc("check_and_create_match", {
      p_swiper_fid: swiper_fid,
      p_swiped_fid: swiped_fid,
    });

    if (data) {
      const { data: matchData } = await supabase
        .from("matches")
        .select("*, user1:profiles!matches_user1_fid_fkey(*), user2:profiles!matches_user2_fid_fkey(*)")
        .eq("id", data)
        .single();
      match = matchData;
    }
  }

  return NextResponse.json({ success: true, match });
}
