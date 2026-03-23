#!/usr/bin/env node
// Run: node scripts/seed-v3.mjs
// Seeds video_intelligence and au_shop_rankings tables with 15 records each
// Requires: tables created via migrate-v3.mjs SQL first

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ievekuazsjbdrltsdksn.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=minimal',
};

async function insertRows(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to insert into ${table}: ${res.status} ${text}`);
    return false;
  }
  console.log(`Inserted ${rows.length} rows into ${table}`);
  return true;
}

const VIDEO_SEEDS = [
  { platform: 'tiktok', video_title: 'This $12 posture corrector changed my life after 8 hours at my desk', video_hook: 'POV: you fix your back pain for under $15', product_name: 'Adjustable Posture Corrector', product_image_url: 'https://images.pexels.com/photos/4498481/pexels-photo-4498481.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 953000, items_sold: 12400, views_count: 10950000, est_roas: 3.2, publish_date: '2026-03-15', revenue_trend: [120000,180000,350000,580000,750000,880000,953000] },
  { platform: 'tiktok', video_title: 'I tested every acne patch - this Korean brand wins by miles', video_hook: 'Testing 8 acne patches so you dont have to', product_name: 'Hydrocolloid Acne Patch 108 Count', product_image_url: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 720000, items_sold: 9800, views_count: 8200000, est_roas: 4.1, publish_date: '2026-03-12', revenue_trend: [80000,140000,280000,450000,580000,660000,720000] },
  { platform: 'meta', video_title: 'Resistance bands complete home gym for under $25', video_hook: 'You dont need a gym membership for this', product_name: 'Resistance Bands Set 5 Levels', product_image_url: 'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 580000, items_sold: 7600, views_count: 5400000, est_roas: 2.8, publish_date: '2026-03-10', revenue_trend: [90000,150000,220000,340000,440000,530000,580000] },
  { platform: 'tiktok', video_title: 'My dog actually uses this toy (honest review)', video_hook: 'I spent $400 on dog toys - heres what won', product_name: 'Interactive Pet Toy Laser Ball', product_image_url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 445000, items_sold: 5200, views_count: 4100000, est_roas: 3.6, publish_date: '2026-03-08', revenue_trend: [60000,100000,180000,280000,360000,410000,445000] },
  { platform: 'instagram', video_title: '5am routine with the LED desk lamp that changed everything', video_hook: 'This $35 lamp is better than my $200 one', product_name: 'LED Desk Lamp Eye Protection', product_image_url: 'https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 390000, items_sold: 4800, views_count: 3600000, est_roas: 2.4, publish_date: '2026-03-06', revenue_trend: [70000,110000,180000,260000,310000,360000,390000] },
  { platform: 'tiktok', video_title: 'Overnight teeth whitening - 7 day results honest review', video_hook: 'Dentist reacts to this $30 whitening kit', product_name: 'Teeth Whitening Kit LED Light', product_image_url: 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 320000, items_sold: 4100, views_count: 7200000, est_roas: 1.9, publish_date: '2026-03-04', revenue_trend: [40000,80000,150000,220000,270000,300000,320000] },
  { platform: 'meta', video_title: 'Blue light glasses saved my eyes working from home', video_hook: 'I had daily headaches for 6 months until this', product_name: 'Blue Light Blocking Glasses', product_image_url: 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 290000, items_sold: 3800, views_count: 2900000, est_roas: 3.3, publish_date: '2026-03-02', revenue_trend: [50000,80000,130000,190000,240000,270000,290000] },
  { platform: 'tiktok', video_title: 'This water bottle keeps ice for 24 hours - tested', video_hook: 'I left ice in this for 30 hours in 35 degree heat', product_name: 'Insulated Water Bottle 1L', product_image_url: 'https://images.pexels.com/photos/2421374/pexels-photo-2421374.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 265000, items_sold: 3400, views_count: 5800000, est_roas: 2.1, publish_date: '2026-02-28', revenue_trend: [35000,60000,110000,160000,210000,245000,265000] },
  { platform: 'instagram', video_title: 'Jade roller gua sha 30 day face transformation', video_hook: 'I did this routine every morning for 30 days', product_name: 'Rose Quartz Jade Roller Set', product_image_url: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 240000, items_sold: 3100, views_count: 4400000, est_roas: 2.7, publish_date: '2026-02-25', revenue_trend: [30000,55000,95000,150000,195000,225000,240000] },
  { platform: 'tiktok', video_title: 'Ring light set up for under $50 that looks expensive', video_hook: 'YouTubers spending $500 on lights are doing it wrong', product_name: 'Ring Light 10 Inch LED', product_image_url: 'https://images.pexels.com/photos/5082579/pexels-photo-5082579.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 215000, items_sold: 2800, views_count: 3100000, est_roas: 2.5, publish_date: '2026-02-22', revenue_trend: [30000,50000,85000,130000,170000,200000,215000] },
  { platform: 'tiktok', video_title: 'Magnetic phone mount that actually holds in potholes', video_hook: 'Every car mount fails except this one', product_name: 'Magnetic Car Phone Mount', product_image_url: 'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 198000, items_sold: 2600, views_count: 2800000, est_roas: 3.8, publish_date: '2026-02-20', revenue_trend: [25000,45000,75000,120000,155000,180000,198000] },
  { platform: 'meta', video_title: 'Portable blender that makes smoothies in 30 seconds', video_hook: 'Meal prep just got ridiculously easy', product_name: 'Portable USB Blender 600ml', product_image_url: 'https://images.pexels.com/photos/1346347/pexels-photo-1346347.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 175000, items_sold: 2200, views_count: 1900000, est_roas: 2.9, publish_date: '2026-02-18', revenue_trend: [20000,38000,65000,100000,135000,160000,175000] },
  { platform: 'tiktok', video_title: 'Sunset lamp aesthetic room transformation under $20', video_hook: 'My room went from boring to Pinterest in 5 minutes', product_name: 'Sunset Projection Lamp', product_image_url: 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 155000, items_sold: 1900, views_count: 6200000, est_roas: 1.6, publish_date: '2026-02-15', revenue_trend: [18000,32000,58000,90000,120000,142000,155000] },
  { platform: 'instagram', video_title: 'Kitchen gadget that peels garlic in 3 seconds', video_hook: 'I will never peel garlic by hand again', product_name: 'Silicone Garlic Peeler Tube', product_image_url: 'https://images.pexels.com/photos/6248740/pexels-photo-6248740.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 130000, items_sold: 1700, views_count: 2100000, est_roas: 4.2, publish_date: '2026-02-12', revenue_trend: [15000,28000,48000,75000,100000,118000,130000] },
  { platform: 'tiktok', video_title: 'Cloud slides the most comfortable shoes I own now', video_hook: 'My podiatrist recommended these $18 slides', product_name: 'Cloud Pillow Slides Unisex', product_image_url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=80', est_revenue_aud: 112000, items_sold: 1500, views_count: 3800000, est_roas: 2.2, publish_date: '2026-02-10', revenue_trend: [12000,22000,40000,65000,85000,100000,112000] },
];

const SHOP_SEEDS = [
  { shop_name: 'FitLife Australia', category: 'Fitness & Wellness', est_monthly_revenue_aud: 1800000, revenue_growth_pct: 34, items_sold_monthly: 24000, avg_unit_price_aud: 75, shop_type: 'brand', revenue_trend: [1100000,1250000,1350000,1480000,1580000,1700000,1800000], top_product_images: ['https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=60','https://images.pexels.com/photos/4498481/pexels-photo-4498481.jpeg?auto=compress&cs=tinysrgb&w=60','https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'PetCo AU Deals', category: 'Pet Accessories', est_monthly_revenue_aud: 2100000, revenue_growth_pct: 18, items_sold_monthly: 32000, avg_unit_price_aud: 65, shop_type: 'creator', revenue_trend: [1600000,1700000,1780000,1850000,1920000,2020000,2100000], top_product_images: ['https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'TechGadgets AU', category: 'Tech & Gadgets', est_monthly_revenue_aud: 1400000, revenue_growth_pct: -5, items_sold_monthly: 18000, avg_unit_price_aud: 78, shop_type: 'brand', revenue_trend: [1550000,1520000,1490000,1460000,1430000,1410000,1400000], top_product_images: ['https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'HomeEssentials AU', category: 'Home & Kitchen', est_monthly_revenue_aud: 1200000, revenue_growth_pct: 12, items_sold_monthly: 15000, avg_unit_price_aud: 80, shop_type: 'dropship', revenue_trend: [980000,1020000,1060000,1100000,1140000,1175000,1200000], top_product_images: ['https://images.pexels.com/photos/6248740/pexels-photo-6248740.jpeg?auto=compress&cs=tinysrgb&w=60','https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'BeautyByAU', category: 'Beauty & Skincare', est_monthly_revenue_aud: 980000, revenue_growth_pct: 45, items_sold_monthly: 12000, avg_unit_price_aud: 82, shop_type: 'creator', revenue_trend: [480000,580000,680000,760000,840000,920000,980000], top_product_images: ['https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=60','https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'OutdoorAussie', category: 'Outdoor & Sports', est_monthly_revenue_aud: 860000, revenue_growth_pct: 22, items_sold_monthly: 11000, avg_unit_price_aud: 78, shop_type: 'dropship', revenue_trend: [620000,670000,710000,750000,790000,830000,860000], top_product_images: ['https://images.pexels.com/photos/2421374/pexels-photo-2421374.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'SleepWell AU', category: 'Sleep & Wellness', est_monthly_revenue_aud: 720000, revenue_growth_pct: 28, items_sold_monthly: 9000, avg_unit_price_aud: 80, shop_type: 'brand', revenue_trend: [430000,490000,540000,590000,640000,685000,720000], top_product_images: ['https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'KitchenKing AU', category: 'Kitchen & Home', est_monthly_revenue_aud: 650000, revenue_growth_pct: 8, items_sold_monthly: 8500, avg_unit_price_aud: 76, shop_type: 'dropship', revenue_trend: [565000,585000,600000,615000,625000,638000,650000], top_product_images: ['https://images.pexels.com/photos/6248740/pexels-photo-6248740.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'BabyBliss AU', category: 'Baby & Kids', est_monthly_revenue_aud: 540000, revenue_growth_pct: 31, items_sold_monthly: 7200, avg_unit_price_aud: 75, shop_type: 'brand', revenue_trend: [310000,350000,390000,430000,470000,510000,540000], top_product_images: ['https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'SuppsAU', category: 'Supplements & Nutrition', est_monthly_revenue_aud: 480000, revenue_growth_pct: 15, items_sold_monthly: 6000, avg_unit_price_aud: 80, shop_type: 'brand', revenue_trend: [380000,400000,420000,440000,455000,470000,480000], top_product_images: ['https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'GlowUp Skincare', category: 'Beauty & Skincare', est_monthly_revenue_aud: 420000, revenue_growth_pct: 52, items_sold_monthly: 5500, avg_unit_price_aud: 76, shop_type: 'creator', revenue_trend: [180000,220000,270000,320000,360000,395000,420000], top_product_images: ['https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'DriveEasy AU', category: 'Automotive', est_monthly_revenue_aud: 380000, revenue_growth_pct: 10, items_sold_monthly: 4800, avg_unit_price_aud: 79, shop_type: 'dropship', revenue_trend: [320000,330000,340000,350000,360000,370000,380000], top_product_images: ['https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'CoffeeSnob AU', category: 'Coffee & Beverages', est_monthly_revenue_aud: 340000, revenue_growth_pct: 20, items_sold_monthly: 4200, avg_unit_price_aud: 81, shop_type: 'brand', revenue_trend: [230000,250000,270000,290000,310000,325000,340000], top_product_images: ['https://images.pexels.com/photos/1346347/pexels-photo-1346347.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'WanderKit AU', category: 'Travel Accessories', est_monthly_revenue_aud: 290000, revenue_growth_pct: 25, items_sold_monthly: 3600, avg_unit_price_aud: 81, shop_type: 'dropship', revenue_trend: [180000,200000,220000,240000,260000,275000,290000], top_product_images: ['https://images.pexels.com/photos/2421374/pexels-photo-2421374.jpeg?auto=compress&cs=tinysrgb&w=60'] },
  { shop_name: 'GreenThumb AU', category: 'Garden & Plants', est_monthly_revenue_aud: 250000, revenue_growth_pct: 18, items_sold_monthly: 3100, avg_unit_price_aud: 81, shop_type: 'brand', revenue_trend: [170000,185000,200000,215000,228000,240000,250000], top_product_images: ['https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=60'] },
];

async function main() {
  console.log('Seeding video_intelligence...');
  await insertRows('video_intelligence', VIDEO_SEEDS);

  console.log('Seeding au_shop_rankings...');
  await insertRows('au_shop_rankings', SHOP_SEEDS);

  console.log('\nDone! Check your Supabase dashboard for the new data.');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
