import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("match_id");
  if (!matchId) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_fid_fkey(*)")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { match_id, sender_fid, content, type = "text" } = await req.json();
  if (!match_id || !sender_fid || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id, sender_fid, content, type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: data });
}
