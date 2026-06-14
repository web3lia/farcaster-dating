"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFrame } from "@/components/layout/FrameProvider";
import { useAuthStore } from "@/store/auth";
import { performSignIn } from "@/lib/auth/signInFlow";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="text-center">
          <div className="text-7xl mb-4">💜</div>
          <h1 className="text-3xl font-bold text-white">Farcaster Dating</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Find your match in the Farcaster universe
          </p>
        </div>

        {/* Features */}
        <ul className="w-full space-y-3 text-sm text-gray-300">
          {[
            ["💜", "Swipe profiles from your network"],
            ["✨", "Mutual likes create a match"],
            ["💬", "Chat privately with your matches"],
          ].map(([icon, text]) => (
            <li key={text} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* Sign In */}
        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={handleSignIn}
            disabled={loading || !isReady}
            className="w-full py-4 px-6 bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-3"
          >
            {!isReady ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading…
              </>
            ) : loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <span className="text-xl">⟡</span>
                Sign in with Farcaster
              </>
            )}
          </button>

          {isReady && !isInFrame && (
            <p className="text-xs text-amber-400 text-center px-2">
              ⚠️ Open this app inside Warpcast for sign-in to work
            </p>
          )}

          <p className="text-xs text-gray-500 text-center">
            By signing in you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
