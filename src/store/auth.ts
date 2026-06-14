import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types";

interface AuthState {
  fid: number | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  onboarded: boolean;
  // Supabase JWTs held in our own (working) persisted store, not GoTrue's
  // session storage — the Warpcast webview doesn't reliably keep GoTrue sessions.
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (fid: number, profile: Profile) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setOnboarded: (value: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      fid: null,
      profile: null,
      isAuthenticated: false,
      onboarded: false,
      accessToken: null,
      refreshToken: null,
      setAuth: (fid, profile) =>
        set({ fid, profile, isAuthenticated: true }),
      updateProfile: (partial) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...partial } : null,
        })),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setOnboarded: (value) => set({ onboarded: value }),
      signOut: () =>
        set({
          fid: null,
          profile: null,
          isAuthenticated: false,
          onboarded: false,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    { name: "farcaster-dating-auth" }
  )
);
