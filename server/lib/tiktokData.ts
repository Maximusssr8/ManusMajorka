/**
 * Shared TikTok data layer — ONE Apify run feeds both Creator Intel and Video Intel.
 * Actor: clockworks/tiktok-scraper (via apify-client SDK)
 *
 * Key findings from testing:
 * - searchQueries: 5s/query (much faster than hashtags: 27s)
 * - hashtag objects are {name: "..."}, not plain strings
 * - apify-client SDK is more reliable than raw REST for this actor
 */
import { ApifyClient } from 'apify-client';
import { getSupabaseAdmin } from '../_core/supabase';

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

// ── Supabase cache helpers ─────────────────────────────────────────────────

async function readCache(key: string): Promise<any[] | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('apify_cache')
      .select('data, expires_at')
      .eq('cache_key', key)
      .single();
    if (error || !data) return null;
    if (new Date(data.expires_at) < new Date()) return null; // expired
    return Array.isArray(data.data) ? data.data : null;
  } catch { return null; }
}

async function writeCache(key: string, items: any[], ttlHours = 6): Promise<void> {
  try {
    if (!items.length) return; // never cache empty results
    const sb = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
    await sb.from('apify_cache').upsert(
      { cache_key: key, data: items, fetched_at: new Date().toISOString(), expires_at: expiresAt },
      { onConflict: 'cache_key' }
    );
  } catch (e) { console.warn('[tiktokData] Cache write failed (table may not exist):', e); }
}

// ── Raw data fetch ─────────────────────────────────────────────────────────

export async function fetchRawTikTokData(bypassCache = false): Promise<any[]> {
  if (!bypassCache) {
    const cached = await readCache('tiktok_raw_au');
    if (cached) {
      console.log('[tiktokData] Cache hit —', cached.length, 'items');
      return cached;
    }
  }

  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error('[tiktokData] No APIFY token');
    return [];
  }

  console.log('[tiktokData] Starting Apify run (searchQueries, 5 terms)...');
  const client = new ApifyClient({ token });

  try {
    const run = await client.actor('clockworks/tiktok-scraper').call(
      {
        searchQueries: SEARCH_QUERIES,
        resultsPerPage: 20,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSubtitles: false,
        shouldDownloadSlideshowImages: false,
      },
      { waitSecs: 55 } // just under Vercel 60s limit
    );

    console.log('[tiktokData] Run', run.id, 'status:', run.status);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log('[tiktokData] Apify returned', items.length, 'items');

    if (items.length > 0) {
      await writeCache('tiktok_raw_au', items);
    }

    return items;
  } catch (err: any) {
    console.error('[tiktokData] Apify run failed:', err.message);
    return [];
  }
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
  let best = 'general';
  let bestCount = 0;
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
    if (!author?.id && !author?.name) continue;
    const key = author.id || author.name;
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
        thumbnail: Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0
          ? item.mediaUrls[0] : '',
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
