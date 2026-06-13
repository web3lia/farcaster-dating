import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types";

interface AuthState {
  fid: number | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  onboarded: boolean;
  setAuth: (fid: number, profile: Profile) => void;
  updateProfile: (profile: Partial<Profile>) => void;
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
      setAuth: (fid, profile) =>
        set({ fid, profile, isAuthenticated: true }),
      updateProfile: (partial) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...partial } : null,
        })),
      setOnboarded: (value) => set({ onboarded: value }),
      signOut: () =>
        set({ fid: null, profile: null, isAuthenticated: false, onboarded: false }),
    }),
    { name: "farcaster-dating-auth" }
  )
);
