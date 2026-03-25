import { ApifyClient } from 'apify-client';
import { readFileSync } from 'fs';

const env = readFileSync('/Users/maximus/ManusMajorka/.env.local', 'utf8');
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
}

const token = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
console.log('Token:', token?.slice(0,20) + '...');
const client = new ApifyClient({ token });

async function runTest(name, input) {
  console.log(`\n═══ ${name} ═══`);
  console.log('Input:', JSON.stringify(input));
  const start = Date.now();
  try {
    const run = await client.actor('clockworks/tiktok-scraper').call(input, { waitSecs: 60 });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Result: ${items.length} items in ${((Date.now()-start)/1000).toFixed(1)}s`);
    if (items.length > 0) {
      const s = items[0];
      console.log('Sample:', JSON.stringify({
        id: s.id,
        text: s.text?.slice(0,80),
        playCount: s.playCount,
        diggCount: s.diggCount,
        authorMeta: s.authorMeta ? { name: s.authorMeta.name, fans: s.authorMeta.fans } : null,
        hashtags: s.hashtags?.slice(0,4),
        keys: Object.keys(s),
      }, null, 2));
    }
    return items.length;
  } catch(e) {
    console.log('ERROR:', e.message);
    return -1;
  }
}

// Test 1: hashtags array (what we're currently using)
const t1 = await runTest('Test 1 — hashtags array', {
  hashtags: ['tiktokmademebuyit'],
  resultsPerPage: 5,
  shouldDownloadVideos: false,
  shouldDownloadCovers: false,
});

// Test 2: searchQueries
const t2 = await runTest('Test 2 — searchQueries', {
  searchQueries: ['tiktokmademebuyit'],
  resultsPerPage: 5,
  shouldDownloadVideos: false,
  shouldDownloadCovers: false,
});

// Test 3: profiles (known real account)
const t3 = await runTest('Test 3 — profiles', {
  profiles: ['keeohh'],
  resultsPerPage: 5,
  shouldDownloadVideos: false,
  shouldDownloadCovers: false,
});

console.log(`\n═══ SUMMARY ═══`);
console.log(`Test 1 (hashtags):     ${t1} items`);
console.log(`Test 2 (searchQueries): ${t2} items`);
console.log(`Test 3 (profiles):     ${t3} items`);
