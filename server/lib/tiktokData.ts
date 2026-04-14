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
  'product review must have 2025',
  'tiktok made me buy it worth it',
  'unboxing haul products review',
  'best gadgets products under 30',
  'honest product review posture fitness',
  'kitchen gadgets that actually work',
  'pet products dogs love',
  'home organization products review',
  'satisfying cleaning products unboxing',
  'wireless gadgets tech review 2025',
];

const NICHE_MAP: Record<string, string> = {
  beauty: 'beauty', skincare: 'beauty', makeup: 'beauty',
  fitness: 'fitness', gym: 'fitness', workout: 'fitness',
  home: 'home', homedecor: 'home', kitchen: 'home', cleaning: 'home',
  tech: 'tech', gadget: 'tech', gadgets: 'tech', iphone: 'tech',
  pets: 'pets', dog: 'pets', cat: 'pets',
  fashion: 'fashion', outfit: 'fashion', ootd: 'fashion',
  food: 'food', recipe: 'food', cooking: 'food',
  lifestyle: 'lifestyle', outdoor: 'outdoor', sports: 'sports', camping: 'outdoor',
  health: 'health', wellness: 'health', vitamins: 'health', supplements: 'health',
  tiktokmademebuyit: 'general', amazonfinds: 'general', productreview: 'general',
};


// ── In-memory cache (per Lambda instance, survives warm re-invocations) ───
const _memCache = new Map<string, { items: any[]; expiresAt: number }>();

function memRead(key: string): any[] | null {
  const entry = _memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _memCache.delete(key); return null; }
  return entry.items;
}

function memWrite(key: string, items: any[], ttlHours = 6): void {
  _memCache.set(key, { items, expiresAt: Date.now() + ttlHours * 3600 * 1000 });
}

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
  productLink: string | null; // first URL extracted from caption — AliExpress / Shopify / amzn / bit.ly / linktree
  hasProductLink: boolean;
  duration: number | null;    // seconds
}

// ── Quality-gate config ───────────────────────────────────────────────────
// Real-data-only leaderboard. Rows that fail any rule are rejected and logged.
export const QUALITY_RULES = {
  MIN_VIEWS: 1000,                    // filter spam / dead videos
  MAX_AGE_DAYS: 30,                   // only fresh content
  REQUIRE_CREATOR_HANDLE: true,
  REQUIRE_VIDEO_ID: true,
  REQUIRE_VIDEO_URL: true,
} as const;

const PRODUCT_LINK_RE = /https?:\/\/(?:[a-z0-9-]+\.)?(aliexpress|amazon|amzn|shopify|myshopify|bit\.ly|linktr\.ee|beacons\.ai|shopmy|tiktokshop|shop\.tiktok|temu|shein)[^\s]*/i;

function extractProductLink(item: any): string | null {
  // Apify TikTok scraper surfaces caption URLs in a few spots depending on video type.
  const candidates: string[] = [];
  if (typeof item.text === 'string') candidates.push(item.text);
  if (Array.isArray(item.textExtra)) {
    for (const t of item.textExtra) if (t?.awemeId || t?.hashtagName || t?.userUniqueId) { /* skip */ }
  }
  if (typeof item.webVideoUrl === 'string' && item.webVideoUrl.includes('redirect')) candidates.push(item.webVideoUrl);
  if (Array.isArray(item.anchors)) {
    for (const a of item.anchors) {
      if (typeof a?.actionUrl === 'string') candidates.push(a.actionUrl);
      if (typeof a?.url === 'string') candidates.push(a.url);
    }
  }
  for (const c of candidates) {
    const m = c.match(PRODUCT_LINK_RE);
    if (m) return m[0];
  }
  return null;
}

interface RejectionBucket { reason: string; count: number }
function logRejections(rejections: RejectionBucket[]): void {
  if (!rejections.length) return;
  const total = rejections.reduce((s, r) => s + r.count, 0);
  console.log(`[tiktokData] Quality gate rejected ${total} rows:`, rejections.map(r => `${r.reason}=${r.count}`).join(', '));
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

  // Start actor run — body IS the input (flat, not nested). Retry up to 3x on transient errors.
  let startData: any;
  let lastErr: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
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
      console.log(`[tiktokData] Start attempt ${attempt + 1} status:`, startRes.status);
      const startText = await startRes.text();
      if (!startRes.ok) {
        lastErr = `HTTP ${startRes.status}: ${startText.slice(0, 200)}`;
        // 5xx → retry, 4xx → fail fast
        if (startRes.status < 500) break;
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      startData = JSON.parse(startText);
      break;
    } catch (err: any) {
      lastErr = err?.message || String(err);
      console.warn(`[tiktokData] Start attempt ${attempt + 1} error:`, lastErr);
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  if (!startData) {
    console.error('[tiktokData] Start run failed after retries:', lastErr);
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
    // L1: in-memory (sub-millisecond on warm Lambda)
    const mem = memRead('tiktok_raw_au');
    if (mem) { console.log('[tiktokData] Mem-cache hit:', mem.length, 'items'); return mem; }
    // L2: Supabase (persistent, ~1-2s)
    const cached = await readCache('tiktok_raw_au');
    if (cached) { memWrite('tiktok_raw_au', cached); return cached; }
  }

  const items = await runApifyRaw({
    searchQueries: SEARCH_QUERIES,
    resultsPerPage: 20,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
    shouldDownloadSlideshowImages: false,
  });

  if (items.length > 0) { memWrite('tiktok_raw_au', items); await writeCache('tiktok_raw_au', items); }
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

/**
 * Map a raw Apify TikTok scraper item → Video, applying the quality gate.
 * Returns null with a rejection reason if the row fails any rule.
 */
function mapAndValidate(item: any, maxAgeMs: number): { video: Video | null; reason?: string } {
  if (!item || typeof item !== 'object') return { video: null, reason: 'not_object' };

  const id = String(item.id || '').trim();
  if (QUALITY_RULES.REQUIRE_VIDEO_ID && !id) return { video: null, reason: 'missing_video_id' };

  const author = item.authorMeta || {};
  const handle = String(author.name || author.uniqueId || '').trim();
  if (QUALITY_RULES.REQUIRE_CREATOR_HANDLE && !handle) return { video: null, reason: 'missing_creator_handle' };

  const videoUrl = String(item.webVideoUrl || '').trim();
  if (QUALITY_RULES.REQUIRE_VIDEO_URL && !videoUrl) return { video: null, reason: 'missing_video_url' };

  const playCount = Number(item.playCount) || 0;
  if (playCount < QUALITY_RULES.MIN_VIEWS) return { video: null, reason: 'low_views' };

  const postedAt = String(item.createTimeISO || '').trim();
  if (postedAt) {
    const ts = Date.parse(postedAt);
    if (Number.isFinite(ts) && (Date.now() - ts) > maxAgeMs) {
      return { video: null, reason: 'too_old' };
    }
  } else {
    return { video: null, reason: 'missing_posted_at' };
  }

  const hashtags = Array.isArray(item.hashtags)
    ? item.hashtags.map(extractHashtagName).filter(Boolean)
    : [];

  const productLink = extractProductLink(item);

  return {
    video: {
      id,
      title: (item.text || '').slice(0, 120),
      creator: author.nickName || author.nickname || handle,
      creatorHandle: handle,
      creatorProfileUrl: `https://www.tiktok.com/@${handle}`,
      playCount,
      likes: Number(item.diggCount) || 0,
      shares: Number(item.shareCount) || 0,
      comments: Number(item.commentCount) || 0,
      videoUrl,
      postedAt,
      hashtags,
      thumbnail: item.videoMeta?.coverUrl || item.videoMeta?.originalCoverUrl || '',
      productLink,
      hasProductLink: !!productLink,
      duration: Number(item.videoMeta?.duration) || null,
    },
  };
}

export async function fetchRealVideos(): Promise<Video[]> {
  const raw = await fetchRawTikTokData();
  if (!raw.length) return [];

  const maxAgeMs = QUALITY_RULES.MAX_AGE_DAYS * 86400 * 1000;
  const byId = new Map<string, Video>();
  const rejections: Record<string, number> = {};

  for (const item of raw) {
    const { video, reason } = mapAndValidate(item, maxAgeMs);
    if (!video) {
      rejections[reason || 'unknown'] = (rejections[reason || 'unknown'] || 0) + 1;
      continue;
    }
    // Dedup by video_id — keep highest playCount on collision
    const existing = byId.get(video.id);
    if (!existing || video.playCount > existing.playCount) byId.set(video.id, video);
  }

  logRejections(Object.entries(rejections).map(([reason, count]) => ({ reason, count })));
  const videos = Array.from(byId.values()).sort((a, b) => b.playCount - a.playCount);
  console.log(`[tiktokData] Leaderboard: ${videos.length} real videos (from ${raw.length} raw, ${videos.filter(v => v.hasProductLink).length} with product link)`);
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

// ── Live search (no cache — always fresh) ─────────────────────────────────

export async function searchVideos(query: string): Promise<Video[]> {
  try {
    const raw = await runApifyRaw({
      searchQueries: [query],
      resultsPerPage: 20,
      maxRequestRetries: 2,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      maxProfilesPerQuery: 10,
    });
    if (!raw.length) return [];

    // Search uses a wider age window (90d) — relevance matters more than freshness here.
    const maxAgeMs = 90 * 86400 * 1000;
    const byId = new Map<string, Video>();
    const rejections: Record<string, number> = {};

    for (const item of raw) {
      const { video, reason } = mapAndValidate(item, maxAgeMs);
      if (!video) {
        rejections[reason || 'unknown'] = (rejections[reason || 'unknown'] || 0) + 1;
        continue;
      }
      const existing = byId.get(video.id);
      if (!existing || video.playCount > existing.playCount) byId.set(video.id, video);
    }

    logRejections(Object.entries(rejections).map(([reason, count]) => ({ reason, count })));
    return Array.from(byId.values()).sort((a, b) => b.playCount - a.playCount);
  } catch (err: any) {
    console.error('[tiktokData] searchVideos error:', err?.message || err);
    return [];
  }
}
