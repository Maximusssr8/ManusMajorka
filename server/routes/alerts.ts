/**
 * /api/alerts — CRUD for server-backed alerts + cron evaluation + email via Resend.
 *
 * Replaces the localStorage-only system. Alerts are stored in Supabase so the
 * cron at /api/cron/evaluate-alerts can check conditions against the live DB
 * and send email notifications via Resend.
 */

import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

function sb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

router.use(requireAuth);

// ── GET /api/alerts — list user's alerts ────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const supa = sb();
    const { data, error } = await supa
      .from('user_alerts')
      .select('id,alert_type,condition_value,email,enabled,last_triggered_at,trigger_count,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet
      if (error.message?.includes('does not exist')) {
        return res.json({ alerts: [], migrationPending: true });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.json({ alerts: data || [] });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ── POST /api/alerts — create a new alert ───────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { alertType, conditionValue, email } = req.body;
    if (!alertType || !conditionValue || !email) {
      return res.status(400).json({ error: 'alertType, conditionValue, and email are required' });
    }
    const VALID_TYPES = ['score', 'new', 'price', 'trending'];
    if (!VALID_TYPES.includes(alertType)) {
      return res.status(400).json({ error: `alertType must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const supa = sb();
    const { data, error } = await supa
      .from('user_alerts')
      .insert({
        user_id: userId,
        alert_type: alertType,
        condition_value: String(conditionValue),
        email: String(email).toLowerCase().trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'migration_pending', message: 'Run supabase/migrations/20260412_alerts.sql' });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ alert: data });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ── DELETE /api/alerts/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const supa = sb();
    const { error } = await supa
      .from('user_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ── PATCH /api/alerts/:id/toggle — enable/disable ──────────────────────────
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const supa = sb();
    const { data: existing } = await supa
      .from('user_alerts')
      .select('enabled')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (!existing) return res.status(404).json({ error: 'Alert not found' });

    const { error } = await supa
      .from('user_alerts')
      .update({ enabled: !existing.enabled })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, enabled: !existing.enabled });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ── GET /api/alerts/history — recent notifications ──────────────────────────
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const supa = sb();
    const { data, error } = await supa
      .from('alert_history')
      .select('id,alert_id,product_title,message,sent_at')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);
    if (error) {
      if (error.message?.includes('does not exist')) return res.json({ history: [] });
      return res.status(500).json({ error: error.message });
    }
    return res.json({ history: data || [] });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;

/**
 * Cron evaluation — called by /api/cron/evaluate-alerts.
 * Checks each enabled alert against the live winning_products table
 * and sends email via Resend when conditions are met.
 */
export async function evaluateAlerts(): Promise<{ checked: number; triggered: number; errors: string[] }> {
  const supa = sb();
  const result = { checked: 0, triggered: 0, errors: [] as string[] };

  const { data: alerts, error } = await supa
    .from('user_alerts')
    .select('*')
    .eq('enabled', true);

  if (error || !alerts) {
    result.errors.push(error?.message || 'Failed to fetch alerts');
    return result;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    result.errors.push('RESEND_API_KEY not set — skipping email delivery');
  }

  for (const alert of alerts) {
    result.checked++;
    try {
      let matches: { id: string; product_title: string }[] = [];

      switch (alert.alert_type) {
        case 'score': {
          const threshold = parseInt(alert.condition_value, 10) || 80;
          const { data } = await supa
            .from('winning_products')
            .select('id,product_title')
            .gte('winning_score', threshold)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(5);
          matches = data || [];
          break;
        }
        case 'new': {
          const category = alert.condition_value;
          const { data } = await supa
            .from('winning_products')
            .select('id,product_title')
            .ilike('category', `%${category.replace(/[.,()%]/g, '')}%`)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(5);
          matches = data || [];
          break;
        }
        case 'price': {
          const maxPrice = parseFloat(alert.condition_value) || 10;
          const { data } = await supa
            .from('winning_products')
            .select('id,product_title')
            .lte('price_aud', maxPrice)
            .gt('winning_score', 50)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(5);
          matches = data || [];
          break;
        }
        case 'trending': {
          const pctThreshold = parseInt(alert.condition_value, 10) || 20;
          // Trending: products with high velocity added recently
          const { data } = await supa
            .from('winning_products')
            .select('id,product_title')
            .gte('winning_score', 70)
            .gte('sold_count', pctThreshold * 100) // rough proxy
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(5);
          matches = data || [];
          break;
        }
      }

      if (matches.length === 0) continue;

      const message = `Alert: ${matches.length} product(s) matched your "${alert.alert_type}" condition (${alert.condition_value}). Top match: ${matches[0].product_title}`;

      // Log to alert_history
      await supa.from('alert_history').insert({
        alert_id: alert.id,
        user_id: alert.user_id,
        product_id: matches[0].id,
        product_title: matches[0].product_title,
        message,
      });

      // Update trigger count
      await supa
        .from('user_alerts')
        .update({
          last_triggered_at: new Date().toISOString(),
          trigger_count: (alert.trigger_count || 0) + 1,
        })
        .eq('id', alert.id);

      // Send email via Resend
      if (resendKey) {
        try {
          const productList = matches.map((m, i) => `${i + 1}. ${m.product_title}`).join('\n');
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: 'Majorka Alerts <alerts@majorka.io>',
              to: [alert.email],
              subject: `Majorka Alert: ${matches.length} product(s) matched "${alert.alert_type}"`,
              html: `
                <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #080808; color: #ededed;">
                  <div style="margin-bottom: 24px;">
                    <span style="font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: #d4af37;">majorka</span>
                  </div>
                  <h2 style="font-size: 18px; margin-bottom: 12px;">Alert triggered: ${alert.alert_type}</h2>
                  <p style="color: #888; font-size: 14px; margin-bottom: 16px;">
                    Your "${alert.alert_type}" alert (condition: ${alert.condition_value}) matched ${matches.length} new product(s):
                  </p>
                  <pre style="background: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 8px; padding: 16px; color: #ededed; font-size: 13px; white-space: pre-wrap;">${productList}</pre>
                  <div style="margin-top: 24px;">
                    <a href="https://www.majorka.io/app/products" style="display: inline-block; background: #3B82F6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Majorka →</a>
                  </div>
                  <p style="color: #555; font-size: 11px; margin-top: 32px;">You're receiving this because you set up an alert at majorka.io. Manage alerts in Settings.</p>
                </div>
              `,
            }),
          });
          result.triggered++;
        } catch (emailErr: unknown) {
          result.errors.push(`Email to ${alert.email}: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`);
        }
      } else {
        result.triggered++; // Count as triggered even without email (logged to history)
      }
    } catch (alertErr: unknown) {
      result.errors.push(`Alert ${alert.id}: ${alertErr instanceof Error ? alertErr.message : String(alertErr)}`);
    }
  }

  return result;
}
