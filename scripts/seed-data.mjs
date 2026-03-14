import postgres from '/Users/maximus/ManusMajorka/node_modules/postgres/src/index.js';

const sql = postgres('postgresql://postgres:Romania1992!Chicken.@db.ievekuazsjbdrltsdksn.supabase.co:5432/postgres', {
  ssl: 'require',
});

// ── winning_products (24 new rows) ────────────────────────────────────────────
const products = [
  { title: 'Cordless Mini Waffle Maker', category: 'Kitchen', daily: 4200, margin: 38, price: 49.95, score: 82, trend: 'rising', rel: 91, img: 'photo-1556909114-f6e7ad7d3136', ali: 'https://www.aliexpress.com/item/1005006001', tiktok: 'https://www.tiktok.com/@kitchentrends_au/video/7301001' },
  { title: 'Magnetic Phone Car Mount Pro', category: 'Auto', daily: 3800, margin: 52, price: 34.95, score: 78, trend: 'rising', rel: 88, img: 'photo-1449965408869-eaa3f722e40d', ali: 'https://www.aliexpress.com/item/1005006002', tiktok: 'https://www.tiktok.com/@automods_au/video/7301002' },
  { title: 'Silicone Air Fryer Liners Set', category: 'Kitchen', daily: 5100, margin: 61, price: 24.95, score: 90, trend: 'exploding', rel: 96, img: 'photo-1585032226651-759b368d7246', ali: 'https://www.aliexpress.com/item/1005006003', tiktok: 'https://www.tiktok.com/@airfryerau/video/7301003' },
  { title: 'Electric Foot Callus Remover', category: 'Health', daily: 6300, margin: 44, price: 44.95, score: 87, trend: 'exploding', rel: 94, img: 'photo-1515377905703-c4788e51af15', ali: 'https://www.aliexpress.com/item/1005006004', tiktok: 'https://www.tiktok.com/@beautycare_au/video/7301004' },
  { title: 'Portable Neck Fan Hands-Free', category: 'Electronics', daily: 7200, margin: 48, price: 39.95, score: 93, trend: 'exploding', rel: 97, img: 'photo-1596495578065-6e0763fa1178', ali: 'https://www.aliexpress.com/item/1005006005', tiktok: 'https://www.tiktok.com/@cooltech_au/video/7301005' },
  { title: 'Cloud Slime Stress Ball Set', category: 'Toys', daily: 3100, margin: 67, price: 19.95, score: 75, trend: 'rising', rel: 86, img: 'photo-1558618666-fcd25c85cd64', ali: 'https://www.aliexpress.com/item/1005006006', tiktok: 'https://www.tiktok.com/@slimetrend_au/video/7301006' },
  { title: 'LED Bathroom Mirror Cabinet', category: 'Home', daily: 8900, margin: 35, price: 189.95, score: 85, trend: 'rising', rel: 92, img: 'photo-1552321554-5fefe8c9ef14', ali: 'https://www.aliexpress.com/item/1005006007', tiktok: 'https://www.tiktok.com/@homedecor_au/video/7301007' },
  { title: 'Waterproof Eyebrow Stamp Kit', category: 'Beauty', daily: 4600, margin: 71, price: 22.95, score: 88, trend: 'exploding', rel: 95, img: 'photo-1522335789203-aabd1fc54bc9', ali: 'https://www.aliexpress.com/item/1005006008', tiktok: 'https://www.tiktok.com/@makeupau/video/7301008' },
  { title: 'Smart Pill Organiser Weekly', category: 'Health', daily: 2900, margin: 43, price: 29.95, score: 74, trend: 'rising', rel: 87, img: 'photo-1584308666744-24d5c474f2ae', ali: 'https://www.aliexpress.com/item/1005006009', tiktok: 'https://www.tiktok.com/@healthhacks_au/video/7301009' },
  { title: 'Collapsible Travel Water Bottle', category: 'Sports', daily: 3400, margin: 55, price: 24.95, score: 80, trend: 'rising', rel: 90, img: 'photo-1602143407151-7111542de6e8', ali: 'https://www.aliexpress.com/item/1005006010', tiktok: 'https://www.tiktok.com/@sportyau/video/7301010' },
  { title: 'Pet GPS Tracker Collar', category: 'Pet', daily: 5700, margin: 39, price: 59.95, score: 86, trend: 'exploding', rel: 93, img: 'photo-1587300003388-59208cc962cb', ali: 'https://www.aliexpress.com/item/1005006011', tiktok: 'https://www.tiktok.com/@petlovers_au/video/7301011' },
  { title: 'Reusable Silicone Food Bags', category: 'Kitchen', daily: 2800, margin: 58, price: 29.95, score: 77, trend: 'rising', rel: 89, img: 'photo-1611735341450-74d61e660ad2', ali: 'https://www.aliexpress.com/item/1005006012', tiktok: 'https://www.tiktok.com/@ecokitchen_au/video/7301012' },
  { title: 'Desk Cable Management Box', category: 'Office', daily: 3600, margin: 62, price: 34.95, score: 81, trend: 'rising', rel: 88, img: 'photo-1593642632559-0c6d3fc62b89', ali: 'https://www.aliexpress.com/item/1005006013', tiktok: 'https://www.tiktok.com/@desksetup_au/video/7301013' },
  { title: 'Acupressure Mat and Pillow Set', category: 'Wellness', daily: 7800, margin: 46, price: 69.95, score: 92, trend: 'exploding', rel: 96, img: 'photo-1506126613408-eca07ce68773', ali: 'https://www.aliexpress.com/item/1005006014', tiktok: 'https://www.tiktok.com/@wellness_au/video/7301014' },
  { title: 'Baby Food Maker Steamer Blender', category: 'Baby', daily: 6100, margin: 37, price: 79.95, score: 84, trend: 'rising', rel: 92, img: 'photo-1555252333-9f8e92e65df9', ali: 'https://www.aliexpress.com/item/1005006015', tiktok: 'https://www.tiktok.com/@mumhacks_au/video/7301015' },
  { title: 'Car Seat Gap Filler Organiser', category: 'Auto', daily: 2600, margin: 64, price: 19.95, score: 73, trend: 'rising', rel: 85, img: 'photo-1503376780353-7e6692767b70', ali: 'https://www.aliexpress.com/item/1005006016', tiktok: 'https://www.tiktok.com/@carhacks_au/video/7301016' },
  { title: 'Weighted Blanket AU Queen', category: 'Sleep', daily: 9200, margin: 32, price: 129.95, score: 89, trend: 'exploding', rel: 97, img: 'photo-1631049307264-da0ec9d70304', ali: 'https://www.aliexpress.com/item/1005006017', tiktok: 'https://www.tiktok.com/@sleeptech_au/video/7301017' },
  { title: 'Jade Roller Face Massage Set', category: 'Beauty', daily: 3300, margin: 68, price: 27.95, score: 79, trend: 'rising', rel: 90, img: 'photo-1570172619644-dfd03ed5d881', ali: 'https://www.aliexpress.com/item/1005006018', tiktok: 'https://www.tiktok.com/@skincare_au/video/7301018' },
  { title: 'Standing Desk Converter', category: 'Office', daily: 11400, margin: 29, price: 199.95, score: 94, trend: 'exploding', rel: 98, img: 'photo-1593642632559-0c6d3fc62b89', ali: 'https://www.aliexpress.com/item/1005006019', tiktok: 'https://www.tiktok.com/@officeupgrade_au/video/7301019' },
  { title: 'Dog Slow Feeder Puzzle Bowl', category: 'Pet', daily: 2200, margin: 72, price: 24.95, score: 72, trend: 'rising', rel: 86, img: 'photo-1587300003388-59208cc962cb', ali: 'https://www.aliexpress.com/item/1005006020', tiktok: 'https://www.tiktok.com/@doglife_au/video/7301020' },
  { title: 'Colour-Changing LED Plant Pot', category: 'Home', daily: 3900, margin: 54, price: 39.95, score: 82, trend: 'rising', rel: 91, img: 'photo-1485955900006-10f4d324d411', ali: 'https://www.aliexpress.com/item/1005006021', tiktok: 'https://www.tiktok.com/@plantdecor_au/video/7301021' },
  { title: 'Portable Solar Phone Charger', category: 'Electronics', daily: 4800, margin: 47, price: 54.95, score: 83, trend: 'rising', rel: 91, img: 'photo-1509391366360-2e959784a276', ali: 'https://www.aliexpress.com/item/1005006022', tiktok: 'https://www.tiktok.com/@outdoortech_au/video/7301022' },
  { title: 'Bamboo Cheese Board Gift Set', category: 'Kitchen', daily: 5500, margin: 41, price: 59.95, score: 86, trend: 'exploding', rel: 93, img: 'photo-1452195100486-9cc805987862', ali: 'https://www.aliexpress.com/item/1005006023', tiktok: 'https://www.tiktok.com/@gifting_au/video/7301023' },
  { title: 'Kids Drawing Tablet Doodle Pad', category: 'Toys', daily: 3700, margin: 58, price: 34.95, score: 80, trend: 'rising', rel: 89, img: 'photo-1596464716127-f2a82984de30', ali: 'https://www.aliexpress.com/item/1005006024', tiktok: 'https://www.tiktok.com/@kidstoys_au/video/7301024' },
];

// ── au_creators (25 new rows) ─────────────────────────────────────────────────
const creators = [
  { handle: '@aussie_finds_daily', name: 'Mia Robertson', niche: 'Home & Kitchen', followers: 420000, gmv: 85000, engagement: 7.2, tier: 'macro', verified: true },
  { handle: '@thriftqueen_au', name: 'Sophie Chang', niche: 'Beauty & Skincare', followers: 215000, gmv: 42000, engagement: 8.9, tier: 'mid', verified: false },
  { handle: '@gadgetguru_oz', name: 'Lachlan Webb', niche: 'Electronics & Tech', followers: 680000, gmv: 134000, engagement: 6.1, tier: 'macro', verified: true },
  { handle: '@petlife_brisbane', name: 'Emma Nguyen', niche: 'Pet Supplies', followers: 185000, gmv: 38000, engagement: 9.4, tier: 'mid', verified: false },
  { handle: '@fitnesshacks_melb', name: 'Jake Thornton', niche: 'Fitness & Wellness', followers: 340000, gmv: 67000, engagement: 7.8, tier: 'macro', verified: true },
  { handle: '@mumlife_sydney', name: 'Claire Davis', niche: 'Baby & Parenting', followers: 295000, gmv: 55000, engagement: 8.3, tier: 'macro', verified: false },
  { handle: '@desksetup_aus', name: 'Ryan Mitchell', niche: 'Office & Productivity', followers: 128000, gmv: 28000, engagement: 10.2, tier: 'mid', verified: false },
  { handle: '@sustainableou', name: 'Zoe Patel', niche: 'Eco & Sustainable', followers: 87000, gmv: 18000, engagement: 11.5, tier: 'micro', verified: false },
  { handle: '@kitchenqueenau', name: 'Bella Thompson', niche: 'Kitchen & Cooking', followers: 510000, gmv: 103000, engagement: 6.8, tier: 'macro', verified: true },
  { handle: '@sleepbetter_oz', name: 'Noah Williams', niche: 'Sleep & Wellness', followers: 162000, gmv: 35000, engagement: 9.1, tier: 'mid', verified: false },
  { handle: '@carmod_australia', name: 'Tyler Brooks', niche: 'Auto Accessories', followers: 445000, gmv: 89000, engagement: 7.4, tier: 'macro', verified: true },
  { handle: '@beautyboxau', name: 'Lily Chen', niche: 'Makeup & Beauty', followers: 730000, gmv: 158000, engagement: 5.9, tier: 'macro', verified: true },
  { handle: '@outdoorau_life', name: 'Sam Hunter', niche: 'Outdoor & Sports', followers: 273000, gmv: 51000, engagement: 8.0, tier: 'macro', verified: false },
  { handle: '@toyreviewer_aus', name: 'Amy Wilson', niche: 'Kids & Toys', followers: 94000, gmv: 22000, engagement: 10.8, tier: 'micro', verified: false },
  { handle: '@homeorganizeroz', name: 'Chloe Baker', niche: 'Home Organisation', followers: 389000, gmv: 76000, engagement: 7.6, tier: 'macro', verified: true },
  { handle: '@healthcoach_perth', name: 'Marcus Reed', niche: 'Health & Nutrition', followers: 201000, gmv: 44000, engagement: 8.7, tier: 'mid', verified: false },
  { handle: '@fashionfinds_au', name: 'Isla Morrison', niche: 'Fashion & Accessories', followers: 855000, gmv: 195000, engagement: 5.7, tier: 'macro', verified: true },
  { handle: '@plantmom_oz', name: 'Priya Sharma', niche: 'Home & Garden', followers: 143000, gmv: 31000, engagement: 9.6, tier: 'mid', verified: false },
  { handle: '@techdeals_sydney', name: 'Kai Anderson', niche: 'Electronics & Gadgets', followers: 376000, gmv: 72000, engagement: 7.3, tier: 'macro', verified: true },
  { handle: '@skincaremum_au', name: 'Hannah Lee', niche: 'Skincare & Wellness', followers: 118000, gmv: 26000, engagement: 10.4, tier: 'mid', verified: false },
  { handle: '@gymrat_gold_coast', name: 'Brandon Cox', niche: 'Fitness & Gym', followers: 234000, gmv: 48000, engagement: 8.5, tier: 'mid', verified: false },
  { handle: '@boho_home_au', name: 'Scarlett Jones', niche: 'Home Decor & Boho', followers: 467000, gmv: 91000, engagement: 7.1, tier: 'macro', verified: true },
  { handle: '@kidsfashion_melb', name: 'Tara Simmons', niche: 'Kids Fashion', followers: 72000, gmv: 16000, engagement: 12.1, tier: 'micro', verified: false },
  { handle: '@coffeeholic_brisbane', name: 'Oscar Martin', niche: 'Coffee & Kitchen', followers: 156000, gmv: 33000, engagement: 9.3, tier: 'mid', verified: false },
  { handle: '@travelmust_aus', name: 'Jasmine Park', niche: 'Travel Accessories', followers: 312000, gmv: 62000, engagement: 7.9, tier: 'macro', verified: true },
];

// ── trending_videos (18 new rows) ─────────────────────────────────────────────
const videos = [
  { title: 'Air fryer liner hack saves 20 min cleanup', creator: '@kitchenqueenau', product: 'Silicone Air Fryer Liners Set', views: 4200000, gmv: 82000, niche: 'Kitchen', engagement: 8.4, hook: 'POV: You never scrub your air fryer again', cta: 'Link in bio to grab yours' },
  { title: 'This neck fan changed my summer in Brisbane', creator: '@gadgetguru_oz', product: 'Portable Neck Fan Hands-Free', views: 3800000, gmv: 74000, niche: 'Electronics', engagement: 7.9, hook: '38 degrees outside, I am perfectly cool', cta: '50% off today only' },
  { title: 'Weighted blanket sleep transformation', creator: '@sleepbetter_oz', product: 'Weighted Blanket AU Queen', views: 5100000, gmv: 112000, niche: 'Sleep', engagement: 9.2, hook: 'I went from 4 hrs to 8 hrs sleep in one week', cta: 'Ships free in AU' },
  { title: 'Standing desk converter honest review', creator: '@desksetup_aus', product: 'Standing Desk Converter', views: 2900000, gmv: 95000, niche: 'Office', engagement: 8.1, hook: 'I spent $200 instead of $2000 on my sit-stand desk', cta: 'See my full setup guide' },
  { title: 'Acupressure mat 30 day results', creator: '@healthcoach_perth', product: 'Acupressure Mat and Pillow Set', views: 6700000, gmv: 118000, niche: 'Wellness', engagement: 10.3, hook: 'Day 1 vs Day 30 — my back pain is gone', cta: 'My link saves you 30%' },
  { title: 'Eyebrow stamp kit 60 second routine', creator: '@beautyboxau', product: 'Waterproof Eyebrow Stamp Kit', views: 7200000, gmv: 108000, niche: 'Beauty', engagement: 9.8, hook: 'Perfect brows in literally 60 seconds', cta: 'AU stock selling fast' },
  { title: 'Pet GPS tracker saved my dog twice', creator: '@petlife_brisbane', product: 'Pet GPS Tracker Collar', views: 1800000, gmv: 54000, niche: 'Pet', engagement: 11.2, hook: 'My dog escaped at 2am. I found him in 8 minutes.', cta: 'Every dog owner needs this' },
  { title: 'Cordless waffle maker Sunday brunch', creator: '@kitchenqueenau', product: 'Cordless Mini Waffle Maker', views: 3400000, gmv: 67000, niche: 'Kitchen', engagement: 8.6, hook: 'Waffles ready before my coffee finishes brewing', cta: 'Gifting season perfect pick' },
  { title: 'Jade roller gua sha before after', creator: '@skincaremum_au', product: 'Jade Roller Face Massage Set', views: 2600000, gmv: 48000, niche: 'Beauty', engagement: 9.1, hook: 'Morning puffiness gone in 5 minutes flat', cta: 'Grab the set not just the roller' },
  { title: 'Car seat gap organiser life hack', creator: '@carmod_australia', product: 'Car Seat Gap Filler Organiser', views: 5500000, gmv: 89000, niche: 'Auto', engagement: 8.8, hook: 'Stop dropping your phone down the seat gap forever', cta: 'Under $20 shipped AU' },
  { title: 'Baby food maker vs blender test', creator: '@mumlife_sydney', product: 'Baby Food Maker Steamer Blender', views: 1500000, gmv: 42000, niche: 'Baby', engagement: 10.5, hook: 'I tested every baby food gadget so you don\'t have to', cta: 'The one I actually use daily' },
  { title: 'Collapsible bottle for Bali trip', creator: '@travelmust_aus', product: 'Collapsible Travel Water Bottle', views: 870000, gmv: 28000, niche: 'Travel', engagement: 9.4, hook: 'This fits in my tiny crossbody when empty', cta: 'Must-pack for any trip' },
  { title: 'LED plant pot time lapse grow', creator: '@plantmom_oz', product: 'Colour-Changing LED Plant Pot', views: 2100000, gmv: 41000, niche: 'Home', engagement: 8.7, hook: 'My plant grew 3x faster with this light feature', cta: 'Perfect for apartments with no sun' },
  { title: 'Bamboo cheese board date night setup', creator: '@coffeeholic_brisbane', product: 'Bamboo Cheese Board Gift Set', views: 1300000, gmv: 35000, niche: 'Kitchen', engagement: 9.0, hook: 'Restaurant quality board for under $60', cta: 'Free engraving promo link' },
  { title: 'Kids doodle pad keeps toddler busy 1hr', creator: '@mumlife_sydney', product: 'Kids Drawing Tablet Doodle Pad', views: 4900000, gmv: 76000, niche: 'Kids', engagement: 11.6, hook: 'Screen-free and they love it more than the iPad', cta: 'Back in stock — moving fast' },
  { title: 'Solar charger hiking Grampians', creator: '@outdoorau_life', product: 'Portable Solar Phone Charger', views: 780000, gmv: 22000, niche: 'Outdoor', engagement: 9.7, hook: 'Day 3 no power — phone still at 60%', cta: 'The one I trust for remote areas' },
  { title: 'Dog slow feeder mealtime chaos fix', creator: '@petlife_brisbane', product: 'Dog Slow Feeder Puzzle Bowl', views: 3300000, gmv: 58000, niche: 'Pet', engagement: 10.1, hook: 'My lab ate so fast he was sick every day. Fixed.', cta: 'Vet-recommended design' },
  { title: 'Magnetic phone mount one hand parking', creator: '@carmod_australia', product: 'Magnetic Phone Car Mount Pro', views: 2400000, gmv: 46000, niche: 'Auto', engagement: 8.3, hook: 'Mount and unmount with one hand while driving safely', cta: 'Works with every case' },
];

// ── AU subscriber emails ──────────────────────────────────────────────────────
const firstNames = ['Emma','Liam','Olivia','Noah','Ava','William','Sophia','James','Isabella','Oliver','Mia','Benjamin','Charlotte','Elijah','Amelia','Lucas','Harper','Mason','Evelyn','Ethan','Abigail','Jack','Emily','Aiden','Elizabeth','Jackson','Sofia','Sebastian','Avery','Matthew','Ella','Samuel','Scarlett','Henry','Grace','Alexander','Victoria','Michael','Riley','Owen','Aria','Daniel','Layla','Logan','Zoe','Joseph','Penelope','Carter','Lily','Dylan'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Moore','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris'];
const domains = ['gmail.com','hotmail.com','outlook.com','yahoo.com.au','icloud.com','bigpond.com','gmail.com','gmail.com'];
const sources = ['website','tiktok','instagram','referral','google'];

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const subscribers = Array.from({ length: 50 }, (_, i) => {
  const first = firstNames[i % firstNames.length];
  const last = lastNames[Math.floor(i / 10) % lastNames.length];
  const num = i > 20 ? Math.floor(Math.random() * 99) + 1 : '';
  const email = `${first.toLowerCase()}${last.toLowerCase()}${num}@${randItem(domains)}`;
  return {
    email,
    name: `${first} ${last}`,
    source: randItem(sources),
  };
});

async function run() {
  console.log('🌱 Seeding database...');

  // ── 1. Check table schema ──────────────────────────────────────────────────
  console.log('\n📋 Checking winning_products schema...');
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'winning_products'
    ORDER BY ordinal_position
  `;
  console.log('Columns:', cols.map(c => c.column_name).join(', '));

  const currentCount = await sql`SELECT count(*) FROM public.winning_products`;
  console.log(`Current winning_products rows: ${currentCount[0].count}`);

  // ── 2. Winning products ────────────────────────────────────────────────────
  console.log('\n📦 Inserting 24 winning products...');
  let inserted = 0;
  for (const p of products) {
    const monthly = p.daily * 30;
    const supplierCost = +(p.price * (1 - p.margin / 100)).toFixed(2);
    try {
      await sql`
        INSERT INTO public.winning_products
          (product_title, category, est_daily_revenue_aud, est_monthly_revenue_aud,
           winning_score, trend, au_relevance, image_url, aliexpress_url, tiktok_url,
           price_aud, supplier_cost_aud, profit_margin)
        VALUES
          (${p.title}, ${p.category}, ${p.daily}, ${monthly},
           ${p.score}, ${p.trend}, ${p.rel},
           ${'https://images.unsplash.com/' + p.img + '?w=400&h=300&fit=crop'},
           ${p.ali}, ${p.tiktok},
           ${p.price}, ${supplierCost}, ${p.margin})
        ON CONFLICT DO NOTHING
      `;
      inserted++;
    } catch (e) {
      console.error(`  ❌ ${p.title}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${inserted}/${products.length} products inserted`);

  // ── 3. AU creators ─────────────────────────────────────────────────────────
  const creatorCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'au_creators'
    ORDER BY ordinal_position
  `;
  console.log('\n👥 au_creators columns:', creatorCols.map(c => c.column_name).join(', '));

  const creatorCount = await sql`SELECT count(*) FROM public.au_creators`;
  console.log(`Current au_creators rows: ${creatorCount[0].count}`);

  console.log('\n👥 Inserting 25 AU creators...');
  let creatorsInserted = 0;
  for (const c of creators) {
    try {
      // Try with common column names, adjust based on schema
      await sql`
        INSERT INTO public.au_creators
          (handle, name, niche, followers, gmv_monthly_aud, engagement_rate, tier, verified)
        VALUES
          (${c.handle}, ${c.name}, ${c.niche}, ${c.followers}, ${c.gmv},
           ${c.engagement}, ${c.tier}, ${c.verified})
        ON CONFLICT DO NOTHING
      `;
      creatorsInserted++;
    } catch (e) {
      console.error(`  ❌ Creator ${c.handle}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${creatorsInserted}/${creators.length} creators inserted`);

  // ── 4. Trending videos ─────────────────────────────────────────────────────
  const videoCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trending_videos'
    ORDER BY ordinal_position
  `;
  console.log('\n🎥 trending_videos columns:', videoCols.map(c => c.column_name).join(', '));

  const videoCount = await sql`SELECT count(*) FROM public.trending_videos`;
  console.log(`Current trending_videos rows: ${videoCount[0].count}`);

  console.log('\n🎥 Inserting 18 trending videos...');
  let videosInserted = 0;
  for (const v of videos) {
    try {
      await sql`
        INSERT INTO public.trending_videos
          (title, creator, product, views, gmv_aud, niche, engagement_rate, hook, cta)
        VALUES
          (${v.title}, ${v.creator}, ${v.product}, ${v.views}, ${v.gmv},
           ${v.niche}, ${v.engagement}, ${v.hook}, ${v.cta})
        ON CONFLICT DO NOTHING
      `;
      videosInserted++;
    } catch (e) {
      console.error(`  ❌ Video "${v.title}": ${e.message}`);
    }
  }
  console.log(`  ✅ ${videosInserted}/${videos.length} videos inserted`);

  // ── 5. Subscribers table ───────────────────────────────────────────────────
  console.log('\n📧 Creating subscribers table...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.subscribers (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        email text UNIQUE NOT NULL,
        name text,
        source text DEFAULT 'website',
        subscribed_at timestamptz DEFAULT now(),
        is_active boolean DEFAULT true
      )
    `;
    console.log('  ✅ Table created');

    await sql`ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY`;

    try {
      await sql`
        CREATE POLICY "Service role full access" ON public.subscribers
        FOR ALL TO service_role USING (true)
      `;
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('  ℹ️ Policy already exists');
    }
  } catch (e) {
    console.error('  ❌ Table creation error:', e.message);
  }

  console.log('\n📧 Inserting 50 subscribers...');
  let subInserted = 0;
  for (const s of subscribers) {
    try {
      await sql`
        INSERT INTO public.subscribers (email, name, source)
        VALUES (${s.email}, ${s.name}, ${s.source})
        ON CONFLICT (email) DO NOTHING
      `;
      subInserted++;
    } catch (e) {
      console.error(`  ❌ ${s.email}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${subInserted}/${subscribers.length} subscribers inserted`);

  // ── Final counts ───────────────────────────────────────────────────────────
  const [wp, ac, tv, sub] = await Promise.all([
    sql`SELECT count(*) FROM public.winning_products`,
    sql`SELECT count(*) FROM public.au_creators`,
    sql`SELECT count(*) FROM public.trending_videos`,
    sql`SELECT count(*) FROM public.subscribers`,
  ]);
  console.log('\n📊 Final counts:');
  console.log(`  winning_products: ${wp[0].count}`);
  console.log(`  au_creators: ${ac[0].count}`);
  console.log(`  trending_videos: ${tv[0].count}`);
  console.log(`  subscribers: ${sub[0].count}`);

  await sql.end();
  console.log('\n✅ Seed complete!');
}

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
