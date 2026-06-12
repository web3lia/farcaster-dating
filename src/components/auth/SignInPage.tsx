"use client";

import { SignInButton, useProfile } from "@farcaster/auth-kit";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import toast from "react-hot-toast";

export function SignInPage() {
  const router = useRouter();
  const { isAuthenticated: storeAuth } = useAuthStore();
  const { isAuthenticated, profile } = useProfile();

  useEffect(() => {
    if (storeAuth) router.replace("/swipe");
  }, [storeAuth, router]);

  async function handleSuccess(data: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    bio: string;
    verifications: string[];
  }) {
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Sign-in failed");
      const { profile } = await res.json();
      useAuthStore.getState().setAuth(data.fid, profile);
      router.replace("/swipe");
    } catch {
      toast.error("Sign-in failed. Please try again.");
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
        <div className="w-full flex flex-col items-center gap-4">
          <SignInButton
            onSuccess={({ fid, username, displayName, pfpUrl, bio, verifications }) =>
              handleSuccess({ fid: fid!, username: username!, displayName: displayName!, pfpUrl: pfpUrl!, bio: bio!, verifications: verifications! })
            }
            onError={(err) => toast.error((err as { message?: string })?.message ?? "Sign-in error")}
          />
          <p className="text-xs text-gray-500 text-center">
            By signing in you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
