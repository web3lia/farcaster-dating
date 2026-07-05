"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { Profile, SwipeDirection } from "@/types";
import { ProfileCardBody } from "@/components/profile/ProfileCardBody";

const SWIPE_THRESHOLD = 100;
// Name overlay sits above SwipeActions (4rem nav + safe area + ~5.5rem buttons + 0.5rem gap)
const NAME_BOTTOM = "calc(4rem + env(safe-area-inset-bottom) + 6rem)";
// Info block clears SwipeActions fully
const INFO_PB = "calc(4rem + env(safe-area-inset-bottom) + 7rem)";

interface Props {
  profile: Profile;
  onSwipe: (fid: number, direction: SwipeDirection) => void;
  isTop: boolean;
  zIndex: number;
}

export function SwipeCard({ profile, onSwipe, isTop, zIndex }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledDown, setScrolledDown] = useState(false);
  const [photoH, setPhotoH] = useState(0);

  useLayoutEffect(() => {
    if (scrollRef.current) setPhotoH(scrollRef.current.clientHeight);
  }, []);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe(profile.fid, "right");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe(profile.fid, "left");
    } else {
      x.set(0);
    }
  }

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
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing drag-none"
      style={{ x, rotate, zIndex }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gray-900">
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

        {/* LIKE / NOPE badges — outside scroll, overlaid on card */}
        <motion.div
          className="absolute top-10 left-6 rotate-[-20deg] border-4 border-like text-like font-black text-3xl px-3 py-1 rounded-lg pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          LIKE
        </motion.div>
        <motion.div
          className="absolute top-10 right-6 rotate-[20deg] border-4 border-nope text-nope font-black text-3xl px-3 py-1 rounded-lg pointer-events-none"
          style={{ opacity: nopeOpacity }}
        >
          NOPE
        </motion.div>
      </div>
    </motion.div>
  );
}
