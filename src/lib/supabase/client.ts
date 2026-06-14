import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton browser client. We keep the session purely IN MEMORY
// (persistSession: false): the Warpcast mini-app webview's localStorage/cookies
// are unreliable — writes can throw and break setSession, and storage may be
// cleared between opens. An in-memory singleton holds the session for the
// lifetime of the app open (shared across client navigation); it's
// re-established on demand by ensureAccessToken when missing. autoRefreshToken
// keeps the in-memory token fresh.
let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: true,
        },
      }
    );
  }
  return client;
}
