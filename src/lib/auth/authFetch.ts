import { createClient } from "@/lib/supabase/client";

/**
 * fetch() that attaches the user's Supabase access token as a Bearer header so
 * RLS-protected API routes can authenticate the caller. Briefly waits for the
 * session on first load (the SessionBootstrap may still be establishing it);
 * on returning loads the session is already cached, so there's no delay.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();

  let token: string | undefined;
  for (let i = 0; i < 20; i++) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
    if (token) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
