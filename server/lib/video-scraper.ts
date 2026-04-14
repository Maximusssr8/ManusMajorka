/**
 * DEPRECATED — Tavily-based video search produced low-fidelity data (engagement
 * numbers inferred from text regex, no real play counts). The TikTok leaderboard
 * now sources exclusively from server/lib/tiktokData.ts (Apify clockworks/tiktok-scraper).
 *
 * This module is retained as a no-op to avoid breaking imports. Any code path
 * still calling these functions will silently return empty arrays.
 */

export type VideoFormat = 'POV' | 'REVIEW' | 'UNBOXING' | 'DEMO' | 'LIFESTYLE';

export interface ViralVideo {
  title: string;
  url: string;
  product_mentioned: string;
  niche: string;
  hook_text: string | null;
  engagement_signal: 'VIRAL' | 'HIGH' | 'MEDIUM';
  format: VideoFormat;
  region_code: string;
}

export async function searchViralVideos(_niche: string, _regionCode = 'US'): Promise<ViralVideo[]> {
  console.warn('[video-scraper] searchViralVideos is deprecated — Tavily-based TikTok search removed to prevent low-fidelity data. Use /api/videos/search (Apify) instead.');
  return [];
}

export async function upsertVideos(_videos: ViralVideo[]): Promise<void> {
  // No-op. Writes to viral_videos have been disabled to keep the leaderboard
  // fed only by real Apify TikTok scrapes.
}
