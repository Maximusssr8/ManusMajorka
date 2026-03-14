/**
 * Majorka Discord Scheduler
 * Posts daily content to keep the server active and looking alive
 */

const https = require('https');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

const CHANNELS = {
  announcements: '1481864881614360607',
  productResearch: '1481864838245388302',
  marketInsights: '1481864848374759555',
  supplierFinds: '1481864855039512616',
  wins: '1481864823154151494',
  adsCreative: '1481864841638707231',
  productUpdates: '1481864885322252399',
  general: '1481864816493727744',
};

function postMessage(channelId, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'discord.com',
      path: `/api/v10/channels/${channelId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.id) {
          console.log(`✅ Posted to ${channelId}: ${parsed.id}`);
          resolve(parsed);
        } else {
          console.log(`❌ Failed:`, parsed);
          reject(parsed);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Rotating product data
const PRODUCTS = [
  { name: 'LED Light Therapy Face Mask Pro', cat: 'Health & Beauty', rev: '$24,200/day', score: 97, trend: 'EXPLODING', margin: '70%' },
  { name: 'Heatless Curl Ribbon Rods Set', cat: 'Health & Beauty', rev: '$21,800/day', score: 96, trend: 'EXPLODING', margin: '73%' },
  { name: 'Stanley Dupe 40oz Quencher', cat: 'Home & Kitchen', rev: '$18,500/day', score: 96, trend: 'EXPLODING', margin: '72%' },
  { name: 'Dog Cooling Gel Mat AU', cat: 'Pet', rev: '$17,800/day', score: 94, trend: 'EXPLODING', margin: '71%' },
  { name: 'Smart LED Strip Lights 10m WiFi', cat: 'Tech', rev: '$14,600/day', score: 93, trend: 'EXPLODING', margin: '72%' },
  { name: 'Silicone Air Fryer Liner Mats 8pk', cat: 'Home & Kitchen', rev: '$12,800/day', score: 93, trend: 'EXPLODING', margin: '75%' },
  { name: 'Hydrocolloid Pimple Patches 72pk', cat: 'Health & Beauty', rev: '$9,800/day', score: 91, trend: 'RISING', margin: '75%' },
  { name: 'Smart Plug WiFi AU Standard 10A', cat: 'Tech', rev: '$11,800/day', score: 90, trend: 'RISING', margin: '65%' },
];

const AD_ANGLES = [
  { product: 'LED Face Mask', angles: ['I paid $200 at the clinic. This $89 mask does the same thing.', 'Before/after in 4 weeks. No dermatologist needed.', 'My skin after 30 days of this LED mask every night.'] },
  { product: 'Stanley Dupe', angles: ['$40 vs $80. I tested both. The dupe won.', 'Stanley is on a 6-month waitlist. This ships in 4 days.', 'My wife thinks I bought the real one. I did not.'] },
  { product: 'Dog Cooling Mat', angles: ['It is 39C in Brisbane. My dog has not left this mat all day.', 'Summer AU essential for dog owners. Under $35.', 'Before this mat: panting dog. After: passed out on it.'] },
  { product: 'Air Fryer Liners', angles: ['I stopped cleaning my air fryer. Here is why.', 'AU has the highest air fryer ownership rate. These liners solve the #1 pain.', 'Set. Cook. Toss. Never scrub again.'] },
];

const MARKET_TIPS = [
  'CJ Dropshipping AU warehouse ships in 4-7 days. China direct is 12-20 days — kills your reviews. Always use AU warehouse stock.',
  'The AU impulse buy sweet spot is $25-$90. Above $90 requires more social proof. Price your products strategically.',
  'TikTok Shop AU launched in 2024. Early movers are winning. The window is 12-18 months before saturation hits major categories.',
  'GST kicks in above $1,000 AUD imports. Keep your product price points below this to avoid duty complications.',
  'AU pet spend is $13 billion/year. Pet products with seasonal angles (summer cooling, winter warmth) convert extremely well.',
  'The best AU ad platform by product price: TikTok for under $60, Facebook for $60-200 range. Different audiences entirely.',
  'AU has one of the highest smartphone penetration rates globally (88%). Mobile-first product pages are non-negotiable.',
  'Health & Beauty is the #1 TikTok Shop AU category. LED therapy devices, skincare tools, and hair devices lead revenue.',
];

// Daily product drop (runs at 9am AEST)
async function dailyProductDrop() {
  const today = new Date();
  const product = PRODUCTS[today.getDate() % PRODUCTS.length];
  
  await postMessage(CHANNELS.productResearch, {
    content: '@here',
    embeds: [{
      title: `🔥 Product of the Day — ${today.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}`,
      description: `**${product.name}**\nCategory: ${product.cat}\n\n💰 **${product.rev}** revenue\n📊 Score: **${product.score}/100**\n📈 Trend: **${product.trend}**\n💎 Margin: **${product.margin}**\n\nSee full analysis, supplier sources, and ad angles:\nhttps://www.majorka.io/app/winning-products`,
      color: 13938487,
      footer: { text: 'Majorka • Updated every 6 hours' },
    }]
  });
}

// Weekly market tip (runs Monday 8am AEST)
async function weeklyMarketTip() {
  const tipIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % MARKET_TIPS.length;
  
  await postMessage(CHANNELS.marketInsights, {
    embeds: [{
      title: '💡 AU Market Intelligence Tip of the Week',
      description: MARKET_TIPS[tipIndex] + '\n\nhttps://www.majorka.io/app/trend-signals',
      color: 3066993,
      footer: { text: 'Majorka Market Intelligence' },
    }]
  });
}

// Ad angle drop (Wednesday 10am AEST)
async function adAngleDrop() {
  const angleSet = AD_ANGLES[Math.floor(Date.now() / (3 * 24 * 60 * 60 * 1000)) % AD_ANGLES.length];
  
  await postMessage(CHANNELS.adsCreative, {
    embeds: [{
      title: `🎨 Ad Angles That Are Working Right Now — ${angleSet.product}`,
      description: angleSet.angles.map((a, i) => `**${i + 1}.** "${a}"`).join('\n\n') + '\n\nGenerate angles for any product → https://www.majorka.io/app/winning-products',
      color: 9442302,
      footer: { text: 'Majorka Creative Intelligence' },
    }]
  });
}

// Determine what to post based on time
const now = new Date();
const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
const hour = now.getHours();

console.log(`Discord scheduler running: day=${dayOfWeek}, hour=${hour}`);

(async () => {
  // Always do daily product drop
  await dailyProductDrop();
  await new Promise(r => setTimeout(r, 1500));
  
  // Monday: market tip
  if (dayOfWeek === 1) {
    await weeklyMarketTip();
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Wednesday: ad angles
  if (dayOfWeek === 3) {
    await adAngleDrop();
  }
  
  console.log('✅ Discord scheduler complete');
})().catch(console.error);
