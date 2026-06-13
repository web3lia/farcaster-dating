export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          fid: number;
          username: string;
          display_name: string;
          pfp_url: string;
          bio: string;
          follower_count: number;
          following_count: number;
          age: number | null;
          gender: string | null;
          looking_for: string | null;
          interests: string[];
          location: string | null;
          show_in_discovery: boolean;
          intent: string;
          about: string;
          prompt_answer: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      swipes: {
        Row: {
          id: string;
          swiper_fid: number;
          swiped_fid: number;
          direction: "like" | "nope" | "superlike";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["swipes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["swipes"]["Insert"]>;
      };
      matches: {
        Row: {
          id: string;
          user1_fid: number;
          user2_fid: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["matches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_fid: number;
          content: string;
          type: "text" | "image" | "cast_embed";
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
    };
  };
}
