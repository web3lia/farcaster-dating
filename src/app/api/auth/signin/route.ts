import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifySiwf, parseNonce } from "@/lib/farcaster/verify";
import { mintSessionForFid } from "@/lib/supabase/session";

const NONCE_TTL_MS = 10 * 60 * 1000;

async function fetchNeynarProfile(fid: number) {
  if (!process.env.NEYNAR_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      { headers: { api_key: process.env.NEYNAR_API_KEY } }
    );
    const data = await res.json();
    return data.users?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, signature } = body;

  // SIWF proof is required — the client-supplied fid is no longer trusted.
  if (!message || !signature) {
    return NextResponse.json({ error: "message and signature required" }, { status: 401 });
  }

  const nonce = parseNonce(message);
  if (!nonce) {
    return NextResponse.json({ error: "Missing nonce" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Consume the nonce (single-use, must be one we issued within the TTL).
  // The atomic delete-returning prevents replay: a second attempt finds nothing.
  const { data: consumed } = await supabase
    .from("auth_nonces")
    .delete()
    .eq("nonce", nonce)
    .gt("created_at", new Date(Date.now() - NONCE_TTL_MS).toISOString())
    .select();

  if (!consumed || consumed.length === 0) {
    return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 401 });
  }

  // Cryptographically verify the signature → trusted fid.
  const result = await verifySiwf({ message, signature, nonce });
  if (!result.success || !result.fid) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }
  const fid = result.fid;

  // Build profile: try Neynar first, fall back to minimal data
  const u = await fetchNeynarProfile(fid);
  const profileData = {
    fid,
    username: u?.username ?? `fid_${fid}`,
    display_name: u?.display_name ?? `Farcaster User`,
    pfp_url: u?.pfp_url ?? "",
    bio: u?.profile?.bio?.text ?? "",
    follower_count: u?.follower_count ?? 0,
    following_count: u?.following_count ?? 0,
  };

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "fid" })
    .select()
    .single();

  if (error) {
    console.error("upsert profile error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stage 2: mint a Supabase Auth session carrying fid in the JWT. Best-effort
  // and not yet enforced — if it's null the app still works via the service-key
  // API routes exactly as before.
  const session = await mintSessionForFid(fid);

  return NextResponse.json({ profile, session });
}
