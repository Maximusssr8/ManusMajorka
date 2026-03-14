/**
 * seed-trends.ts
 * One-shot script: creates trend_signals table + seeds 10 real AU trends.
 * Run: npx tsx server/lib/seed-trends.ts
 */

import { config } from 'dotenv';
config();
config({ path: '.env.local', override: false });

import postgres from 'postgres';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

async function tavilySearch(query: string): Promise<string> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: 'basic', max_results: 5 }),
  });
  const data = await res.json() as { results?: Array<{ title: string; content: string }> };
  return (data.results || []).map((r) => `[${r.title}]\n${r.content}`).join('\n\n');
}

async function createTable(): Promise<boolean> {
  // Try postgres direct first
  const dbUrl = process.env.DATABASE_URL;
  
  if (dbUrl) {
    const strategies = [
      dbUrl,
      // Supavisor pooler
      dbUrl.replace(/postgresql:\/\/postgres:([^@]+)@db\.([^.]+)\.supabase\.co:\d+\/(.+)/, 
        'postgresql://postgres.$2:$1@aws-0-ap-southeast-2.pooler.supabase.com:5432/$3'),
    ];
    
    for (const url of strategies) {
      const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 10 });
      try {
        await sql`SELECT 1`;
        await sql`
          CREATE TABLE IF NOT EXISTS public.trend_signals (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            trend_name text NOT NULL,
            category text,
            signal_strength integer DEFAULT 5,
            stage text DEFAULT 'emerging',
            why_now text,
            opportunity_window text,
            est_monthly_revenue_aud numeric,
            sample_products jsonb DEFAULT '[]',
            target_audience text,
            entry_difficulty text DEFAULT 'Medium',
            au_seasonal_relevance text,
            action text,
            detected_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            UNIQUE(trend_name)
          )
        `;
        try { await sql`ALTER TABLE public.trend_signals ENABLE ROW LEVEL SECURITY`; } catch {}
        try { await sql`CREATE POLICY ts_pub ON public.trend_signals FOR SELECT USING (true)`; } catch {}
        try { await sql`CREATE POLICY ts_svc ON public.trend_signals FOR ALL TO service_role USING (true) WITH CHECK (true)`; } catch {}
        await sql.end();
        return true;
      } catch (e: any) {
        console.warn('Postgres strategy failed:', e.message?.slice(0, 80));
        try { await sql.end(); } catch {}
      }
    }
  }
  
  return false;
}

async function seedTrends(trends: any[]): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/trend_signals`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(trends),
  });
  
  if (res.ok) {
  } else {
    const err = await res.text();
    console.error('Seed failed:', err.slice(0, 300));
  }
}

async function main() {
  const queries = [
    'viral products TikTok Australia trending this week 2025',
    'fastest growing niches ecommerce Australia 2025',
    'TikTok Shop AU trending categories sales growth 2025',
    'Google Trends Australia top searches ecommerce products 2025',
    'seasonal products Australia upcoming months 2025 demand',
    'new product launches TikTok viral Australia this month',
  ];
  
  const results = await Promise.allSettled(queries.map(q => tavilySearch(q)));
  const combined = results.map((r, i) => {
    if (r.status === 'fulfilled') return `=== ${queries[i]} ===\n${r.value}`;
    return `=== ${queries[i]} ===\n[failed]`;
  }).join('\n\n');
  
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyse these search results for emerging product/niche trends in Australia.
Return JSON array of 10 trends:
[{
  "trend_name": "short catchy name",
  "category": "product category",
  "signal_strength": <1-10>,
  "stage": "emerging | rising | peak | declining",
  "why_now": "1-2 sentences",
  "opportunity_window": "how long this trend likely lasts",
  "est_monthly_revenue_aud": <realistic number>,
  "sample_products": ["product1", "product2", "product3"],
  "target_audience": "who's buying in AU",
  "entry_difficulty": "Easy | Medium | Hard",
  "au_seasonal_relevance": "relevant month/season",
  "action": "what to do right now"
}]
Only include trends with signal_strength >= 6. Return ONLY a JSON array.

${combined}`
      }],
    }),
  });
  
  const data = await res.json() as { content: Array<{ text: string }> };
  const text = data.content?.[0]?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  
  if (!match) {
    console.error('No JSON array in Claude response:', text.slice(0, 200));
    process.exit(1);
  }
  
  const trends = JSON.parse(match[0]);

  // Create table
  const tableCreated = await createTable();
  if (!tableCreated) {
    console.warn('Could not create table via postgres — will try to insert anyway (table may exist)');
  }
  
  // Seed
  await seedTrends(trends);
  
}

main().catch(console.error);
