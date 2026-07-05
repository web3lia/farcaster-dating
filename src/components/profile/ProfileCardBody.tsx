"use client";

import { RefObject } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { Profile } from "@/types";
import { MapPin as MapPinIcon } from "lucide-react";
import { intentsToMetas, PROMPT_SHORT } from "@/lib/intents";
import { tradingStyleMeta, riskProfileMeta } from "@/lib/crypto";

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="border-t border-ui-border pt-4">
      <p className="text-[10px] font-mono text-ink-muted uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}

interface Props {
  profile: Profile;
  scrollRef: RefObject<HTMLDivElement>;
  photoH: number;
  scrolledDown: boolean;
  onScroll: (scrollTop: number) => void;
  onExpandToggle: () => void;
  /** CSS value for the bottom offset of the name overlay */
  nameOverlayBottom: string;
  /** CSS value for padding-bottom of the info block */
  infoPb: string;
}

export function ProfileCardBody({
  profile,
  scrollRef,
  photoH,
  scrolledDown,
  onScroll,
  onExpandToggle,
  nameOverlayBottom,
  infoPb,
}: Props) {
  const intentMetas = intentsToMetas(profile.intents);
  const tradingMetas = (profile.trading_style ?? []).slice(0, 3).map(tradingStyleMeta).filter(Boolean);
  const riskMeta = profile.risk_profile ? riskProfileMeta(profile.risk_profile) : null;

  const hasInfo = !!(
    profile.about ||
    profile.bio ||
    profile.prompt_answer ||
    intentMetas.length > 0 ||
    tradingMetas.length > 0 ||
    riskMeta ||
    profile.interests.length > 0
  );

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto"
      style={{ touchAction: "pan-y" }}
      onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
    >
      {/* Photo block */}
      <div className="relative flex-shrink-0" style={{ height: photoH ? `${photoH}px` : "100%" }}>
        <Avatar
          src={profile.pfp_url}
          alt={profile.display_name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Intent badges */}
        <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5">
          {intentMetas.map((meta) => (
            <div
              key={meta.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs font-sans font-semibold shadow-sm"
            >
              <span className="leading-none">{meta.emoji}</span>
              <span>{meta.label}</span>
            </div>
          ))}
        </div>

        {/* Name overlay */}
        <div className="absolute left-0 right-0 px-5 text-white" style={{ bottom: nameOverlayBottom }}>
          {profile.superliked_you && (
            <div className="mb-2 space-y-1.5">
              <div className="superlike-entrance relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-brand-400/40 overflow-hidden pointer-events-none">
                <span className="superlike-shimmer-bg absolute inset-0 rounded-lg" aria-hidden="true" />
                <span className="relative text-base leading-none">💜</span>
                <span className="relative text-brand-200 font-bold text-xs tracking-widest uppercase">Superliked you</span>
              </div>
              {profile.superlike_message && (
                <div
                  className="superlike-entrance border-l-2 border-brand-500 pl-3 py-1 bg-black/40 rounded-r-lg backdrop-blur-sm pointer-events-none max-w-[220px]"
                  style={{ animationDelay: "0.15s" }}
                >
                  <p className="text-sm text-gray-200 italic leading-snug">&ldquo;{profile.superlike_message}&rdquo;</p>
                </div>
              )}
            </div>
          )}
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-mono font-bold leading-tight">
                {profile.display_name}
                {profile.age && <span className="font-normal text-xl ml-2">{profile.age}</span>}
              </h2>
              <p className="text-gray-300 text-sm font-mono">@{profile.username}</p>
              {profile.location && (
                <p className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                  <MapPinIcon className="w-3 h-3" />
                  {profile.location}
                </p>
              )}
            </div>
            {hasInfo && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onExpandToggle}
                className="w-8 h-8 rounded-full bg-[#0A0E0D]/70 border border-white/20 flex items-center justify-center text-ink-muted shrink-0 backdrop-blur-sm"
              >
                {scrolledDown ? "↑" : "↓"}
              </button>
            )}
          </div>
          {profile.about && (
            <p className="mt-2 text-sm text-gray-200 leading-snug line-clamp-2">{profile.about}</p>
          )}
          {profile.prompt_answer && (
            <p className="mt-1.5 text-xs text-gray-300 line-clamp-2">
              <span className="font-semibold text-white">🛠 {PROMPT_SHORT}:</span>{" "}
              {profile.prompt_answer}
            </p>
          )}
        </div>
      </div>

      {/* Info block */}
      {hasInfo && (
        <div className="bg-[#0D1210] px-5 pt-5 space-y-4" style={{ paddingBottom: infoPb }}>
          <div>
            <p className="font-mono font-bold text-ink text-lg">
              {profile.display_name}
              {profile.age && <span className="font-normal text-base ml-2 text-ink-muted">{profile.age}</span>}
            </p>
            <p className="text-xs font-mono text-ink-muted mt-0.5">@{profile.username}</p>
            {profile.location && (
              <p className="flex items-center gap-1 text-ink-muted text-xs mt-0.5">
                <MapPinIcon className="w-3 h-3" />
                {profile.location}
              </p>
            )}
            {profile.follower_count > 0 && (
              <p className="text-xs font-mono text-ink-muted mt-0.5">
                👥 {profile.follower_count.toLocaleString()} followers
              </p>
            )}
          </div>

          <Section label="About">
            {profile.about && <p className="text-sm font-sans text-ink leading-relaxed">{profile.about}</p>}
          </Section>
          <Section label="Bio">
            {profile.bio && <p className="text-sm font-sans text-ink leading-relaxed">{profile.bio}</p>}
          </Section>
          <Section label={PROMPT_SHORT}>
            {profile.prompt_answer && (
              <p className="text-sm font-sans text-ink leading-relaxed">{profile.prompt_answer}</p>
            )}
          </Section>
          <Section label="Here for">
            {intentMetas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {intentMetas.map((meta) => (
                  <span
                    key={meta.id}
                    className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-ink"
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </span>
                ))}
              </div>
            )}
          </Section>
          <Section label="Trading vibe">
            {(tradingMetas.length > 0 || riskMeta) && (
              <div className="flex flex-wrap gap-2">
                {tradingMetas.map(
                  (m) =>
                    m && (
                      <span
                        key={m.id}
                        className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full bg-acid/15 border border-acid/30 text-ink"
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </span>
                    )
                )}
                {riskMeta && (
                  <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold">
                    <span>{riskMeta.emoji}</span>
                    <span>{riskMeta.label}</span>
                  </span>
                )}
              </div>
            )}
          </Section>
          <Section label="Interests">
            {profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((tag) => (
                  <span key={tag} className="text-xs font-mono bg-white/10 text-ink-muted rounded-full px-2.5 py-1">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
