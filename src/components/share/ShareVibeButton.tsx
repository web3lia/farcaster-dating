"use client";

import { openCastComposer } from "@/lib/openCastComposer";
import { INTENT_MAP } from "@/lib/intents";
import { tradingStyleMeta, riskProfileMeta } from "@/lib/crypto";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

function buildCastText(profile: Pick<Profile, "intents" | "trading_style" | "risk_profile">): string {
  const parts: string[] = [];

  const riskMeta = profile.risk_profile ? riskProfileMeta(profile.risk_profile) : null;
  const tradingMetas = (profile.trading_style ?? [])
    .slice(0, 2)
    .map(tradingStyleMeta)
    .filter(Boolean);
  const intentMetas = (profile.intents ?? [])
    .slice(0, 2)
    .map((id) => INTENT_MAP[id])
    .filter(Boolean);

  const identityParts: string[] = [];
  if (riskMeta) identityParts.push(`${riskMeta.emoji} ${riskMeta.label}`);
  tradingMetas.forEach((m) => m && identityParts.push(`${m.emoji} ${m.label}`));

  if (identityParts.length > 0) {
    parts.push(`I'm a ${identityParts.join(", ")}`);
  }

  if (intentMetas.length > 0) {
    const intentStr = intentMetas.map((m) => `${m.emoji} ${m.label}`).join(" & ");
    parts.push(`Looking for ${intentStr} on Onlyfrens 💜`);
  } else {
    parts.push("Looking for connections on Onlyfrens 💜");
  }

  parts.push("\nFind your Farcaster match 👇");

  return parts.join("\n");
}

interface Props {
  profile: Pick<Profile, "intents" | "trading_style" | "risk_profile">;
  onAfter?: () => void;
  className?: string;
}

export function ShareVibeButton({ profile, onAfter, className }: Props) {
  async function handleClick() {
    await openCastComposer(buildCastText(profile));
    onAfter?.();
  }

  return (
    <Button
      onClick={handleClick}
      variant="primary"
      size="md"
      showPrefix
      className={className}
    >
      Share my vibe
    </Button>
  );
}
