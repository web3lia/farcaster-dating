import { ensureAccessToken, refreshAccessToken, performSignIn } from "@/lib/auth/signInFlow";
import { useAuthStore } from "@/store/auth";

const RETRY_DELAYS = [300, 800];

function send(input: RequestInfo | URL, init: RequestInit, token: string | null) {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function sendWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  token: string | null
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await send(input, init, token);
    } catch (e) {
      if (!isNetworkError(e)) throw e; // non-network throw — don't retry
      lastErr = e;
      if (attempt < RETRY_DELAYS.length) await sleep(RETRY_DELAYS[attempt]);
    }
  }
  throw new Error("Network error, please try again");
}

/**
 * fetch() that attaches the user's Supabase access token (held in our store) so
 * RLS-protected API routes can authenticate the caller. Establishes a session
 * on demand if missing; on a 401 it transparently refreshes (or re-signs-in)
 * once and retries. Network failures are retried up to 2× before throwing.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  let token = await ensureAccessToken();
  let res = await sendWithRetry(input, init, token);
  if (res.status !== 401) return res;

  // Token rejected/expired — refresh silently, else re-sign-in, then retry once.
  token = await refreshAccessToken();
  if (!token) {
    try {
      await performSignIn();
    } catch {
      /* leave token null */
    }
    token = useAuthStore.getState().accessToken;
  }
  if (!token) return res; // give up; caller surfaces the 401
  res = await sendWithRetry(input, init, token);
  return res;
}
