/**
 * Auth Routes — Email code verification, Google OAuth, Apple OAuth.
 * Uses in-memory code store for dev; Resend API for production email delivery.
 */
import type { Express } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import * as db from "../db";

// In-memory code store (dev only; production would use Redis or DB)
const codeStore = new Map<string, { code: string; expires: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendCodeEmail(email: string, code: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Majorka <noreply@majorka.com>",
          to: [email],
          subject: `Your Majorka verification code: ${code}`,
          html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:40px 20px;text-align:center;"><h1 style="color:#d4af37;font-size:24px;margin-bottom:8px;">Majorka</h1><p style="color:#666;margin-bottom:24px;">Your verification code is:</p><div style="background:#f5f5f5;border-radius:12px;padding:20px;font-size:32px;letter-spacing:8px;font-weight:bold;color:#000;">${code}</div><p style="color:#999;margin-top:24px;font-size:13px;">This code expires in 10 minutes.</p></div>`,
        }),
      });
    } catch (err) {
      console.error("[Auth] Failed to send email via Resend:", err);
    }
  } else {
    // Dev mode: log code to console
    console.log(`[Auth] Verification code for ${email}: ${code}`);
  }
}

export function registerAuthRoutes(app: Express) {
  // Send verification code to email
  app.post("/api/auth/email/send-code", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "email is required" });
        return;
      }

      const code = generateCode();
      codeStore.set(email.toLowerCase(), { code, expires: Date.now() + 10 * 60 * 1000 });

      await sendCodeEmail(email.toLowerCase(), code);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Auth] send-code error:", error);
      res.status(500).json({ error: "Failed to send code" });
    }
  });

  // Verify code and create session
  app.post("/api/auth/email/verify", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(400).json({ error: "email and code are required" });
        return;
      }

      const stored = codeStore.get(email.toLowerCase());
      if (!stored || stored.code !== code || stored.expires < Date.now()) {
        res.status(401).json({ error: "Invalid or expired code" });
        return;
      }

      // Code is valid — clean up
      codeStore.delete(email.toLowerCase());

      // Upsert user
      const openId = `email_${email.toLowerCase()}`;
      await db.upsertUser({
        openId,
        email: email.toLowerCase(),
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Create session
      const sessionToken = await sdk.createSessionToken(openId, {
        name: email.split("@")[0] || "User",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Auth] verify error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Google OAuth redirect (placeholder — full OAuth requires passport)
  app.get("/api/auth/google", (_req, res) => {
    // If OAuth is configured, redirect to the OAuth portal
    const oauthUrl = process.env.OAUTH_SERVER_URL;
    const appId = process.env.VITE_APP_ID;
    if (oauthUrl && appId) {
      const redirectUri = `${_req.protocol}://${_req.get("host")}/api/oauth/callback`;
      const state = Buffer.from(redirectUri).toString("base64");
      res.redirect(`${oauthUrl}/app-auth?appId=${appId}&redirectUri=${encodeURIComponent(redirectUri)}&state=${state}&type=signIn&provider=google`);
    } else {
      res.status(501).json({ error: "Google OAuth not configured. Set OAUTH_SERVER_URL and VITE_APP_ID." });
    }
  });

  // Apple OAuth redirect (placeholder)
  app.get("/api/auth/apple", (_req, res) => {
    const oauthUrl = process.env.OAUTH_SERVER_URL;
    const appId = process.env.VITE_APP_ID;
    if (oauthUrl && appId) {
      const redirectUri = `${_req.protocol}://${_req.get("host")}/api/oauth/callback`;
      const state = Buffer.from(redirectUri).toString("base64");
      res.redirect(`${oauthUrl}/app-auth?appId=${appId}&redirectUri=${encodeURIComponent(redirectUri)}&state=${state}&type=signIn&provider=apple`);
    } else {
      res.status(501).json({ error: "Apple OAuth not configured. Set APPLE_ID and APPLE_SECRET." });
    }
  });

  // Session check
  app.get("/api/auth/session", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user });
    } catch {
      res.json({ user: null });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
