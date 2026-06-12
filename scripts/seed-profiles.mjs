// Seed the profiles table with real Farcaster users fetched from Neynar.
// Usage: node scripts/seed-profiles.mjs
import { readFileSync } from "fs";

// Load .env.local manually (no dotenv dependency)
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = env.SUPABASE_SECRET_KEY;
const NEYNAR = env.NEYNAR_API_KEY;

if (!SUPABASE_URL || !SECRET || !NEYNAR) {
  console.error("Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, NEYNAR_API_KEY");
  process.exit(1);
}

// Well-known public Farcaster FIDs
const FIDS = [
  3,     // dwr.eth (Dan Romero)
  2,     // v (Varun)
  5650,  // vitalik.eth
  1214,  // df (Dan Finlay)
  99,    // jessepollak (Base)
  1689,  // stephancill
  680,   // woj
  576,   // jacek (degen)
  239,   // ted
  4823,  // nicholas
  10259, // rev
  20591, // sahil
];

// Sample dating-app metadata to make profiles feel real
const SAMPLE = {
  interests: [
    ["🎨 Art", "💻 Tech", "🎵 Music"],
    ["🌍 Travel", "📚 Books", "🍕 Food"],
    ["🏋️ Fitness", "🎮 Gaming", "🌿 Nature"],
    ["💻 Tech", "🎬 Film", "🎵 Music"],
    ["📚 Books", "🌍 Travel", "🎨 Art"],
  ],
  locations: ["San Francisco", "New York", "London", "Berlin", "Lisbon", "Singapore", "Austin", "Miami"],
  looking_for: ["Friends & connections", "Something serious", "Casual dating", "Co-founders & friends"],
};

async function fetchNeynarUsers(fids) {
  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(",")}`,
    { headers: { api_key: NEYNAR } }
  );
  if (!res.ok) {
    throw new Error(`Neynar ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.users ?? [];
}

async function upsertProfiles(profiles) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=fid`, {
    method: "POST",
    headers: {
      apikey: SECRET,
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(profiles),
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

console.log(`Fetching ${FIDS.length} users from Neynar…`);
const users = await fetchNeynarUsers(FIDS);
console.log(`Got ${users.length} users.`);

const profiles = users.map((u, i) => ({
  fid: u.fid,
  username: u.username ?? `fid_${u.fid}`,
  display_name: u.display_name ?? u.username ?? `User ${u.fid}`,
  pfp_url: u.pfp_url ?? "",
  bio: u.profile?.bio?.text ?? "",
  follower_count: u.follower_count ?? 0,
  following_count: u.following_count ?? 0,
  age: 24 + (i % 12),
  interests: SAMPLE.interests[i % SAMPLE.interests.length],
  location: SAMPLE.locations[i % SAMPLE.locations.length],
  looking_for: SAMPLE.looking_for[i % SAMPLE.looking_for.length],
  show_in_discovery: true,
}));

const inserted = await upsertProfiles(profiles);
console.log(`\n✓ Seeded ${inserted.length} profiles:`);
for (const p of inserted) {
  console.log(`  • ${p.display_name} (@${p.username}) — fid ${p.fid}, ${p.follower_count.toLocaleString()} followers`);
}
