import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/server";

const HUB_URL = "https://hub.pinata.cloud";
const PER_CALL_TIMEOUT_MS = 2000;
const CONCURRENCY = 20;
const PROFILE_CAP = 500;
const CACHE_TTL_MS = 5 * 60 * 1000;

// In-memory cache: fid → { result, expiresAt }
const cache = new Map<number, { result: unknown; expiresAt: number }>();

async function doesFollow(fromFid: number, targetFid: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_CALL_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${HUB_URL}/v1/linkById?fid=${fromFid}&target_fid=${targetFid}&link_type=follow`,
      { signal: controller.signal }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data?.data?.type === "MESSAGE_TYPE_LINK_ADD" && !data?.error;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function GET(req: NextRequest) {
  const authed = await getAuthedClient(req);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fid } = authed;

  // Serve from cache if fresh
  const cached = cache.get(fid);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.result);
  }

  const supabase = createServiceClient();

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("fid, username, display_name, pfp_url")
    .neq("fid", fid)
    .order("created_at", { ascending: false })
    .limit(PROFILE_CAP);

  if (!allProfiles || allProfiles.length === 0) {
    const result = { mode: "total", count: 0, profiles: [] };
    cache.set(fid, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(result);
  }

  try {
    const followFlags = await runInBatches(
      allProfiles,
      CONCURRENCY,
      (p) => doesFollow(fid, p.fid)
    );

    const matchedProfiles = allProfiles.filter((_, i) => followFlags[i]);

    console.log(
      `[social-proof] fid=${fid} checked=${allProfiles.length} matched=${matchedProfiles.length} fids=[${matchedProfiles.map((p) => p.fid).join(",")}]`
    );

    const result = {
      mode: "frens",
      count: matchedProfiles.length,
      profiles: matchedProfiles.slice(0, 5),
    };
    cache.set(fid, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(result);
  } catch (e) {
    console.log(`[social-proof] fid=${fid} hub_error=${e instanceof Error ? e.message : String(e)}`);
  }

  // Fallback: total count
  const { count } = await supabase
    .from("profiles")
    .select("fid", { count: "exact", head: true });

  const result = { mode: "total", count: count ?? 0, profiles: [] };
  cache.set(fid, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return NextResponse.json(result);
}
