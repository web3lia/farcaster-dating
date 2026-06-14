import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("match_id");
  if (!matchId) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized", debug: "getAuthedClient returned null" }, { status: 401 });

  const { data, error } = await authed.supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_fid_fkey(*)")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message, debug_fid: authed.fid }, { status: 500 });

  return NextResponse.json({ messages: data ?? [], debug_fid: authed.fid, debug_count: data?.length ?? 0 });
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

  return NextResponse.json({ message: data });
}
