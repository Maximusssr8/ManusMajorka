import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyMTQ0MCwiZXhwIjoyMDg3NTk3NDQwfQ.VTbTM5BCyAq843T1z1DRpkPI-0X7ZkAoD6K2q3sVX9Q';
const PEXELS_KEY = 'process.env.PEXELS_API_KEY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function pexelsSearch(query) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);
  const data = await res.json();
  return data.photos || [];
}

async function refreshAllImages() {
  const { data: products, error } = await supabase
    .from('trend_signals')
    .select('id, name, niche, image_url')
    .limit(200);

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  console.log(`Refreshing images for ${products.length} products...\n`);

  let updated = 0, failed = 0, nicheUsed = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    try {
      // Primary: search by product name
      let photos = await pexelsSearch(product.name);

      // Fallback: search by niche
      if (!photos.length) {
        photos = await pexelsSearch(product.niche);
        if (photos.length) nicheUsed++;
      }

      if (photos.length) {
        const photo = photos[0];
        const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;

        const { error: updateErr } = await supabase
          .from('trend_signals')
          .update({ image_url: imageUrl })
          .eq('id', product.id);

        if (updateErr) throw new Error(updateErr.message);

        updated++;
        const flag = photos === photos && nicheUsed > 0 && updated - nicheUsed < updated ? '' : '';
        console.log(`[${i+1}/${products.length}] ✅ ${product.name.slice(0,40)} → ${imageUrl.slice(0,65)}`);
      } else {
        failed++;
        console.log(`[${i+1}/${products.length}] ❌ ${product.name.slice(0,40)} → no image`);
      }

      // 350ms gap → ~170 req/min, well under 200/min limit
      await new Promise(r => setTimeout(r, 350));

    } catch (err) {
      failed++;
      console.error(`[${i+1}/${products.length}] ❌ ${product.name.slice(0,40)}: ${err.message}`);
      // Back off on rate-limit errors
      if (err.message.includes('429') || err.message.includes('rate')) {
        console.log('  → Rate limit hit, waiting 10s...');
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Done!`);
  console.log(`  ✅ Updated:     ${updated}`);
  console.log(`  📁 Niche fallback used: ${nicheUsed}`);
  console.log(`  ❌ Failed:      ${failed}`);
  console.log(`  📊 Total:       ${products.length}`);
}

refreshAllImages();
