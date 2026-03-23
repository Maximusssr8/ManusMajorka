// server/lib/competitor-scraper.ts
// Scrapes competitor AU stores via Tavily

import { AU_DROPSHIP_STORES } from './competitor-shops';

const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface ScrapedProduct {
  store_domain: string;
  product_name: string;
  price_aud: number | null;
  category: string | null;
}

function extractProducts(results: any[], storeDomain: string, storeCategory: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  for (const r of results) {
    const title = r.title || '';
    const content = r.content || '';
    const combined = `${title} ${content}`;

    const priceMatch = combined.match(/\$\s?(\d+(?:\.\d{2})?)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;

    let name = title
      .replace(new RegExp(storeDomain.replace(/\./g, '\\.'), 'gi'), '')
      .replace(/buy\s+/gi, '')
      .replace(/\s*-\s*.*$/, '')
      .replace(/\s*\|\s*.*$/, '')
      .trim();

    if (name.length > 10 && name.length < 200) {
      products.push({
        store_domain: storeDomain,
        product_name: name.slice(0, 200),
        price_aud: price,
        category: storeCategory,
      });
    }
  }

  return products;
}

export async function scrapeStore(domain: string, category: string): Promise<ScrapedProduct[]> {
  if (!TAVILY_KEY) return [];

  try {
    const query = `site:${domain} trending OR bestseller OR "best seller" OR "new arrivals" OR popular 2026`;
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        search_depth: 'basic',
        max_results: 8,
        include_answer: false,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return extractProducts(data.results || [], domain, category);
  } catch {
    return [];
  }
}

async function upsertProducts(products: ScrapedProduct[]): Promise<number> {
  if (!products.length || !SUPABASE_URL || !SUPABASE_KEY) return 0;

  const now = new Date().toISOString();
  const rows = products.map(p => ({
    ...p,
    last_seen_at: now,
  }));

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/competitor_products`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });
    if (r.ok || r.status === 201) inserted += batch.length;
  }
  return inserted;
}

export async function runCompetitorSpy(storeLimit = 20): Promise<{
  stores_scraped: number;
  products_found: number;
  products_inserted: number;
  results: Array<{ store: string; products: number }>;
}> {
  const stores = AU_DROPSHIP_STORES.slice(0, storeLimit);
  let totalProducts = 0;
  let totalInserted = 0;
  const results: Array<{ store: string; products: number }> = [];

  for (const store of stores) {
    console.log(`[competitor-spy] scraping ${store.domain}...`);
    try {
      const products = await scrapeStore(store.domain, store.category);
      const inserted = await upsertProducts(products);
      totalProducts += products.length;
      totalInserted += inserted;
      results.push({ store: store.domain, products: products.length });
      console.log(`[competitor-spy] ${store.domain}: ${products.length} products, ${inserted} inserted`);
    } catch (err) {
      console.warn(`[competitor-spy] failed for ${store.domain}:`, err instanceof Error ? err.message : '');
      results.push({ store: store.domain, products: 0 });
    }
    await sleep(800);
  }

  return {
    stores_scraped: stores.length,
    products_found: totalProducts,
    products_inserted: totalInserted,
    results,
  };
}
