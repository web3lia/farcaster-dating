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
  inviteBannerLastShown: string | null;
  addAppModalLastShown: string | null;
  swipeAddBannerLastShown: string | null;
  frameAdded: boolean;
  setAuth: (fid: number, profile: Profile) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setOnboarded: (value: boolean) => void;
  setInviteBannerLastShown: (date: string) => void;
  setAddAppModalLastShown: (date: string) => void;
  setSwipeAddBannerLastShown: (date: string) => void;
  setFrameAdded: (value: boolean) => void;
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
      inviteBannerLastShown: null,
      addAppModalLastShown: null,
      swipeAddBannerLastShown: null,
      frameAdded: false,
      setAuth: (fid, profile) =>
        set({ fid, profile, isAuthenticated: true }),
      updateProfile: (partial) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...partial } : null,
        })),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setOnboarded: (value) => set({ onboarded: value }),
      setInviteBannerLastShown: (date) => set({ inviteBannerLastShown: date }),
      setAddAppModalLastShown: (date) => set({ addAppModalLastShown: date }),
      setSwipeAddBannerLastShown: (date) => set({ swipeAddBannerLastShown: date }),
      setFrameAdded: (value) => set({ frameAdded: value }),
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
