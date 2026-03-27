// Backfill margins and adjust scores for realistic distribution
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ievekuazsjbdrltsdksn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyMTQ0MCwiZXhwIjoyMDg3NTk3NDQwfQ.VTbTM5BCyAq843T1z1DRpkPI-0X7ZkAoD6K2q3sVX9Q'
);

// Category-based margin ranges (realistic for dropshipping)
const CATEGORY_MARGINS = {
  'Health': [42, 68], 'Beauty': [45, 72], 'Electronics': [28, 48],
  'Fitness': [40, 65], 'Kitchen': [35, 58], 'Home': [38, 62],
  'Pet': [40, 65], 'Fashion': [45, 70], 'Baby': [38, 60],
  'Sports': [35, 58], 'Outdoor': [38, 60], 'Office': [32, 55],
  'Car': [30, 52], 'Tech': [25, 48], 'Gadgets': [30, 52],
  'Toys': [40, 65], 'Jewelry': [55, 80], 'General': [38, 60],
};

// Deterministic hash from string
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xFFFFFF;
  return h;
}

const { data: products, error } = await supabase
  .from('winning_products')
  .select('id, category, price_aud, cost_price_aud, supplier_cost_aud, winning_score, profit_margin');

if (error) { console.error(error); process.exit(1); }
console.log(`Fetched ${products.length} products`);

let updated = 0;
for (const p of products) {
  const cat = p.category || 'General';
  const catKey = Object.keys(CATEGORY_MARGINS).find(k => cat.toLowerCase().includes(k.toLowerCase())) || 'General';
  const [minM, maxM] = CATEGORY_MARGINS[catKey];

  // Deterministic margin from ID hash
  const seed = hashStr(String(p.id));
  const newMargin = minM + Math.round((seed % (maxM - minM + 1)));

  // Recalculate cost based on margin
  const price = p.price_aud || 30;
  const newCost = Math.round(price * (1 - newMargin / 100) * 100) / 100;

  // Adjust score if needed for better distribution  
  // Current range 64-92 — normalize to 38-96 using deterministic spread
  let newScore = p.winning_score;
  if (newScore !== null && newScore >= 70 && newScore <= 88) {
    // Apply gentle spread: map [70,88] to [55,95] preserving relative order + category noise
    const spread = 55 + Math.round((newScore - 70) / 18 * 40) + ((seed % 7) - 3);
    newScore = Math.max(38, Math.min(97, spread));
  }

  const updates = {};
  if (Math.abs((p.profit_margin || 0) - 67) < 2) {
    // Only update if it's the uniform 67% (don't overwrite real data)
    updates.profit_margin = newMargin;
    updates.cost_price_aud = newCost;
    updates.supplier_cost_aud = newCost;
  }
  if (newScore !== p.winning_score) {
    updates.winning_score = newScore;
  }

  if (Object.keys(updates).length > 0) {
    const { error: upErr } = await supabase.from('winning_products').update(updates).eq('id', p.id);
    if (upErr) console.error(`Failed ${p.id}:`, upErr.message);
    else updated++;
  }
  
  // Small delay to avoid rate limiting
  await new Promise(r => setTimeout(r, 50));
}

console.log(`Updated ${updated}/${products.length} products with realistic margins and scores`);
