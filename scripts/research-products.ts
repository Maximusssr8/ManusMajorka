/**
 * Research real AU winning products using Tavily + Claude.
 * Outputs a TypeScript array ready to paste into WinningProducts.tsx
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env: Record<string,string> = {};
for (const line of envContent.split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx > 0) env[line.slice(0,idx).trim()] = line.slice(idx+1).trim();
}

const TAVILY_KEY = env.TAVILY_API_KEY;
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const QUERIES = [
  'best selling dropshipping products Australia 2025 2026 TikTok trending',
  'winning products AliExpress Australia high margin 2025',
  'viral TikTok shop products Australia March 2026',
  'top selling Shopify products Australia health beauty fitness 2025',
  'fast shipping dropship products australia under $100 high profit',
  'trending home kitchen products australia 2026 dropship',
  'pet products australia bestseller dropshipping 2025',
  'beauty skincare products trending australia 2026 tiktok',
];

async function tavilySearch(query: string) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TAVILY_KEY}` },
    body: JSON.stringify({ query, max_results: 6, search_depth: 'basic' }),
  });
  const data = await res.json() as any;
  return (data.results || []).map((r: any) => `${r.title}: ${r.content?.slice(0,300)}`).join('\n---\n');
}

async function main() {
  console.log('Searching for AU winning products...');
  
  const results = await Promise.allSettled(QUERIES.map(q => tavilySearch(q)));
  const allContent = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as any).value)
    .join('\n===\n')
    .slice(0, 12000);

  console.log('Got search results, asking Claude to structure...');

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `You are an expert in Australian ecommerce and dropshipping. 

Based on this research data about trending products in Australia, create a list of 69 real winning products suitable for Australian dropshippers.

Research data:
${allContent}

Requirements:
- Products must be real, specific, and currently trending in AU
- Price range: $20-200 AUD retail
- Suitable for dropshipping from China/AliExpress to Australia in 7-14 days
- NO: branded goods, TVs, large appliances, food, medicine requiring certification
- Mix of categories: Health/Beauty (20%), Fitness (15%), Home (15%), Tech (15%), Pets (10%), Fashion (10%), Other (15%)
- Each product needs realistic AU market data

Return EXACTLY this TypeScript array (no other text):
[
  {
    "product_title": "LED Therapy Face Mask",
    "category": "Health & Beauty",
    "platform": "TikTok Shop",
    "price_aud": 89,
    "sold_count": 3240,
    "winning_score": 94,
    "trend": "exploding",
    "competition_level": "low",
    "au_relevance": 92,
    "est_daily_revenue_aud": 2800,
    "units_per_day": 31,
    "why_winning": "Why this product is winning right now in Australia — specific reason with data",
    "ad_angle": "The exact ad copy angle that converts for this product in AU market"
  },
  ...69 total items
]

trend values: "exploding" | "growing" | "stable" | "declining"
competition_level: "low" | "medium" | "high"
winning_score: 50-99 (sorted descending)
au_relevance: 60-99

Only output the JSON array.`
    }]
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  // Strip markdown fences
  const cleaned = text.replace(/^```(?:json|typescript|ts)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('No JSON array found. First 600 chars of response:');
    console.error(text.slice(0, 600));
    process.exit(1);
  }

  let products: any[];
  try {
    products = JSON.parse(jsonMatch[0]);
  } catch (e) {
    // Try to salvage partial JSON
    const partialMatch = cleaned.match(/\[\s*\{[\s\S]*/);
    if (partialMatch) {
      try {
        // Try to close the array
        products = JSON.parse(partialMatch[0] + (partialMatch[0].endsWith(']') ? '' : ']'));
      } catch {
        console.error('Parse failed even with salvage:', (e as Error).message);
        console.error('Response start:', text.slice(0, 300));
        process.exit(1);
      }
    } else {
      console.error('Parse failed:', (e as Error).message);
      process.exit(1);
    }
  }

  console.log(`\nGot ${products.length} products. Generating TypeScript...\n`);

  // Add image URLs based on category/title
  const IMAGES: Record<string, string> = {
    'LED Therapy': 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Posture': 'https://images.pexels.com/photos/4498603/pexels-photo-4498603.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Resistance Band': 'https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Massage Gun': 'https://images.pexels.com/photos/3764568/pexels-photo-3764568.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Yoga': 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Pet': 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Dog': 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Cat': 'https://images.pexels.com/photos/2061057/pexels-photo-2061057.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Neck': 'https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Diffuser': 'https://images.pexels.com/photos/3270223/pexels-photo-3270223.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Fridge': 'https://images.pexels.com/photos/3990359/pexels-photo-3990359.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Planter': 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Ring Light': 'https://images.pexels.com/photos/4009402/pexels-photo-4009402.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Wireless Charg': 'https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Earb': 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Laptop': 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Foam Roller': 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Teeth': 'https://images.pexels.com/photos/3762453/pexels-photo-3762453.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Skin': 'https://images.pexels.com/photos/3373723/pexels-photo-3373723.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Watch': 'https://images.pexels.com/photos/2783873/pexels-photo-2783873.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Bag': 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Sunglasses': 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Herb': 'https://images.pexels.com/photos/4751978/pexels-photo-4751978.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Blender': 'https://images.pexels.com/photos/4397927/pexels-photo-4397927.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Jump Rope': 'https://images.pexels.com/photos/4720258/pexels-photo-4720258.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Red Light': 'https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Jade': 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Ab Roller': 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Collagen': 'https://images.pexels.com/photos/3621240/pexels-photo-3621240.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Hair': 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Eyelash': 'https://images.pexels.com/photos/2253832/pexels-photo-2253832.jpeg?auto=compress&cs=tinysrgb&w=400',
    'UV': 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Knee': 'https://images.pexels.com/photos/863926/pexels-photo-863926.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Blanket': 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Bedding': 'https://images.pexels.com/photos/6585751/pexels-photo-6585751.jpeg?auto=compress&cs=tinysrgb&w=400',
  };
  
  const CAT_FALLBACK: Record<string, string> = {
    'Health': 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Beauty': 'https://images.pexels.com/photos/3373723/pexels-photo-3373723.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Fitness': 'https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Tech': 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Home': 'https://images.pexels.com/photos/3990359/pexels-photo-3990359.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Pet': 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Fashion': 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Baby': 'https://images.pexels.com/photos/3662667/pexels-photo-3662667.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Outdoor': 'https://images.pexels.com/photos/1687093/pexels-photo-1687093.jpeg?auto=compress&cs=tinysrgb&w=400',
  };

  function getImage(title: string, category: string): string {
    for (const [kw, url] of Object.entries(IMAGES)) {
      if (title.includes(kw)) return url;
    }
    for (const [kw, url] of Object.entries(CAT_FALLBACK)) {
      if (category.includes(kw)) return url;
    }
    return 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=400';
  }

  const now = new Date().toISOString();
  const ts = products.map((p: any, i: number) => {
    const img = getImage(p.product_title, p.category);
    return `  { id: 'r${i+1}', product_title: ${JSON.stringify(p.product_title)}, category: ${JSON.stringify(p.category)}, platform: ${JSON.stringify(p.platform || 'TikTok Shop')}, price_aud: ${p.price_aud || 49}, sold_count: ${p.sold_count || 1000}, winning_score: ${p.winning_score || 70}, trend: ${JSON.stringify(p.trend || 'growing')}, competition_level: ${JSON.stringify(p.competition_level || 'medium')}, au_relevance: ${p.au_relevance || 80}, est_daily_revenue_aud: ${p.est_daily_revenue_aud || 500}, units_per_day: ${p.units_per_day || 10}, why_winning: ${JSON.stringify(p.why_winning || '')}, ad_angle: ${JSON.stringify(p.ad_angle || '')}, image_url: ${JSON.stringify(img)}, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() }`;
  });

  console.log('// RESEARCHED PRODUCTS — Replace SEEDED_PRODUCTS in WinningProducts.tsx');
  console.log('export const SEEDED_PRODUCTS: WinningProduct[] = [');
  console.log(ts.join(',\n'));
  console.log('];');
  
  console.log('\n// ✅ Done — ' + products.length + ' products generated');
}

main().catch(console.error);
