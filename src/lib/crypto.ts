import type { TradingStyle, RiskProfile } from "@/types";

export const TRADING_STYLES: { id: TradingStyle; emoji: string; label: string }[] = [
  { id: "meme_trader",   emoji: "🐸", label: "Meme trader"   },
  { id: "nft_collector", emoji: "🖼",  label: "NFT collector" },
  { id: "degen",         emoji: "⚡️", label: "Degen"         },
  { id: "arbitrage",     emoji: "📊", label: "Arbitrage"     },
  { id: "whale_watcher", emoji: "🐋", label: "Whale watcher" },
  { id: "diamond_hands", emoji: "💎", label: "Diamond hands" },
  { id: "defi_farmer",   emoji: "🌾", label: "DeFi farmer"   },
  { id: "builder",       emoji: "🏗",  label: "Builder"       },
];

export const RISK_PROFILES: { id: RiskProfile; emoji: string; label: string }[] = [
  { id: "hodl_chill",  emoji: "🧘", label: "HODL & chill" },
  { id: "calculated",  emoji: "📊", label: "Calculated"   },
  { id: "ape_in",      emoji: "🦧", label: "Ape in"       },
  { id: "full_degen",  emoji: "🎰", label: "Full degen"   },
  { id: "gigachad",    emoji: "🧠", label: "Gigachad"     },
];

export function tradingStyleMeta(id: TradingStyle) {
  return TRADING_STYLES.find((s) => s.id === id);
}

export function riskProfileMeta(id: RiskProfile) {
  return RISK_PROFILES.find((r) => r.id === id);
}
