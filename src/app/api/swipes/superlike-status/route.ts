import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";

export async function GET(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // UTC midnight reset — could be made timezone-aware later if users find
  // the reset timing confusing.
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const { count } = await authed.supabase
    .from("swipes")
    .select("*", { count: "exact", head: true })
    .eq("swiper_fid", authed.fid)
    .eq("direction", "superlike")
    .gte("created_at", todayUtc.toISOString());

  return NextResponse.json({ used: (count ?? 0) >= 1 });
}
