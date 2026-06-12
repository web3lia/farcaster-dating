import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");
  if (!fid) return NextResponse.json({ error: "fid required" }, { status: 400 });

  const supabase = createServiceClient();
  const currentFid = parseInt(fid);

  // Get already-swiped fids
  const { data: swiped } = await supabase
    .from("swipes")
    .select("swiped_fid")
    .eq("swiper_fid", currentFid);

  const swipedFids = (swiped ?? []).map((s) => s.swiped_fid);
  swipedFids.push(currentFid); // exclude self

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("show_in_discovery", true)
    .not("fid", "in", `(${swipedFids.join(",")})`)
    .order("follower_count", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profiles: profiles ?? [] });
}
