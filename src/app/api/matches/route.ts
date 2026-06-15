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
      user2:profiles!matches_user2_fid_fkey(*),
      last_message:messages(content, created_at)
    `)
    .or(`user1_fid.eq.${authed.fid},user2_fid.eq.${authed.fid}`)
    .order("created_at", { ascending: false })
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // PostgREST returns embedded one-to-many as an array even with limit(1).
  // Flatten last_message to a single object (or null) for the client.
  const matches = (data ?? []).map((m) => ({
    ...m,
    last_message: Array.isArray(m.last_message) ? (m.last_message[0] ?? null) : m.last_message,
  }));

  return NextResponse.json({ matches });
}
