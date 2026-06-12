import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check env vars (masked)
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
  const pubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  results.env = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "✗ MISSING",
    // Show last 6 chars so you can verify correct key without exposing it
    SUPABASE_PUBLISHABLE_KEY: pubKey ? `✓ ...${pubKey.slice(-6)}` : "✗ MISSING",
    SUPABASE_SECRET_KEY: secretKey ? `✓ ...${secretKey.slice(-6)}` : "✗ MISSING",
    NEYNAR_API_KEY: process.env.NEYNAR_API_KEY ? "✓ set" : "✗ MISSING",
    // Detect if secret key looks like anon key (both present = likely swapped)
    KEY_TYPE_HINT: secretKey.startsWith("sb_secret_") ? "✓ looks like service key"
      : secretKey.startsWith("sb_publishable_") ? "✗ THIS IS ANON KEY — keys are swapped!"
      : secretKey.length > 100 ? "✓ looks like JWT service key"
      : "⚠ unknown format",
  };

  // 2. Test Supabase connection via supabase-js — dump FULL error object
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("profiles").select("fid").limit(1);
    results.supabase_js = error
      ? {
          status: "✗ error",
          message: error.message,
          code: error.code,      // e.g. 42501 = insufficient_privilege (GRANT issue)
          details: error.details,
          hint: error.hint,
        }
      : { status: "✓ connected", rows: data?.length ?? 0 };
  } catch (e) {
    results.supabase_js = `✗ threw: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 2b. Raw REST call — shows HTTP status + raw PostgREST body + which role it resolved
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=fid&limit=1`;
    const raw = await fetch(url, {
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
      },
    });
    const body = await raw.text();
    results.supabase_raw = {
      query: "SELECT fid FROM public.profiles LIMIT 1",
      http_status: raw.status,                       // 200 ok, 401 bad key, 403/permission denied
      role_resolved: raw.headers.get("content-profile") ?? "(none)",
      body: body.slice(0, 500),
    };
  } catch (e) {
    results.supabase_raw = `✗ threw: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Test FID parsing regex
  const sampleMessage = `farcaster-dating.vercel.app wants you to sign in with your Ethereum account\n\nURI: https://farcaster-dating.vercel.app\nVersion: 1\nChain ID: 10\nNonce: abc123\n\nResources:\n- farcaster://fid/99\n- https://farcaster-dating.vercel.app`;
  const fidMatch = sampleMessage.match(/farcaster:\/\/fid\/(\d+)/);
  results.fidRegex = fidMatch ? `✓ parsed FID ${fidMatch[1]}` : "✗ no match";

  // 4. Test Neynar
  try {
    const nRes = await fetch("https://api.neynar.com/v2/farcaster/user/bulk?fids=3", {
      headers: { api_key: process.env.NEYNAR_API_KEY ?? "" },
    });
    const nData = await nRes.json();
    results.neynar = nRes.ok
      ? `✓ ${nData.users?.[0]?.username ?? "no username"}`
      : `✗ ${nData.message ?? nRes.status}`;
  } catch (e) {
    results.neynar = `✗ ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(results, { status: 200 });
}
