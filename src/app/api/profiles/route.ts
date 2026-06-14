import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";

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

  return NextResponse.json({ profiles: profiles ?? [] });
}
