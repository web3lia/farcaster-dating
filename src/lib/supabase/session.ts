import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SECRET = process.env.SUPABASE_SECRET_KEY!;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export interface MintedSession {
  access_token: string;
  refresh_token: string;
}

// Synthetic auth user per fid. The fid goes into app_metadata, which GoTrue
// automatically includes in the JWT — so RLS (Stage 3) can read it without any
// custom Auth Hook.
function emailFor(fid: number) {
  return `fid-${fid}@farcaster.local`;
}

// Deterministic password derived from the server-only secret. Nobody can guess
// it without SUPABASE_SECRET_KEY, and the only way to reach this code path is a
// verified SIWF sign-in (Stage 1).
function passwordFor(fid: number) {
  return createHmac("sha256", SECRET).update(`farcaster-fid-${fid}`).digest("hex");
}

/**
 * Provision (get-or-create) a Supabase Auth user for a verified fid and return
 * a real session (access + refresh). Best-effort: returns null on any failure
 * so sign-in keeps working even if session minting hiccups (Stage 2 is additive
 * and not yet enforced).
 */
export async function mintSessionForFid(fid: number): Promise<MintedSession | null> {
  const email = emailFor(fid);
  const password = passwordFor(fid);

  try {
    // 1. Idempotent create — ignore "already registered"
    const admin = createClient(URL, SECRET, { auth: { persistSession: false } });
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { fid },
    });

    // 2. Exchange credentials for a session
    const authClient = createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      console.error("mintSessionForFid: signIn failed", error?.message);
      return null;
    }
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  } catch (e) {
    console.error("mintSessionForFid error", e instanceof Error ? e.message : e);
    return null;
  }
}
