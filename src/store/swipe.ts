import { create } from "zustand";
import type { Profile, Match } from "@/types";

interface SwipeState {
  stack: Profile[];
  currentMatch: Match | null;
  setStack: (profiles: Profile[]) => void;
  removeTop: () => void;
  setCurrentMatch: (match: Match | null) => void;
}

export const useSwipeStore = create<SwipeState>((set) => ({
  stack: [],
  currentMatch: null,
  setStack: (profiles) => set({ stack: profiles }),
  removeTop: () => set((s) => ({ stack: s.stack.slice(1) })),
  setCurrentMatch: (match) => set({ currentMatch: match }),
}));
