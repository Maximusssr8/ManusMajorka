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

    // ── au_creators table ────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS public.au_creators (
        id                      uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
        username                text             NOT NULL,
        display_name            text,
        avatar_url              text,
        follower_count          integer          DEFAULT 0,
        gmv_30d_aud             numeric          DEFAULT 0,
        gmv_growth_rate         numeric          DEFAULT 0,
        items_sold_30d          integer          DEFAULT 0,
        avg_video_views         integer          DEFAULT 0,
        engagement_rate         numeric          DEFAULT 0,
        top_categories          text[]           DEFAULT '{}',
        commission_rate         numeric          DEFAULT 15,
        creator_conversion_ratio numeric         DEFAULT 0,
        tiktok_url              text,
        is_verified             boolean          DEFAULT false,
        location                text             DEFAULT 'Australia',
        revenue_sparkline       jsonb            DEFAULT '[]',
        scraped_at              timestamptz      DEFAULT now(),
        UNIQUE(username)
      )
    `;
    await sql`ALTER TABLE public.au_creators ENABLE ROW LEVEL SECURITY`;
    try { await sql`CREATE POLICY "ac_public_read" ON public.au_creators FOR SELECT USING (true)`; } catch {}
    try { await sql`CREATE POLICY "ac_service_write" ON public.au_creators FOR ALL TO service_role USING (true) WITH CHECK (true)`; } catch {}

    // ── trending_videos table ────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS public.trending_videos (
        id                      uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
        video_title             text,
        creator_username        text,
        product_name            text,
        thumbnail_url           text,
        tiktok_video_url        text,
        views                   integer          DEFAULT 0,
        likes                   integer          DEFAULT 0,
        gmv_driven_aud          numeric          DEFAULT 0,
        items_sold_from_video   integer          DEFAULT 0,
        engagement_rate         numeric          DEFAULT 0,
        hook_type               text,
        category                text,
        published_at            timestamptz,
        scraped_at              timestamptz      DEFAULT now()
      )
    `;
    await sql`ALTER TABLE public.trending_videos ENABLE ROW LEVEL SECURITY`;
    try { await sql`CREATE POLICY "tv_public_read" ON public.trending_videos FOR SELECT USING (true)`; } catch {}
    try { await sql`CREATE POLICY "tv_service_write" ON public.trending_videos FOR ALL TO service_role USING (true) WITH CHECK (true)`; } catch {}

    // ── category_rankings table ──────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS public.category_rankings (
        id                    uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
        category_name         text             NOT NULL UNIQUE,
        total_products        integer          DEFAULT 0,
        total_gmv_aud         numeric          DEFAULT 0,
        revenue_growth_rate   numeric          DEFAULT 0,
        top_product_title     text,
        avg_price_aud         numeric          DEFAULT 0,
        creator_count         integer          DEFAULT 0,
        competition_level     text             DEFAULT 'medium',
        trend                 text             DEFAULT 'growing',
        au_opportunity_score  integer          DEFAULT 75,
        updated_at            timestamptz      DEFAULT now()
      )
    `;
    await sql`ALTER TABLE public.category_rankings ENABLE ROW LEVEL SECURITY`;
    try { await sql`CREATE POLICY "cr_public_read" ON public.category_rankings FOR SELECT USING (true)`; } catch {}
    try { await sql`CREATE POLICY "cr_service_write" ON public.category_rankings FOR ALL TO service_role USING (true) WITH CHECK (true)`; } catch {}

    // ── search_cache table ───────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS public.search_cache (
        id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
        query      text        NOT NULL,
        results    jsonb       NOT NULL,
        searched_at timestamptz DEFAULT now()
      )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS search_cache_query_idx ON public.search_cache(query)`;
    await sql`ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY`;
    try { await sql`CREATE POLICY "sc_public_read"   ON public.search_cache FOR SELECT USING (true)`; } catch {}
    try { await sql`CREATE POLICY "sc_service_write" ON public.search_cache FOR ALL TO service_role USING (true) WITH CHECK (true)`; } catch {}

    // ── user_search_history table ────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS public.user_search_history (
        id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id     text        NOT NULL,
        query       text        NOT NULL,
        searched_at timestamptz DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS user_search_history_user_idx ON public.user_search_history(user_id)`;
    await sql`ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY`;
    try { await sql`CREATE POLICY "ush_public_read"   ON public.user_search_history FOR SELECT USING (true)`; } catch {}
    try { await sql`CREATE POLICY "ush_service_write" ON public.user_search_history FOR ALL TO service_role USING (true) WITH CHECK (true)`; } catch {}

    console.log('[migrate] ✅ au_creators + trending_videos + category_rankings + search_cache + user_search_history tables ready');
    _migrationDone = true;

    // ── Seed if empty ────────────────────────────────────────────────────────
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM public.winning_products` as [{ count: string }];
    if (parseInt(count) === 0) {
      await seedViaRest();
    } else {
      console.log(`[seed] Already has ${count} rows — skipping`);
    }

    // ── Seed intelligence tables if empty ───────────────────────────────────
    const [{ count: creatorCount }] = await sql`SELECT COUNT(*) as count FROM public.au_creators` as [{ count: string }];
    if (parseInt(creatorCount) === 0) {
      await seedIntelligenceData();
    } else {
      console.log(`[seed] au_creators already has ${creatorCount} rows — skipping`);
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

// ── Intelligence seed data ───────────────────────────────────────────────────

const SEED_CREATORS = [
  { username: 'aussie_finds_daily', display_name: 'Aussie Finds Daily', avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=80&h=80&fit=crop&crop=face', follower_count: 284000, gmv_30d_aud: 48200, gmv_growth_rate: 34.2, items_sold_30d: 1840, avg_video_views: 92000, engagement_rate: 4.8, top_categories: ['Health & Beauty', 'Home & Kitchen'], commission_rate: 15, creator_conversion_ratio: 3.2, tiktok_url: 'https://tiktok.com/@aussie_finds_daily', is_verified: true, location: 'Sydney, NSW', revenue_sparkline: '[28000,31000,29500,35000,38000,42000,45000,48200]' },
  { username: 'melb_lifestyle_picks', display_name: 'Mel & Co Lifestyle', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', follower_count: 127000, gmv_30d_aud: 31500, gmv_growth_rate: 28.7, items_sold_30d: 1240, avg_video_views: 54000, engagement_rate: 6.1, top_categories: ['Fitness', 'Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 4.1, tiktok_url: 'https://tiktok.com/@melb_lifestyle_picks', is_verified: false, location: 'Melbourne, VIC', revenue_sparkline: '[18000,20000,22000,24500,26000,28000,30000,31500]' },
  { username: 'brisbane_budget_finds', display_name: 'Bris Budget Queen', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', follower_count: 89000, gmv_30d_aud: 22800, gmv_growth_rate: 41.5, items_sold_30d: 980, avg_video_views: 38000, engagement_rate: 7.3, top_categories: ['Home & Kitchen', 'Baby & Kids'], commission_rate: 15, creator_conversion_ratio: 4.8, tiktok_url: 'https://tiktok.com/@brisbane_budget_finds', is_verified: false, location: 'Brisbane, QLD', revenue_sparkline: '[10000,12000,14000,16100,18000,19500,21000,22800]' },
  { username: 'petlover_au', display_name: 'PetLover AU', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', follower_count: 412000, gmv_30d_aud: 67400, gmv_growth_rate: 22.1, items_sold_30d: 2890, avg_video_views: 145000, engagement_rate: 5.2, top_categories: ['Pet', 'Home & Kitchen'], commission_rate: 15, creator_conversion_ratio: 2.9, tiktok_url: 'https://tiktok.com/@petlover_au', is_verified: true, location: 'Gold Coast, QLD', revenue_sparkline: '[45000,48000,50000,54000,58000,61000,64000,67400]' },
  { username: 'techdeals_oz', display_name: 'Tech Deals OZ', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', follower_count: 198000, gmv_30d_aud: 54100, gmv_growth_rate: 19.8, items_sold_30d: 1560, avg_video_views: 78000, engagement_rate: 3.9, top_categories: ['Tech', 'Home & Kitchen'], commission_rate: 15, creator_conversion_ratio: 2.7, tiktok_url: 'https://tiktok.com/@techdeals_oz', is_verified: true, location: 'Perth, WA', revenue_sparkline: '[38000,40000,43000,46000,48000,50000,52000,54100]' },
  { username: 'skincare_syd', display_name: 'Skincare by Syd', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', follower_count: 56000, gmv_30d_aud: 18600, gmv_growth_rate: 52.3, items_sold_30d: 890, avg_video_views: 29000, engagement_rate: 8.9, top_categories: ['Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 5.6, tiktok_url: 'https://tiktok.com/@skincare_syd', is_verified: false, location: 'Sydney, NSW', revenue_sparkline: '[6000,8000,9500,11000,13000,15000,17000,18600]' },
  { username: 'homegym_aus', display_name: 'Home Gym Australia', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face', follower_count: 320000, gmv_30d_aud: 41800, gmv_growth_rate: 15.4, items_sold_30d: 1320, avg_video_views: 110000, engagement_rate: 4.4, top_categories: ['Fitness', 'Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 3.1, tiktok_url: 'https://tiktok.com/@homegym_aus', is_verified: true, location: 'Adelaide, SA', revenue_sparkline: '[30000,32000,34000,36000,37500,39000,40500,41800]' },
  { username: 'babyfinds_au', display_name: 'Baby Finds AU', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face', follower_count: 43000, gmv_30d_aud: 14200, gmv_growth_rate: 63.8, items_sold_30d: 680, avg_video_views: 22000, engagement_rate: 9.2, top_categories: ['Baby & Kids', 'Home & Kitchen'], commission_rate: 15, creator_conversion_ratio: 5.9, tiktok_url: 'https://tiktok.com/@babyfinds_au', is_verified: false, location: 'Melbourne, VIC', revenue_sparkline: '[4000,5500,7000,8500,10000,11500,13000,14200]' },
  { username: 'foodie_finds_oz', display_name: 'Foodie Finds OZ', avatar_url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face', follower_count: 74000, gmv_30d_aud: 19800, gmv_growth_rate: 38.1, items_sold_30d: 840, avg_video_views: 41000, engagement_rate: 6.8, top_categories: ['Food & Beverage', 'Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 4.3, tiktok_url: 'https://tiktok.com/@foodie_finds_oz', is_verified: false, location: 'Brisbane, QLD', revenue_sparkline: '[10000,12000,13500,15000,16500,17500,18800,19800]' },
  { username: 'fashion_au_daily', display_name: 'Fashion AU Daily', avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face', follower_count: 231000, gmv_30d_aud: 38400, gmv_growth_rate: 11.2, items_sold_30d: 1580, avg_video_views: 87000, engagement_rate: 4.1, top_categories: ['Fashion', 'Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 2.8, tiktok_url: 'https://tiktok.com/@fashion_au_daily', is_verified: true, location: 'Sydney, NSW', revenue_sparkline: '[30000,32000,33000,34500,35500,36500,37500,38400]' },
  { username: 'nifty_nora_au', display_name: 'Nifty Nora', avatar_url: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=80&h=80&fit=crop&crop=face', follower_count: 28000, gmv_30d_aud: 9400, gmv_growth_rate: 78.4, items_sold_30d: 420, avg_video_views: 15000, engagement_rate: 11.2, top_categories: ['Home & Kitchen', 'Pet'], commission_rate: 15, creator_conversion_ratio: 6.4, tiktok_url: 'https://tiktok.com/@nifty_nora_au', is_verified: false, location: 'Darwin, NT', revenue_sparkline: '[2000,3000,4000,5500,6500,7500,8500,9400]' },
  { username: 'ecolife_aussie', display_name: 'EcoLife Aussie', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face', follower_count: 165000, gmv_30d_aud: 28900, gmv_growth_rate: 25.6, items_sold_30d: 1140, avg_video_views: 62000, engagement_rate: 5.5, top_categories: ['Home & Kitchen', 'Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 3.7, tiktok_url: 'https://tiktok.com/@ecolife_aussie', is_verified: false, location: 'Melbourne, VIC', revenue_sparkline: '[18000,20000,22000,23500,25000,26500,28000,28900]' },
  { username: 'dogmum_au', display_name: 'Dog Mum AU', avatar_url: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=80&h=80&fit=crop&crop=face', follower_count: 92000, gmv_30d_aud: 24600, gmv_growth_rate: 45.2, items_sold_30d: 1080, avg_video_views: 48000, engagement_rate: 7.8, top_categories: ['Pet'], commission_rate: 15, creator_conversion_ratio: 4.6, tiktok_url: 'https://tiktok.com/@dogmum_au', is_verified: false, location: 'Gold Coast, QLD', revenue_sparkline: '[10000,13000,15000,17000,19500,21000,23000,24600]' },
  { username: 'kitchen_hacks_oz', display_name: 'Kitchen Hacks OZ', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face', follower_count: 382000, gmv_30d_aud: 52300, gmv_growth_rate: 17.9, items_sold_30d: 2100, avg_video_views: 128000, engagement_rate: 4.6, top_categories: ['Home & Kitchen', 'Food & Beverage'], commission_rate: 15, creator_conversion_ratio: 3.4, tiktok_url: 'https://tiktok.com/@kitchen_hacks_oz', is_verified: true, location: 'Sydney, NSW', revenue_sparkline: '[38000,41000,44000,46000,48000,49500,51000,52300]' },
  { username: 'wellness_oz', display_name: 'Wellness OZ', avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face', follower_count: 145000, gmv_30d_aud: 35700, gmv_growth_rate: 29.4, items_sold_30d: 1290, avg_video_views: 58000, engagement_rate: 5.8, top_categories: ['Health & Beauty', 'Fitness', 'Food & Beverage'], commission_rate: 15, creator_conversion_ratio: 3.9, tiktok_url: 'https://tiktok.com/@wellness_oz', is_verified: false, location: 'Brisbane, QLD', revenue_sparkline: '[22000,25000,27000,29000,31000,33000,34500,35700]' },
  { username: 'trendy_threads_au', display_name: 'Trendy Threads AU', avatar_url: 'https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=80&h=80&fit=crop&crop=face', follower_count: 67000, gmv_30d_aud: 16300, gmv_growth_rate: 33.7, items_sold_30d: 720, avg_video_views: 31000, engagement_rate: 6.4, top_categories: ['Fashion'], commission_rate: 15, creator_conversion_ratio: 4.2, tiktok_url: 'https://tiktok.com/@trendy_threads_au', is_verified: false, location: 'Melbourne, VIC', revenue_sparkline: '[8000,9500,11000,12500,13500,14500,15500,16300]' },
  { username: 'au_gadget_king', display_name: 'AU Gadget King', avatar_url: 'https://images.unsplash.com/photo-1618641986557-1ecd230959aa?w=80&h=80&fit=crop&crop=face', follower_count: 510000, gmv_30d_aud: 78900, gmv_growth_rate: 13.6, items_sold_30d: 2340, avg_video_views: 182000, engagement_rate: 3.7, top_categories: ['Tech', 'Home & Kitchen'], commission_rate: 15, creator_conversion_ratio: 2.5, tiktok_url: 'https://tiktok.com/@au_gadget_king', is_verified: true, location: 'Sydney, NSW', revenue_sparkline: '[58000,62000,65000,68000,71000,74000,76500,78900]' },
  { username: 'mum_approved_au', display_name: 'Mum Approved AU', avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face', follower_count: 38000, gmv_30d_aud: 11800, gmv_growth_rate: 56.9, items_sold_30d: 510, avg_video_views: 19000, engagement_rate: 9.8, top_categories: ['Baby & Kids', 'Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 6.1, tiktok_url: 'https://tiktok.com/@mum_approved_au', is_verified: false, location: 'Perth, WA', revenue_sparkline: '[4000,5500,7000,8000,9200,10200,11000,11800]' },
  { username: 'fitlife_brisbane', display_name: 'FitLife Brisbane', avatar_url: 'https://images.unsplash.com/photo-1542178243-bc20204b769f?w=80&h=80&fit=crop&crop=face', follower_count: 112000, gmv_30d_aud: 26400, gmv_growth_rate: 22.8, items_sold_30d: 980, avg_video_views: 46000, engagement_rate: 5.9, top_categories: ['Fitness', 'Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 3.8, tiktok_url: 'https://tiktok.com/@fitlife_brisbane', is_verified: false, location: 'Brisbane, QLD', revenue_sparkline: '[18000,19500,21000,22500,23500,24500,25500,26400]' },
  { username: 'bargain_radar_au', display_name: 'Bargain Radar AU', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face', follower_count: 195000, gmv_30d_aud: 33600, gmv_growth_rate: 18.3, items_sold_30d: 1470, avg_video_views: 72000, engagement_rate: 4.9, top_categories: ['Home & Kitchen', 'Tech', 'Health & Beauty'], commission_rate: 15, creator_conversion_ratio: 3.3, tiktok_url: 'https://tiktok.com/@bargain_radar_au', is_verified: false, location: 'Adelaide, SA', revenue_sparkline: '[24000,26000,28000,29500,30500,31500,32500,33600]' },
];

const SEED_VIDEOS = [
  { video_title: 'I tried this posture corrector for 30 days 😱', creator_username: 'wellness_oz', product_name: 'Posture Corrector Belt', thumbnail_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@wellness_oz/video/1', views: 1840000, likes: 124000, gmv_driven_aud: 14200, items_sold_from_video: 1020, engagement_rate: 8.4, hook_type: 'Testimonial', category: 'Health & Beauty', published_at: '2026-03-01T10:00:00Z' },
  { video_title: 'My dog literally will not stop using this 🐕', creator_username: 'dogmum_au', product_name: 'Dog Lick Mat Slow Feeder', thumbnail_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@dogmum_au/video/2', views: 2100000, likes: 187000, gmv_driven_aud: 11800, items_sold_from_video: 1230, engagement_rate: 10.2, hook_type: 'POV', category: 'Pet', published_at: '2026-03-03T14:00:00Z' },
  { video_title: 'POV: adding this to your car 🚗✨', creator_username: 'au_gadget_king', product_name: 'Car Phone Mount MagSafe', thumbnail_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@au_gadget_king/video/3', views: 980000, likes: 62000, gmv_driven_aud: 8900, items_sold_from_video: 795, engagement_rate: 7.1, hook_type: 'POV', category: 'Tech', published_at: '2026-03-05T08:00:00Z' },
  { video_title: 'This $9 scalp brush saved my hair 🤯', creator_username: 'skincare_syd', product_name: 'Scalp Massager Shampoo Brush', thumbnail_url: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@skincare_syd/video/4', views: 3200000, likes: 298000, gmv_driven_aud: 18400, items_sold_from_video: 2630, engagement_rate: 11.8, hook_type: 'Problem/Solution', category: 'Health & Beauty', published_at: '2026-03-02T18:00:00Z' },
  { video_title: 'Meal prep just got 10x easier 🥗', creator_username: 'kitchen_hacks_oz', product_name: 'Silicone Food Bag Set', thumbnail_url: 'https://images.unsplash.com/photo-1604719312566-8912e9c8a213?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@kitchen_hacks_oz/video/5', views: 1560000, likes: 98000, gmv_driven_aud: 9800, items_sold_from_video: 575, engagement_rate: 7.8, hook_type: 'Demo', category: 'Home & Kitchen', published_at: '2026-03-04T12:00:00Z' },
  { video_title: 'Unboxing the LED strips everyone is talking about', creator_username: 'aussie_finds_daily', product_name: 'LED Strip Lights USB', thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@aussie_finds_daily/video/6', views: 870000, likes: 54000, gmv_driven_aud: 7200, items_sold_from_video: 713, engagement_rate: 7.2, hook_type: 'Unboxing', category: 'Home & Kitchen', published_at: '2026-03-06T20:00:00Z' },
  { video_title: 'Mushroom coffee review — does it actually work?', creator_username: 'wellness_oz', product_name: 'Mushroom Coffee Blend', thumbnail_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@wellness_oz/video/7', views: 620000, likes: 41000, gmv_driven_aud: 12400, items_sold_from_video: 364, engagement_rate: 8.0, hook_type: 'Testimonial', category: 'Health & Beauty', published_at: '2026-03-07T09:00:00Z' },
  { video_title: 'These resistance bands are INSANE for home workouts', creator_username: 'homegym_aus', product_name: 'Resistance Band Set 5pc', thumbnail_url: 'https://images.unsplash.com/photo-1517343985841-f8b2d66e010b?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@homegym_aus/video/8', views: 1240000, likes: 88000, gmv_driven_aud: 10600, items_sold_from_video: 719, engagement_rate: 8.8, hook_type: 'Demo', category: 'Fitness', published_at: '2026-03-01T16:00:00Z' },
  { video_title: 'I got this for my cat and now she wont stop drinking 😂', creator_username: 'petlover_au', product_name: 'Pet Water Fountain Filter', thumbnail_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@petlover_au/video/9', views: 4800000, likes: 512000, gmv_driven_aud: 24600, items_sold_from_video: 1984, engagement_rate: 12.1, hook_type: 'POV', category: 'Pet', published_at: '2026-02-28T19:00:00Z' },
  { video_title: 'Protein shake anywhere — no gym required', creator_username: 'fitlife_brisbane', product_name: 'Portable Blender Bottle', thumbnail_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@fitlife_brisbane/video/10', views: 490000, likes: 32000, gmv_driven_aud: 6100, items_sold_from_video: 281, engagement_rate: 7.5, hook_type: 'Demo', category: 'Fitness', published_at: '2026-03-08T11:00:00Z' },
  { video_title: 'My morning skincare routine with this ice roller 🧊', creator_username: 'skincare_syd', product_name: 'Ice Roller Face Massager', thumbnail_url: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@skincare_syd/video/11', views: 1100000, likes: 93000, gmv_driven_aud: 8800, items_sold_from_video: 728, engagement_rate: 10.1, hook_type: 'Testimonial', category: 'Health & Beauty', published_at: '2026-03-05T07:30:00Z' },
  { video_title: 'The desk cable organiser that changed my WFH life', creator_username: 'techdeals_oz', product_name: 'Cable Management Box', thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@techdeals_oz/video/12', views: 380000, likes: 21000, gmv_driven_aud: 5200, items_sold_from_video: 258, engagement_rate: 6.4, hook_type: 'Problem/Solution', category: 'Tech', published_at: '2026-03-09T13:00:00Z' },
  { video_title: 'Baby finds haul — everything under $25', creator_username: 'babyfinds_au', product_name: 'Baby & Kids Essentials', thumbnail_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@babyfinds_au/video/13', views: 720000, likes: 68000, gmv_driven_aud: 7800, items_sold_from_video: 580, engagement_rate: 11.4, hook_type: 'Unboxing', category: 'Baby & Kids', published_at: '2026-03-06T17:00:00Z' },
  { video_title: 'Eco bag haul that actually looks cute 🌿', creator_username: 'ecolife_aussie', product_name: 'Reusable Grocery Bags 6pk', thumbnail_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@ecolife_aussie/video/14', views: 540000, likes: 38000, gmv_driven_aud: 4900, items_sold_from_video: 316, engagement_rate: 8.3, hook_type: 'Unboxing', category: 'Home & Kitchen', published_at: '2026-03-07T15:00:00Z' },
  { video_title: 'BEST knee sleeve for runners — honest review', creator_username: 'fitlife_brisbane', product_name: 'Knee Compression Sleeve', thumbnail_url: 'https://images.unsplash.com/photo-1571945192151-cd9c576d3e12?w=400&h=300&fit=crop', tiktok_video_url: 'https://tiktok.com/@fitlife_brisbane/video/15', views: 860000, likes: 71000, gmv_driven_aud: 9400, items_sold_from_video: 714, engagement_rate: 9.4, hook_type: 'Testimonial', category: 'Fitness', published_at: '2026-03-03T10:00:00Z' },
];

const SEED_CATEGORIES = [
  { category_name: 'Health & Beauty', total_products: 48, total_gmv_aud: 284000, revenue_growth_rate: 34.8, top_product_title: 'Scalp Massager Shampoo Brush', avg_price_aud: 14.20, creator_count: 12, competition_level: 'medium', trend: 'exploding', au_opportunity_score: 91 },
  { category_name: 'Pet', total_products: 22, total_gmv_aud: 198000, revenue_growth_rate: 42.1, top_product_title: 'Pet Water Fountain Filter', avg_price_aud: 11.80, creator_count: 8, competition_level: 'low', trend: 'exploding', au_opportunity_score: 94 },
  { category_name: 'Fitness', total_products: 31, total_gmv_aud: 156000, revenue_growth_rate: 22.4, top_product_title: 'Resistance Band Set 5pc', avg_price_aud: 19.40, creator_count: 9, competition_level: 'medium', trend: 'growing', au_opportunity_score: 83 },
  { category_name: 'Home & Kitchen', total_products: 67, total_gmv_aud: 241000, revenue_growth_rate: 18.9, top_product_title: 'LED Strip Lights USB', avg_price_aud: 17.90, creator_count: 15, competition_level: 'medium', trend: 'growing', au_opportunity_score: 78 },
  { category_name: 'Tech', total_products: 29, total_gmv_aud: 189000, revenue_growth_rate: 16.2, top_product_title: 'Car Phone Mount MagSafe', avg_price_aud: 22.30, creator_count: 7, competition_level: 'low', trend: 'growing', au_opportunity_score: 82 },
  { category_name: 'Fashion', total_products: 44, total_gmv_aud: 112000, revenue_growth_rate: 8.7, top_product_title: 'Reusable Grocery Bags 6pk', avg_price_aud: 28.40, creator_count: 11, competition_level: 'high', trend: 'stable', au_opportunity_score: 61 },
  { category_name: 'Baby & Kids', total_products: 18, total_gmv_aud: 87000, revenue_growth_rate: 51.3, top_product_title: 'Baby Food Maker Set', avg_price_aud: 31.20, creator_count: 5, competition_level: 'low', trend: 'exploding', au_opportunity_score: 89 },
  { category_name: 'Food & Beverage', total_products: 14, total_gmv_aud: 94000, revenue_growth_rate: 29.6, top_product_title: 'Mushroom Coffee Blend', avg_price_aud: 34.80, creator_count: 6, competition_level: 'low', trend: 'growing', au_opportunity_score: 86 },
];

export async function createIntelligenceTables(): Promise<{ ok: boolean; message: string }> {
  const dbUrl = process.env.DATABASE_URL;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl) return { ok: false, message: 'No DATABASE_URL' };
  let sql: ReturnType<typeof import('postgres')> | null = null;
  try {
    const postgres = (await import('postgres')).default;
    sql = postgres(dbUrl, { ssl: 'require', max: 1, connect_timeout: 20 });
    await sql`CREATE TABLE IF NOT EXISTS public.au_creators (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, username text NOT NULL, display_name text, avatar_url text, follower_count integer DEFAULT 0, gmv_30d_aud numeric DEFAULT 0, gmv_growth_rate numeric DEFAULT 0, items_sold_30d integer DEFAULT 0, avg_video_views integer DEFAULT 0, engagement_rate numeric DEFAULT 0, top_categories text[] DEFAULT '{}', commission_rate numeric DEFAULT 15, creator_conversion_ratio numeric DEFAULT 0, tiktok_url text, is_verified boolean DEFAULT false, location text DEFAULT 'Australia', revenue_sparkline jsonb DEFAULT '[]', scraped_at timestamptz DEFAULT now(), UNIQUE(username))`;
    await sql`CREATE TABLE IF NOT EXISTS public.trending_videos (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, video_title text, creator_username text, product_name text, thumbnail_url text, tiktok_video_url text, views integer DEFAULT 0, likes integer DEFAULT 0, gmv_driven_aud numeric DEFAULT 0, items_sold_from_video integer DEFAULT 0, engagement_rate numeric DEFAULT 0, hook_type text, category text, published_at timestamptz, scraped_at timestamptz DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS public.category_rankings (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, category_name text NOT NULL UNIQUE, total_products integer DEFAULT 0, total_gmv_aud numeric DEFAULT 0, revenue_growth_rate numeric DEFAULT 0, top_product_title text, avg_price_aud numeric DEFAULT 0, creator_count integer DEFAULT 0, competition_level text DEFAULT 'medium', trend text DEFAULT 'growing', au_opportunity_score integer DEFAULT 75, updated_at timestamptz DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS public.competitor_watchlist (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, query text NOT NULL, notes text, created_at timestamptz DEFAULT now(), UNIQUE(user_id, query))`;
    for (const t of ['au_creators', 'trending_videos', 'category_rankings', 'competitor_watchlist']) {
      await sql.unsafe(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`);
      try { await sql.unsafe(`CREATE POLICY "${t}_pub" ON public.${t} FOR SELECT USING (true)`); } catch {}
      try { await sql.unsafe(`CREATE POLICY "${t}_svc" ON public.${t} FOR ALL TO service_role USING (true) WITH CHECK (true)`); } catch {}
    }
    try { await sql`CREATE POLICY "cw_own" ON public.competitor_watchlist USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`; } catch {}
    console.log('[intel-migrate] ✅ Intelligence tables created');
    if (url && key) await seedIntelligenceData();
    return { ok: true, message: 'Intelligence tables created and seeded' };
  } catch (e: any) {
    console.warn('[intel-migrate] Error:', e.message?.slice(0, 200));
    return { ok: false, message: e.message };
  } finally {
    if (sql) { try { await sql.end(); } catch {} }
  }
}

async function seedIntelligenceData(): Promise<void> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.warn('[seed] Supabase env vars missing for intelligence seed'); return; }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  };

  const [cr, tv, cat] = await Promise.all([
    fetch(`${url}/rest/v1/au_creators`, { method: 'POST', headers, body: JSON.stringify(SEED_CREATORS) }),
    fetch(`${url}/rest/v1/trending_videos`, { method: 'POST', headers, body: JSON.stringify(SEED_VIDEOS) }),
    fetch(`${url}/rest/v1/category_rankings`, { method: 'POST', headers, body: JSON.stringify(SEED_CATEGORIES) }),
  ]);

  if (cr.ok && tv.ok && cat.ok) {
    console.log(`[seed] ✅ Seeded ${SEED_CREATORS.length} creators, ${SEED_VIDEOS.length} videos, ${SEED_CATEGORIES.length} categories`);
  } else {
    const errs = await Promise.all([cr.text(), tv.text(), cat.text()]);
    console.warn('[seed] ⚠️ Intelligence seed partial failure:', errs.map(e => e.slice(0, 100)).join(' | '));
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
