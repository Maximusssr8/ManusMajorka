import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ZENROWS_KEY = 'process.env.ZENROWS_API_KEY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function scrape(url) {
  const zenUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_KEY}&url=${encodeURIComponent(url)}&js_render=true&premium_proxy=true`;
  const res = await fetch(zenUrl, { signal: AbortSignal.timeout(45000) });
  if (!res.ok) { console.log(`  ZenRows ${res.status}`); return null; }
  const html = await res.text();

  const titleMatch = html.match(/<h1[^>]*>\s*([^<]{10,200})/i) || html.match(/<title>\s*([^<|–\-]{10,})/i);
  const title = titleMatch?.[1]?.trim().replace(/&amp;/g,'&').slice(0,200) || null;

  const imgMatches = [...html.matchAll(/"imageUrl"\s*:\s*"([^"]+\.jpg[^"]*)"/g),
                      ...html.matchAll(/"image"\s*:\s*"(\/\/ae\d+\.alicdn\.com[^"]+)"/g)];
  const images = [...new Set(imgMatches
    .map(m => m[1])
    .filter(i => i && !i.includes('thumbnail') && !i.includes('50x50'))
    .map(i => i.startsWith('//') ? `https:${i}` : i)
  )].slice(0, 5);

  const priceMatch = html.match(/["']discountPrice["']\s*:\s*["']([0-9.]+)["']/) ||
                     html.match(/["']minAmount["']\s*:\s*["']([0-9.]+)["']/) ||
                     html.match(/\$\s*([0-9]+\.[0-9]{2})/);
  const priceUsd = priceMatch ? parseFloat(priceMatch[1]) : null;

  const ordersMatch = html.match(/([0-9,]+)\+?\s*(?:sold|orders)/i);
  const orders = ordersMatch ? parseInt(ordersMatch[1].replace(/,/g,'')) : null;

  return { title, images, priceUsd, orders };
}

async function run() {
  // Get all products with real AliExpress URLs, not yet scraped
  const { data: products, error } = await supabase
    .from('trend_signals')
    .select('id, name, aliexpress_url')
    .not('aliexpress_url', 'is', null)
    .neq('aliexpress_url', 'not_found');

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  console.log(`Found ${products.length} products with AliExpress URLs\n`);

  let scraped = 0, noData = 0, failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i+1}/${products.length}] ${p.name.slice(0,45)}`);
    console.log(`  URL: ${p.aliexpress_url.slice(0,70)}`);

    try {
      const data = await scrape(p.aliexpress_url);

      if (data && (data.images.length > 0 || data.title)) {
        const updates = { real_data_scraped: true, scrape_images: data.images };
        if (data.title?.length > 5) updates.name = data.title.slice(0,200);
        if (data.images[0]) updates.image_url = data.images[0];
        if (data.priceUsd) updates.estimated_retail_aud = Math.round(data.priceUsd * 1.55 * 100) / 100;
        if (data.orders) updates.orders_count = data.orders;

        await supabase.from('trend_signals').update(updates).eq('id', p.id);
        scraped++;
        console.log(`  ✅ title: ${data.title?.slice(0,40) || 'none'} | imgs: ${data.images.length} | $${data.priceUsd || '?'} → AUD $${updates.estimated_retail_aud || '?'}`);
      } else {
        await supabase.from('trend_signals').update({ real_data_scraped: true }).eq('id', p.id);
        noData++;
        console.log(`  ⚠️  no data extracted`);
      }
    } catch (e) {
      failed++;
      console.log(`  ❌ ${e.message?.slice(0,60)}`);
    }

    // 2s between ZenRows calls — stay under rate limit
    if (i < products.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ With real data:  ${scraped}`);
  console.log(`⚠️  No data found:  ${noData}`);
  console.log(`❌ Failed:         ${failed}`);
  console.log(`📊 Total:          ${products.length}`);
}

run();
