import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, url } = await req.json();
  if (!token || !url) {
    return NextResponse.json({ error: "token and url required" }, { status: 400 });
  }

  const { error } = await createServiceClient()
    .from("notification_tokens")
    .upsert(
      { fid: authed.fid, token, url, updated_at: new Date().toISOString() },
      { onConflict: "fid" }
    );

  if (error) {
    console.error("[notification-token] upsert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[notification-token] saved token for fid", authed.fid);
  return NextResponse.json({ ok: true });
}
