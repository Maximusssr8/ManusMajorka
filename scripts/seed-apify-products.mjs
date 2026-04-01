#!/usr/bin/env node
/**
 * Seed products via Apify playwright-scraper + AliExpress search.
 * Fire-and-forget: starts runs, waits 3min, harvests results.
 * Stores in winning_products (NOT a 'products' table).
 *
 * Usage: node scripts/seed-apify-products.mjs
 * Requires: APIFY_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found — rely on existing env */ }

const APIFY_TOKEN = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AUD_RATE = 1.55;

if (!APIFY_TOKEN) { console.error('Missing APIFY_API_KEY'); process.exit(1); }
if (!SUPABASE_URL || !SKEY) { console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const APIFY_BASE = 'https://api.apify.com/v2';

const KEYWORDS = [
  { keyword: 'kitchen gadgets', category: 'Kitchen' },
  { keyword: 'pet accessories dogs', category: 'Pet' },
  { keyword: 'fitness equipment home', category: 'Fitness' },
  { keyword: 'home decor aesthetic', category: 'Home' },
  { keyword: 'beauty tools skin care', category: 'Beauty' },
  { keyword: 'baby products safety', category: 'Kids' },
  { keyword: 'outdoor camping gear', category: 'Outdoor' },
  { keyword: 'office desk accessories', category: 'Office' },
  { keyword: 'LED lights bedroom', category: 'Home' },
  { keyword: 'hair accessories women', category: 'Beauty' },
];

async function startRun(keyword, maxResults = 60) {
  const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}&SortType=total_tranpro_desc`;

  const input = {
    startUrls: [{ url: searchUrl }],
    pageFunction: `async function pageFunction(context) {
      const { page } = context;
      await page.waitForTimeout(3000);
      const items = await page.$$eval('[class*="product-snippet"]', cards => {
        return cards.slice(0, ${maxResults}).map(card => {
          const title = card.querySelector('[class*="title"]')?.textContent?.trim() || '';
          const priceEl = card.querySelector('[class*="price"]');
          const price = priceEl?.textContent?.replace(/[^0-9.]/g, '') || '0';
          const img = card.querySelector('img')?.src || card.querySelector('img')?.getAttribute('data-src') || '';
          const link = card.querySelector('a')?.href || '';
          const orders = card.querySelector('[class*="sold"]')?.textContent?.replace(/[^0-9]/g, '') || '0';
          const rating = card.querySelector('[class*="star"]')?.textContent?.replace(/[^0-9.]/g, '') || '0';
          return { title, price: parseFloat(price), imageUrl: img, productUrl: link, orders: parseInt(orders), rating: parseFloat(rating) };
        }).filter(p => p.title && p.price > 0);
      });
      return items;
    }`,
    proxyConfiguration: { useApifyProxy: true },
    maxRequestRetries: 2,
  };

  const url = `${APIFY_BASE}/acts/apify~playwright-scraper/runs?token=${APIFY_TOKEN}&timeout=120`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error(`  Failed to start run for "${keyword}": ${res.status} ${err.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  return { runId: data?.data?.id, datasetId: data?.data?.defaultDatasetId };
}

async function checkStatus(runId) {
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`);
  const data = await res.json();
  return {
    status: data?.data?.status || 'UNKNOWN',
    datasetId: data?.data?.defaultDatasetId,
  };
}

async function fetchDataset(datasetId, limit = 200) {
  const res = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=${limit}&clean=true`);
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

async function upsertProducts(products) {
  // Batch upsert via Supabase REST API
  const url = `${SUPABASE_URL}/rest/v1/winning_products`;
  const batchSize = 50;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SKEY,
        'Authorization': `Bearer ${SKEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error(`  Upsert batch failed: ${res.status} ${err.slice(0, 300)}`);
    } else {
      console.log(`  Upserted batch ${i / batchSize + 1} (${batch.length} products)`);
    }
  }
}

function mapToWinningProduct(item, category, keyword) {
  const title = String(item.title || '').slice(0, 255);
  const priceUsd = parseFloat(String(item.price || '0').replace(/[^0-9.]/g, ''));
  if (!title || priceUsd <= 0) return null;

  const priceAud = Math.round(priceUsd * AUD_RATE * 100) / 100;
  const orders = parseInt(String(item.orders || '0').replace(/[^0-9]/g, ''), 10);
  const rating = parseFloat(String(item.rating || '0'));

  return {
    product_title: title,
    category,
    search_keyword: keyword,
    platform: 'aliexpress',
    image_url: item.imageUrl || '',
    aliexpress_url: item.productUrl || '',
    price_aud: priceAud,
    cost_price_aud: Math.round(priceAud * 0.4 * 100) / 100,
    orders_count: orders,
    rating: rating || 4.5,
    winning_score: 50,
    source: 'apify_seed',
    data_freshness: new Date().toISOString(),
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`Starting seed for ${KEYWORDS.length} keywords...`);
  console.log(`Apify token: ${APIFY_TOKEN.slice(0, 12)}...`);
  console.log(`Supabase: ${SUPABASE_URL}`);

  // Step 1: Start all runs
  const runs = [];
  for (const { keyword, category } of KEYWORDS) {
    console.log(`Starting scrape: "${keyword}" [${category}]`);
    const result = await startRun(keyword);
    if (result) {
      runs.push({ ...result, keyword, category });
      console.log(`  Run started: ${result.runId}`);
    }
    await sleep(1000); // small delay between starts
  }

  if (!runs.length) {
    console.error('No runs started. Check APIFY_API_KEY.');
    process.exit(1);
  }

  // Step 2: Wait 3 minutes for runs to complete
  console.log(`\nWaiting 3 minutes for ${runs.length} runs to complete...`);
  await sleep(180_000);

  // Step 3: Harvest results
  let totalProducts = 0;

  for (const run of runs) {
    console.log(`\nHarvesting "${run.keyword}" (run: ${run.runId})`);
    const { status, datasetId } = await checkStatus(run.runId);
    console.log(`  Status: ${status}`);

    if (status !== 'SUCCEEDED') {
      if (status === 'RUNNING') {
        console.log('  Still running — will be picked up by harvest cron');
      } else {
        console.log(`  Skipping (status: ${status})`);
      }
      continue;
    }

    const dsId = datasetId || run.datasetId;
    if (!dsId) { console.log('  No dataset ID'); continue; }

    const items = await fetchDataset(dsId);
    console.log(`  Raw items: ${items.length}`);

    // Flatten nested arrays (playwright-scraper returns array of arrays)
    const flatItems = items.flat();
    const products = flatItems
      .map(item => mapToWinningProduct(item, run.category, run.keyword))
      .filter(Boolean);

    console.log(`  Mapped products: ${products.length}`);

    if (products.length > 0) {
      await upsertProducts(products);
      totalProducts += products.length;
    }
  }

  console.log(`\nDone! Total products seeded: ${totalProducts}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
