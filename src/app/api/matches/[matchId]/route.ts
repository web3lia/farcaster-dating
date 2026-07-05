import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId } = params;
  const { supabase } = authed;

  const { error, count } = await supabase
    .from("matches")
    .delete({ count: "exact" })
    .eq("id", matchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
