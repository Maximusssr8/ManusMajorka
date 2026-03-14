import postgres from '/Users/maximus/ManusMajorka/node_modules/postgres/src/index.js';

const sql = postgres('postgresql://postgres:Romania1992!Chicken.@db.ievekuazsjbdrltsdksn.supabase.co:5432/postgres', {
  ssl: 'require',
});

// ── winning_products (24 new rows) ────────────────────────────────────────────
// Actual columns: product_title, tiktok_product_url, image_url, category, platform,
//   price_aud, sold_count, rating, review_count, shop_name, winning_score, trend,
//   competition_level, au_relevance, est_daily_revenue_aud, units_per_day, why_winning, ad_angle
const products = [
  { title: 'Cordless Mini Waffle Maker', category: 'Kitchen', daily: 4200, margin: 0.38, price: 49.95, score: 82, trend: 'rising', rel: 91, img: 'photo-1556909114-f6e7ad7d3136', units: 84, sold: 2300, rating: 4.6, reviews: 412, shop: 'AU Kitchen Finds', why: 'Viral TikTok brunch aesthetic, high repeat purchase', angle: 'Sunday brunch hack — waffles in 90 seconds', competition: 'medium' },
  { title: 'Magnetic Phone Car Mount Pro', category: 'Auto', daily: 3800, margin: 0.52, price: 34.95, score: 78, trend: 'rising', rel: 88, img: 'photo-1449965408869-eaa3f722e40d', units: 109, sold: 5600, rating: 4.7, reviews: 891, shop: 'DriveAccessories AU', why: 'High-volume commuter accessory, low competition', angle: 'Mount in 1 second, hands-free driving', competition: 'low' },
  { title: 'Silicone Air Fryer Liners Set', category: 'Kitchen', daily: 5100, margin: 0.61, price: 24.95, score: 90, trend: 'exploding', rel: 96, img: 'photo-1585032226651-759b368d7246', units: 204, sold: 8900, rating: 4.8, reviews: 1240, shop: 'EcoKitchen AU', why: 'Exploding AU TikTok niche, near-zero competition', angle: 'Never scrub your air fryer basket again', competition: 'low' },
  { title: 'Electric Foot Callus Remover', category: 'Health', daily: 6300, margin: 0.44, price: 44.95, score: 87, trend: 'exploding', rel: 94, img: 'photo-1515377905703-c4788e51af15', units: 140, sold: 6200, rating: 4.5, reviews: 978, shop: 'PediCare AU', why: 'Beauty & wellness crossover, year-round demand', angle: 'Salon-smooth feet at home for $44', competition: 'medium' },
  { title: 'Portable Neck Fan Hands-Free', category: 'Electronics', daily: 7200, margin: 0.48, price: 39.95, score: 93, trend: 'exploding', rel: 97, img: 'photo-1596495578065-6e0763fa1178', units: 180, sold: 12000, rating: 4.6, reviews: 2100, shop: 'CoolTech AU', why: 'AU summer essential, peak season demand', angle: '38°C outside, perfectly cool all day', competition: 'medium' },
  { title: 'Cloud Slime Stress Ball Set', category: 'Toys', daily: 3100, margin: 0.67, price: 19.95, score: 75, trend: 'rising', rel: 86, img: 'photo-1558618666-fcd25c85cd64', units: 155, sold: 3400, rating: 4.4, reviews: 567, shop: 'Fun Finds AU', why: 'Gen Z viral trend, gift-ready packaging', angle: 'Squish away your stress in 60 seconds', competition: 'low' },
  { title: 'LED Bathroom Mirror Cabinet', category: 'Home', daily: 8900, margin: 0.35, price: 189.95, score: 85, trend: 'rising', rel: 92, img: 'photo-1552321554-5fefe8c9ef14', units: 47, sold: 1800, rating: 4.5, reviews: 320, shop: 'HomeLux AU', why: 'High AOV, home reno trend ongoing in AU', angle: 'Hotel bathroom vibes for under $200', competition: 'medium' },
  { title: 'Waterproof Eyebrow Stamp Kit', category: 'Beauty', daily: 4600, margin: 0.71, price: 22.95, score: 88, trend: 'exploding', rel: 95, img: 'photo-1522335789203-aabd1fc54bc9', units: 200, sold: 9800, rating: 4.7, reviews: 1780, shop: 'GlamKit AU', why: 'Highest margin beauty item, <60s transformation content', angle: 'Perfect brows in 60 seconds — no artist needed', competition: 'low' },
  { title: 'Smart Pill Organiser Weekly', category: 'Health', daily: 2900, margin: 0.43, price: 29.95, score: 74, trend: 'rising', rel: 87, img: 'photo-1584308666744-24d5c474f2ae', units: 97, sold: 2700, rating: 4.5, reviews: 445, shop: 'HealthHacks AU', why: 'Aging AU population, high repeat gifting', angle: 'Never miss a pill again — smart weekly tracking', competition: 'low' },
  { title: 'Collapsible Travel Water Bottle', category: 'Sports', daily: 3400, margin: 0.55, price: 24.95, score: 80, trend: 'rising', rel: 90, img: 'photo-1602143407151-7111542de6e8', units: 136, sold: 4500, rating: 4.6, reviews: 720, shop: 'TrailGear AU', why: 'Travel revival post-COVID, eco-conscious AU buyers', angle: 'Fits in your pocket empty, lasts all day full', competition: 'low' },
  { title: 'Pet GPS Tracker Collar', category: 'Pet', daily: 5700, margin: 0.39, price: 59.95, score: 86, trend: 'exploding', rel: 93, img: 'photo-1587300003388-59208cc962cb', units: 95, sold: 4100, rating: 4.7, reviews: 890, shop: 'PetSafe AU', why: 'Pet escapes spike in AU summer, emotional purchase', angle: 'Found my dog at 2am in 8 minutes', competition: 'medium' },
  { title: 'Reusable Silicone Food Bags', category: 'Kitchen', daily: 2800, margin: 0.58, price: 29.95, score: 77, trend: 'rising', rel: 89, img: 'photo-1611735341450-74d61e660ad2', units: 94, sold: 3200, rating: 4.5, reviews: 560, shop: 'EcoKitchen AU', why: 'Plastic ban sentiment in AU, eco gifting', angle: 'Replace 500 zip bags with these 6 reusables', competition: 'low' },
  { title: 'Desk Cable Management Box', category: 'Office', daily: 3600, margin: 0.62, price: 34.95, score: 81, trend: 'rising', rel: 88, img: 'photo-1593642632559-0c6d3fc62b89', units: 103, sold: 5600, rating: 4.6, reviews: 980, shop: 'DeskSetup AU', why: 'WFH desk aesthetic trend, high engagement content', angle: 'Hide all your cables in one clean box', competition: 'low' },
  { title: 'Acupressure Mat and Pillow Set', category: 'Wellness', daily: 7800, margin: 0.46, price: 69.95, score: 92, trend: 'exploding', rel: 96, img: 'photo-1506126613408-eca07ce68773', units: 111, sold: 7200, rating: 4.7, reviews: 1340, shop: 'WellnessAU', why: 'Back pain epidemic, before/after content performs', angle: 'Day 1 vs Day 30 — chronic back pain gone', competition: 'medium' },
  { title: 'Baby Food Maker Steamer Blender', category: 'Baby', daily: 6100, margin: 0.37, price: 79.95, score: 84, trend: 'rising', rel: 92, img: 'photo-1555252333-9f8e92e65df9', units: 76, sold: 3300, rating: 4.6, reviews: 610, shop: 'BabyEssentials AU', why: 'New parents AU segment, premium gift item', angle: 'Fresh homemade baby food in under 10 minutes', competition: 'medium' },
  { title: 'Car Seat Gap Filler Organiser', category: 'Auto', daily: 2600, margin: 0.64, price: 19.95, score: 73, trend: 'rising', rel: 85, img: 'photo-1503376780353-7e6692767b70', units: 130, sold: 6700, rating: 4.5, reviews: 1120, shop: 'DriveAccessories AU', why: 'Impulse buy, universal pain point, under $20', angle: 'Never lose your phone down the seat gap again', competition: 'low' },
  { title: 'Weighted Blanket AU Queen', category: 'Sleep', daily: 9200, margin: 0.32, price: 129.95, score: 89, trend: 'exploding', rel: 97, img: 'photo-1631049307264-da0ec9d70304', units: 71, sold: 5800, rating: 4.8, reviews: 2100, shop: 'SleepTech AU', why: 'Sleep quality epidemic, high AOV, gift season spike', angle: 'From 4 hrs to 8 hrs sleep — one week result', competition: 'medium' },
  { title: 'Jade Roller Face Massage Set', category: 'Beauty', daily: 3300, margin: 0.68, price: 27.95, score: 79, trend: 'rising', rel: 90, img: 'photo-1570172619644-dfd03ed5d881', units: 118, sold: 7800, rating: 4.6, reviews: 1450, shop: 'GlowKit AU', why: 'Skincare ritual trend, GRWM content staple', angle: 'Morning puffiness gone in 5 minutes', competition: 'low' },
  { title: 'Standing Desk Converter', category: 'Office', daily: 11400, margin: 0.29, price: 199.95, score: 94, trend: 'exploding', rel: 98, img: 'photo-1593642632559-0c6d3fc62b89', units: 57, sold: 2900, rating: 4.7, reviews: 780, shop: 'DeskSetup AU', why: 'Highest revenue WFH product, AU office upgrade trend', angle: '$200 sit-stand vs $2000 — I chose right', competition: 'medium' },
  { title: 'Dog Slow Feeder Puzzle Bowl', category: 'Pet', daily: 2200, margin: 0.72, price: 24.95, score: 72, trend: 'rising', rel: 86, img: 'photo-1587300003388-59208cc962cb', units: 88, sold: 4600, rating: 4.7, reviews: 890, shop: 'PetLovers AU', why: 'Vet-recommended content, high margin pet accessory', angle: 'My lab stopped vomiting after meals — day 1', competition: 'low' },
  { title: 'Colour-Changing LED Plant Pot', category: 'Home', daily: 3900, margin: 0.54, price: 39.95, score: 82, trend: 'rising', rel: 91, img: 'photo-1485955900006-10f4d324d411', units: 98, sold: 3500, rating: 4.5, reviews: 620, shop: 'HomeLux AU', why: 'Apartment aesthetic trend, gift item, social content', angle: 'My plant grew 3x faster with built-in UV light', competition: 'low' },
  { title: 'Portable Solar Phone Charger', category: 'Electronics', daily: 4800, margin: 0.47, price: 54.95, score: 83, trend: 'rising', rel: 91, img: 'photo-1509391366360-2e959784a276', units: 87, sold: 3100, rating: 4.6, reviews: 540, shop: 'OutdoorTech AU', why: 'Hiking/festival season, power outage anxiety AU', angle: 'Day 3 no power — phone still at 60%', competition: 'medium' },
  { title: 'Bamboo Cheese Board Gift Set', category: 'Kitchen', daily: 5500, margin: 0.41, price: 59.95, score: 86, trend: 'exploding', rel: 93, img: 'photo-1452195100486-9cc805987862', units: 92, sold: 4200, rating: 4.8, reviews: 870, shop: 'GiftAU', why: 'Premium gift season spike, high AOV charcuterie trend', angle: 'Restaurant charcuterie board for under $60', competition: 'medium' },
  { title: 'Kids Drawing Tablet Doodle Pad', category: 'Toys', daily: 3700, margin: 0.58, price: 34.95, score: 80, trend: 'rising', rel: 89, img: 'photo-1596464716127-f2a82984de30', units: 106, sold: 6700, rating: 4.6, reviews: 1230, shop: 'KidsToys AU', why: 'Screen-free parenting trend, birthday gift staple', angle: 'They put down the iPad for this — hour 1', competition: 'low' },
];

// ── au_creators (25 new rows) ─────────────────────────────────────────────────
// Actual columns: username, display_name, avatar_url, follower_count, gmv_30d_aud,
//   gmv_growth_rate, items_sold_30d, avg_video_views, engagement_rate, top_categories,
//   commission_rate, creator_conversion_ratio, tiktok_url, is_verified, location, revenue_sparkline
const creators = [
  { username: 'aussie_finds_daily', display: 'Mia Robertson', followers: 420000, gmv: 85000, growth: 22.4, sold: 1700, views: 380000, engagement: 7.2, categories: '["Home","Kitchen"]', commission: 8.0, conversion: 3.2, verified: true, location: 'Sydney, NSW' },
  { username: 'thriftqueen_au', display: 'Sophie Chang', followers: 215000, gmv: 42000, growth: 18.1, sold: 840, views: 195000, engagement: 8.9, categories: '["Beauty","Skincare"]', commission: 9.5, conversion: 3.8, verified: false, location: 'Melbourne, VIC' },
  { username: 'gadgetguru_oz', display: 'Lachlan Webb', followers: 680000, gmv: 134000, growth: 15.6, sold: 2680, views: 610000, engagement: 6.1, categories: '["Electronics","Tech"]', commission: 7.0, conversion: 2.8, verified: true, location: 'Brisbane, QLD' },
  { username: 'petlife_brisbane', display: 'Emma Nguyen', followers: 185000, gmv: 38000, growth: 31.2, sold: 760, views: 170000, engagement: 9.4, categories: '["Pet","Animals"]', commission: 10.0, conversion: 4.1, verified: false, location: 'Brisbane, QLD' },
  { username: 'fitnesshacks_melb', display: 'Jake Thornton', followers: 340000, gmv: 67000, growth: 19.8, sold: 1340, views: 305000, engagement: 7.8, categories: '["Fitness","Wellness"]', commission: 8.5, conversion: 3.5, verified: true, location: 'Melbourne, VIC' },
  { username: 'mumlife_sydney', display: 'Claire Davis', followers: 295000, gmv: 55000, growth: 24.3, sold: 1100, views: 265000, engagement: 8.3, categories: '["Baby","Parenting"]', commission: 9.0, conversion: 3.7, verified: false, location: 'Sydney, NSW' },
  { username: 'desksetup_aus', display: 'Ryan Mitchell', followers: 128000, gmv: 28000, growth: 38.5, sold: 560, views: 115000, engagement: 10.2, categories: '["Office","Tech"]', commission: 10.5, conversion: 4.4, verified: false, location: 'Perth, WA' },
  { username: 'sustainableou', display: 'Zoe Patel', followers: 87000, gmv: 18000, growth: 42.1, sold: 360, views: 79000, engagement: 11.5, categories: '["Eco","Sustainable"]', commission: 11.0, conversion: 4.8, verified: false, location: 'Adelaide, SA' },
  { username: 'kitchenqueenau', display: 'Bella Thompson', followers: 510000, gmv: 103000, growth: 17.2, sold: 2060, views: 460000, engagement: 6.8, categories: '["Kitchen","Food"]', commission: 7.5, conversion: 3.0, verified: true, location: 'Gold Coast, QLD' },
  { username: 'sleepbetter_oz', display: 'Noah Williams', followers: 162000, gmv: 35000, growth: 28.7, sold: 700, views: 148000, engagement: 9.1, categories: '["Sleep","Wellness"]', commission: 9.5, conversion: 4.0, verified: false, location: 'Canberra, ACT' },
  { username: 'carmod_australia', display: 'Tyler Brooks', followers: 445000, gmv: 89000, growth: 14.9, sold: 1780, views: 400000, engagement: 7.4, categories: '["Auto","Cars"]', commission: 7.5, conversion: 3.1, verified: true, location: 'Melbourne, VIC' },
  { username: 'beautyboxau', display: 'Lily Chen', followers: 730000, gmv: 158000, growth: 12.3, sold: 3160, views: 660000, engagement: 5.9, categories: '["Beauty","Makeup"]', commission: 6.5, conversion: 2.6, verified: true, location: 'Sydney, NSW' },
  { username: 'outdoorau_life', display: 'Sam Hunter', followers: 273000, gmv: 51000, growth: 21.6, sold: 1020, views: 245000, engagement: 8.0, categories: '["Outdoor","Sports"]', commission: 8.5, conversion: 3.4, verified: false, location: 'Darwin, NT' },
  { username: 'toyreviewer_aus', display: 'Amy Wilson', followers: 94000, gmv: 22000, growth: 35.8, sold: 440, views: 85000, engagement: 10.8, categories: '["Toys","Kids"]', commission: 10.0, conversion: 4.6, verified: false, location: 'Hobart, TAS' },
  { username: 'homeorganizeroz', display: 'Chloe Baker', followers: 389000, gmv: 76000, growth: 20.1, sold: 1520, views: 350000, engagement: 7.6, categories: '["Home","Organisation"]', commission: 8.0, conversion: 3.3, verified: true, location: 'Sydney, NSW' },
  { username: 'healthcoach_perth', display: 'Marcus Reed', followers: 201000, gmv: 44000, growth: 26.4, sold: 880, views: 182000, engagement: 8.7, categories: '["Health","Nutrition"]', commission: 9.0, conversion: 3.9, verified: false, location: 'Perth, WA' },
  { username: 'fashionfinds_au', display: 'Isla Morrison', followers: 855000, gmv: 195000, growth: 11.8, sold: 3900, views: 770000, engagement: 5.7, categories: '["Fashion","Accessories"]', commission: 6.0, conversion: 2.5, verified: true, location: 'Melbourne, VIC' },
  { username: 'plantmom_oz', display: 'Priya Sharma', followers: 143000, gmv: 31000, growth: 33.2, sold: 620, views: 129000, engagement: 9.6, categories: '["Garden","Home"]', commission: 9.5, conversion: 4.2, verified: false, location: 'Brisbane, QLD' },
  { username: 'techdeals_sydney', display: 'Kai Anderson', followers: 376000, gmv: 72000, growth: 16.5, sold: 1440, views: 338000, engagement: 7.3, categories: '["Electronics","Deals"]', commission: 7.5, conversion: 3.0, verified: true, location: 'Sydney, NSW' },
  { username: 'skincaremum_au', display: 'Hannah Lee', followers: 118000, gmv: 26000, growth: 37.4, sold: 520, views: 106000, engagement: 10.4, categories: '["Skincare","Wellness"]', commission: 10.0, conversion: 4.5, verified: false, location: 'Gold Coast, QLD' },
  { username: 'gymrat_gold_coast', display: 'Brandon Cox', followers: 234000, gmv: 48000, growth: 23.0, sold: 960, views: 211000, engagement: 8.5, categories: '["Fitness","Gym"]', commission: 8.5, conversion: 3.6, verified: false, location: 'Gold Coast, QLD' },
  { username: 'boho_home_au', display: 'Scarlett Jones', followers: 467000, gmv: 91000, growth: 18.8, sold: 1820, views: 420000, engagement: 7.1, categories: '["Home Decor","Boho"]', commission: 7.5, conversion: 3.1, verified: true, location: 'Byron Bay, NSW' },
  { username: 'kidsfashion_melb', display: 'Tara Simmons', followers: 72000, gmv: 16000, growth: 44.6, sold: 320, views: 65000, engagement: 12.1, categories: '["Kids","Fashion"]', commission: 11.5, conversion: 5.1, verified: false, location: 'Melbourne, VIC' },
  { username: 'coffeeholic_brisbane', display: 'Oscar Martin', followers: 156000, gmv: 33000, growth: 29.3, sold: 660, views: 141000, engagement: 9.3, categories: '["Coffee","Kitchen"]', commission: 9.0, conversion: 4.1, verified: false, location: 'Brisbane, QLD' },
  { username: 'travelmust_aus', display: 'Jasmine Park', followers: 312000, gmv: 62000, growth: 22.7, sold: 1240, views: 281000, engagement: 7.9, categories: '["Travel","Accessories"]', commission: 8.0, conversion: 3.4, verified: true, location: 'Sydney, NSW' },
];

// ── trending_videos (18 new rows) ─────────────────────────────────────────────
// Actual columns: video_title, creator_username, product_name, thumbnail_url, tiktok_video_url,
//   views, likes, gmv_driven_aud, items_sold_from_video, engagement_rate, hook_type, category, published_at
const videoData = [
  { title: 'Air fryer liner hack saves 20 min cleanup', creator: 'kitchenqueenau', product: 'Silicone Air Fryer Liners Set', views: 4200000, likes: 354000, gmv: 82000, sold: 3280, engagement: 8.4, hook: 'problem_solution', category: 'Kitchen', published: '2025-12-14' },
  { title: 'This neck fan changed my summer in Brisbane', creator: 'gadgetguru_oz', product: 'Portable Neck Fan Hands-Free', views: 3800000, likes: 300000, gmv: 74000, sold: 1850, engagement: 7.9, hook: 'personal_story', category: 'Electronics', published: '2025-11-28' },
  { title: 'Weighted blanket sleep transformation', creator: 'sleepbetter_oz', product: 'Weighted Blanket AU Queen', views: 5100000, likes: 469000, gmv: 112000, sold: 862, engagement: 9.2, hook: 'transformation', category: 'Sleep', published: '2025-12-01' },
  { title: 'Standing desk converter honest review', creator: 'desksetup_aus', product: 'Standing Desk Converter', views: 2900000, likes: 234000, gmv: 95000, sold: 475, engagement: 8.1, hook: 'review', category: 'Office', published: '2025-11-15' },
  { title: 'Acupressure mat 30 day results', creator: 'healthcoach_perth', product: 'Acupressure Mat and Pillow Set', views: 6700000, likes: 690000, gmv: 118000, sold: 1686, engagement: 10.3, hook: 'transformation', category: 'Wellness', published: '2025-12-20' },
  { title: 'Eyebrow stamp kit 60 second routine', creator: 'beautyboxau', product: 'Waterproof Eyebrow Stamp Kit', views: 7200000, likes: 705000, gmv: 108000, sold: 4704, engagement: 9.8, hook: 'tutorial', category: 'Beauty', published: '2025-12-18' },
  { title: 'Pet GPS tracker saved my dog twice', creator: 'petlife_brisbane', product: 'Pet GPS Tracker Collar', views: 1800000, likes: 201000, gmv: 54000, sold: 900, engagement: 11.2, hook: 'personal_story', category: 'Pet', published: '2025-11-22' },
  { title: 'Cordless waffle maker Sunday brunch', creator: 'kitchenqueenau', product: 'Cordless Mini Waffle Maker', views: 3400000, likes: 292000, gmv: 67000, sold: 1340, engagement: 8.6, hook: 'lifestyle', category: 'Kitchen', published: '2025-12-07' },
  { title: 'Jade roller gua sha before after', creator: 'skincaremum_au', product: 'Jade Roller Face Massage Set', views: 2600000, likes: 236000, gmv: 48000, sold: 1716, engagement: 9.1, hook: 'transformation', category: 'Beauty', published: '2025-11-30' },
  { title: 'Car seat gap organiser life hack', creator: 'carmod_australia', product: 'Car Seat Gap Filler Organiser', views: 5500000, likes: 484000, gmv: 89000, sold: 4462, engagement: 8.8, hook: 'problem_solution', category: 'Auto', published: '2025-12-10' },
  { title: 'Baby food maker vs blender test', creator: 'mumlife_sydney', product: 'Baby Food Maker Steamer Blender', views: 1500000, likes: 157000, gmv: 42000, sold: 525, engagement: 10.5, hook: 'review', category: 'Baby', published: '2025-12-03' },
  { title: 'Collapsible bottle for Bali trip', creator: 'travelmust_aus', product: 'Collapsible Travel Water Bottle', views: 870000, likes: 82000, gmv: 28000, sold: 1120, engagement: 9.4, hook: 'lifestyle', category: 'Travel', published: '2025-11-18' },
  { title: 'LED plant pot time lapse grow', creator: 'plantmom_oz', product: 'Colour-Changing LED Plant Pot', views: 2100000, likes: 183000, gmv: 41000, sold: 1027, engagement: 8.7, hook: 'educational', category: 'Home', published: '2025-12-12' },
  { title: 'Bamboo cheese board date night setup', creator: 'coffeeholic_brisbane', product: 'Bamboo Cheese Board Gift Set', views: 1300000, likes: 117000, gmv: 35000, sold: 583, engagement: 9.0, hook: 'lifestyle', category: 'Kitchen', published: '2025-12-05' },
  { title: 'Kids doodle pad keeps toddler busy 1hr', creator: 'mumlife_sydney', product: 'Kids Drawing Tablet Doodle Pad', views: 4900000, likes: 568000, gmv: 76000, sold: 2176, engagement: 11.6, hook: 'problem_solution', category: 'Kids', published: '2025-12-22' },
  { title: 'Solar charger hiking Grampians', creator: 'outdoorau_life', product: 'Portable Solar Phone Charger', views: 780000, likes: 75000, gmv: 22000, sold: 400, engagement: 9.7, hook: 'lifestyle', category: 'Outdoor', published: '2025-11-25' },
  { title: 'Dog slow feeder mealtime chaos fix', creator: 'petlife_brisbane', product: 'Dog Slow Feeder Puzzle Bowl', views: 3300000, likes: 333000, gmv: 58000, sold: 2320, engagement: 10.1, hook: 'problem_solution', category: 'Pet', published: '2025-12-16' },
  { title: 'Magnetic phone mount one hand parking', creator: 'carmod_australia', product: 'Magnetic Phone Car Mount Pro', views: 2400000, likes: 199000, gmv: 46000, sold: 1317, engagement: 8.3, hook: 'product_demo', category: 'Auto', published: '2025-12-08' },
];

async function run() {
  console.log('🌱 Seeding database (round 2 — correct column names)...');

  // ── 1. Winning products ──────────────────────────────────────────────────
  console.log('\n📦 Inserting 24 winning products...');
  let inserted = 0;
  for (const p of products) {
    const supplierCost = +(p.price * (1 - p.margin)).toFixed(2);
    try {
      await sql`
        INSERT INTO public.winning_products
          (product_title, tiktok_product_url, image_url, category, platform,
           price_aud, sold_count, rating, review_count, shop_name,
           winning_score, trend, competition_level, au_relevance,
           est_daily_revenue_aud, units_per_day, why_winning, ad_angle)
        VALUES
          (${p.title},
           ${'https://www.tiktok.com/shop/product/' + p.title.toLowerCase().replace(/\s+/g, '-')},
           ${'https://images.unsplash.com/' + p.img + '?w=400&h=300&fit=crop'},
           ${p.category}, 'TikTok Shop',
           ${p.price}, ${p.sold}, ${p.rating}, ${p.reviews}, ${p.shop},
           ${p.score}, ${p.trend}, ${p.competition}, ${p.rel},
           ${p.daily}, ${p.units}, ${p.why}, ${p.angle})
        ON CONFLICT DO NOTHING
      `;
      inserted++;
    } catch (e) {
      console.error(`  ❌ ${p.title}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${inserted}/${products.length} products inserted`);

  // ── 2. AU creators ──────────────────────────────────────────────────────
  console.log('\n👥 Inserting 25 AU creators...');
  let creatorsInserted = 0;
  for (const c of creators) {
    try {
      const sparkline = JSON.stringify(Array.from({length: 8}, () => Math.floor(c.gmv * (0.7 + Math.random() * 0.6) / 8)));
      await sql`
        INSERT INTO public.au_creators
          (username, display_name, avatar_url, follower_count, gmv_30d_aud,
           gmv_growth_rate, items_sold_30d, avg_video_views, engagement_rate,
           top_categories, commission_rate, creator_conversion_ratio,
           tiktok_url, is_verified, location, revenue_sparkline)
        VALUES
          (${c.username}, ${c.display},
           ${'https://i.pravatar.cc/150?u=' + c.username},
           ${c.followers}, ${c.gmv},
           ${c.growth}, ${c.sold}, ${c.views}, ${c.engagement},
           ${c.categories}, ${c.commission}, ${c.conversion},
           ${'https://www.tiktok.com/@' + c.username},
           ${c.verified}, ${c.location}, ${sparkline})
        ON CONFLICT DO NOTHING
      `;
      creatorsInserted++;
    } catch (e) {
      console.error(`  ❌ Creator ${c.username}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${creatorsInserted}/${creators.length} creators inserted`);

  // ── 3. Trending videos ──────────────────────────────────────────────────
  console.log('\n🎥 Inserting 18 trending videos...');
  let videosInserted = 0;
  for (const v of videoData) {
    try {
      await sql`
        INSERT INTO public.trending_videos
          (video_title, creator_username, product_name, thumbnail_url, tiktok_video_url,
           views, likes, gmv_driven_aud, items_sold_from_video,
           engagement_rate, hook_type, category, published_at)
        VALUES
          (${v.title}, ${v.creator}, ${v.product},
           ${'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop'},
           ${'https://www.tiktok.com/@' + v.creator + '/video/' + (7300000000000 + Math.floor(Math.random() * 100000))},
           ${v.views}, ${v.likes}, ${v.gmv}, ${v.sold},
           ${v.engagement}, ${v.hook}, ${v.category}, ${v.published})
        ON CONFLICT DO NOTHING
      `;
      videosInserted++;
    } catch (e) {
      console.error(`  ❌ Video "${v.title}": ${e.message}`);
    }
  }
  console.log(`  ✅ ${videosInserted}/${videoData.length} videos inserted`);

  // ── Final counts ─────────────────────────────────────────────────────────
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
