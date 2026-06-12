"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import Image from "next/image";
import type { Profile, SwipeDirection } from "@/types";
import { MapPin as MapPinIcon } from "lucide-react";

const SWIPE_THRESHOLD = 100;

interface Props {
  profile: Profile;
  onSwipe: (fid: number, direction: SwipeDirection) => void;
  isTop: boolean;
  zIndex: number;
}

export function SwipeCard({ profile, onSwipe, isTop, zIndex }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const superlikeOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const [expanded, setExpanded] = useState(false);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe(profile.fid, "right");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe(profile.fid, "left");
    } else if (info.offset.y < -SWIPE_THRESHOLD) {
      onSwipe(profile.fid, "up");
    } else {
      x.set(0);
      y.set(0);
    }
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing drag-none"
      style={{ x, y, rotate, zIndex }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gray-800">
        {/* Photo */}
        <Image
          src={profile.pfp_url || "/placeholder-pfp.png"}
          alt={profile.display_name}
          fill
          className="object-cover"
          draggable={false}
          priority={isTop}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* LIKE badge */}
        <motion.div
          className="absolute top-10 left-6 rotate-[-20deg] border-4 border-like text-like font-black text-3xl px-3 py-1 rounded-lg"
          style={{ opacity: likeOpacity }}
        >
          LIKE
        </motion.div>

        {/* NOPE badge */}
        <motion.div
          className="absolute top-10 right-6 rotate-[20deg] border-4 border-nope text-nope font-black text-3xl px-3 py-1 rounded-lg"
          style={{ opacity: nopeOpacity }}
        >
          NOPE
        </motion.div>

        {/* SUPER badge */}
        <motion.div
          className="absolute top-10 left-1/2 -translate-x-1/2 border-4 border-blue-400 text-blue-400 font-black text-3xl px-3 py-1 rounded-lg"
          style={{ opacity: superlikeOpacity }}
        >
          SUPER
        </motion.div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold leading-tight">
                {profile.display_name}
                {profile.age && <span className="font-normal text-xl ml-2">{profile.age}</span>}
              </h2>
              <p className="text-gray-300 text-sm">@{profile.username}</p>
              {profile.location && (
                <p className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                  <MapPinIcon className="w-3 h-3" />
                  {profile.location}
                </p>
              )}
            </div>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0"
            >
              {expanded ? "↑" : "↓"}
            </button>
          </div>

          {expanded && (
            <div className="mt-3 space-y-2 animate-fade-up">
              {profile.bio && (
                <p className="text-sm text-gray-200 line-clamp-3">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-white/20 rounded-full px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>👥 {profile.follower_count.toLocaleString()} followers</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
