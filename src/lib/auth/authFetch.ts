import { ensureAccessToken, refreshAccessToken, performSignIn } from "@/lib/auth/signInFlow";
import { useAuthStore } from "@/store/auth";

function send(input: RequestInfo | URL, init: RequestInit, token: string | null) {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

/**
 * fetch() that attaches the user's Supabase access token (held in our store) so
 * RLS-protected API routes can authenticate the caller. Establishes a session
 * on demand if missing; on a 401 it transparently refreshes (or re-signs-in)
 * once and retries.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  let token = await ensureAccessToken();
  let res = await send(input, init, token);
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
  res = await send(input, init, token);
  return res;
}
