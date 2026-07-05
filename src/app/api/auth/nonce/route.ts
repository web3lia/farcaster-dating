import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const identifier = `${ip}:nonce`;
  const supabase = createServiceClient();

  const { data: allowed, error: rlError } = await supabase.rpc("check_rate_limit", {
    p_identifier: identifier,
    p_max_requests: 5,
    p_window_seconds: 60,
  });

  // Fail open — a DB hiccup must not block logins
  if (!rlError && allowed === false) {
    return NextResponse.json(
      { error: "Too many requests, please slow down" },
      { status: 429 }
    );
  }

  const nonce = randomBytes(16).toString("hex");

  // Purge expired nonces so the table doesn't grow unbounded.
  await supabase
    .from("auth_nonces")
    .delete()
    .lt("created_at", new Date(Date.now() - NONCE_TTL_MS).toISOString());

  const { error } = await supabase.from("auth_nonces").insert({ nonce });
  if (error) {
    console.error("nonce store failed", error.message);
    return NextResponse.json({ error: "Could not issue nonce" }, { status: 500 });
  }

  return NextResponse.json({ nonce });
}
