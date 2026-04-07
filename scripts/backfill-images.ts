/**
 * One-time backfill script — extracts og:image from AliExpress product pages
 * for any winning_products row with null image_url.
 *
 * Usage:
 *   npx tsx scripts/backfill-images.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

interface Row { id: string; product_url: string | null; product_title: string | null }

async function backfill() {
  const { data: products, error } = await supabase
    .from('winning_products')
    .select('id, product_url, product_title')
    .is('image_url', null)
    .not('product_url', 'is', null)
    .limit(500);

  if (error) {
    console.error('Query failed:', error.message);
    return;
  }
  const rows = (products ?? []) as Row[];
  if (!rows.length) {
    console.log('No products to backfill');
    return;
  }
  console.log(`Backfilling ${rows.length} products...`);

  let updated = 0;
  let failed = 0;
  for (const product of rows) {
    const match = product.product_url?.match(/item\/(\d+)\.html/);
    if (!match) { failed++; continue; }
    const productId = match[1];

    try {
      const res = await fetch(`https://www.aliexpress.com/item/${productId}.html`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const html = await res.text();
      const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
      const imageUrl = ogMatch?.[1];
      if (imageUrl && imageUrl.startsWith('http')) {
        const { error: upErr } = await supabase
          .from('winning_products')
          .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
          .eq('id', product.id);
        if (upErr) { failed++; continue; }
        updated++;
        console.log(`✓ ${(product.product_title ?? '').slice(0, 50)} → ${imageUrl.slice(0, 60)}`);
      } else {
        failed++;
      }
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      failed++;
      console.log(`✗ ${product.product_title?.slice(0, 50)}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\nDone. Updated: ${updated} · Failed: ${failed}`);
}

backfill().catch((e) => { console.error(e); process.exit(1); });
