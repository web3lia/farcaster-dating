export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  verifications: string[];
  activeStatus: "active" | "inactive";
}

export type Intent = "romance" | "friendship" | "networking";

export type TradingStyle =
  | "meme_trader" | "nft_collector" | "degen" | "arbitrage"
  | "whale_watcher" | "diamond_hands" | "defi_farmer" | "builder";

export type RiskProfile = "hodl_chill" | "calculated" | "ape_in" | "full_degen" | "gigachad";

export interface Profile {
  id: string;
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  bio: string;
  follower_count: number;
  following_count: number;
  age?: number;
  gender?: string;
  looking_for?: string;
  interests: string[];
  location?: string;
  show_in_discovery: boolean;
  intents: Intent[];
  trading_style: TradingStyle[];
  risk_profile?: RiskProfile;
  about: string;
  prompt_answer: string;
  created_at: string;
  updated_at: string;
}

export interface Swipe {
  id: string;
  swiper_fid: number;
  swiped_fid: number;
  direction: "like" | "nope" | "superlike";
  created_at: string;
}

export interface Match {
  id: string;
  user1_fid: number;
  user2_fid: number;
  created_at: string;
  user1?: Profile;
  user2?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  match_id: string;
  sender_fid: number;
  content: string;
  type: "text" | "image" | "cast_embed";
  read: boolean;
  created_at: string;
  sender?: Profile;
}

export type SwipeDirection = "left" | "right" | "up";

export interface SwipeCardProps {
  profile: Profile;
  onSwipe: (fid: number, direction: SwipeDirection) => void;
  isTop: boolean;
  zIndex: number;
}
