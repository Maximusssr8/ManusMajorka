/**
 * Affiliate & subscriber API routes.
 * Handles: affiliate join, stats, click tracking, email subscribe, user count.
 */
import type { Express, Request, Response } from "express";
import { getSupabaseAdmin } from "../_core/supabase";
import {
  getAffiliateByUserId,
  getAffiliateByCode,
  createAffiliate,
  incrementAffiliateClicks,
  incrementAffiliateSignups,
  createSubscriber,
  getSubscriberByEmail,
  getUserCount,
  createReferral,
} from "../db";

function generateCode(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function authenticateUser(req: Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function registerAffiliateRoutes(app: Express) {
  // ─── Affiliate: Join ────────────────────────────────────────────────────
  app.post("/api/affiliate/join", async (req: Request, res: Response) => {
    const userId = await authenticateUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const existing = await getAffiliateByUserId(userId);
    if (existing) {
      return res.json({ success: true, affiliate: existing });
    }

    const code = generateCode();
    const affiliate = await createAffiliate({
      userId,
      code,
      clicks: 0,
      signups: 0,
      revenue: 0,
      commissionRate: 30,
    });

    res.json({ success: true, affiliate });
  });

  // ─── Affiliate: Stats ──────────────────────────────────────────────────
  app.get("/api/affiliate/stats", async (req: Request, res: Response) => {
    const userId = await authenticateUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const affiliate = await getAffiliateByUserId(userId);
    if (!affiliate) {
      return res.json({ joined: false });
    }

    res.json({
      joined: true,
      code: affiliate.code,
      clicks: affiliate.clicks,
      signups: affiliate.signups,
      revenueCents: affiliate.revenue,
      commissionRate: affiliate.commissionRate,
    });
  });

  // ─── Affiliate: Track click ────────────────────────────────────────────
  app.post("/api/affiliate/track", async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code is required" });
    }

    const affiliate = await getAffiliateByCode(code);
    if (!affiliate) {
      return res.status(404).json({ error: "Invalid affiliate code" });
    }

    await incrementAffiliateClicks(code);
    res.json({ success: true });
  });

  // ─── Affiliate: Record referral on signup ──────────────────────────────
  app.post("/api/affiliate/referral", async (req: Request, res: Response) => {
    const { code, referredUserId } = req.body;
    if (!code || !referredUserId) {
      return res.status(400).json({ error: "code and referredUserId are required" });
    }

    const affiliate = await getAffiliateByCode(code);
    if (!affiliate) {
      return res.status(404).json({ error: "Invalid affiliate code" });
    }

    await incrementAffiliateSignups(code);
    await createReferral({
      affiliateId: affiliate.id,
      referredUserId,
      status: "signed_up",
      commissionCents: 0,
    });

    res.json({ success: true });
  });

  // ─── Email Subscribe ───────────────────────────────────────────────────
  app.post("/api/subscribe", async (req: Request, res: Response) => {
    const { email, source, niche } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    // Check for existing subscriber
    const existing = await getSubscriberByEmail(email);
    if (existing) {
      return res.json({ success: true, message: "Already subscribed" });
    }

    await createSubscriber({
      email: email.toLowerCase().trim(),
      source: source || "homepage",
      niche: niche || null,
    });

    // Fire n8n webhook if configured
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, niche, subscribedAt: new Date().toISOString() }),
      }).catch(() => { /* fire and forget */ });
    }

    res.json({
      success: true,
      message: "Check your inbox for your free AU product research guide",
    });
  });

  // ─── Public: User count (for social proof) ─────────────────────────────
  app.get("/api/stats/users", async (_req: Request, res: Response) => {
    const count = await getUserCount();
    // Add a base number for social proof (early stage)
    const displayCount = count + 127;
    res.json({ count: displayCount });
  });
}
