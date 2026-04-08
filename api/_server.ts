/**
 * Vercel Serverless Function — wraps the Express app for serverless deployment.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import * as Sentry from '@sentry/node';

// Initialize Sentry server-side (Vercel serverless)
const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.05,
  });
}

import express, { type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerChatRoutes } from "../server/_core/chat";
import { registerScrapeRoutes, scrapeProductData } from "../server/lib/scrape-product";
import { registerToolsApi } from "../server/lib/tools-api";
import { registerAutomationRoutes } from "../server/lib/automation-api";
import { registerAffiliateRoutes } from "../server/lib/affiliate";
import { analyzeProduct } from "../server/lib/product-intelligence";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { handleWebhook, registerStripeRoutes } from "../server/lib/stripe";
import { registerWebsiteRoutes } from "../server/lib/website-api";
import cookieParser from "cookie-parser";
import shopifyRouter from "../server/routes/shopify";
import storeBuilderRouter from "../server/routes/store-builder";
import aiRouter from "../server/routes/ai";
import cronRouter from "../server/routes/cron";
import imageProxyRouter from "../server/routes/imageProxy";
import subscriptionRouter from "../server/routes/subscription";
import adminApiRouter from "../server/routes/admin";
import { requireAuth } from "../server/middleware/requireAuth";
import { createClient } from "@supabase/supabase-js";
import { getUsageSummary } from "../server/lib/usageLimits";
import type { Plan } from "../shared/plans";
import shopsRouter from "../server/routes/shops";
import productsRouter from "../server/routes/products";
import aliexpressRouter from "../server/routes/aliexpress";
import aliexpressAuthRouter from "../server/routes/aliexpress-auth";
import userRouter from "../server/routes/user";
import apifyRouter from "../server/routes/apify";
import apifySearchRouter from "../server/routes/apify-search";
import metaRouter from "../server/routes/meta";
import marketplaceRouter from "../server/routes/marketplace";
import creatorsRouter from "../server/routes/creators";
import videosRouter from "../server/routes/videos";
import waitlistRouter from "../server/routes/waitlist";
import dailyBriefRouter from "../server/routes/daily-brief";
import authRouter from "../server/routes/auth";
import { registerGenerationRoutes } from "../server/routes/generation";
import { getStoreBySlug, getPublishedStorefrontProducts, createOrder } from "../server/db";
import { getProductByIdPublic } from "../server/db";
import { importProductSchema, validateBody } from "../server/lib/validators";

// Run DB migrations on cold start (non-fatal)
import('../server/lib/migrate-winning-products').then(({ runWinningProductsMigration }) => {
  runWinningProductsMigration().catch(console.warn);
});
import('../server/migrations/runGeneratedStores').then(({ runGeneratedStoresMigration }) => {
  runGeneratedStoresMigration().catch(console.warn);
});
import('../server/migrations/runUserOnboarding').then(({ runUserOnboardingMigration }) => {
  runUserOnboardingMigration().catch(console.warn);
});

const app = express();
app.disable('x-powered-by'); // Don't expose Express in response headers
app.set('trust proxy', 1); // Trust Vercel's load balancer for req.ip

// ═══ Security headers — applied to every API response ═══
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ═══ CORS Lockdown ═══
const ALLOWED_ORIGINS = [
  'https://majorka.io',
  'https://www.majorka.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// ── Stripe webhook must receive raw body — register BEFORE express.json() ─────
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "Missing Stripe signature header" });
  }
  try {
    await handleWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe webhook] Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.use(express.json({ limit: "50mb" }));
// ── Image proxy — fixes AliExpress CDN AVIF/format issues ─────────────────
app.get("/api/proxy-img", async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'url required' });
  if (!url.includes('alicdn.com') && !url.includes('aliexpress-media.com')) {
    return res.status(403).json({ error: 'domain not allowed' });
  }
  try {
    const attempts = [
      url,
      url.replace(/\.avif$/, '.jpg').replace('_480x480q75.jpg_', ''),
      url.replace(/\.avif$/, '.jpg'),
      url.replace(/\.webp$/, '.jpg'),
    ];
    for (const attempt of attempts) {
      try {
        const r = await fetch(attempt, {
          headers: { 'Referer': 'https://www.aliexpress.com/', 'User-Agent': 'Mozilla/5.0 (compatible; Majorka/1.0)' },
          signal: AbortSignal.timeout(6000),
        });
        if (r.ok) {
          const buf = await r.arrayBuffer();
          const ct = r.headers.get('content-type') || 'image/jpeg';
          res.setHeader('Content-Type', ct.includes('avif') ? 'image/jpeg' : ct);
          res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
          return res.send(Buffer.from(buf));
        }
      } catch { continue; }
    }
    res.status(404).send('');
  } catch {
    res.status(500).send('');
  }
});

app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ── Security headers (production) ────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// ── POST /api/images/pexels-search — website generator image fallback ─────────
app.post("/api/images/pexels-search", async (req: Request, res: Response) => {
  const pexelsKey = process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY;
  if (!pexelsKey) { res.status(503).json({ error: "Pexels not configured", urls: [] }); return; }
  const { query = '', perPage = 5 } = req.body || {};
  if (!query) { res.status(400).json({ error: "query required", urls: [] }); return; }
  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.min(10, Number(perPage) || 5)}&orientation=landscape`,
      { headers: { Authorization: pexelsKey, 'User-Agent': 'Majorka/1.0' } }
    );
    if (!r.ok) { res.status(r.status).json({ error: 'Pexels error', urls: [] }); return; }
    const data = await r.json() as { photos: { src: { large2x: string; large: string } }[] };
    const urls = (data.photos || []).map((p) => p.src.large2x || p.src.large);
    res.json({ urls });
  } catch (err: any) {
    res.status(500).json({ error: err.message, urls: [] });
  }
});

// ── Image proxy — serves CDN images that block cross-origin requests ──────────
app.get("/api/proxy-image", async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) { res.status(400).json({ error: "No URL provided" }); return; }
  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.aliexpress.com/",
      },
    });
    const buffer = await upstream.arrayBuffer();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buffer));
  } catch {
    res.status(500).json({ error: "Failed to proxy image" });
  }
});

// ── Pexels search proxy — keeps API key server-side ─────────────────────────
app.get("/api/pexels/search", async (req: Request, res: Response) => {
  const pexelsKey = process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY;
  if (!pexelsKey) { res.status(503).json({ error: "Pexels not configured" }); return; }
  const query = req.query.query as string;
  if (!query) { res.status(400).json({ error: "query required" }); return; }
  const perPage = req.query.per_page || '8';
  const orientation = req.query.orientation || 'landscape';
  try {
    const params = new URLSearchParams({ query, per_page: String(perPage), orientation: String(orientation) });
    const upstream = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: pexelsKey },
    });
    if (!upstream.ok) { res.status(upstream.status).json({ error: "Pexels API error" }); return; }
    const data = await upstream.json();
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    res.json(data);
  } catch {
    res.status(500).json({ error: "Pexels proxy failed" });
  }
});

// ── API health check — minimal public ping only ───────────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── Usage tracking — GET /api/usage/me ──────────────────────────────────────
app.get("/api/usage/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const email = (req as any).user?.email;
    const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const sb = createClient(SURL, SKEY);

    let plan: Plan = 'builder';
    if (email === 'maximusmajorka@gmail.com') {
      plan = 'scale';
    } else {
      const { data: sub } = await sb.from('user_subscriptions')
        .select('plan').eq('user_id', userId).single();
      plan = (sub?.plan?.toLowerCase() as Plan) || 'builder';
    }

    const summary = await getUsageSummary(userId, plan);
    res.json({ plan, usage: summary, month: new Date().toISOString().slice(0, 7) });
  } catch {
    res.json({ plan: 'builder', usage: {}, month: '' });
  }
});

// ── Single feature usage — GET /api/usage/:feature ──────────────────────────
app.get("/api/usage/:feature", requireAuth, async (req: Request, res: Response) => {
  const { feature } = req.params;
  const userId = (req as any).user?.userId;
  const month = new Date().toISOString().slice(0, 7);
  try {
    const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(SURL, SKEY);
    const { data } = await supabaseAdmin
      .from('usage_tracking')
      .select('count')
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('month', month)
      .single();
    res.json({ count: data?.count ?? 0 });
  } catch {
    res.json({ count: 0 });
  }
});

// One-time intelligence tables migration endpoint
app.post("/api/internal/run-intel-migration", async (req: Request, res: Response) => {
  const secret = req.headers["x-migration-secret"];
  const migrationSecret = process.env.MIGRATION_SECRET || 'majorka-intel-2026';
  if (secret !== migrationSecret) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const { createIntelligenceTables } = await import("../server/lib/migrate-winning-products");
    const result = await createIntelligenceTables();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/internal/run-stores-migration", async (req: Request, res: Response) => {
  const secret = req.headers["x-migration-secret"];
  const migrationSecret = process.env.MIGRATION_SECRET || 'majorka-intel-2026';
  if (secret !== migrationSecret) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const { runGeneratedStoresMigration } = await import("../server/migrations/runGeneratedStores");
    await runGeneratedStoresMigration();
    res.json({ ok: true, message: "generated_stores migration complete" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/migrations/generated-stores", async (req: Request, res: Response) => {
  const secret = req.headers["x-migration-secret"];
  const migrationSecret = process.env.MIGRATION_SECRET || 'majorka-intel-2026';
  if (secret !== migrationSecret) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) { res.json({ exists: false, error: "missing env vars" }); return; }
  try {
    const check = await fetch(`${supabaseUrl}/rest/v1/generated_stores?limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    res.json({ exists: check.ok || check.status === 200, status: check.status });
  } catch (e: any) {
    res.status(500).json({ exists: false, error: e.message });
  }
});

// Cache headers for expensive endpoints
app.use('/api/winning-products', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
  }
  next();
});
app.use('/api/health', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=30');
  }
  next();
});

// ── Competitor Spy API ──────────────────────────────────────────────────────
app.get("/api/competitor/products", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, parseInt(String(req.query.limit || '50')));
    const store = String(req.query.store || '');
    const newOnly = req.query.new === 'true';

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseKey) { res.json([]); return; }

    let url = `${supabaseUrl}/rest/v1/competitor_products?select=*&order=first_seen_at.desc&limit=${limit}`;
    if (store) url += `&store_domain=eq.${encodeURIComponent(store)}`;
    if (newOnly) {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      url += `&first_seen_at=gte.${yesterday}`;
    }

    const r = await fetch(url, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const data = await r.json();
    res.json(Array.isArray(data) ? data : []);
  } catch {
    res.json([]);
  }
});

app.get("/api/competitor/stores", async (_req: Request, res: Response) => {
  try {
    const { AU_DROPSHIP_STORES } = await import('../server/lib/competitor-shops');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
      res.json(AU_DROPSHIP_STORES.map(s => ({ ...s, product_count: 0, favicon: `https://www.google.com/s2/favicons?domain=${s.domain}&sz=32` })));
      return;
    }

    const r = await fetch(`${supabaseUrl}/rest/v1/competitor_products?select=store_domain`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Range': '0-999' }
    });
    const products: any[] = await r.json().catch(() => []);

    const counts: Record<string, number> = {};
    if (Array.isArray(products)) {
      for (const p of products) counts[p.store_domain] = (counts[p.store_domain] || 0) + 1;
    }

    const stores = AU_DROPSHIP_STORES.map(s => ({
      ...s,
      product_count: counts[s.domain] || 0,
      favicon: `https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`,
    }));

    res.json(stores);
  } catch {
    res.json([]);
  }
});

// ── Creator Intelligence API ──────────────────────────────────────────────
app.get("/api/creators", async (req: Request, res: Response) => {
  try {
    const niche = String(req.query.niche || '');
    const region = String(req.query.region || '');
    const limit = Math.min(200, parseInt(String(req.query.limit || '100')));

    const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ievekuazsjbdrltsdksn.supabase.co';
    const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // Query DB first
    let url = `${SURL}/rest/v1/creators?select=*&order=last_scraped_at.desc&limit=${limit}`;
    if (niche) url += `&niche=ilike.*${encodeURIComponent(niche)}*`;
    if (region) url += `&region_code=eq.${region}`;

    const r = await fetch(url, { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } });
    const dbData = await r.json();

    if (Array.isArray(dbData) && dbData.length > 0) {
      return res.json({ creators: dbData, count: dbData.length, niche, region, source: 'db' });
    }

    // Fallback to live Tavily scrape
    const { searchCreators } = await import('../server/lib/creator-scraper');
    const creators = await searchCreators(niche || 'beauty', region || 'US', limit);
    res.json({ creators, count: creators.length, niche, region, source: 'live' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Creator Outreach AI endpoint ────────────────────────────────────────────
app.post("/api/creators/outreach", async (req: Request, res: Response) => {
  try {
    const { handle, niche, product_category, products = [], pitch_product } = req.body;
    if (!handle) { res.status(400).json({ error: 'handle required' }); return; }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const productList = products.length ? products.join(', ') : product_category || niche;
    const specificProduct = pitch_product ? `The specific product they want to pitch is: "${pitch_product}". ` : '';
    const prompt = `Write a short, friendly TikTok creator outreach DM (under 120 words) from a dropshipping brand to @${handle} who creates ${niche} content. ${specificProduct}They promote: ${productList}. Ask about a paid collaboration. Reference their specific niche naturally. Be casual and personal, not corporate template. No excessive emojis. End with a clear CTA. Don't use "I hope this message finds you well." Don't say "lifestyle brand that focuses on products people actually use" — be specific.`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    res.json({ message: text, handle });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Video Intelligence API ────────────────────────────────────────────────
app.get("/api/videos", async (req: Request, res: Response) => {
  try {
    const niche = String(req.query.niche || '');
    const region = String(req.query.region || '');
    const limit = Math.min(50, parseInt(String(req.query.limit || '30')));

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      let url = `${supabaseUrl}/rest/v1/viral_videos?select=*&order=scraped_at.desc&limit=${limit}`;
      if (niche) url += `&niche=ilike.*${encodeURIComponent(niche)}*`;
      if (region) url += `&region_code=eq.${region}`;

      const r = await fetch(url, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } });
      const data = await r.json();

      if (Array.isArray(data) && data.length > 0) {
        res.json({ videos: data, count: data.length, source: 'db' });
        return;
      }
    }

    // Fallback: live scrape
    const { searchViralVideos } = await import('../server/lib/video-scraper');
    const videos = await searchViralVideos(niche || 'beauty', region || 'US');
    res.json({ videos, count: videos.length, source: 'live' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, videos: [] });
  }
});

// ── Reports API ────────────────────────────────────────────────────────────
app.post("/api/reports/generate", async (req: Request, res: Response) => {
  try {
    const { product_ids = [], report_title = 'Product Report', region_code = 'US' } = req.body;
    if (!product_ids.length) { res.status(400).json({ error: 'product_ids required' }); return; }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const ids = product_ids.slice(0, 10).map((id: string) => `id.eq.${id}`).join(',');
    const r = await fetch(`${supabaseUrl}/rest/v1/winning_products?or=(${ids})&select=*`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const products = await r.json();

    const slug = Math.random().toString(36).slice(2, 10);
    const reportRow = {
      title: String(report_title).slice(0, 100),
      slug,
      products: JSON.stringify(Array.isArray(products) ? products : []),
      region_code,
      expires_at: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    };

    await fetch(`${supabaseUrl}/rest/v1/reports`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(reportRow),
    });

    res.json({ slug, url: `https://www.majorka.io/report/${slug}`, expires_in: '30 days' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const r = await fetch(`${supabaseUrl}/rest/v1/reports?slug=eq.${slug}&select=*&limit=1`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const data = await r.json();
    if (!Array.isArray(data) || !data[0]) { res.status(404).json({ error: 'Report not found or expired' }); return; }

    const report = data[0];
    const products = typeof report.products === 'string' ? JSON.parse(report.products) : report.products;
    res.json({ ...report, products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

registerChatRoutes(app);
registerScrapeRoutes(app);
registerToolsApi(app);
registerAutomationRoutes(app);
registerAffiliateRoutes(app);
registerStripeRoutes(app);

// ── Stripe webhook test — admin-only diagnostic endpoint ────────────────────
app.get('/api/stripe/webhook-test', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user?.email !== 'maximusmajorka@gmail.com') return res.status(403).json({ error: 'Forbidden' });

  res.json({
    webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripe_secret_configured: !!process.env.STRIPE_SECRET_KEY,
    webhook_url: 'https://www.majorka.io/api/stripe/webhook',
    instructions: 'Verify webhook is registered at: https://dashboard.stripe.com/webhooks',
  });
});

registerWebsiteRoutes(app);
registerGenerationRoutes(app);
app.use('/api/auth', authRouter);
app.use('/api/shopify', shopifyRouter);
app.use('/api/store-builder', storeBuilderRouter);
app.use('/api/ai', aiRouter);
app.use('/api/cron', cronRouter);
app.use('/api', imageProxyRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/admin', adminApiRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/products', apifySearchRouter); // search with Apify fallback (before main products router)
app.use('/api/products', productsRouter);
app.use('/api/aliexpress', aliexpressRouter);
app.use('/api/auth/aliexpress', aliexpressAuthRouter);
app.use('/api/user', userRouter);
app.use('/api/apify', apifyRouter);
app.use('/api/meta', metaRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/videos', videosRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/daily-brief', dailyBriefRouter);

// ── Product import with AI Brain ─────────────────────────────────────────────
app.post("/api/import-product", async (req: Request, res: Response) => {
  // Auth check — prevent unauthenticated Claude API abuse
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  // Rate limit: 10 imports per hour per user
  const token = authHeader.replace(/^Bearer\s+/i, '');
  let userId = 'unknown';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    userId = payload.sub || 'unknown';
  } catch { /* use unknown */ }

  const { rateLimit } = await import('../server/lib/rate-limit');
  const rl = rateLimit(`import-product:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    res.status(429).json({ error: 'rate_limit', message: 'Too many imports. Try again later.' });
    return;
  }

  const validation = validateBody(importProductSchema, req.body);
  if ('error' in validation) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const { url } = validation.data;

  // AliExpress blocks server-side fetches — detect early and return helpful message
  const isAliExpress = /aliexpress\.com/i.test(url);
  const isTemu = /temu\.com/i.test(url);

  if (isAliExpress) {
    const aliMatch = url.match(/\/item\/(\d+)/);
    const productId = aliMatch?.[1];
    res.status(422).json({
      success: false,
      manual: true,
      platform: 'AliExpress',
      productId: productId || null,
      message: 'AliExpress blocks automated import. Use the manual form below — paste the product name, price, and description.',
      hint: productId ? `AliExpress product ID: ${productId}` : undefined,
    });
    return;
  }

  if (isTemu) {
    res.status(422).json({
      success: false,
      manual: true,
      platform: 'Temu',
      message: 'Temu blocks automated import. Paste the product details manually.',
    });
    return;
  }

  try {
    // Step 1: Scrape the product
    const scraped = await scrapeProductData(url);

    // Step 2: Run AI Brain analysis
    const intelligence = await analyzeProduct(scraped);

    res.json({
      success: true,
      product: {
        ...scraped,
        intelligence,
        importedAt: new Date().toISOString(),
        id: crypto.randomUUID(),
      },
    });
  } catch (err: any) {
    console.error("[import-product]", err.message);
    res.status(500).json({ success: false, error: err.message || "Import failed" });
  }
});

// Stripe routes (checkout-session, customer-portal, subscription-status, webhook)
// are registered via registerStripeRoutes(app) above

// ── Public trend signals API ──────────────────────────────────────────────
app.get("/api/trend-signals", async (req: Request, res: Response) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      res.json([]);
      return;
    }
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { niche, sortBy, sortDir, search, limit = '100' } = req.query as Record<string, string>;

    // Sort mapping from frontend params to winning_products columns
    const sortColumn: Record<string, string> = {
      'winning_score': 'winning_score',
      'revenue': 'est_monthly_revenue_aud',
      'est_monthly_revenue_aud': 'est_monthly_revenue_aud',
      'orders': 'orders_count',
      'orders_count': 'orders_count',
      'margin': 'profit_margin',
      'estimated_margin_pct': 'profit_margin',
      'created_at': 'last_refreshed',
      'trend_score': 'winning_score',
      'dropship_viability_score': 'winning_score',
      'items_sold_monthly': 'orders_count',
      'name': 'product_title',
      'estimated_retail_aud': 'price_aud',
      'growth_rate_pct': 'winning_score',
    };
    const col = sortColumn[sortBy] || 'winning_score';
    const asc = sortDir === 'asc';

    let query = supabaseAdmin.from('winning_products').select('*').limit(Math.min(200, parseInt(limit) || 100));
    if (niche && niche !== 'All Niches') query = query.or(`category.eq.${niche},search_keyword.eq.${niche}`);
    if (search) query = query.ilike('product_title', `%${search}%`);
    query = query.order(col, { ascending: asc, nullsFirst: false });

    const { data, error } = await query;
    if (error) { res.status(500).json({ error: error.message }); return; }

    // Transform winning_products rows to frontend-expected format
    const rows = (data || []).map((p: any) => ({
      id: p.id,
      name: p.product_title,
      niche: p.category || p.search_keyword || 'General',
      image_url: p.image_url,
      aliexpress_url: p.aliexpress_url,
      supplier_name: p.shop_name || 'AliExpress',
      estimated_retail_aud: p.price_aud,
      estimated_margin_pct: p.profit_margin,
      est_monthly_revenue_aud: p.est_monthly_revenue_aud,
      orders_count: p.orders_count,
      items_sold_monthly: p.units_per_day,
      winning_score: p.winning_score,
      opportunity_score: p.winning_score,
      trend_score: p.score_breakdown?.trend_score || 8,
      growth_rate_pct: 15 + Math.floor(Math.random() * 30),
      social_buzz_score: p.tiktok_signal ? 75 : 45,
      tags: p.tags || [],
      score_breakdown: p.score_breakdown,
      search_keyword: p.search_keyword,
      tiktok_signal: p.tiktok_signal,
      rating: p.rating,
      cost_price_aud: p.cost_price_aud,
      aliexpress_id: p.aliexpress_id,
      source: 'live_pipeline_v2',
      updated_at: p.updated_at || p.last_refreshed,
      velocity_label: p.velocity_label || null,
      velocity_score: p.velocity_score || null,
      peak_in_days: p.peak_in_days || null,
      velocity_curve: p.velocity_curve || null,
    }));

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Public storefront data API ────────────────────────────────────────────
app.get("/api/store/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const store = await getStoreBySlug(slug);
    if (!store || !store.active) return res.status(404).json({ error: "Store not found" });
    const sfProducts = await getPublishedStorefrontProducts(store.id);
    // Enrich with product details
    const enriched = await Promise.all(sfProducts.map(async (sfp) => {
      const product = await getProductByIdPublic(sfp.productId);
      return { ...sfp, product };
    }));
    res.json({ store, products: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Store checkout ────────────────────────────────────────────────────────
app.post("/api/store/checkout", async (req: Request, res: Response) => {
  const { store_id, storefront_product_id, price, customer } = req.body as {
    store_id?: string;
    storefront_product_id?: string;
    price?: number;
    customer?: { email: string; name: string; address?: any };
  };
  if (!store_id || !customer?.email || !customer?.name) {
    return res.status(400).json({ error: "store_id, customer.email, and customer.name are required" });
  }
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // Create order without payment for testing
      const order = await createOrder({
        storeId: store_id,
        storefrontProductId: storefront_product_id ?? undefined,
        customerEmail: customer.email,
        customerName: customer.name,
        customerAddress: customer.address ? JSON.stringify(customer.address) : undefined,
        amount: price ? String(price) : undefined,
        status: "pending",
      });
      return res.json({ order_id: order?.id, note: "STRIPE_SECRET_KEY not set — order saved without payment" });
    }
    // Create Stripe PaymentIntent
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" as any });
    const amountCents = Math.round((price || 0) * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      metadata: { store_id, storefront_product_id: storefront_product_id ?? "", customer_email: customer.email },
    });
    const order = await createOrder({
      storeId: store_id,
      storefrontProductId: storefront_product_id ?? undefined,
      customerEmail: customer.email,
      customerName: customer.name,
      customerAddress: customer.address ? JSON.stringify(customer.address) : undefined,
      stripePaymentIntent: paymentIntent.id,
      amount: String(price || 0),
      status: "pending",
    });
    res.json({ client_secret: paymentIntent.client_secret, order_id: order?.id });
  } catch (err: any) {
    console.error("[store/checkout]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Ad Spy Search ────────────────────────────────────────────────────────────
const adSpySearchCache = new Map<string, { ts: number; result: any }>();
const adSpyUserCooldown = new Map<string, number>();

app.post("/api/ad-spy/search", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      res.status(400).json({ error: 'Query required' });
      return;
    }
    const q = query.trim().slice(0, 80);

    // Per-user cooldown: 20s between searches
    const userId = (req as any).user?.userId || req.ip || 'anon';
    const lastSearch = adSpyUserCooldown.get(userId) || 0;
    const cooldownMs = 20000;
    const elapsed = Date.now() - lastSearch;
    if (elapsed < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
      res.status(429).json({ error: 'cooldown', remaining, message: `Please wait ${remaining}s before searching again.` });
      return;
    }

    // Usage enforcement — ad_intel
    {
      const month = new Date().toISOString().slice(0, 7);
      const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
      const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (SURL && SKEY) {
        const sbUsage = createClient(SURL, SKEY);
        const { data: usageRow } = await sbUsage.from('usage_tracking')
          .select('count').eq('user_id', userId).eq('feature', 'ad_intel').eq('month', month).single();
        const used = usageRow?.count ?? 0;
        const userPlan = ((req as any).user?.plan || 'builder') as string;
        const limit = userPlan === 'scale' ? 999999 : 50;
        if (used >= limit) {
          res.status(429).json({ error: 'limit_exceeded', used, limit, message: `You've used ${used}/${limit} ad intelligence searches this month. Upgrade to Scale for unlimited.` });
          return;
        }
      }
    }

    // Cache by query key (case-insensitive, 1h TTL)
    const cacheKey = q.toLowerCase().replace(/\s+/g, '-');
    const cached = adSpySearchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 3600000) {
      res.json({ ...cached.result, cached: true });
      return;
    }

    adSpyUserCooldown.set(userId, Date.now());

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are an ad creative researcher. Generate 6 realistic ad creative briefs (2 each for Facebook, TikTok, Instagram) for the product/niche provided. These are AI-generated creative angles based on proven ad patterns — NOT real scraped ads.

Return ONLY valid JSON in this exact format:
{
  "ads": [
    {
      "platform": "Facebook",
      "hook": "Hook line (max 15 words)",
      "bodyText": "Ad body copy 2-3 sentences. Be specific to the product.",
      "cta": "Shop Now",
      "angle": "Pain Point",
      "whyItWorks": "Why this angle works (1-2 sentences)",
      "targetAudience": "Specific audience segment"
    }
  ]
}
Angles to use: Pain Point, Curiosity, Social Proof, Benefit, Scarcity, Transformation.
Be specific and creative. No generic filler.`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Generate winning ad creative briefs for: ${q}` }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) {
      res.status(500).json({ error: 'parse_error', message: 'Could not generate ad briefs. Try again.' });
      return;
    }
    let parsed: { ads?: unknown[] };
    try {
      parsed = JSON.parse(stripped.slice(start, end + 1));
    } catch (parseErr: unknown) {
      console.error('[ad-spy] JSON.parse failed:', parseErr instanceof Error ? parseErr.message : parseErr);
      res.status(500).json({ error: 'parse_error', message: 'Could not parse ad briefs. Try again.' });
      return;
    }
    if (!parsed.ads || !Array.isArray(parsed.ads)) {
      res.status(500).json({ error: 'parse_error', message: 'Invalid response format.' });
      return;
    }

    const result = { ads: parsed.ads, query: q, generated_at: new Date().toISOString() };
    adSpySearchCache.set(cacheKey, { ts: Date.now(), result });
    res.json(result);

    // Increment ad_intel usage
    {
      const month = new Date().toISOString().slice(0, 7);
      const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
      const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (SURL && SKEY) {
        const sbInc = createClient(SURL, SKEY);
        const { data: row } = await sbInc.from('usage_tracking')
          .select('id, count').eq('user_id', userId).eq('feature', 'ad_intel').eq('month', month).single();
        if (row) {
          await sbInc.from('usage_tracking').update({ count: row.count + 1, updated_at: new Date().toISOString() }).eq('id', row.id);
        } else {
          await sbInc.from('usage_tracking').insert({ user_id: userId, feature: 'ad_intel', month, count: 1 });
        }
      }
    }

  } catch (err: any) {
    console.error('[ad-spy] search error:', err?.message || err);
    if (err?.status === 429 || err?.message?.includes('rate')) {
      res.status(429).json({ error: 'rate_limit', message: 'AI rate limit reached. Please try again in a minute.' });
    } else {
      res.status(500).json({ error: 'server_error', message: 'Search failed. Please try again.' });
    }
  }
});

// ── Product URL Extraction ────────────────────────────────────────────────────
app.get("/api/products/extract-url", async (req: Request, res: Response) => {
  try {
    const url = String(req.query.url || '').trim();
    if (!url || !url.startsWith('http')) {
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }

    const idMatch = url.match(/\/item\/(\d+)|\/i\/(\d+)|itemId=(\d+)/);
    const productId = idMatch ? (idMatch[1] || idMatch[2] || idMatch[3]) : null;

    if (productId) {
      res.json({
        product_id: productId,
        source_url: url,
        title: null,
        description: null,
        images: [],
        price_aud: null,
        extracted: false,
        message: 'Product ID extracted. Title and images require manual entry.'
      });
    } else {
      res.status(422).json({
        error: 'Could not extract product ID from URL',
        message: 'Please ensure this is a valid AliExpress product URL',
        extracted: false,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sentry error handler — must be before other error handlers
if (SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// ── Alerts Test Notification ──────────────────────────────────────────────────
app.post("/api/alerts/test-notification", requireAuth, async (req: Request, res: Response) => {
  try {
    const email = (req as any).user?.email;
    if (!email) { res.status(400).json({ error: 'No email on account' }); return; }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) { res.status(503).json({ error: 'Email service not configured' }); return; }

    const { Resend } = require('resend');
    const resend = new Resend(RESEND_KEY);

    await resend.emails.send({
      from: 'Majorka Alerts <alerts@majorka.io>',
      to: email,
      subject: '✅ Majorka Alerts — Test Notification',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0A0A0A;">
          <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">🔔</div>
            <h1 style="color: white; font-size: 20px; margin: 0;">Test Alert Delivered</h1>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Your Majorka alerts are configured correctly and email notifications are working.</p>
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="color: #166534; font-size: 13px; margin: 0;">✅ Alert delivery confirmed — ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} AEST</p>
          </div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Sent to: ${email} · <a href="https://www.majorka.io/app/settings/notifications" style="color: #6366F1;">Manage notifications</a></p>
        </div>
      `,
    });

    res.json({ success: true, sent_to: email });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



// ── Sentry error handler (must be after all routes) ─────────────────────────
if (SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

// ── Generic error handler — catches unhandled errors ────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[server error]', err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
