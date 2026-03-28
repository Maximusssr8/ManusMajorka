/**
 * backfill-real-images.mjs
 * Uses Tavily image search to find real AliExpress product images for every product.
 * Replaces all Pexels/stock photos with actual alicdn.com product CDN images.
 */

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://ievekuazsjbdrltsdksn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Returns { image_url, aliexpress_url, aliexpress_id } or null
async function findRealImage(productName) {
  try {
    const query = `${productName} site:aliexpress.com`;
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_images: true,
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();

    // Prefer AliExpress CDN images (ae01.alicdn.com, ae-pic-a1.aliexpress-media.com)
    const images = (data.images || []).filter(img =>
      img && (img.includes('alicdn.com') || img.includes('aliexpress-media.com'))
    );

    // Best image = first alicdn image without query params noise
    const bestImage = images.find(img => !img.includes('?')) || images[0];

    // Extract item URL + ID from results
    const itemResult = (data.results || []).find(r =>
      r.url?.includes('aliexpress.com/item/')
    );
    const itemId = itemResult?.url?.match(/\/item\/(\d+)/)?.[1] || null;
    const itemUrl = itemId
      ? `https://www.aliexpress.com/item/${itemId}.html`
      : (itemResult?.url || null);

    if (!bestImage) return null;

    return {
      image_url: bestImage,
      aliexpress_url: itemUrl,
      aliexpress_id: itemId,
    };
  } catch {
    return null;
  }
}

async function main() {
  const { data: products, error } = await sb
    .from('winning_products')
    .select('id, product_title, image_url')
    .order('winning_score', { ascending: false });

  if (error) { console.error(error); process.exit(1); }

  console.log(`\n🔍 Backfilling real images for ${products.length} products...\n`);

  let updated = 0;
  let nulled = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${String(i+1).padStart(2,'0')}/${products.length}] ${p.product_title.slice(0, 45).padEnd(45)} `);

    const result = await findRealImage(p.product_title);

    if (result?.image_url) {
      const upd = { image_url: result.image_url };
      if (result.aliexpress_url) upd.aliexpress_url = result.aliexpress_url;
      if (result.aliexpress_id) upd.aliexpress_id = result.aliexpress_id;

      const { error: upErr } = await sb
        .from('winning_products')
        .update(upd)
        .eq('id', p.id);

      if (upErr) {
        console.log(`❌ ${upErr.message}`);
      } else {
        console.log(`✓  ${result.image_url.slice(0, 55)}`);
        updated++;
      }
    } else {
      // Remove fake stock image — NoImage component handles this gracefully
      await sb.from('winning_products').update({ image_url: null }).eq('id', p.id);
      console.log(`—  no real image found (nulled)`);
      nulled++;
    }

    // 900ms between Tavily calls to respect rate limit
    await sleep(900);
  }

  console.log(`\n✅ Done — ${updated} real images applied, ${nulled} nulled (show placeholder)`);
}

main().catch(console.error);
