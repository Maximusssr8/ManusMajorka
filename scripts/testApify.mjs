import { ApifyClient } from 'apify-client';
import { readFileSync } from 'fs';

// Load .env.local manually
const env = readFileSync('.env.local', 'utf8');
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
}

const token = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
console.log('Token present:', !!token, '| Length:', token?.length);

const client = new ApifyClient({ token });

async function testTikTokScraper() {
  console.log('\n═══ Starting Apify TikTok Scraper test ═══');
  const start = Date.now();

  const run = await client.actor('clockworks/tiktok-scraper').call({
    hashtags: ['tiktokmademebuyit', 'australianshopping', 'productreview'],
    resultsPerPage: 10,
    maxRequestRetries: 3,
  });

  console.log('Run ID:', run.id);
  console.log('Status:', run.status);
  console.log('Dataset ID:', run.defaultDatasetId);
  console.log('Duration:', ((Date.now() - start) / 1000).toFixed(1) + 's');

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log(`\nTotal items returned: ${items.length}`);

  if (items.length === 0) {
    console.log('⚠️ No items returned');
    return;
  }

  console.log('\nSample item keys:', Object.keys(items[0]));

  console.log('\n─── First 3 items ───');
  items.slice(0, 3).forEach((item, i) => {
    console.log(`\n--- Item ${i + 1} ---`);
    // Show most relevant fields compactly
    const useful = {
      id: item.id,
      text: item.text?.slice(0, 100),
      authorMeta: item.authorMeta ? {
        id: item.authorMeta.id,
        name: item.authorMeta.name,
        nickName: item.authorMeta.nickName,
        fans: item.authorMeta.fans,
        heart: item.authorMeta.heart,
        verified: item.authorMeta.verified,
      } : undefined,
      musicMeta: item.musicMeta?.musicName,
      hashtags: item.hashtags?.map(h => h.name),
      playCount: item.playCount,
      diggCount: item.diggCount,
      shareCount: item.shareCount,
      commentCount: item.commentCount,
      webVideoUrl: item.webVideoUrl,
      createTimeISO: item.createTimeISO,
    };
    console.log(JSON.stringify(useful, null, 2));
  });

  console.log(`\n═══ Done in ${((Date.now() - start) / 1000).toFixed(1)}s ═══`);
}

testTikTokScraper().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
