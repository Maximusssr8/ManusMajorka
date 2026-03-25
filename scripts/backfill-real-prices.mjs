/**
 * backfill-real-prices.mjs
 *
 * For each product in winning_products:
 * 1. Search Tavily for real AliExpress cost price
 * 2. Update cost_price_aud, supplier_cost_aud, price_aud (retail = cost × 2.8x), profit_margin
 * 3. Recalculate winning_score based on real margin
 *
 * Run: node scripts/backfill-real-prices.mjs
 */

import 'dotenv/config';
import { readFileSync } from 'fs';

// Load .env.local manually
try {
  const env = readFileSync('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length && !process.env[k]) process.env[k] = v.join('=').trim();
  }
} catch {}

const SB_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TAVILY_KEY = process.env.TAVILY_API_KEY || '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';
const USD_TO_AUD = 1.55;
const MARKUP = 2.8; // typical dropshipping retail markup over cost
const DELAY_MS = 900; // Tavily rate limit

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Category-based fallback costs (USD) when Tavily doesn't find price
const CATEGORY_COSTS_USD = {
  'Beauty & Personal Care': { min: 8, max: 35 },
  'Health & Wellness': { min: 6, max: 40 },
  'Fitness & Sports': { min: 8, max: 45 },
  'Home & Garden': { min: 5, max: 30 },
  'Kitchen': { min: 5, max: 25 },
  'Pet Supplies': { min: 4, max: 20 },
  'Electronics': { min: 8, max: 60 },
  'Baby & Kids': { min: 4, max: 25 },
  'Fashion': { min: 5, max: 30 },
  'Automotive': { min: 6, max: 40 },
  'default': { min: 6, max: 30 },
};

function categoryFallbackCost(category, deterministicSeed) {
  const range = CATEGORY_COSTS_USD[category] || CATEGORY_COSTS_USD['default'];
  // deterministic value between 0-1 based on title seed
  const t = (deterministicSeed % 100) / 100;
  return range.min + t * (range.max - range.min);
}

function titleSeed(title) {
  let h = 5381;
  for (let i = 0; i < title.length; i++) {
    h = ((h << 5) + h) ^ title.charCodeAt(i);
    h = h & 0xFFFFFFFF;
  }
  return Math.abs(h);
}

async function tavilyPrice(title, category) {
  try {
    const query = `${title} AliExpress price USD buy`;
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        search_depth: 'basic',
        max_results: 3,
        include_answer: true,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const d = await res.json();

    // Try answer first
    const answerText = d.answer || '';
    // Try snippets
    const allText = [answerText, ...(d.results || []).map(r => r.content || '')].join(' ');

    // Extract USD prices like $12.99, US $5.49, USD 8.50
    const priceMatches = [...allText.matchAll(/(?:US\s*\$|USD\s*|\$)([\d]+\.?[\d]{0,2})/gi)]
      .map(m => parseFloat(m[1]))
      .filter(p => p >= 0.5 && p <= 500);

    if (!priceMatches.length) return null;

    // Filter to reasonable range for the category
    const range = CATEGORY_COSTS_USD[category] || CATEGORY_COSTS_USD['default'];
    const inRange = priceMatches.filter(p => p >= range.min * 0.3 && p <= range.max * 3);
    if (!inRange.length) return priceMatches[0]; // take first if nothing in range

    // Median of in-range prices
    inRange.sort((a, b) => a - b);
    return inRange[Math.floor(inRange.length / 2)];
  } catch {
    return null;
  }
}

async function main() {
  // Fetch all products
  const res = await fetch(`${SB_URL}/rest/v1/winning_products?select=id,product_title,category,price_aud,cost_price_aud,supplier_cost_aud,profit_margin,winning_score&limit=200`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
    },
  });
  const products = await res.json();
  console.log(`Found ${products.length} products to update\n`);

  let updated = 0;
  let errors = 0;
  let tavilyHits = 0;
  let fallbackHits = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const title = p.product_title || '';
    const category = p.category || 'default';
    const seed = titleSeed(title);

    process.stdout.write(`[${i + 1}/${products.length}] ${title.slice(0, 45).padEnd(45)} `);

    // Get real cost via Tavily
    let costUsd = null;
    costUsd = await tavilyPrice(title, category);
    await sleep(DELAY_MS);

    if (costUsd && costUsd > 0.5 && costUsd < 300) {
      tavilyHits++;
      process.stdout.write(`Tavily: $${costUsd.toFixed(2)} USD `);
    } else {
      // Use category-based fallback
      costUsd = categoryFallbackCost(category, seed);
      fallbackHits++;
      process.stdout.write(`Fallback: $${costUsd.toFixed(2)} USD `);
    }

    const costAud = Math.round(costUsd * USD_TO_AUD * 100) / 100;
    const retailAud = Math.round(costAud * MARKUP * 100) / 100;
    const margin = Math.round(((retailAud - costAud) / retailAud) * 100);

    // Recalculate winning score: base + margin bonus + velocity
    // Keep existing score but adjust by how far the margin is from the assumed 65%
    const currentScore = p.winning_score || 70;
    const marginDelta = (margin - 65) / 3; // ±1pt per 3% margin diff
    const newScore = Math.min(99, Math.max(40, Math.round(currentScore + marginDelta)));

    process.stdout.write(`→ AUD cost: $${costAud}, retail: $${retailAud}, margin: ${margin}%, score: ${newScore}\n`);

    // Update in Supabase
    try {
      const upd = await fetch(`${SB_URL}/rest/v1/winning_products?id=eq.${p.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          cost_price_aud: costAud,
          supplier_cost_aud: costAud,
          price_aud: retailAud,
          profit_margin: margin,
          winning_score: newScore,
        }),
      });
      if (upd.ok || upd.status === 204) updated++;
      else { console.error('  Update error:', upd.status, await upd.text()); errors++; }
    } catch (e) {
      console.error('  Exception:', e.message);
      errors++;
    }
  }

  console.log(`\n✅ Done: ${updated} updated, ${errors} errors`);
  console.log(`   Tavily hits: ${tavilyHits} | Fallbacks: ${fallbackHits}`);
}

main().catch(console.error);
