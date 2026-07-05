"use client";

import { useRef, useState, useLayoutEffect } from "react";
import type { Profile } from "@/types";
import { ProfileCardBody } from "./ProfileCardBody";

// In the modal there are no SwipeActions, so the name overlay only needs to
// clear the safe-area inset (plus a small buffer for readability).
const NAME_BOTTOM = "calc(env(safe-area-inset-bottom) + 2rem)";
const INFO_PB = "calc(env(safe-area-inset-bottom) + 2rem)";

interface Props {
  profile: Profile;
  onClose: () => void;
}

export function ProfileCardModal({ profile, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledDown, setScrolledDown] = useState(false);
  const [photoH, setPhotoH] = useState(0);

  useLayoutEffect(() => {
    if (scrollRef.current) setPhotoH(scrollRef.current.clientHeight);
  }, []);

  function handleExpandToggle() {
    const el = scrollRef.current;
    if (!el) return;
    if (scrolledDown) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: el.clientHeight, behavior: "smooth" });
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end safe-bottom">
      {/* Card fills most of the screen with a small top gap for the close button */}
      <div className="relative w-full" style={{ height: "calc(100dvh - 3rem)" }}>
        {/* Close button — sits above the card in the gap */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-4 w-9 h-9 rounded-full bg-surface border border-ui-border flex items-center justify-center text-ink-muted text-lg z-10"
        >
          ×
        </button>

        <div className="w-full h-full rounded-t-3xl overflow-hidden bg-gray-900">
          <ProfileCardBody
            profile={profile}
            scrollRef={scrollRef}
            photoH={photoH}
            scrolledDown={scrolledDown}
            onScroll={(top) => setScrolledDown(top > 50)}
            onExpandToggle={handleExpandToggle}
            nameOverlayBottom={NAME_BOTTOM}
            infoPb={INFO_PB}
          />
        </div>
      </div>
    </div>
  );
}
