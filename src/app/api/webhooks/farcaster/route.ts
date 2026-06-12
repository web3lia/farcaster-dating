import { NextRequest, NextResponse } from "next/server";

// Farcaster Mini App webhook — handle frame events
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[farcaster webhook]", JSON.stringify(body));
  // TODO: handle frame_added / frame_removed / notifications_enabled events
  return NextResponse.json({ ok: true });
}
