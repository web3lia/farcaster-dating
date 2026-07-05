"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

const MAX_CHARS = 140;

interface Props {
  profile: Profile;
  onSend: (message: string) => void;
  onCancel: () => void;
}

export function SuperlikeModal({ profile, onSend, onCancel }: Props) {
  const [message, setMessage] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      onClick={onCancel}
    >
      <div
        className="bg-surface border border-ui-border rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold/60 shadow-lg shadow-gold/10">
            <Avatar src={profile.pfp_url} alt={profile.display_name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-mono text-gold font-semibold uppercase tracking-wider">⭐ Super Like</p>
            <h2 className="text-xl font-mono font-bold text-ink mt-0.5">{profile.display_name}</h2>
          </div>
        </div>

        {/* Message textarea */}
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Add a message… (optional)"
            rows={3}
            className="w-full bg-terminal-bg border border-ui-border text-ink placeholder-ink-muted/60 rounded-lg px-4 py-3 text-sm font-sans outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors resize-none leading-relaxed"
          />
          <span className={`absolute bottom-2.5 right-3 text-xs font-mono ${message.length >= MAX_CHARS ? "text-danger" : "text-ink-muted"}`}>
            {MAX_CHARS - message.length}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="superlike" size="md" className="flex-1" showPrefix onClick={() => onSend(message.trim())}>
            Send superlike
          </Button>
        </div>
      </div>
    </div>
  );
}
