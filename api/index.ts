/**
 * Vercel Serverless Function — wraps the Express app for serverless deployment.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerChatRoutes } from "../server/_core/chat";
import { registerScrapeRoutes } from "../server/lib/scrape-product";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { createCheckoutSession, constructWebhookEvent, handleWebhook } from "../server/lib/stripe";

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

registerChatRoutes(app);
registerScrapeRoutes(app);

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

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
