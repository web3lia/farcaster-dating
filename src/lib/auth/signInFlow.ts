import sdk from "@farcaster/frame-sdk";
import { useAuthStore } from "@/store/auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Full SIWF sign-in: nonce → sdk.signIn → server verify → store profile + JWTs.
 * Supabase JWTs are stored in our persisted Zustand store rather than GoTrue's
 * session storage, which is unreliable in the Warpcast webview.
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

// Coalesces concurrent sign-in attempts into a single SIWF flow.
let inflightSignIn: Promise<void> | null = null;

/** Silently refreshes the access token using the stored refresh token. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
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
 * Returns a usable access token. Triggers a SIWF sign-in if none is stored.
 * Returns null only if sign-in fails or is dismissed.
 */
export async function ensureAccessToken(): Promise<string | null> {
  const current = useAuthStore.getState().accessToken;
  if (current) return current;

  if (!inflightSignIn) {
    inflightSignIn = performSignIn()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        inflightSignIn = null;
      });
  }
  await inflightSignIn;
  return useAuthStore.getState().accessToken;
}
