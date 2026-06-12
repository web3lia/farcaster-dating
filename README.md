# 💜 Farcaster Dating

Tinder-like dating app built on Farcaster — swipe, match and chat with users from the Farcaster social network. Runs as a **Farcaster Mini App (Frames v2)**.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | `@farcaster/auth-kit` (SIWF) |
| Mini App | `@farcaster/frame-sdk` (Frames v2) |
| Animations | Framer Motion |
| State | Zustand |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing / Sign-in
│   ├── swipe/page.tsx        # Card stack with swipe
│   ├── matches/page.tsx      # Match list
│   ├── chat/[matchId]/       # Real-time chat
│   ├── profile/page.tsx      # Edit profile
│   └── api/
│       ├── auth/signin/      # Upsert profile on sign-in
│       ├── profiles/         # GET discovery list, PATCH profile
│       ├── swipes/           # POST swipe + match detection
│       ├── matches/          # GET user matches
│       ├── messages/         # GET + POST messages
│       └── webhooks/farcaster/  # Frame events
├── components/
│   ├── auth/SignInPage.tsx
│   ├── swipe/SwipeCard.tsx   # Draggable card with Framer Motion
│   ├── swipe/SwipeActions.tsx
│   ├── swipe/MatchModal.tsx
│   └── layout/{BottomNav, Providers, FrameProvider}
├── lib/
│   ├── supabase/{client,server}.ts
│   └── farcaster/neynar.ts
├── store/{auth,swipe}.ts     # Zustand stores
└── types/index.ts
supabase/schema.sql           # Full DB schema + RLS policies
```

## Quick Start

### 1. Install Node.js & dependencies

```bash
# Install Node 20+ via nvm or brew
brew install node@20
npm install
```

### 2. Set up environment

```bash
cp .env.local.example .env.local
# Fill in:
# - NEXT_PUBLIC_SUPABASE_URL + keys (supabase.com → new project)
# - NEYNAR_API_KEY (neynar.com → free tier)
# - NEXT_PUBLIC_APP_URL (ngrok tunnel or Vercel URL)
```

### 3. Create Supabase tables

In the Supabase dashboard → SQL Editor, run:

```sql
-- paste contents of supabase/schema.sql
```

### 4. Run locally

```bash
npm run dev
# App at http://localhost:3000
```

For Mini App testing use ngrok:
```bash
ngrok http 3000
# Use the https URL as NEXT_PUBLIC_APP_URL
```

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Set env vars in Vercel dashboard, then register your Mini App at:
**https://farcaster.xyz/~/developers**

## Key Features

- **SIWF Auth** — one-click sign-in with Farcaster wallet (no passwords)
- **Swipe deck** — drag cards left/right/up (nope/like/superlike) with spring physics
- **Mutual match** — PostgreSQL function detects mutual likes server-side
- **Match modal** — animated pop-up when a match is created
- **Real-time chat** — Supabase Realtime subscriptions for instant messages
- **Farcaster Mini App** — `/.well-known/farcaster.json` manifest for Frame v2 embedding

## Database

Matches are detected via a PostgreSQL function `check_and_create_match` called on every like. RLS policies restrict each user to only their own data.

Realtime is enabled on the `messages` table — the chat page subscribes via Supabase channel.
