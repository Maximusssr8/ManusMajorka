/**
 * Google Trends daily RSS scraper.
 * No Apify needed — direct RSS feed fetch.
 */
import { getSupabaseAdmin } from '../_core/supabase';

const GEOS = ['AU', 'US'];
const RSS_BASE = 'https://trends.google.com/trends/trendingsearches/daily/rss';

interface TrendItem { keyword: string; geo: string; breakout: boolean }

export async function fetchGoogleTrends(): Promise<TrendItem[]> {
  const results: TrendItem[] = [];

  for (const geo of GEOS) {
    try {
      const res = await fetch(`${RSS_BASE}?geo=${geo}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

      for (const item of itemMatches.slice(0, 30)) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const title = titleMatch?.[1]?.trim() || '';
        if (!title) continue;

        const approxMatch = item.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/);
        const approxTraffic = approxMatch?.[1] || '';
        const isBreakout = approxTraffic.includes('+') || parseInt(approxTraffic.replace(/[^0-9]/g, '')) > 50000;

        results.push({ keyword: title, geo, breakout: isBreakout });
      }
    } catch (err: any) {
      console.error(`[trends] ${geo} error:`, err.message);
    }
  }

  return results;
}

export async function saveTrends(items: TrendItem[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (items.length === 0) return;

  await supabase.from('trends_data').insert(
    items.map(item => ({
      keyword: item.keyword,
      geo: item.geo,
      interest_score: item.breakout ? 90 : 60,
      direction: item.breakout ? 'exploding' : 'rising',
      breakout: item.breakout,
      checked_at: new Date().toISOString(),
    }))
  ).then(null, (err: any) => console.error('[trends] Save error:', err.message));

  console.log(`[trends] Saved ${items.length} trending keywords`);
}
