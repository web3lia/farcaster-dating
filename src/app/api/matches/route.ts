import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";

export async function GET(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await authed.supabase
    .from("matches")
    .select(`
      *,
      user1:profiles!matches_user1_fid_fkey(*),
      user2:profiles!matches_user2_fid_fkey(*)
    `)
    .or(`user1_fid.eq.${authed.fid},user2_fid.eq.${authed.fid}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ matches: data ?? [] });
}
