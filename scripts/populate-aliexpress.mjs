#!/usr/bin/env node
/**
 * One-shot AliExpress populator.
 *
 * Runs piotrv1001/aliexpress-listings-scraper across 10 diverse keywords,
 * waits for each to complete, processes the dataset, and upserts the
 * valid products into winning_products via Supabase REST.
 *
 * Usage: APIFY_TOKEN=... SUPABASE_URL=... SUPABASE_KEY=... node populate-products.mjs
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('file:///Users/maximus/Projects/ManusMajorka/');
const { createClient } = require('@supabase/supabase-js');

// Read env from .env.local
const envText = fs.readFileSync('/Users/maximus/ManusMajorka/.env.local', 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\!/g, '!');
}

const APIFY_TOKEN = env.APIFY_API_TOKEN;
const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const AUD_RATE = 1.55;
const ACTOR = 'piotrv1001~aliexpress-listings-scraper';

if (!APIFY_TOKEN || !SERVICE_KEY) {
  console.error('Missing APIFY_API_TOKEN or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Pass 4 — fresh keywords to maximize uniqueness vs prior passes
const KEYWORDS = [
  { kw: 'bottle',      cat: 'Kitchen' },
  { kw: 'usb',         cat: 'Electronics' },
  { kw: 'silicone',    cat: 'Home & Decor' },
  { kw: 'bag',         cat: 'Fashion' },
  { kw: 'watch',       cat: 'Fashion' },
  { kw: 'smart',       cat: 'Electronics' },
  { kw: 'mini',        cat: 'Electronics' },
  { kw: 'storage',     cat: 'Home & Decor' },
  { kw: 'massage',     cat: 'Beauty & Health' },
  { kw: 'led',         cat: 'Home & Decor' },
  { kw: 'rgb',         cat: 'Electronics' },
  { kw: 'magnetic',    cat: 'Hardware' },
  { kw: 'rechargeable', cat: 'Electronics' },
  { kw: 'foldable',    cat: 'Home & Decor' },
];

function parseSold(s) {
  if (s == null) return 0;
  if (typeof s === 'number') return s;
  // "39 sold", "1.2K sold", "10K+ sold"
  const m = String(s).match(/([\d.]+)\s*(K|M)?/i);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (/k/i.test(m[2] || '')) n *= 1000;
  if (/m/i.test(m[2] || '')) n *= 1000000;
  return Math.round(n);
}

function computeScore(p) {
  const orders = p.totalSoldNum || 0;
  const price = p.priceUsd || 0;
  const rating = p.rating || 4.5;
  // Order velocity: log scale, capped at 40 pts
  const orderScore = Math.min(40, Math.log10(Math.max(1, orders)) * 11);
  // Price tier: under $5 best, drops as price climbs
  const priceScore = price < 5 ? 25 : price < 15 ? 22 : price < 30 ? 17 : price < 60 ? 12 : 8;
  // Rating: 3.0→0, 5.0→25
  const ratingScore = Math.max(0, Math.min(25, (rating - 3) * 12.5));
  // Discount bonus
  const discountBonus = (p.discountPercentage || 0) > 50 ? 10 : 5;
  return Math.min(99, Math.round(orderScore + priceScore + ratingScore + discountBonus));
}

// (validation now lives in isValidMapped, used after mapping)


async function launchRun(keyword) {
  const r = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${APIFY_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchUrls: [{ url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}` }],
      maxItemsPerSearch: 80,
    }),
  });
  const d = await r.json();
  if (d.error) throw new Error(`launch failed: ${d.error.message}`);
  return d.data.id;
}

async function waitForRun(runId, label) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    const d = await r.json();
    const status = d.data?.status;
    if (status === 'SUCCEEDED') {
      // Wait 15s for dataset writes to flush — the actor reports SUCCEEDED
      // before items are consistently readable, causing intermittent
      // 0-item datasets on hot reads.
      await new Promise((res) => setTimeout(res, 15000));
      return d.data.defaultDatasetId;
    }
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`${label} ended with ${status}`);
    }
    await new Promise((res) => setTimeout(res, 8000));
  }
  throw new Error(`${label} timed out after 4 minutes`);
}

async function fetchDataset(datasetId) {
  const r = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=200`);
  return r.json();
}

function mapItem(raw, fallbackCategory) {
  const totalSoldNum = parseSold(raw.totalSold);
  const priceUsd = Number(raw.price) || 0;
  const priceAud = priceUsd > 0 ? Math.round(priceUsd * AUD_RATE * 100) / 100 : null;
  const score = computeScore({
    totalSoldNum,
    priceUsd,
    rating: raw.rating,
    discountPercentage: raw.discountPercentage,
  });
  return {
    aliexpress_id: String(raw.id),
    product_title: raw.title,
    category: fallbackCategory,
    platform: 'aliexpress',
    price_aud: priceAud,
    sold_count: totalSoldNum,
    winning_score: score,
    image_url: raw.imageUrl,
    aliexpress_url: `https://www.aliexpress.com/item/${raw.id}.html`,
    est_daily_revenue_aud: priceAud && totalSoldNum > 0 ? Math.round((totalSoldNum / 365) * priceAud * 100) / 100 : null,
    rating: Number(raw.rating) || null,
    is_active: true,
    data_source: 'apify_listings',
    last_refreshed: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function isValidMapped(p) {
  if (!p.product_title || p.product_title.length < 5) return false;
  if (!p.sold_count || p.sold_count <= 0) return false;
  if (!p.image_url || !/^https?:/.test(p.image_url)) return false;
  if (!p.price_aud || p.price_aud <= 0) return false;
  if (!p.aliexpress_id) return false;
  return true;
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function getCount() {
  const { count } = await sb.from('winning_products').select('*', { count: 'exact', head: true });
  return count ?? 0;
}

async function main() {
  console.log('━━━ AliExpress Population ━━━');
  const before = await getCount();
  console.log(`Starting count: ${before}`);

  let totalImported = 0;
  let totalRejected = 0;
  let totalDuplicate = 0;

  let kwIdx = 0;
  for (const { kw, cat } of KEYWORDS) {
    if (kwIdx > 0) {
      // 30-second cooldown between keywords — the actor seems to lock
      // up after consecutive launches without a gap.
      console.log(`\n[cooldown] sleeping 30s...`);
      await new Promise((res) => setTimeout(res, 30000));
    }
    kwIdx += 1;
    try {
      console.log(`\n[${kw}] launching...`);
      const runId = await launchRun(kw);
      console.log(`[${kw}] run ${runId} — waiting...`);
      const datasetId = await waitForRun(runId, kw);
      const items = await fetchDataset(datasetId);
      console.log(`[${kw}] got ${items.length} raw items`);

      const mapped = items.map((it) => mapItem(it, cat));
      const valid = mapped.filter(isValidMapped);
      const rejected = mapped.length - valid.length;
      totalRejected += rejected;
      console.log(`[${kw}] ${valid.length} valid, ${rejected} rejected`);

      if (valid.length === 0) continue;

      // Dedupe both by aliexpress_id AND by product_title (DB has a
      // unique constraint on product_title+platform). Then insert one
      // at a time so a single conflict doesn't fail the whole chunk.
      const ids = valid.map((p) => p.aliexpress_id);
      const titles = valid.map((p) => p.product_title);
      const [existingById, existingByTitle] = await Promise.all([
        sb.from('winning_products').select('aliexpress_id').in('aliexpress_id', ids),
        sb.from('winning_products').select('product_title').in('product_title', titles),
      ]);
      const existingIdSet = new Set((existingById.data ?? []).map((r) => r.aliexpress_id));
      const existingTitleSet = new Set((existingByTitle.data ?? []).map((r) => r.product_title));
      const fresh = valid.filter((p) =>
        !existingIdSet.has(p.aliexpress_id) && !existingTitleSet.has(p.product_title)
      );
      const dupes = valid.length - fresh.length;
      let inserted = 0;
      // Insert one at a time so a single conflict doesn't kill a chunk
      for (const p of fresh) {
        const { error } = await sb.from('winning_products').insert(p);
        if (error) {
          if (!error.message.includes('duplicate key')) {
            console.error(`[${kw}] insert error: ${error.message}`);
          }
          continue;
        }
        inserted += 1;
      }
      totalDuplicate += dupes;
      totalImported += inserted;
      console.log(`[${kw}] inserted ${inserted} new, ${dupes} dupes`);
    } catch (err) {
      console.error(`[${kw}] FAILED:`, err.message);
    }
  }

  const after = await getCount();
  console.log('\n━━━ FINAL ━━━');
  console.log(`Before: ${before}`);
  console.log(`After:  ${after}`);
  console.log(`Net new: ${after - before}`);
  console.log(`Imported: ${totalImported}, Rejected: ${totalRejected}, Duplicate: ${totalDuplicate}`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
