import { createClient } from "@supabase/supabase-js";

/**
 * Build a Supabase client scoped to the caller's JWT (forwarded in the
 * Authorization header). Queries run as the authenticated user, so RLS is
 * enforced. Returns the verified fid from the token — never trust a
 * client-supplied fid. Null if there's no valid session.
 */
export async function getAuthedClient(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7); // strip "Bearer "

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  // Pass the token explicitly so GoTrue verifies it via /auth/v1/user;
  // without it, getUser() looks for a stored session (which is always empty
  // on a fresh persistSession:false client) and returns an error.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const fid = (data.user.app_metadata as { fid?: number })?.fid ?? null;
  if (!fid) return null;

  return { supabase, fid };
}
