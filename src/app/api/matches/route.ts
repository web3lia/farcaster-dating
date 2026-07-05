import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/server";

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

  // Flatten last_message (PostgREST returns one-to-many as array even with limit(1)).
  const matches = (data ?? []).map((m) => ({
    ...m,
    last_message: Array.isArray(m.last_message) ? (m.last_message[0] ?? null) : m.last_message,
  }));

  // Count unread messages per match (messages sent by the OTHER person, not yet read).
  // Service role needed — no SELECT-by-recipient RLS policy for cross-user reads.
  const matchIds = matches.map((m: { id: string }) => m.id);
  const unreadMap: Record<string, number> = {};
  if (matchIds.length > 0) {
    const { data: unreadRows } = await createServiceClient()
      .from("messages")
      .select("match_id")
      .in("match_id", matchIds)
      .neq("sender_fid", authed.fid)
      .eq("read", false);
    for (const row of unreadRows ?? []) {
      unreadMap[row.match_id] = (unreadMap[row.match_id] ?? 0) + 1;
    }
  }

  const enriched = matches.map((m: { id: string }) => ({
    ...m,
    unread_count: unreadMap[m.id] ?? 0,
  }));

  // Unread matches float to top, then by latest message descending.
  type EnrichedMatch = { unread_count: number; id: string; last_message: { created_at: string } | null };
  (enriched as EnrichedMatch[]).sort((a, b) => {
    const aUnread = a.unread_count > 0 ? 1 : 0;
    const bUnread = b.unread_count > 0 ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    const aTime = a.last_message?.created_at ?? "";
    const bTime = b.last_message?.created_at ?? "";
    return bTime.localeCompare(aTime);
  });

  return NextResponse.json({ matches: enriched });
}
