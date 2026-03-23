#!/usr/bin/env node
// Backfills velocity scores for top 10 products in winning_products
// Run: node scripts/seed-velocity.mjs

const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyMTQ0MCwiZXhwIjoyMDg3NTk3NDQwfQ.VTbTM5BCyAq843T1z1DRpkPI-0X7ZkAoD6K2q3sVX9Q';
const TAVILY_KEY = process.env.TAVILY_API_KEY || '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';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function tavilySearch(query) {
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: 'basic', max_results: 5, include_answer: false }),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return d.results || [];
  } catch { return []; }
}

function signalStrength(results, positive, negative) {
  let score = Math.min(100, results.length * 18);
  for (const r of results) {
    const t = `${r.title || ''} ${r.content || ''}`.toLowerCase();
    if (t.includes('2026')) score += 8;
    if (t.includes('australia') || t.includes('au ')) score += 5;
    for (const w of positive) if (t.includes(w)) score += 6;
    for (const w of negative) if (t.includes(w)) score -= 8;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildCurve(h, r, c) {
  return [h*0.7,h*0.85,h,(h+r)/2,r,(r+c)/2,c].map((v,i) => ({
    date: new Date(Date.now()-(6-i)*86400000).toISOString().split('T')[0],
    signal_strength: Math.max(0,Math.min(100,Math.round(v)))
  }));
}

function classify(curve, current) {
  const vals = curve.map(p => p.signal_strength);
  const recent = vals[6]-vals[4];
  const overall = vals[6]-vals[0];
  if (current < 5) return { label: 'UNKNOWN', peak_in_days: null };
  if (recent < -10 || (overall < 0 && current < 35)) return { label: 'FADING', peak_in_days: -Math.round(Math.abs(recent)/5) };
  if (current > 60 && Math.abs(recent) < 8) return { label: 'PEAK', peak_in_days: Math.round(current/10) };
  if (recent > 5 || (overall > 10 && current < 70)) return { label: 'EARLY', peak_in_days: Math.min(60, Math.max(7, Math.round((80-current)/Math.max(1,recent)))) };
  if (current >= 45) return { label: 'PEAK', peak_in_days: 7 };
  return { label: 'EARLY', peak_in_days: 21 };
}

const POSITIVE = ['trending','viral','hot','winning','popular','demand','selling fast','best seller','growth'];
const NEGATIVE = ['saturated','declining','dying','oversaturated','dead','avoid'];

async function run() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/winning_products?select=id,product_title,winning_score&order=winning_score.desc&limit=10`,{
    headers:{'apikey':K,'Authorization':'Bearer '+K}
  });
  const products = await r.json();
  if (!Array.isArray(products)) { console.error('fetch failed:', products); return; }

  console.log(`Calculating velocity for ${products.length} products...\n`);
  let done = 0;

  for (const p of products) {
    const name = (p.product_title || '').split(' ').slice(0,5).join(' ');
    console.log(`[${++done}/${products.length}] ${name}`);

    const [curr, rec, hist] = await Promise.allSettled([
      tavilySearch(`${name} trending tiktok shop australia 2026`),
      tavilySearch(`${name} dropship australia viral`),
      tavilySearch(`${name} aliexpress bestseller australia`),
    ]);

    const cs = signalStrength(curr.status==='fulfilled'?curr.value:[], POSITIVE, NEGATIVE);
    const rs = signalStrength(rec.status==='fulfilled'?rec.value:[], POSITIVE, NEGATIVE);
    const hs = signalStrength(hist.status==='fulfilled'?hist.value:[], POSITIVE, NEGATIVE);
    const curve = buildCurve(hs, rs, cs);
    const { label, peak_in_days } = classify(curve, cs);
    const score = Math.round(cs*0.5 + rs*0.3 + hs*0.2);

    console.log(`  → ${label} | score: ${score} | peak_in_days: ${peak_in_days}`);

    await fetch(`${SUPABASE_URL}/rest/v1/winning_products?id=eq.${p.id}`, {
      method: 'PATCH',
      headers: { 'apikey': K, 'Authorization': 'Bearer '+K, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ velocity_label: label, velocity_score: score, peak_in_days, velocity_curve: curve, velocity_confidence: score>60?'HIGH':score>30?'MEDIUM':'LOW' })
    });

    await sleep(800);
  }

  console.log('\nDone! Check Product Intelligence for velocity badges.');
}

run().catch(console.error);
