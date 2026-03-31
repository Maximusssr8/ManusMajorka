/**
 * Automation API — Lead generation, subscriber management, and n8n webhook routes.
 *
 * Registers Express routes for:
 *   POST   /api/subscribe
 *   POST   /api/webhooks/n8n/signup
 *   POST   /api/webhooks/n8n/usage-limit
 *   GET    /api/subscribers
 *   POST   /api/subscribers/unsubscribe
 *   GET    /api/automation/health
 */

import type { Application } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';
import { sendWelcomeSequence } from './onboarding-emails';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fire-and-forget POST to an n8n webhook URL. Logs errors but never throws. */
function fireWebhook(url: string | undefined, payload: Record<string, unknown>): void {
  if (!url) return;
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error('[automation] Webhook error:', err.message);
  });
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerAutomationRoutes(app: Application): void {
  // -----------------------------------------------------------------------
  // 1. POST /api/subscribe — Public email capture
  // -----------------------------------------------------------------------
  app.post('/api/subscribe', async (req, res) => {
    try {
      const { email, name, niche, source } = req.body ?? {};

      if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
        res.status(400).json({ error: 'A valid email address is required.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();

      // Try DB insert — gracefully skip if table doesn't exist
      try {
        const sb = getSupabaseAdmin();
        await sb.from('subscribers').upsert(
          {
            email: cleanEmail,
            name: name ?? null,
            niche: niche ?? null,
            source: source ?? null,
            status: 'active',
            subscribed_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
      } catch (dbErr: any) {
        // Table doesn't exist or DB unavailable — continue to email fallback
        console.warn('[subscribe] DB unavailable:', dbErr.message);
      }

      // Send branded welcome sequence (email 1 of 3) via onboarding-emails.ts
      sendWelcomeSequence(cleanEmail, name ?? '').catch(() => { /* non-fatal */ });

      // Notify Max
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        resend.emails.send({
          from: 'Majorka AI <hello@majorka.io>',
          to: 'maximusmajorka@gmail.com',
          subject: `🔥 New lead: ${cleanEmail}`,
          html: `<p>New subscriber: <strong>${cleanEmail}</strong>${name ? ` (${name})` : ''}<br>Source: ${source ?? 'homepage'}</p>`,
        }).catch(() => {});
      } catch { /* silent */ }

      // Fire n8n welcome sequence webhook (non-blocking)
      fireWebhook(process.env.N8N_WEBHOOK_URL, {
        event: 'subscribe',
        email: cleanEmail,
        name: name ?? null,
        niche: niche ?? null,
        source: source ?? null,
        timestamp: new Date().toISOString(),
      });

      res.json({ success: true, message: "You're in! Check your inbox for your free playbook." });
    } catch (err: any) {
      console.error('[subscribe] Error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 2. POST /api/webhooks/n8n/signup — New user signup notification
  // -----------------------------------------------------------------------
  app.post('/api/webhooks/n8n/signup', async (req, res) => {
    try {
      const { email, name, plan, source } = req.body ?? {};

      // Send onboarding welcome sequence (email 1 immediately, 2+3 via n8n)
      if (email) {
        sendWelcomeSequence(email, name ?? '').catch(() => { /* non-fatal */ });
      }

      // Fire Telegram notification via n8n
      fireWebhook(process.env.N8N_SIGNUP_WEBHOOK_URL, {
        event: 'user_signup',
        email: email ?? null,
        name: name ?? null,
        plan: plan ?? 'free',
        source: source ?? null,
        timestamp: new Date().toISOString(),
      });

      res.json({ ok: true });
    } catch (err: any) {
      console.error('[webhooks/n8n/signup] Error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 3. POST /api/webhooks/n8n/usage-limit — Free plan limit reached
  // -----------------------------------------------------------------------
  app.post('/api/webhooks/n8n/usage-limit', async (req, res) => {
    try {
      const { email, name, toolName, usageCount } = req.body ?? {};

      // Fire n8n upgrade workflow
      fireWebhook(process.env.N8N_UPGRADE_WEBHOOK_URL, {
        event: 'usage_limit_reached',
        email: email ?? null,
        name: name ?? null,
        toolName: toolName ?? null,
        usageCount: usageCount ?? 0,
        timestamp: new Date().toISOString(),
      });

      res.json({ ok: true });
    } catch (err: any) {
      console.error('[webhooks/n8n/usage-limit] Error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 4. GET /api/subscribers — Admin-only subscriber list
  // -----------------------------------------------------------------------
  app.get('/api/subscribers', async (req, res) => {
    try {
      const adminKey = process.env.ADMIN_API_KEY;
      if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const status = (req.query.status as string) || 'active';
      const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 1000);

      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from('subscribers')
        .select('*')
        .eq('status', status)
        .order('subscribed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[subscribers] Query error:', error.message);
        res.status(500).json({ error: 'Failed to fetch subscribers.' });
        return;
      }

      res.json({ subscribers: data ?? [], count: data?.length ?? 0 });
    } catch (err: any) {
      console.error('[subscribers] Error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 5. POST /api/subscribers/unsubscribe — Public unsubscribe
  // -----------------------------------------------------------------------
  app.post('/api/subscribers/unsubscribe', async (req, res) => {
    try {
      const email = (req.body?.email as string) || (req.query.email as string) || '';

      if (!email || !EMAIL_RE.test(email)) {
        res.status(400).json({ error: 'A valid email address is required.' });
        return;
      }

      const sb = getSupabaseAdmin();
      const { error: updateError } = await sb
        .from('subscribers')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase().trim());

      if (updateError) {
        console.error('[unsubscribe] Update error:', updateError.message);
        res.status(500).json({ error: 'Failed to unsubscribe. Please try again.' });
        return;
      }

      res.json({ success: true, message: "You've been unsubscribed." });
    } catch (err: any) {
      console.error('[unsubscribe] Error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 6. GET /api/automation/health — Automation system health check
  // -----------------------------------------------------------------------
  app.get('/api/automation/health', (_req, res) => {
    try {
      const welcomeConfigured = !!process.env.N8N_WEBHOOK_URL;
      const signupConfigured = !!process.env.N8N_SIGNUP_WEBHOOK_URL;
      const upgradeConfigured = !!process.env.N8N_UPGRADE_WEBHOOK_URL;

      res.json({
        status: 'ok',
        n8nConfigured: welcomeConfigured || signupConfigured || upgradeConfigured,
        webhookUrls: {
          welcome: welcomeConfigured,
          signup: signupConfigured,
          upgrade: upgradeConfigured,
        },
      });
    } catch (err: any) {
      console.error('[automation/health] Error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
