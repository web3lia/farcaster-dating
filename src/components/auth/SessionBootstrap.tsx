"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@/components/layout/FrameProvider";
import { useAuthStore } from "@/store/auth";
import { performSignIn, hasSupabaseSession } from "@/lib/auth/signInFlow";

/**
 * Ensures a Supabase Auth session exists for already-authenticated users.
 *
 * Users who signed in before sessions existed have `isAuthenticated` in the
 * persisted store but no Supabase session, so RLS-protected realtime/reads
 * would fail. On load, if we're authenticated in-frame but have no Supabase
 * session, silently re-run SIWF to mint one. Runs at most once per mount.
 */
export function SessionBootstrap() {
  const { isReady, context } = useFrame();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (!isReady || !context?.user?.fid || !isAuthenticated) return;
    ranRef.current = true;

    (async () => {
      try {
        if (await hasSupabaseSession()) return; // already has a session
        await performSignIn(); // silent re-auth to mint the session
      } catch {
        /* non-blocking — app still works via the service-key API */
      }
    })();
  }, [isReady, context, isAuthenticated]);

  return null;
}
