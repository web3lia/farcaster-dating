"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFrame } from "@/components/layout/FrameProvider";
import { useAuthStore } from "@/store/auth";
import { performSignIn } from "@/lib/auth/signInFlow";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, onboarded } = useAuthStore();
  const { isReady, context } = useFrame();
  const [loading, setLoading] = useState(false);

  const isInFrame = !!context?.user?.fid;

  // New users (not yet onboarded) go through the intent onboarding first
  const destAfterAuth = onboarded ? "/swipe" : "/onboarding";

  useEffect(() => {
    if (isAuthenticated) router.replace(destAfterAuth);
  }, [isAuthenticated, router, destAfterAuth]);

  // Auto sign-in if SDK already has the user context (returning user in Warpcast)
  useEffect(() => {
    if (isReady && isInFrame && !isAuthenticated) {
      handleSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isInFrame]);

  async function handleSignIn() {
    if (!isReady) {
      toast.error("SDK not ready yet, please wait…");
      return;
    }
    setLoading(true);
    try {
      await performSignIn();
      router.replace(destAfterAuth);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("rejected") || msg.includes("cancel") || msg.includes("denied")) {
        toast.error("Sign-in cancelled");
      } else if (msg.includes("not supported") || msg.includes("undefined")) {
        toast.error("Open this app inside Warpcast to sign in");
      } else {
        toast.error(msg || "Sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="text-center">
          <img src="/onlyfrens_mascot_green.png" alt="Onlyfrens" className="w-20 h-20 mb-4 mx-auto" />
          <h1 className="text-3xl font-mono font-bold text-ink">Onlyfrens</h1>
          <p className="text-ink-muted mt-2 text-sm font-mono">
            Find your match in the Farcaster universe
          </p>
        </div>

        {/* Features */}
        <div className="w-full bg-surface border border-ui-border rounded-2xl p-5 space-y-3">
          {[
            ["💜", "Swipe profiles from your network"],
            ["✨", "Mutual likes create a match"],
            ["💬", "Chat privately with your matches"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl shrink-0">{icon}</span>
              <span className="text-sm font-mono text-ink">{text}</span>
            </div>
          ))}
        </div>

        {/* Sign In */}
        <div className="w-full flex flex-col items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSignIn}
            disabled={loading || !isReady}
          >
            {!isReady ? (
              <>
                <span className="w-4 h-4 border-2 border-acid/30 border-t-acid rounded-full animate-spin" />
                Loading…
              </>
            ) : loading ? (
              <>
                <span className="w-4 h-4 border-2 border-acid/30 border-t-acid rounded-full animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <span className="opacity-70">›</span>
                Sign in with Farcaster
              </>
            )}
          </Button>

          {isReady && !isInFrame && (
            <p className="text-xs font-mono text-gold text-center px-2">
              ⚠️ Open this app inside Warpcast for sign-in to work
            </p>
          )}

          <p className="text-xs font-mono text-ink-muted text-center">
            By signing in you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
