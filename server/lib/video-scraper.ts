const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ievekuazsjbdrltsdksn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

function classifyFormat(text: string): VideoFormat {
  const lower = text.toLowerCase();
  if (lower.includes('pov') || lower.includes('point of view')) return 'POV';
  if (lower.includes('unbox') || lower.includes('unpackaging')) return 'UNBOXING';
  if (lower.includes('review') || lower.includes('honest') || lower.includes('rating')) return 'REVIEW';
  if (lower.includes('demo') || lower.includes('how to') || lower.includes('tutorial')) return 'DEMO';
  return 'LIFESTYLE';
}

function classifySignal(text: string): 'VIRAL' | 'HIGH' | 'MEDIUM' {
  const lower = text.toLowerCase();
  if (/\d+m\s*(views|likes)/.test(lower) || lower.includes('million views') || lower.includes('viral')) return 'VIRAL';
  if (/\d{3}k\s*(views|likes)/.test(lower) || lower.includes('trending')) return 'HIGH';
  return 'MEDIUM';
}

export async function searchViralVideos(niche: string, regionCode = 'US'): Promise<ViralVideo[]> {
  if (!TAVILY_KEY) return [];
  const regionNames: Record<string, string> = { AU: 'Australia', US: 'United States', UK: 'United Kingdom', CA: 'Canada' };
  const rName = regionNames[regionCode] || regionCode;

  try {
    const query = `site:tiktok.com ${niche} product viral shop "${rName}" views likes 2026`;
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: 'basic', max_results: 10 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const videos: ViralVideo[] = [];

    for (const r of (data.results || [])) {
      if (!r.url?.includes('tiktok.com')) continue;
      const text = `${r.title || ''} ${r.content || ''}`;
      const hookMatch = r.content?.match(/^[^.!?]+[.!?]/);
      const hook = hookMatch ? hookMatch[0].trim().slice(0, 120) : null;
      const productWords = r.title?.replace(/\|.+$/, '').replace(/@\w+/, '').trim() || niche;

      videos.push({
        title: (r.title || '').slice(0, 150),
        url: r.url,
        product_mentioned: productWords.slice(0, 80),
        niche,
        hook_text: hook,
        engagement_signal: classifySignal(text),
        format: classifyFormat(text),
        region_code: regionCode,
      });
    }
    return videos;
  } catch { return []; }
}

export async function upsertVideos(videos: ViralVideo[]): Promise<void> {
  if (!videos.length || !SUPABASE_KEY) return;
  await fetch(`${SUPABASE_URL}/rest/v1/viral_videos`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(videos.map(v => ({ ...v, scraped_at: new Date().toISOString() }))),
  }).catch(() => {});
}
