import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mintSessionForFid } from "@/lib/supabase/session";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let getUserResult: unknown = "skipped (no token)";
  if (token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );
    const { data, error } = await supabase.auth.getUser(token);
    getUserResult = error
      ? { error: error.message, status: error.status }
      : { user_id: data.user?.id, email: data.user?.email, app_metadata: data.user?.app_metadata };
  }

  // Test that mintSessionForFid works for fid=1 (canary)
  let mintResult: unknown = "skipped";
  const testFid = req.nextUrl.searchParams.get("mint");
  if (testFid) {
    const session = await mintSessionForFid(Number(testFid));
    mintResult = session
      ? { ok: true, access_token_prefix: session.access_token.slice(0, 20) }
      : { ok: false, error: "mintSessionForFid returned null" };
  }

  return NextResponse.json({
    env: {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
    },
    token_received: !!token,
    token_prefix: token ? token.slice(0, 30) + "…" : null,
    getUser: getUserResult,
    mint: mintResult,
  });
}
