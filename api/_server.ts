/**
 * Vercel Serverless Function — wraps the Express app for serverless deployment.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import express, { type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerChatRoutes } from "../server/_core/chat";
import { registerScrapeRoutes, scrapeProductData } from "../server/lib/scrape-product";
import { analyzeProduct } from "../server/lib/product-intelligence";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { createCheckoutSession, constructWebhookEvent, handleWebhook } from "../server/lib/stripe";
import { getStoreBySlug, getPublishedStorefrontProducts, createOrder } from "../server/db";
import { getProductById } from "../server/db";

const app = express();

// ── Stripe webhook must receive raw body — register BEFORE express.json() ─────
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "Missing Stripe signature header" });
  }
  try {
    const event = constructWebhookEvent(req.body as Buffer, signature);
    await handleWebhook(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe webhook] Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

// ── API health check ──────────────────────────────────────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
    firecrawl: !!process.env.FIRECRAWL_API_KEY,
    supabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    database: !!process.env.DATABASE_URL,
  });
});

registerChatRoutes(app);
registerScrapeRoutes(app);

// ── Product import with AI Brain ─────────────────────────────────────────────
app.post("/api/import-product", async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url is required" });
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

// ── Stripe checkout session ─────────────────────────────────────────────────
app.post("/api/stripe/checkout-session", async (req, res) => {
  try {
    const context = await createContext({ req, res } as any);
    if (!context.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { url } = await createCheckoutSession({
      userId: context.user.id,
      userEmail: context.user.email ?? undefined,
    });
    res.json({ url });
  } catch (err: any) {
    console.error("[Stripe checkout] Error:", err.message);
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
      const product = await getProductById(sfp.productId);
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

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
