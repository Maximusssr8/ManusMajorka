/**
 * migrate-winning-products.ts
 *
 * Creates the winning_products and user_watchlist tables on first cold-start.
 * Uses the raw postgres client (works on Vercel / any server with DB access).
 * Fails gracefully when the database is unreachable (e.g. IPv6-restricted local dev).
 */

import postgres from 'postgres';

let _migrationDone = false;

// ── Seed data (15 AU winning products) ──────────────────────────────────────

const SEED_PRODUCTS = [
  { product_title: 'Posture Corrector Belt', category: 'Health & Beauty', platform: 'tiktok_shop', price_aud: 13.95, sold_count: 4200, winning_score: 92, trend: 'exploding', competition_level: 'low', au_relevance: 95, est_daily_revenue_aud: 890, units_per_day: 12, why_winning: 'Desk workers post-COVID, massive search volume AU', ad_angle: 'Fix back pain in 7 days — guaranteed', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' },
  { product_title: 'LED Strip Lights USB', category: 'Home & Kitchen', platform: 'tiktok_shop', price_aud: 10.10, sold_count: 8900, winning_score: 88, trend: 'growing', competition_level: 'medium', au_relevance: 85, est_daily_revenue_aud: 1200, units_per_day: 18, why_winning: 'Gen Z room aesthetic, gift season spike TikTok viral', ad_angle: 'Transform your room in 5 minutes', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
  { product_title: 'Car Phone Mount MagSafe', category: 'Tech', platform: 'tiktok_shop', price_aud: 11.20, sold_count: 6100, winning_score: 85, trend: 'growing', competition_level: 'low', au_relevance: 90, est_daily_revenue_aud: 780, units_per_day: 11, why_winning: 'iPhone 15 adoption wave + AU distracted driving laws', ad_angle: 'Never touch your phone while driving again', image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop' },
  { product_title: 'Resistance Band Set 5pc', category: 'Fitness', platform: 'tiktok_shop', price_aud: 14.75, sold_count: 5300, winning_score: 87, trend: 'growing', competition_level: 'medium', au_relevance: 92, est_daily_revenue_aud: 950, units_per_day: 14, why_winning: 'Home gym boom post-COVID still going strong AU', ad_angle: 'Full body workout at home for under $50', image_url: 'https://images.unsplash.com/photo-1517343985841-f8b2d66e010b?w=400&h=400&fit=crop' },
  { product_title: 'Silicone Food Bag Set', category: 'Home & Kitchen', platform: 'tiktok_shop', price_aud: 17.05, sold_count: 3800, winning_score: 82, trend: 'stable', competition_level: 'low', au_relevance: 88, est_daily_revenue_aud: 720, units_per_day: 9, why_winning: 'Eco-conscious AU market, single-use plastic bans spreading', ad_angle: 'Save money, save the planet, save your food', image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9c8a213?w=400&h=400&fit=crop' },
  { product_title: 'Pet Water Fountain Filter', category: 'Pet', platform: 'tiktok_shop', price_aud: 12.40, sold_count: 7200, winning_score: 90, trend: 'exploding', competition_level: 'low', au_relevance: 93, est_daily_revenue_aud: 1050, units_per_day: 15, why_winning: 'Pet humanisation trend — AU pet spend at all-time high', ad_angle: 'Your pet deserves fresh water 24/7', image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop' },
  { product_title: 'Scalp Massager Shampoo Brush', category: 'Health & Beauty', platform: 'tiktok_shop', price_aud: 6.99, sold_count: 9800, winning_score: 91, trend: 'exploding', competition_level: 'low', au_relevance: 89, est_daily_revenue_aud: 800, units_per_day: 22, why_winning: 'Haircare TikTok trend, sub-$10 impulse buy with high AOV bundles', ad_angle: 'Dermatologist-approved scalp treatment for $9', image_url: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&h=400&fit=crop' },
  { product_title: 'Portable Blender Bottle', category: 'Fitness', platform: 'tiktok_shop', price_aud: 21.70, sold_count: 4100, winning_score: 84, trend: 'growing', competition_level: 'medium', au_relevance: 91, est_daily_revenue_aud: 890, units_per_day: 10, why_winning: 'Health smoothie trend, office lunch guilt, gym culture', ad_angle: 'Protein shake anywhere in 30 seconds', image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop' },
  { product_title: 'Bamboo Charging Station', category: 'Tech', platform: 'tiktok_shop', price_aud: 25.60, sold_count: 2900, winning_score: 80, trend: 'growing', competition_level: 'low', au_relevance: 85, est_daily_revenue_aud: 750, units_per_day: 8, why_winning: 'Multi-device households, eco-friendly gifting AU', ad_angle: 'One station charges everything you own', image_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop' },
  { product_title: 'Ice Roller Face Massager', category: 'Health & Beauty', platform: 'tiktok_shop', price_aud: 12.10, sold_count: 5600, winning_score: 86, trend: 'growing', competition_level: 'low', au_relevance: 88, est_daily_revenue_aud: 820, units_per_day: 13, why_winning: 'Skincare TikTok AU, morning routine content going viral', ad_angle: 'Reduce puffiness in 60 seconds every morning', image_url: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&h=400&fit=crop' },
  { product_title: 'Cable Management Box', category: 'Home & Kitchen', platform: 'tiktok_shop', price_aud: 20.15, sold_count: 3200, winning_score: 79, trend: 'stable', competition_level: 'low', au_relevance: 82, est_daily_revenue_aud: 610, units_per_day: 7, why_winning: 'WFH setups, gifting for office types, desk aesthetic TikTok', ad_angle: 'Hide all your cables in one clean box', image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop' },
  { product_title: 'Mushroom Coffee Blend', category: 'Health & Beauty', platform: 'tiktok_shop', price_aud: 34.10, sold_count: 1800, winning_score: 88, trend: 'exploding', competition_level: 'low', au_relevance: 96, est_daily_revenue_aud: 990, units_per_day: 6, why_winning: 'Functional food trend, high AU health spend, stress content', ad_angle: 'Coffee that reduces stress instead of adding it', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop' },
  { product_title: 'Dog Lick Mat Slow Feeder', category: 'Pet', platform: 'tiktok_shop', price_aud: 9.61, sold_count: 6800, winning_score: 89, trend: 'exploding', competition_level: 'low', au_relevance: 94, est_daily_revenue_aud: 870, units_per_day: 19, why_winning: 'Dog anxiety content viral on TikTok AU, huge pet market', ad_angle: 'Calm your dog naturally in minutes', image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop' },
  { product_title: 'Knee Compression Sleeve', category: 'Health & Beauty', platform: 'tiktok_shop', price_aud: 13.18, sold_count: 5100, winning_score: 83, trend: 'growing', competition_level: 'medium', au_relevance: 90, est_daily_revenue_aud: 840, units_per_day: 11, why_winning: 'Ageing AU population, pickleball boom, running culture', ad_angle: 'Run pain-free — no surgery, no rest days', image_url: 'https://images.unsplash.com/photo-1571945192151-cd9c576d3e12?w=400&h=400&fit=crop' },
  { product_title: 'Reusable Grocery Bags 6pk', category: 'Home & Kitchen', platform: 'tiktok_shop', price_aud: 15.50, sold_count: 4400, winning_score: 78, trend: 'stable', competition_level: 'medium', au_relevance: 87, est_daily_revenue_aud: 580, units_per_day: 10, why_winning: 'Single-use bag ban spreading AU states, eco gifting trend', ad_angle: 'Never pay for plastic bags again — ever', image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop' },
];

// ── Migration runner ─────────────────────────────────────────────────────────

export async function runWinningProductsMigration(): Promise<void> {
  if (_migrationDone) return;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('[migrate] DATABASE_URL not set — skipping winning_products migration');
    return;
  }

  let sql: postgres.Sql | null = null;
  try {
    sql = postgres(dbUrl, { ssl: 'require', max: 1, connect_timeout: 15 });

    // ── winning_products table ───────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS public.winning_products (
        id                    uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
        product_title         text             NOT NULL,
        image_url             text,
        tiktok_product_url    text,
        shop_name             text,
        category              text,
        platform              text             DEFAULT 'tiktok_shop',
        price_aud             numeric(10,2),
        sold_count            integer,
        rating                numeric(3,1),
        review_count          integer,
        winning_score         integer          DEFAULT 0,
        trend                 text             CHECK (trend IN ('exploding','growing','stable','declining')),
        competition_level     text             CHECK (competition_level IN ('low','medium','high')),
        au_relevance          integer          DEFAULT 0,
        est_daily_revenue_aud numeric(10,2),
        units_per_day         numeric(10,2),
        why_winning           text,
        ad_angle              text,
        source                text             DEFAULT 'tiktok_shop',
        scraped_at            timestamptz      DEFAULT now(),
        scored_at             timestamptz,
        created_at            timestamptz      DEFAULT now(),
        updated_at            timestamptz      DEFAULT now(),
        UNIQUE(product_title, platform)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS wp_score_idx    ON public.winning_products(winning_score DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS wp_category_idx ON public.winning_products(category)`;
    await sql`CREATE INDEX IF NOT EXISTS wp_trend_idx    ON public.winning_products(trend)`;
    await sql`CREATE INDEX IF NOT EXISTS wp_scraped_idx  ON public.winning_products(scraped_at DESC)`;

    await sql`ALTER TABLE public.winning_products ENABLE ROW LEVEL SECURITY`;
    try { await sql`CREATE POLICY "wp_public_read"   ON public.winning_products FOR SELECT USING (true)`; } catch {}
    try { await sql`CREATE POLICY "wp_service_write" ON public.winning_products FOR ALL TO service_role USING (true) WITH CHECK (true)`; } catch {}

    // ── user_watchlist table ─────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS public.user_watchlist (
        id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
        product_id uuid        REFERENCES public.winning_products(id) ON DELETE CASCADE,
        notes      text,
        created_at timestamptz DEFAULT now(),
        UNIQUE(user_id, product_id)
      )
    `;
    await sql`ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY`;
    try { await sql`CREATE POLICY "wl_user_own" ON public.user_watchlist USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`; } catch {}

    console.log('[migrate] ✅ winning_products + user_watchlist tables ready');
    _migrationDone = true;

    // ── Seed if empty ────────────────────────────────────────────────────────
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM public.winning_products` as [{ count: string }];
    if (parseInt(count) === 0) {
      await seedViaRest();
    } else {
      console.log(`[seed] Already has ${count} rows — skipping`);
    }
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('[migrate] Tables already exist');
      _migrationDone = true;
    } else {
      console.warn('[migrate] ⚠️ Migration skipped (DB unreachable):', e.message?.slice(0, 120));
    }
  } finally {
    if (sql) { try { await sql.end(); } catch {} }
  }
}

// ── Seed via Supabase REST (works everywhere, no direct DB needed) ────────────

export async function seedViaRest(): Promise<void> {
  const url  = process.env.VITE_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.warn('[seed] Supabase env vars missing'); return; }

  // Check count first
  const check = await fetch(`${url}/rest/v1/winning_products?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!check.ok) { console.warn('[seed] Cannot check table — maybe not created yet'); return; }
  const existing = await check.json() as unknown[];
  if (existing.length > 0) { console.log('[seed] Table already seeded'); return; }

  const res = await fetch(`${url}/rest/v1/winning_products`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(SEED_PRODUCTS),
  });

  if (res.ok) {
    console.log(`[seed] ✅ Seeded ${SEED_PRODUCTS.length} AU winning products`);
  } else {
    const err = await res.text();
    console.warn('[seed] ⚠️ Seed failed:', err.slice(0, 200));
  }
}
