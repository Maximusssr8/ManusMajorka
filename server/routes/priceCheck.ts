/**
 * /api/cron/price-check — Vercel cron handler for price drop alerts.
 *
 * Runs every 6h (vercel.json). For each `price_alerts` row where
 * status='active', compares the live `winning_products.price_aud`
 * against the configured threshold (any_drop / percentage / target_price).
 *
 * On trigger:
 *   1. Send a Resend / Postmark email with the drop details.
 *   2. Mark the row triggered_at = now().
 *   3. Reset original_price = current_price and status='active' so any
 *      subsequent drop re-notifies. (The spec calls this out explicitly:
 *      we want the operator to keep getting alerts as the price keeps
 *      falling — not just the first time.)
 *
 * Auth — reuses the same shared-secret pattern as the rest of the cron
 * surface: Bearer CRON_SECRET, or a vercel-cron user-agent / x-vercel-cron
 * header when run from Vercel's scheduler.
 */
import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';
import { sendAlertEmail, getEmailProvider } from '../lib/email';

const router = Router();

function verifyCronSecret(req: Request): boolean {
  const auth = req.headers.authorization || '';
  const secret = process.env.CRON_SECRET || '';
  if (!secret) {
    const ua = String(req.headers['user-agent'] ?? '');
    const isVercel = ua.includes('vercel-cron') || req.headers['x-vercel-cron'] === '1';
    const isLocal = String(req.headers.host ?? '').includes('localhost');
    return isVercel || isLocal;
  }
  return auth === `Bearer ${secret}`;
}

interface PriceAlertRow {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  original_price: number;
  target_price: number | null;
  alert_type: 'any_drop' | 'percentage' | 'target_price';
  threshold_percent: number | null;
  status: 'active' | 'triggered' | 'cancelled';
}

interface ProductRow {
  id: string;
  price_aud: number | null;
  product_url: string | null;
}

function shouldFire(alert: PriceAlertRow, currentPrice: number): boolean {
  if (currentPrice <= 0 || currentPrice >= alert.original_price) return false;
  switch (alert.alert_type) {
    case 'any_drop':
      return currentPrice < alert.original_price;
    case 'percentage': {
      const pct = Number(alert.threshold_percent ?? 0);
      if (pct <= 0) return false;
      const dropPct = ((alert.original_price - currentPrice) / alert.original_price) * 100;
      return dropPct >= pct;
    }
    case 'target_price': {
      const target = Number(alert.target_price ?? 0);
      if (target <= 0) return false;
      return currentPrice <= target;
    }
  }
}

function renderEmail(
  alert: PriceAlertRow,
  currentPrice: number,
  productUrl: string | null,
): { subject: string; html: string } {
  const subject = `Price drop on ${alert.product_name} — was $${alert.original_price.toFixed(2)}, now $${currentPrice.toFixed(2)}`;
  const link = productUrl
    ? `<a href="${productUrl}" style="color:#d4af37;text-decoration:none;font-weight:600">View product →</a>`
    : `<a href="https://www.majorka.io/app/products" style="color:#d4af37;text-decoration:none;font-weight:600">View in Majorka →</a>`;
  const img = alert.product_image
    ? `<img src="${alert.product_image}" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:12px;border:1px solid #1a1a1a"/>`
    : '';
  const dropPct = ((alert.original_price - currentPrice) / alert.original_price) * 100;
  const html = `<!doctype html><html><body style="margin:0;background:#0d0f14;font-family:-apple-system,Inter,sans-serif;color:#f5f5f5">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <h1 style="font-size:22px;margin:0 0 6px;color:#d4af37">Price drop on ${alert.product_name}!</h1>
      <p style="color:#a3a3a3;margin:0 0 20px;font-size:13px">Down ${dropPct.toFixed(1)}% from your tracked price.</p>
      <div style="background:#13151c;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px;display:flex;gap:16px;align-items:flex-start">
        ${img}
        <div>
          <div style="font-weight:700;margin-bottom:8px;color:#f5f5f5">${alert.product_name}</div>
          <div style="color:#a3a3a3;font-size:13px;margin-bottom:4px">Was: <span style="text-decoration:line-through">$${alert.original_price.toFixed(2)} AUD</span></div>
          <div style="color:#10b981;font-size:18px;font-weight:700;margin-bottom:12px">Now: $${currentPrice.toFixed(2)} AUD</div>
          ${link}
        </div>
      </div>
      <p style="color:#52525b;font-size:11px;margin-top:32px">Majorka · <a href="https://www.majorka.io/app/alerts" style="color:#52525b">Manage alerts</a></p>
    </div>
  </body></html>`;
  return { subject, html };
}

async function runPriceCheck(req: Request, res: Response): Promise<void> {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    const sb = getSupabaseAdmin();
    const { data: alertsData, error: alertsErr } = await sb
      .from('price_alerts')
      .select('id,user_id,product_id,product_name,product_image,original_price,target_price,alert_type,threshold_percent,status')
      .eq('status', 'active');

    if (alertsErr) {
      res.status(500).json({ error: 'db_error', message: alertsErr.message });
      return;
    }
    const alerts = (alertsData ?? []) as PriceAlertRow[];
    if (alerts.length === 0) {
      res.json({ ok: true, checked: 0, fired: 0 });
      return;
    }

    const provider = getEmailProvider();
    const productIds = Array.from(new Set(alerts.map((a) => a.product_id)));
    const userIds = Array.from(new Set(alerts.map((a) => a.user_id)));

    const productsRes = await sb
      .from('winning_products')
      .select('id, price_aud, product_url')
      .in('id', productIds);

    const productMap = new Map<string, ProductRow>();
    for (const p of (productsRes.data ?? []) as ProductRow[]) productMap.set(String(p.id), p);

    // auth.users isn't directly queryable via supabase-js .from — use the
    // admin API, which is one round-trip per user (acceptable: alerts are
    // a small set, and the cron only runs every 6h).
    const userEmailMap = new Map<string, string>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const { data } = await sb.auth.admin.getUserById(uid);
          const email = data?.user?.email;
          if (email) userEmailMap.set(uid, email);
        } catch {
          /* skip */
        }
      }),
    );

    let fired = 0;
    let skipped = 0;
    let mailErrors = 0;

    for (const alert of alerts) {
      const product = productMap.get(String(alert.product_id));
      if (!product) { skipped++; continue; }
      const current = Number(product.price_aud ?? 0);
      if (!shouldFire(alert, current)) { skipped++; continue; }

      const email = userEmailMap.get(alert.user_id);
      // Always update the DB even if email isn't deliverable — the operator
      // still sees the trigger reflected in the UI.
      let emailOk = false;
      if (email && provider !== 'none') {
        const { subject, html } = renderEmail(alert, current, product.product_url);
        const result = await sendAlertEmail(email, subject, html);
        emailOk = result.ok;
        if (!result.ok) mailErrors++;
      }

      // Mark triggered, log when, then reset original_price so future
      // drops re-fire (per spec).
      const nowIso = new Date().toISOString();
      const { error: updErr } = await sb
        .from('price_alerts')
        .update({
          status: 'active',
          triggered_at: nowIso,
          original_price: current,
        })
        .eq('id', alert.id);
      if (updErr) {
        // eslint-disable-next-line no-console
        console.warn('[cron/price-check] update failed for', alert.id, updErr.message);
      }
      if (emailOk || !email) fired++;
    }

    res.json({
      ok: true,
      checked: alerts.length,
      fired,
      skipped,
      mail_errors: mailErrors,
      provider,
    });
  } catch (err: unknown) {
    res.status(500).json({
      error: 'internal',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

router.get('/price-check', runPriceCheck);
router.post('/price-check', runPriceCheck);

export default router;
