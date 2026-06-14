import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RATE_WINDOW_MS = 60 * 1000;     // 1 minute window
const RATE_LIMIT = 5;                  // max 5 nonces per IP per minute

// In-memory rate limiter (per serverless instance — good enough to blunt
// naive burst attacks; a shared store like Redis isn't needed here since
// nonces are single-use and expire in 10 min anyway).
const ipHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_LIMIT;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const nonce = randomBytes(16).toString("hex");
  const supabase = createServiceClient();

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
