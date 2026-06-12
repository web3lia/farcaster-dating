import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types";

interface AuthState {
  fid: number | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  setAuth: (fid: number, profile: Profile) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      fid: null,
      profile: null,
      isAuthenticated: false,
      setAuth: (fid, profile) =>
        set({ fid, profile, isAuthenticated: true }),
      updateProfile: (partial) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...partial } : null,
        })),
      signOut: () =>
        set({ fid: null, profile: null, isAuthenticated: false }),
    }),
    { name: "farcaster-dating-auth" }
  )
);
