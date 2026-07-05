"use client";

import sdk from "@farcaster/frame-sdk";
import type { Profile } from "@/types";

interface Props {
  profile: Profile;
  onViewCard: () => void;
  onClose: () => void;
}

export function ProfileChooser({ profile, onViewCard, onClose }: Props) {
  function openWarpcast() {
    sdk.actions.openUrl(`https://warpcast.com/${profile.username}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full bg-surface border-t border-ui-border rounded-t-2xl px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-ui-border mx-auto mb-4" />

        <p className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-3">
          {profile.display_name}
        </p>

        <button
          onClick={() => { onViewCard(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-ui-border text-left hover:bg-white/10 transition-colors"
        >
          <span className="text-xl">🪪</span>
          <div>
            <p className="font-mono font-semibold text-ink text-sm">View card</p>
            <p className="text-xs text-ink-muted font-mono">See their full Onlyfrens profile</p>
          </div>
        </button>

        <button
          onClick={openWarpcast}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-ui-border text-left hover:bg-white/10 transition-colors"
        >
          <span className="text-xl">🟣</span>
          <div>
            <p className="font-mono font-semibold text-ink text-sm">Open in Farcaster</p>
            <p className="text-xs text-ink-muted font-mono">View @{profile.username} on Warpcast</p>
          </div>
        </button>
      </div>
    </div>
  );
}
