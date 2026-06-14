import sdk from "@farcaster/frame-sdk";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";

/**
 * Full SIWF sign-in: nonce → sdk.signIn → server verify → set store + Supabase
 * session. Shared by the sign-in screen and the session bootstrap (returning
 * users who have a persisted store but no Supabase session yet).
 *
 * Returns the verified fid. Throws on failure (caller decides how to surface).
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
    throw new Error(data.error ?? "Sign-in failed");
  }

  const { profile, session } = await res.json();
  useAuthStore.getState().setAuth(profile.fid, profile);

  if (session?.access_token && session?.refresh_token) {
    try {
      await createClient().auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } catch {
      /* non-blocking — store auth still set */
    }
  }

  return { fid: profile.fid };
}

/** True if the browser currently has an active Supabase Auth session. */
export async function hasSupabaseSession(): Promise<boolean> {
  const { data } = await createClient().auth.getSession();
  return !!data.session;
}

// Shared in-flight sign-in so concurrent callers (multiple authFetch + the
// bootstrap) trigger at most one SIWF flow.
let inflightSignIn: Promise<void> | null = null;

/**
 * Return a valid access token, establishing a Supabase session via SIWF if one
 * isn't present (webview storage can be cleared between opens). Self-healing:
 * an authenticated API call will mint the session on demand. Null if SIWF
 * doesn't complete (e.g. the user dismisses the prompt).
 */
export async function ensureAccessToken(): Promise<string | null> {
  const supabase = createClient();

  const existing = await supabase.auth.getSession();
  if (existing.data.session) return existing.data.session.access_token;

  if (!inflightSignIn) {
    inflightSignIn = performSignIn()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        inflightSignIn = null;
      });
  }
  await inflightSignIn;

  const after = await supabase.auth.getSession();
  return after.data.session?.access_token ?? null;
}
