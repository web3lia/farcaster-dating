import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton browser client with localStorage persistence. We intentionally do
// NOT use @supabase/ssr's cookie-based createBrowserClient: in the Warpcast
// mini-app webview cookies don't reliably round-trip, so the session would be
// written but never read back (breaking authFetch + RLS realtime). A single
// shared instance keeps the session in memory across client navigation, and
// localStorage persists it across reloads.
let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "farcaster-dating-supabase-auth",
        },
      }
    );
  }
  return client;
}
