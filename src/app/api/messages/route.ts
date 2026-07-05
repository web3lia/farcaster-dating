import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyMessage } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("match_id");
  if (!matchId) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await authed.supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_fid_fkey(*)")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: mark the other person's messages as read.
  // Uses service role because no UPDATE RLS policy exists on messages.
  // Errors are caught and logged — never block or crash the GET response.
  createServiceClient()
    .from("messages")
    .update({ read: true })
    .eq("match_id", matchId)
    .neq("sender_fid", authed.fid)
    .eq("read", false)
    .then(({ error: updateErr }) => {
      if (updateErr) console.error("[messages] mark-as-read failed:", updateErr.message);
    });

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { match_id, content, type = "text" } = await req.json();
  if (!match_id || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // sender_fid is the verified fid from the token — not from the request body.
  // RLS additionally enforces sender_fid = auth_fid() AND match participation.
  const { data, error } = await authed.supabase
    .from("messages")
    .insert({ match_id, sender_fid: authed.fid, content, type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });

  // Fire-and-forget message notification (throttled in notifications.ts)
  sendMessageNotification(match_id, authed.fid, content).catch(console.error);

  return NextResponse.json({ message: data });
}

async function sendMessageNotification(matchId: string, senderFid: number, content: string) {
  const service = createServiceClient();

  // Fetch match participants + sender's display name in one query
  const { data: match } = await service
    .from("matches")
    .select("user1_fid, user2_fid, user1:profiles!matches_user1_fid_fkey(display_name), user2:profiles!matches_user2_fid_fkey(display_name)")
    .eq("id", matchId)
    .single();

  if (!match) return;

  const recipientFid = match.user1_fid === senderFid ? match.user2_fid : match.user1_fid;
  // Supabase returns joined profiles as arrays when using the fkey hint
  const user1 = Array.isArray(match.user1) ? match.user1[0] : match.user1;
  const user2 = Array.isArray(match.user2) ? match.user2[0] : match.user2;
  const senderName =
    match.user1_fid === senderFid
      ? (user1 as { display_name?: string } | null)?.display_name ?? "Someone"
      : (user2 as { display_name?: string } | null)?.display_name ?? "Someone";

  notifyMessage(matchId, recipientFid, senderName, content);
}
