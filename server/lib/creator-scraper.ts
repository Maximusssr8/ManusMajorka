const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ievekuazsjbdrltsdksn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface Creator {
  handle: string;
  display_name: string;
  profile_url: string;
  niche: string;
  region_code: string;
  est_followers: string;
  promoting_products: string[];
  engagement_signal: 'HIGH' | 'MEDIUM' | 'LOW';
  contact_hint: string | null;
}

const TOP_NICHES = ['beauty','fitness','home decor','pet care','tech accessories','fashion','health','kitchen','outdoor','baby'];
const TOP_REGIONS = ['US', 'AU', 'UK'];

function classifyEngagement(text: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const lower = text.toLowerCase();
  if (lower.includes('million') || lower.includes('viral') || lower.includes('1m') || /\d+m\s*followers/i.test(lower)) return 'HIGH';
  if (lower.includes('500k') || lower.includes('100k') || /\d{3}k\s*followers/i.test(lower)) return 'MEDIUM';
  return 'LOW';
}

export async function searchCreators(niche: string, regionCode = 'US', limit = 20): Promise<Creator[]> {
  if (!TAVILY_KEY) return [];
  const regionNames: Record<string, string> = { AU: 'Australia', US: 'United States', UK: 'United Kingdom', CA: 'Canada', NZ: 'New Zealand', DE: 'Germany', SG: 'Singapore' };
  const rName = regionNames[regionCode] || regionCode;

  try {
    const query = `TikTok creator @username ${niche} shop affiliate dropship ${rName} followers 2026`;
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: 'basic', max_results: 10 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const creators: Creator[] = [];

    for (const r of (data.results || [])) {
      const text = `${r.title || ''} ${r.content || ''}`;
      const handles = [...new Set(text.match(/@[\w.]{3,25}/g) || [])];
      const followerMatch = text.match(/(\d[\d.,]+\s*[KkMmBb]?\s*followers)/i);
      const followers = followerMatch ? followerMatch[1].replace(/\s*followers/i, '').trim() : 'N/A';
      const products = (text.match(/\b([A-Z][a-z]+(?: [A-Za-z]+){1,3})\b/g) || [])
        .filter(p => p.length > 8 && p.length < 50 && !/^(The|This|That|With|From|When|Where)/.test(p)).slice(0, 3);
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/);

      for (const handle of handles.slice(0, 2)) {
        if (creators.find(c => c.handle === handle)) continue;
        const displayName = handle.replace('@', '').replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        creators.push({
          handle, display_name: displayName,
          profile_url: `https://www.tiktok.com/${handle}`,
          niche, region_code: regionCode,
          est_followers: followers,
          promoting_products: products,
          engagement_signal: classifyEngagement(text),
          contact_hint: emailMatch ? emailMatch[0] : null,
        });
        if (creators.length >= limit) break;
      }
      if (creators.length >= limit) break;
    }
    return creators;
  } catch { return []; }
}

async function upsertCreators(creators: Creator[]): Promise<void> {
  if (!creators.length || !SUPABASE_KEY) return;
  const rows = creators.map(c => ({ ...c, last_scraped_at: new Date().toISOString() }));
  await fetch(`${SUPABASE_URL}/rest/v1/creators`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  }).catch(() => {});
}

export async function refreshCreators(): Promise<{ niches: number; regions: number; total: number }> {
  let total = 0;
  for (const niche of TOP_NICHES) {
    for (const region of TOP_REGIONS) {
      try {
        const creators = await searchCreators(niche, region, 5);
        await upsertCreators(creators);
        total += creators.length;
        console.log(`[creators] ${niche}/${region}: ${creators.length}`);
      } catch { /* silent */ }
      await sleep(400);
    }
  }
  return { niches: TOP_NICHES.length, regions: TOP_REGIONS.length, total };
}
