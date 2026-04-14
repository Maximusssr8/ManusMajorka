import { config } from 'dotenv';

config(); // loads .env
config({ path: '.env.local', override: false }); // loads .env.local, doesn't override existing

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
  });
}

import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import { createServer } from 'http';
import net from 'net';
import cron from 'node-cron';
import { registerAffiliateRoutes } from '../lib/affiliate';
import { registerAutomationRoutes } from '../lib/automation-api';
import { registerDemoRoutes } from '../lib/demo-api';
import { refreshWinningProducts } from '../lib/refresh-winning-products';
import { detectTrends } from '../lib/trend-detection';
import { registerScrapeRoutes } from '../lib/scrape-product';
import { registerStripeRoutes } from '../lib/stripe';
import { registerToolsApi } from '../lib/tools-api';
import { registerWebsiteRoutes } from '../lib/website-api';
import cookieParser from 'cookie-parser';
import shopifyRouter from '../routes/shopify';
import storeBuilderRouter from '../routes/store-builder';
import apifyRouter from '../routes/apify';
import { appRouter } from '../routers';
import { registerChatRoutes } from './chat';
import { createContext } from './context';
import { serveStatic, setupVite } from './vite';
import { createClient } from '@supabase/supabase-js';
import { getUsageSummary } from '../lib/usageLimits';
import type { Plan } from '../../shared/plans';
import { requireAuth } from '../middleware/requireAuth';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ═══ Agent Activity Log (in-memory, max 100 entries) ═══
interface AgentLogEntry {
  agent: string;
  message: string;
  status: string;
  timestamp: string;
}
const agentLog: AgentLogEntry[] = [];

async function startServer() {
  const app = express();
  const server = createServer(app);

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

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ═══ Agent Log API ═══
  const agentLogOrigin = process.env.NODE_ENV === 'production'
    ? (process.env.VITE_APP_URL ?? 'https://www.majorka.io')
    : 'http://localhost:5173';
  app.options('/api/agent-log', (_req, res) => {
    res.set({
      'Access-Control-Allow-Origin': agentLogOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.sendStatus(204);
  });

  // Shared-secret middleware for /api/agent-log (server-to-server only).
  // Accepts either x-agent-log-secret header or localhost origin.
  // Set AGENT_LOG_SECRET in env to enable secret-based auth (used by n8n + discord bot).
  const agentLogAuth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const secret = process.env.AGENT_LOG_SECRET;
    const provided = req.headers['x-agent-log-secret'];
    if (secret && provided === secret) {
      next();
      return;
    }
    const origin = String(req.headers.origin || req.headers.referer || '');
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1') || !origin;
    if (isLocal) {
      next();
      return;
    }
    res.status(401).json({ error: 'unauthorized', message: 'Agent log requires x-agent-log-secret header' });
  };

  app.post('/api/agent-log', agentLogAuth, (req, res) => {
    res.set('Access-Control-Allow-Origin', agentLogOrigin);
    const { agent, message, status, timestamp } = req.body;
    if (!agent || !message) {
      return res.status(400).json({ error: 'agent and message are required' });
    }
    const entry: AgentLogEntry = {
      agent,
      message,
      status: status || 'info',
      timestamp: timestamp || new Date().toISOString(),
    };
    agentLog.push(entry);
    if (agentLog.length > 100) agentLog.shift();
    res.json({ ok: true, count: agentLog.length });
  });

  app.get('/api/agent-log', agentLogAuth, (_req, res) => {
    res.set('Access-Control-Allow-Origin', agentLogOrigin);
    res.json(agentLog);
  });

  // DB migrations disabled on auto-startup — all tables already exist in Supabase.
  // Run migrations manually via POST /api/internal/run-intel-migration if needed.

  // One-time intelligence tables migration endpoint
  app.post('/api/internal/run-intel-migration', async (req, res) => {
    const secret = req.headers['x-migration-secret'];
    const migrationSecret = process.env.MIGRATION_SECRET || 'majorka-intel-2026';
    if (secret !== migrationSecret) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    try {
      const { createIntelligenceTables } = await import('../lib/migrate-winning-products');
      const result = await createIntelligenceTables();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Generated stores migration + status endpoint
  app.post('/api/internal/run-stores-migration', async (req, res) => {
    const secret = req.headers['x-migration-secret'];
    const migrationSecret = process.env.MIGRATION_SECRET || 'majorka-intel-2026';
    if (secret !== migrationSecret) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    try {
      const { runGeneratedStoresMigration } = await import('../migrations/runGeneratedStores');
      await runGeneratedStoresMigration();
      res.json({ ok: true, message: 'generated_stores migration complete' });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/migrations/generated-stores', async (req, res) => {
    const secret = req.headers['x-migration-secret'];
    const migrationSecret = process.env.MIGRATION_SECRET || 'majorka-intel-2026';
    if (secret !== migrationSecret) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return res.json({ exists: false, error: 'missing env vars' });
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

  // Chat API with streaming and tool calling
  registerChatRoutes(app);
  // Product scraping API
  registerScrapeRoutes(app);
  // Stripe checkout + webhook routes
  registerStripeRoutes(app);
  // Research & intelligence tool endpoints
  registerToolsApi(app);
  // Lead generation & automation webhooks
  registerAutomationRoutes(app);
  // Affiliate program, email subscribe, social proof
  registerAffiliateRoutes(app);
  // Demo research endpoint (unauthenticated, rate-limited)
  registerDemoRoutes(app);
  // Website Generator — Vercel deploy + product analyzer
  registerWebsiteRoutes(app);
  // Auth whitelist check (unauthenticated — called after sign-in)
  const authRouter = (await import('../routes/auth')).default;
  app.use('/api/auth', authRouter);
  // Shopify OAuth + Store Builder
  app.use(cookieParser());
  app.use('/api/shopify', shopifyRouter);
  app.use('/api/store-builder', storeBuilderRouter);
  app.use('/api/apify', apifyRouter);
  // Majorka ai router (chat, generate, image, store concept, meta ad variants)
  const aiModule = await import('../routes/ai');
  app.use('/api/ai', aiModule.default);
  app.use('/api/ads', aiModule.adsRouter);
  // Saved stores + saved ad sets (user CRUD behind RLS)
  const storesRouter = (await import('../routes/stores')).default;
  app.use('/api/stores', storesRouter);
  const marketplaceRouter = (await import('../routes/marketplace')).default;
  app.use('/api/marketplace', marketplaceRouter);
  const metaRouter = (await import('../routes/meta')).default;
  app.use('/api/meta', metaRouter);
  const creatorsRealRouter = (await import('../routes/creators')).default;
  app.use('/api/creators', creatorsRealRouter);
  const videosRealRouter = (await import('../routes/videos')).default;
  app.use('/api/videos', videosRealRouter);
  // Cron endpoints (Vercel cron + manual refresh)
  const cronRouter = (await import('../routes/cron')).default;
  app.use('/api/cron', cronRouter);

  // Image proxy for AliExpress CDN (bypasses hotlink protection)
  const imageProxyRouter = (await import('../routes/imageProxy')).default;
  app.use('/api', imageProxyRouter);
  const dailyBriefRouter = (await import('../routes/daily-brief')).default;
  app.use('/api/daily-brief', dailyBriefRouter);
  // ── Usage tracking — GET /api/usage/me ────────────────────────────────────
  app.get('/api/usage/me', requireAuth, async (req, res) => {
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
  app.get('/api/usage/:feature', requireAuth, async (req, res) => {
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

  // Subscription + Admin
  const subscriptionRouter = (await import('../routes/subscription')).default;
  app.use('/api/subscription', subscriptionRouter);
  const adminApiRouter = (await import('../routes/admin')).default;
  app.use('/api/admin', adminApiRouter);
  const shopsRouter = (await import('../routes/shops')).default;
  app.use('/api/shops', shopsRouter);
  const apifySearchRouter = (await import('../routes/apify-search')).default;
  app.use('/api/products', apifySearchRouter); // search with Apify fallback (before main products router)
  const productsRouter = (await import('../routes/products')).default;
  app.use('/api/products', productsRouter);
  const waitlistRouter = (await import('../routes/waitlist')).default;
  app.use('/api/waitlist', waitlistRouter);
  const { default: aliexpressRouter } = await import('../routes/aliexpress');
  app.use('/api/aliexpress', aliexpressRouter);
  const { default: aliexpressAuthRouter } = await import('../routes/aliexpress-auth');
  app.use('/api/auth/aliexpress', aliexpressAuthRouter);
  const { registerGenerationRoutes } = await import('../routes/generation');
  registerGenerationRoutes(app);
  // ── Ad Spy Search ────────────────────────────────────────────────────────────
  const adSpySearchCache = new Map<string, { ts: number; result: any }>();
  const adSpyUserCooldown = new Map<string, number>();

  app.post('/api/ad-spy/search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({ error: 'Query required' });
        return;
      }
      const q = query.trim().slice(0, 80);

      const userId = (req as any).user?.userId || req.ip || 'anon';
      const lastSearch = adSpyUserCooldown.get(userId) || 0;
      const cooldownMs = 20000;
      const elapsed = Date.now() - lastSearch;
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        res.status(429).json({ error: 'cooldown', remaining, message: `Please wait ${remaining}s before searching again.` });
        return;
      }

      const cacheKey = q.toLowerCase().replace(/\s+/g, '-');
      const cached = adSpySearchCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < 3600000) {
        res.json({ ...cached.result, cached: true });
        return;
      }

      adSpyUserCooldown.set(userId, Date.now());

      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    } catch (err: any) {
      console.error('[ad-spy] search error:', err?.message || err);
      if (err?.status === 429 || err?.message?.includes('rate')) {
        res.status(429).json({ error: 'rate_limit', message: 'AI rate limit reached. Please try again in a minute.' });
      } else {
        res.status(500).json({ error: 'server_error', message: 'Search failed. Please try again.' });
      }
    }
  });

  // tRPC API
  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Sentry error handler (must be after routes)
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.expressErrorHandler());
  }

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || '3000');
  const port = await findAvailablePort(preferredPort);

  server.listen(port, () => {
  });

  // ── Scheduled product refresh (every 6h at 0:00, 6:00, 12:00, 18:00 AEST) ──
  cron.schedule('0 0,6,12,18 * * *', async () => {
    try {
      const result = await refreshWinningProducts();
    } catch (err: any) {
      console.error('[Products] Scheduled refresh failed:', err.message);
    }
  }, { timezone: 'Australia/Brisbane' });

  // ── Scheduled trend detection (every 6h at 3:00, 9:00, 15:00, 21:00 AEST) ──
  cron.schedule('0 3,9,15,21 * * *', async () => {
    const trends = await detectTrends().catch((err: Error) => {
      console.error('[Trends] Detection failed:', err.message);
      return null;
    });
  }, { timezone: 'Australia/Brisbane' });
}

startServer().catch(console.error);
