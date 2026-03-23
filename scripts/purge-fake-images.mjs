/**
 * purge-fake-images.mjs — Null out picsum/placeholder image URLs from Supabase tables.
 * Run: node scripts/purge-fake-images.mjs
 */

const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyMTQ0MCwiZXhwIjoyMDg3NTk3NDQwfQ.VTbTM5BCyAq843T1z1DRpkPI-0X7ZkAoD6K2q3sVX9Q';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function run() {
  // 1. Check winning_products for picsum
  const check1 = await fetch(`${SUPABASE_URL}/rest/v1/winning_products?image_url=ilike.*picsum*&select=id,product_title,image_url&limit=50`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const picsum1 = await check1.json();
  console.log('winning_products with picsum:', Array.isArray(picsum1) ? picsum1.length : 0);

  // 2. Check winning_products for placeholder.com
  const check2 = await fetch(`${SUPABASE_URL}/rest/v1/winning_products?image_url=ilike.*placeholder*&select=id,product_title,image_url&limit=50`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const placeholder1 = await check2.json();
  console.log('winning_products with placeholder:', Array.isArray(placeholder1) ? placeholder1.length : 0);

  // 3. Null out picsum in winning_products
  if (Array.isArray(picsum1) && picsum1.length > 0) {
    const r1 = await fetch(`${SUPABASE_URL}/rest/v1/winning_products?image_url=ilike.*picsum*`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ image_url: null })
    });
    console.log('Picsum cleared from winning_products:', r1.status);
  }

  // 4. Null out placeholder.com in winning_products
  if (Array.isArray(placeholder1) && placeholder1.length > 0) {
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/winning_products?image_url=ilike.*placeholder*`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ image_url: null })
    });
    console.log('Placeholder cleared from winning_products:', r2.status);
  }

  // 5. Check and clear trend_signals table
  const check3 = await fetch(`${SUPABASE_URL}/rest/v1/trend_signals?image_url=ilike.*picsum*&select=id,image_url&limit=50`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const picsum3 = await check3.json();
  console.log('trend_signals with picsum:', Array.isArray(picsum3) ? picsum3.length : 0);

  if (Array.isArray(picsum3) && picsum3.length > 0) {
    const r3 = await fetch(`${SUPABASE_URL}/rest/v1/trend_signals?image_url=ilike.*picsum*`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ image_url: null })
    });
    console.log('Picsum cleared from trend_signals:', r3.status);
  }

  const check4 = await fetch(`${SUPABASE_URL}/rest/v1/trend_signals?image_url=ilike.*placeholder*&select=id,image_url&limit=50`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const placeholder4 = await check4.json();
  console.log('trend_signals with placeholder:', Array.isArray(placeholder4) ? placeholder4.length : 0);

  if (Array.isArray(placeholder4) && placeholder4.length > 0) {
    const r4 = await fetch(`${SUPABASE_URL}/rest/v1/trend_signals?image_url=ilike.*placeholder*`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ image_url: null })
    });
    console.log('Placeholder cleared from trend_signals:', r4.status);
  }

  console.log('\nDone. Fake image URLs purged.');
}

run().catch(console.error);
