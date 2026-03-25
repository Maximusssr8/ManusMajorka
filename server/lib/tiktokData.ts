/**
 * Shared TikTok data layer — ONE Apify run feeds both Creator Intel and Video Intel.
 * Actor: clockworks/tiktok-scraper (confirmed working, ~13s for 30 items)
 */
import { runApifyActor, getCachedOrFetch } from './apifyTikTok';
import { getSupabaseAdmin } from '../_core/supabase';

const HASHTAGS = [
  'tiktokmademebuyit',
  'australianshopping',
  'productreview',
  'dropshipping',
  'ecommerce',
];

const NICHE_MAP: Record<string, string> = {
  beauty: 'beauty',
  skincare: 'beauty',
  makeup: 'beauty',
  fitness: 'fitness',
  gym: 'fitness',
  workout: 'fitness',
  home: 'home',
  homedecor: 'home',
  kitchen: 'home',
  cleaning: 'home',
  tech: 'tech',
  gadget: 'tech',
  gadgets: 'tech',
  iphone: 'tech',
  pets: 'pets',
  dog: 'pets',
  cat: 'pets',
  fashion: 'fashion',
  outfit: 'fashion',
  ootd: 'fashion',
  food: 'food',
  recipe: 'food',
  cooking: 'food',
  lifestyle: 'lifestyle',
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

// ── Raw data fetch (cached 6 hours) ────────────────────────────────────────

export async function fetchRawTikTokData(bypassCache = false): Promise<any[]> {
  const fetcher = async () => {
    // Search multiple hashtags, 20 results each to get ~100 items
    const input = {
      hashtags: HASHTAGS,
      resultsPerPage: 20,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    };
    const items = await runApifyActor('clockworks~tiktok-scraper', input);
    return items;
  };

  if (bypassCache) {
    return fetcher();
  }

  return getCachedOrFetch('tiktok_raw_au', fetcher, 6);
}

// ── Niche detection from hashtags ──────────────────────────────────────────

function detectNiche(hashtags: string[]): string {
  const counts: Record<string, number> = {};
  for (const tag of hashtags) {
    const lower = tag.toLowerCase().replace(/[^a-z]/g, '');
    const mapped = NICHE_MAP[lower];
    if (mapped) {
      counts[mapped] = (counts[mapped] || 0) + 1;
    }
  }
  let best = 'general';
  let bestCount = 0;
  for (const [niche, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = niche;
      bestCount = count;
    }
  }
  return best;
}

// ── Creators: deduplicated, >=5000 fans, sorted by fans desc ───────────────

export async function fetchRealCreators(): Promise<Creator[]> {
  const raw = await fetchRawTikTokData();
  if (!Array.isArray(raw) || raw.length === 0) return [];

  // Group videos by author
  const authorMap = new Map<string, { meta: any; videos: any[] }>();
  for (const item of raw) {
    const author = item.authorMeta;
    if (!author?.id) continue;
    const existing = authorMap.get(author.id);
    if (existing) {
      existing.videos.push(item);
    } else {
      authorMap.set(author.id, { meta: author, videos: [item] });
    }
  }

  const creators: Creator[] = [];
  for (const [, { meta, videos }] of authorMap) {
    const fans = Number(meta.fans) || 0;
    if (fans < 5000) continue;

    // Engagement: sum(diggCount) / sum(playCount) * 100
    let totalDigg = 0;
    let totalPlay = 0;
    const allHashtags: string[] = [];
    for (const v of videos) {
      totalDigg += Number(v.diggCount) || 0;
      totalPlay += Number(v.playCount) || 0;
      if (Array.isArray(v.hashtags)) {
        for (const h of v.hashtags) {
          allHashtags.push(typeof h === 'string' ? h : h?.name || '');
        }
      }
    }
    const engRate = totalPlay > 0 ? (totalDigg / totalPlay) * 100 : 0;
    const engagement = engRate > 5 ? 'High' : engRate > 2 ? 'Medium' : 'Low';
    const niche = detectNiche(allHashtags);

    creators.push({
      id: meta.id,
      handle: meta.name || meta.uniqueId || '',
      nickname: meta.nickName || meta.nickname || meta.name || '',
      followers: fans,
      totalLikes: Number(meta.heart) || 0,
      verified: !!meta.verified,
      profileUrl: `https://www.tiktok.com/@${meta.name || meta.uniqueId || ''}`,
      niche,
      engagement,
    });
  }

  // Sort by followers desc
  creators.sort((a, b) => b.followers - a.followers);
  return creators;
}

// ── Videos: filtered >=10k plays, sorted by playCount desc ─────────────────

export async function fetchRealVideos(): Promise<Video[]> {
  const raw = await fetchRawTikTokData();
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const videos: Video[] = [];
  for (const item of raw) {
    const plays = Number(item.playCount) || 0;
    if (plays < 10000) continue;

    const author = item.authorMeta || {};
    const hashtags: string[] = Array.isArray(item.hashtags)
      ? item.hashtags.map((h: any) => typeof h === 'string' ? h : h?.name || '')
      : [];

    videos.push({
      id: item.id || String(Math.random()),
      title: item.text || '',
      creator: author.nickName || author.nickname || author.name || '',
      creatorHandle: author.name || author.uniqueId || '',
      creatorProfileUrl: `https://www.tiktok.com/@${author.name || author.uniqueId || ''}`,
      playCount: plays,
      likes: Number(item.diggCount) || 0,
      shares: Number(item.shareCount) || 0,
      comments: Number(item.commentCount) || 0,
      videoUrl: item.webVideoUrl || '',
      postedAt: item.createTimeISO || '',
      hashtags,
      thumbnail: Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0
        ? item.mediaUrls[0]
        : '',
    });
  }

  videos.sort((a, b) => b.playCount - a.playCount);
  return videos;
}

// ── Cache status ───────────────────────────────────────────────────────────

export async function getTikTokCacheStatus(): Promise<{ cached_at: string | null; fresh: boolean }> {
  try {
    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb
      .from('apify_cache')
      .select('fetched_at, expires_at')
      .eq('cache_key', 'tiktok_raw_au')
      .single();

    if (error || !row) return { cached_at: null, fresh: false };
    return {
      cached_at: row.fetched_at,
      fresh: new Date(row.expires_at) > new Date(),
    };
  } catch {
    return { cached_at: null, fresh: false };
  }
}
