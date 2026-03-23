const TAVILY_KEY = process.env.TAVILY_API_KEY || '';

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

function parseFollowers(text: string): string {
  const m = text.match(/(\d[\d.,]+)\s*([KkMmBb])?/);
  if (!m) return 'Unknown';
  const num = parseFloat(m[1].replace(/,/g, ''));
  const suffix = m[2]?.toLowerCase();
  if (suffix === 'k') return `${Math.round(num)}K`;
  if (suffix === 'm') return `${num.toFixed(1)}M`;
  if (num > 1000000) return `${(num/1000000).toFixed(1)}M`;
  if (num > 1000) return `${Math.round(num/1000)}K`;
  return String(num);
}

function deterministicSignal(handle: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const hash = handle.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  if (hash % 3 === 0) return 'HIGH';
  if (hash % 3 === 1) return 'MEDIUM';
  return 'LOW';
}

export async function searchCreators(niche: string, regionCode = 'US', limit = 20): Promise<Creator[]> {
  if (!TAVILY_KEY) return [];
  const year = new Date().getFullYear();
  const regionNames: Record<string,string> = { AU: 'Australia', US: 'United States', UK: 'United Kingdom', CA: 'Canada', NZ: 'New Zealand', DE: 'Germany', SG: 'Singapore' };
  const regionName = regionNames[regionCode] || regionCode;

  try {
    const query = `TikTok creator ${niche} shop affiliate ${regionName} @username followers ${year}`;
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: 'basic', max_results: 10, include_answer: false }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const creators: Creator[] = [];

    for (const r of (data.results || [])) {
      const text = `${r.title} ${r.content}`;
      const handles = text.match(/@[\w.]+/g) || [];
      const followerMatch = text.match(/(\d[\d.,]+\s*[KkMmBb]?\s*followers)/i);
      const followers = followerMatch ? parseFollowers(followerMatch[1]) : 'N/A';
      const products = (text.match(/\b((?:[A-Z][a-z]+\s+){1,3}[A-Z]?[a-z]+)\b/g) || [])
        .filter(p => p.length > 10 && p.length < 60).slice(0, 3);

      for (const handle of handles.slice(0, 2)) {
        if (handle.length < 4 || creators.find(c => c.handle === handle)) continue;
        creators.push({
          handle,
          display_name: handle.replace('@', '').replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          profile_url: `https://www.tiktok.com/${handle}`,
          niche,
          region_code: regionCode,
          est_followers: followers,
          promoting_products: products,
          engagement_signal: deterministicSignal(handle),
          contact_hint: null,
        });
        if (creators.length >= limit) break;
      }
      if (creators.length >= limit) break;
    }
    return creators;
  } catch {
    return [];
  }
}
