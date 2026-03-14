import { config } from 'dotenv';

config(); // loads .env
config({ path: '.env.local', override: false }); // loads .env.local, doesn't override existing

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
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
import { appRouter } from '../routers';
import { registerChatRoutes } from './chat';
import { createContext } from './context';
import { serveStatic, setupVite } from './vite';

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

  // ═══ Agent Log API (CORS for dashboard at localhost:5173) ═══
  app.options('/api/agent-log', (_req, res) => {
    res.set({
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.sendStatus(204);
  });

  app.post('/api/agent-log', (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
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

  app.get('/api/agent-log', (_req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.json(agentLog);
  });

  // Run DB migrations (non-fatal — gracefully skips if DB unreachable locally)
  import('../lib/migrate-winning-products').then(({ runWinningProductsMigration }) =>
    runWinningProductsMigration().catch(console.warn)
  );

  // One-time intelligence tables migration endpoint
  app.post('/api/internal/run-intel-migration', async (req, res) => {
    const secret = req.headers['x-migration-secret'];
    if (secret !== 'majorka-intel-2026') {
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

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // ── Scheduled product refresh (every 6h at 0:00, 6:00, 12:00, 18:00 AEST) ──
  cron.schedule('0 0,6,12,18 * * *', async () => {
    console.log('[Products] Starting scheduled refresh...');
    try {
      const result = await refreshWinningProducts();
      console.log(`[Products] Scheduled refresh complete — ${result.count} products updated`);
    } catch (err: any) {
      console.error('[Products] Scheduled refresh failed:', err.message);
    }
  }, { timezone: 'Australia/Brisbane' });
  console.log('[Products] Auto-refresh scheduled: 0:00, 6:00, 12:00, 18:00 AEST');

  // ── Scheduled trend detection (every 6h at 3:00, 9:00, 15:00, 21:00 AEST) ──
  cron.schedule('0 3,9,15,21 * * *', async () => {
    console.log('[Trends] Starting scheduled trend detection...');
    const trends = await detectTrends().catch((err: Error) => {
      console.error('[Trends] Detection failed:', err.message);
      return null;
    });
    if (trends) console.log(`[Trends] Refreshed ${trends.length} trend signals`);
  }, { timezone: 'Australia/Brisbane' });
  console.log('[Trends] Detection scheduled: 3:00, 9:00, 15:00, 21:00 AEST');
}

startServer().catch(console.error);
