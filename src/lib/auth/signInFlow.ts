import sdk from "@farcaster/frame-sdk";
import { useAuthStore } from "@/store/auth";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Full SIWF sign-in: nonce → sdk.signIn → server verify → store profile + JWTs.
 * We keep the Supabase JWTs in our own persisted Zustand store (GoTrue's session
 * storage is unreliable in the Warpcast webview). Throws on failure.
 */
export async function performSignIn(): Promise<{ fid: number }> {
  const nonceRes = await fetch("/api/auth/nonce");
  const { nonce } = await nonceRes.json();

  const { message, signature } = await sdk.actions.signIn({ nonce });

  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `signin ${res.status}`);
  }

  const { profile, session } = await res.json();
  if (!session?.access_token || !session?.refresh_token) {
    throw new Error("no session in signin response");
  }

  useAuthStore.getState().setAuth(profile.fid, profile);
  useAuthStore.getState().setTokens(session.access_token, session.refresh_token);
  return { fid: profile.fid };
}

// Coalesce concurrent sign-ins into one SIWF flow.
let inflightSignIn: Promise<void> | null = null;

/** Refresh the access token using the stored refresh token (no user prompt). */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: PUBLISHABLE, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token) return null;
    useAuthStore.getState().setTokens(data.access_token, data.refresh_token ?? refreshToken);
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Return a usable access token, establishing a session via SIWF if we don't
 * have one yet. Null only if SIWF doesn't complete.
 */
export async function ensureAccessToken(): Promise<string | null> {
  const current = useAuthStore.getState().accessToken;
  if (current) return current;

  if (!inflightSignIn) {
    inflightSignIn = performSignIn()
      .then(() => undefined)
      .catch((err) => {
        // Surface sign-in errors so they're visible in the swipe page toast
        console.error("[ensureAccessToken] performSignIn failed:", err?.message ?? err);
        lastSignInError = err?.message ?? "sign-in failed";
      })
      .finally(() => {
        inflightSignIn = null;
      });
  }
  await inflightSignIn;
  return useAuthStore.getState().accessToken;
}

// Last sign-in error message, readable by callers for display purposes.
let lastSignInError: string | null = null;
export function takeLastSignInError(): string | null {
  const e = lastSignInError;
  lastSignInError = null;
  return e;
}
