// @ts-nocheck — Passport auth routes are not in use; app uses Supabase auth.
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "./passport";
import { Resend } from "resend";
import crypto from "crypto";
import * as db from "../db";

// In-memory store for email verification codes (swap with Redis in production)
const emailCodes = new Map<string, { code: string; expiresAt: number }>();

export function registerAuthRoutes(app: Express) {
  // ─── Session middleware ───────────────────────────────────────────────
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "majorka-dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ─── Google OAuth routes ──────────────────────────────────────────────
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (_req: Request, res: Response) => {
      res.redirect("/app");
    }
  );

  // ─── Apple OAuth placeholder ──────────────────────────────────────────
  // Apple Sign-In requires Apple Developer Program membership.
  // This route redirects to sign-in with a message until configured.
  app.get("/api/auth/apple", (_req: Request, res: Response) => {
    if (!process.env.APPLE_ID || !process.env.APPLE_SECRET) {
      res.redirect("/login?error=apple_not_configured");
      return;
    }
    // TODO: Add passport-apple strategy when Apple Developer credentials are provided
    res.redirect("/login?error=apple_not_configured");
  });

  // ─── Email magic link / code ──────────────────────────────────────────
  app.post("/api/auth/email/send-code", async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    emailCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
    });

    // Send via Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Majorka <noreply@majorka.com>",
          to: email,
          subject: "Your Majorka sign-in code",
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; text-align: center; padding: 40px 20px;">
              <div style="background: #d4af37; color: #000; width: 48px; height: 48px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; margin-bottom: 24px;">M</div>
              <h1 style="font-size: 24px; color: #f0ede8; margin-bottom: 8px;">Your sign-in code</h1>
              <p style="color: #999; margin-bottom: 24px;">Enter this code to sign in to Majorka</p>
              <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #d4af37;">${code}</div>
              <p style="color: #666; font-size: 12px; margin-top: 24px;">This code expires in 10 minutes.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[Auth] Failed to send email:", err);
      }
    } else {
      // In development without Resend, log the code
      console.log(`[Auth] Email code for ${email}: ${code}`);
    }

    res.json({ success: true });
  });

  app.post("/api/auth/email/verify", async (req: Request, res: Response) => {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: "Email and code are required" });
      return;
    }

    const stored = emailCodes.get(email.toLowerCase());
    if (!stored || stored.code !== code || stored.expiresAt < Date.now()) {
      res.status(401).json({ error: "Invalid or expired code" });
      return;
    }

    // Code valid — clean up
    emailCodes.delete(email.toLowerCase());

    // Upsert user
    await db.upsertUser({
      openId: `email_${email.toLowerCase()}`,
      name: email.split("@")[0],
      email: email.toLowerCase(),
      loginMethod: "email",
      lastSignedIn: new Date(),
    });

    // Get user and login
    const user = await db.getUserByOpenId(`email_${email.toLowerCase()}`);
    if (user) {
      (req as any).login(user, (err: any) => {
        if (err) {
          res.status(500).json({ error: "Session creation failed" });
          return;
        }
        res.json({ success: true, redirect: "/app" });
      });
    } else {
      res.status(500).json({ error: "User creation failed" });
    }
  });

  // ─── Session status ───────────────────────────────────────────────────
  app.get("/api/auth/session", (req: Request, res: Response) => {
    if (req.isAuthenticated?.() && req.user) {
      res.json({ user: req.user, authenticated: true });
    } else {
      res.json({ user: null, authenticated: false });
    }
  });

  // ─── Logout ───────────────────────────────────────────────────────────
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout?.((err: any) => {
      if (err) console.error("[Auth] Logout error:", err);
      req.session?.destroy?.(() => {});
      res.json({ success: true });
    });
  });
}

// Middleware to require authentication on protected routes
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated?.() && req.user) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
}
