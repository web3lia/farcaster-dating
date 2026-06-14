import { ensureAccessToken } from "@/lib/auth/signInFlow";

/**
 * fetch() that attaches the user's Supabase access token so RLS-protected API
 * routes can authenticate the caller. If no session exists yet (first load, or
 * webview storage was cleared between opens), it establishes one on demand via
 * SIWF before sending the request.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await ensureAccessToken();

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
