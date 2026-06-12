import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");
  if (!fid) return NextResponse.json({ error: "fid required" }, { status: 400 });

  const supabase = createServiceClient();
  const currentFid = parseInt(fid);

  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      user1:profiles!matches_user1_fid_fkey(*),
      user2:profiles!matches_user2_fid_fkey(*)
    `)
    .or(`user1_fid.eq.${currentFid},user2_fid.eq.${currentFid}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ matches: data ?? [] });
}
