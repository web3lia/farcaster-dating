const NEYNAR_BASE = "https://api.neynar.com/v2";

async function neynarFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${NEYNAR_BASE}${path}`, {
    ...init,
    headers: {
      "api_key": process.env.NEYNAR_API_KEY!,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Neynar ${path}: ${res.status}`);
  return res.json();
}

export async function getFarcasterUserByFid(fid: number) {
  const data = await neynarFetch(`/farcaster/user/bulk?fids=${fid}`);
  return data.users?.[0] ?? null;
}

export async function searchFarcasterUsers(q: string, limit = 20) {
  const data = await neynarFetch(
    `/farcaster/user/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  return data.result?.users ?? [];
}

export async function getFollowers(fid: number, limit = 100) {
  const data = await neynarFetch(
    `/farcaster/followers?fid=${fid}&limit=${limit}`
  );
  return data.result?.users ?? [];
}
