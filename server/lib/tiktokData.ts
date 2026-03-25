/**
 * Shared TikTok data layer — ONE Apify run feeds both Creator Intel and Video Intel.
 * Actor: clockworks/tiktok-scraper
 *
 * Uses raw REST API (same pattern as apifyAliExpress.ts which is proven to work).
 * apify-client SDK was unreliable in the CJS-bundled Vercel Lambda.
 *
 * Key learnings:
 * - Input fields must be FLAT in POST body (not nested under {input: {...}})
 * - searchQueries mode: ~5s per query (much faster than hashtags: ~27s)
 * - Hashtag objects: {name: "..."} — always extract .name
 */

import { getSupabaseAdmin } from '../_core/supabase';

const ACTOR = 'clockworks~tiktok-scraper';
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 18; // 54s max — under Vercel maxDuration=300 but safe

const SEARCH_QUERIES = [
  'tiktokmademebuyit',
  'australianshopping',
  'productreview dropshipping',
  'ecommerce australia',
  'winning products 2025',
];

const NICHE_MAP: Record<string, string> = {
  beauty: 'beauty', skincare: 'beauty', makeup: 'beauty',
  fitness: 'fitness', gym: 'fitness', workout: 'fitness',
  home: 'home', homedecor: 'home', kitchen: 'home', cleaning: 'home',
  tech: 'tech', gadget: 'tech', gadgets: 'tech', iphone: 'tech',
  pets: 'pets', dog: 'pets', cat: 'pets',
  fashion: 'fashion', outfit: 'fashion', ootd: 'fashion',
  food: 'food', recipe: 'food', cooking: 'food',
  lifestyle: 'lifestyle', dropshipping: 'ecommerce', ecommerce: 'ecommerce',
  shopify: 'ecommerce', tiktokmademebuyit: 'general', productreview: 'general',
};

export interface Creator {
  id: string;
  handle: string;
  nickname: string;
  followers: number;
  totalLikes: number;
  verified: boolean;
  profileUrl: string;
  niche: string;
  engagement: string;
}

export interface Video {
  id: string;
  title: string;
  creator: string;
  creatorHandle: string;
  creatorProfileUrl: string;
  playCount: number;
  likes: number;
  shares: number;
  comments: number;
  videoUrl: string;
  postedAt: string;
  hashtags: string[];
  thumbnail: string;
}

// ── Raw REST Apify call ────────────────────────────────────────────────────

async function runApifyRaw(input: Record<string, unknown>): Promise<any[]> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error('[tiktokData] No APIFY token set');
    return [];
  }

  console.log('[tiktokData] Token present:', !!token, 'len:', token.length);
  console.log('[tiktokData] Input:', JSON.stringify(input));

  // Start actor run — body IS the input (flat, not nested)
  let startData: any;
  try {
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}&memory=256`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(20000),
      }
    );
    console.log('[tiktokData] Start response status:', startRes.status);
    const startText = await startRes.text();
    console.log('[tiktokData] Start response (first 500):', startText.slice(0, 500));
    if (!startRes.ok) return [];
    startData = JSON.parse(startText);
  } catch (err: any) {
    console.error('[tiktokData] Start run error:', err.message);
    return [];
  }

  const runId = startData?.data?.id;
  if (!runId) {
    console.error('[tiktokData] No run ID in response');
    return [];
  }
  console.log('[tiktokData] Run started:', runId);

  // Poll for completion
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}?token=${token}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const statusData: any = await statusRes.json();
      const status = statusData?.data?.status;
      console.log(`[tiktokData] Poll ${i + 1}: ${status}`);

      if (status === 'SUCCEEDED') {
        const datasetId = statusData.data.defaultDatasetId;
        const itemsRes = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`,
          { signal: AbortSignal.timeout(15000) }
        );
        const items = await itemsRes.json();
        console.log('[tiktokData] Items fetched:', Array.isArray(items) ? items.length : 'not array');
        return Array.isArray(items) ? items : [];
      }
      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        console.error('[tiktokData] Run', status);
        return [];
      }
    } catch (err: any) {
      console.warn('[tiktokData] Poll error:', err.message);
    }
  }

  console.warn('[tiktokData] Poll timeout after', MAX_POLLS, 'attempts');
  return [];
}

// ── Supabase cache ─────────────────────────────────────────────────────────

async function readCache(key: string): Promise<any[] | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('apify_cache')
      .select('data, expires_at')
      .eq('cache_key', key)
      .single();
    if (error || !data) return null;
    if (new Date(data.expires_at) < new Date()) {
      console.log('[tiktokData] Cache expired for', key);
      return null;
    }
    console.log('[tiktokData] Cache hit:', key);
    return Array.isArray(data.data) ? data.data : null;
  } catch (e) {
    console.warn('[tiktokData] Cache read error (table may not exist):', e);
    return null;
  }
}

async function writeCache(key: string, items: any[], ttlHours = 6): Promise<void> {
  if (!items.length) return; // never cache empty
  try {
    const sb = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
    await sb.from('apify_cache').upsert(
      { cache_key: key, data: items, fetched_at: new Date().toISOString(), expires_at: expiresAt },
      { onConflict: 'cache_key' }
    );
    console.log('[tiktokData] Cache written:', key, items.length, 'items');
  } catch (e) {
    console.warn('[tiktokData] Cache write error:', e);
  }
}

// ── Raw data fetch (cached 6h) ─────────────────────────────────────────────

export async function fetchRawTikTokData(bypassCache = false): Promise<any[]> {
  if (!bypassCache) {
    const cached = await readCache('tiktok_raw_au');
    if (cached) return cached;
  }

  const items = await runApifyRaw({
    searchQueries: SEARCH_QUERIES,
    resultsPerPage: 20,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
    shouldDownloadSlideshowImages: false,
  });

  if (items.length > 0) await writeCache('tiktok_raw_au', items);
  return items;
}

// ── Niche detection ────────────────────────────────────────────────────────

function extractHashtagName(h: any): string {
  if (typeof h === 'string') return h.toLowerCase();
  return (h?.name || h?.title || '').toLowerCase();
}

function detectNiche(hashtags: any[]): string {
  const counts: Record<string, number> = {};
  for (const h of hashtags) {
    const tag = extractHashtagName(h).replace(/[^a-z]/g, '');
    const mapped = NICHE_MAP[tag];
    if (mapped) counts[mapped] = (counts[mapped] || 0) + 1;
  }
  let best = 'general', bestCount = 0;
  for (const [niche, count] of Object.entries(counts)) {
    if (count > bestCount) { best = niche; bestCount = count; }
  }
  return best;
}

// ── Creators ──────────────────────────────────────────────────────────────

export async function fetchRealCreators(): Promise<Creator[]> {
  const raw = await fetchRawTikTokData();
  if (!raw.length) return [];

  const authorMap = new Map<string, { meta: any; videos: any[] }>();
  for (const item of raw) {
    const author = item.authorMeta;
    if (!author) continue;
    const key = author.id || author.name;
    if (!key) continue;
    const existing = authorMap.get(key);
    if (existing) { existing.videos.push(item); }
    else { authorMap.set(key, { meta: author, videos: [item] }); }
  }

  const creators: Creator[] = [];
  for (const [, { meta, videos }] of authorMap) {
    const fans = Number(meta.fans) || 0;
    if (fans < 5000) continue;

    let totalDigg = 0, totalPlay = 0;
    const allHashtags: any[] = [];
    for (const v of videos) {
      totalDigg += Number(v.diggCount) || 0;
      totalPlay += Number(v.playCount) || 0;
      if (Array.isArray(v.hashtags)) allHashtags.push(...v.hashtags);
    }
    const engRate = totalPlay > 0 ? (totalDigg / totalPlay) * 100 : 0;
    const engagement = engRate > 5 ? 'High' : engRate > 2 ? 'Medium' : 'Low';
    const handle = meta.name || meta.uniqueId || '';

    creators.push({
      id: meta.id || handle,
      handle,
      nickname: meta.nickName || meta.nickname || handle,
      followers: fans,
      totalLikes: Number(meta.heart) || 0,
      verified: !!meta.verified,
      profileUrl: `https://www.tiktok.com/@${handle}`,
      niche: detectNiche(allHashtags),
      engagement,
    });
  }

  creators.sort((a, b) => b.followers - a.followers);
  return creators;
}

// ── Videos ────────────────────────────────────────────────────────────────

export async function fetchRealVideos(): Promise<Video[]> {
  const raw = await fetchRawTikTokData();
  if (!raw.length) return [];

  const videos: Video[] = raw
    .filter(item => (Number(item.playCount) || 0) >= 10000)
    .map(item => {
      const author = item.authorMeta || {};
      const handle = author.name || author.uniqueId || '';
      const hashtags = Array.isArray(item.hashtags)
        ? item.hashtags.map(extractHashtagName).filter(Boolean)
        : [];
      return {
        id: item.id || String(Date.now()),
        title: (item.text || '').slice(0, 120),
        creator: author.nickName || author.nickname || handle,
        creatorHandle: handle,
        creatorProfileUrl: `https://www.tiktok.com/@${handle}`,
        playCount: Number(item.playCount) || 0,
        likes: Number(item.diggCount) || 0,
        shares: Number(item.shareCount) || 0,
        comments: Number(item.commentCount) || 0,
        videoUrl: item.webVideoUrl || '',
        postedAt: item.createTimeISO || '',
        hashtags,
        thumbnail: Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0 ? item.mediaUrls[0] : '',
      };
    });

  videos.sort((a, b) => b.playCount - a.playCount);
  return videos;
}

// ── Cache status ───────────────────────────────────────────────────────────

export async function getTikTokCacheStatus(): Promise<{ cached_at: string | null; fresh: boolean }> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('apify_cache')
      .select('fetched_at, expires_at')
      .eq('cache_key', 'tiktok_raw_au')
      .single();
    if (error || !data) return { cached_at: null, fresh: false };
    return { cached_at: data.fetched_at, fresh: new Date(data.expires_at) > new Date() };
  } catch { return { cached_at: null, fresh: false }; }
}
