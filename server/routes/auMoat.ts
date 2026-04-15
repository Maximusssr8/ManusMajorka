/**
 * AU Moat — three Australia-specific endpoints.
 *
 *   POST /api/margin/calculate   — GST + margin calculator
 *   GET  /api/shipping/estimate  — Australia Post PAC quote for a product
 *   GET  /api/bnpl/score         — Buy-Now-Pay-Later score for a product
 *
 * All endpoints degrade gracefully — missing AUSPOST_API_KEY surfaces
 * `auspost_not_configured`, never a 500. Margin calc has no external
 * dependencies.
 */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { calculateAUMargins, calculateBNPLScore } from '../services/gstCalculator';
import { calculateDomesticShipping } from '../services/auspost';
import { getSupabaseAdmin } from '../_core/supabase';
import { claudeRateLimit } from '../middleware/claudeRateLimit';

const router = Router();

// ─── Margin calculator ──────────────────────────────────────────────────────

const marginInputSchema = z.object({
  productCostAUD: z.number().nonnegative().finite(),
  shippingCostAUD: z.number().nonnegative().finite().default(0),
  sellingPriceAUD: z.number().positive().finite(),
  adSpendPercent: z.number().min(0).max(100).default(25),
  returnsPercent: z.number().min(0).max(100).default(8),
});

router.post('/margin/calculate', claudeRateLimit, (req: Request, res: Response): void => {
  const parsed = marginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', issues: parsed.error.flatten() });
    return;
  }
  try {
    const result = calculateAUMargins(parsed.data);
    res.json({ success: true, ...result });
  } catch (err: unknown) {
    res.status(500).json({
      error: 'internal',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ─── Australia Post shipping estimate ───────────────────────────────────────

const shippingQuerySchema = z.object({
  productId: z.string().min(1).max(120),
  postcode: z.string().regex(/^\d{4}$/).default('2000'),
});

interface ProductDimsRow {
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  category: string | null;
  au_warehouse_available: boolean | null;
}

// Reasonable defaults per category (kg / cm) — keeps the quote sensible
// when a product row is missing dimension data.
function categoryDefaults(category: string | null): {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
} {
  const c = (category ?? '').toLowerCase();
  if (c.includes('jewelry') || c.includes('jewellery') || c.includes('watch')) {
    return { weightKg: 0.2, lengthCm: 12, widthCm: 10, heightCm: 4 };
  }
  if (c.includes('phone') || c.includes('accessor')) {
    return { weightKg: 0.3, lengthCm: 18, widthCm: 12, heightCm: 4 };
  }
  if (c.includes('beauty') || c.includes('skincare')) {
    return { weightKg: 0.4, lengthCm: 18, widthCm: 12, heightCm: 8 };
  }
  if (c.includes('shoes') || c.includes('apparel') || c.includes('fashion') || c.includes('bag')) {
    return { weightKg: 0.8, lengthCm: 30, widthCm: 22, heightCm: 12 };
  }
  if (c.includes('home') || c.includes('kitchen') || c.includes('furniture') || c.includes('lighting')) {
    return { weightKg: 1.5, lengthCm: 35, widthCm: 25, heightCm: 18 };
  }
  if (c.includes('fitness') || c.includes('sport')) {
    return { weightKg: 2.0, lengthCm: 40, widthCm: 28, heightCm: 18 };
  }
  // Generic small parcel default.
  return { weightKg: 0.5, lengthCm: 22, widthCm: 16, heightCm: 10 };
}

router.get('/shipping/estimate', async (req: Request, res: Response): Promise<void> => {
  const parsed = shippingQuerySchema.safeParse({
    productId: String(req.query.productId ?? ''),
    postcode: req.query.postcode ? String(req.query.postcode) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', issues: parsed.error.flatten() });
    return;
  }

  if (!process.env.AUSPOST_API_KEY) {
    res.json({
      error: 'auspost_not_configured',
      message: 'Australia Post API key not set on the server.',
    });
    return;
  }

  // Fetch the product row to get weight / dims / category.
  let weightKg = 0.5;
  let lengthCm = 22;
  let widthCm = 16;
  let heightCm = 10;
  let auWarehouse = false;

  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('winning_products')
      .select('weight_kg, length_cm, width_cm, height_cm, category, au_warehouse_available')
      .eq('id', parsed.data.productId)
      .maybeSingle();
    const row = data as ProductDimsRow | null;
    if (row) {
      const fallback = categoryDefaults(row.category);
      weightKg = Number(row.weight_kg) > 0 ? Number(row.weight_kg) : fallback.weightKg;
      lengthCm = Number(row.length_cm) > 0 ? Number(row.length_cm) : fallback.lengthCm;
      widthCm = Number(row.width_cm) > 0 ? Number(row.width_cm) : fallback.widthCm;
      heightCm = Number(row.height_cm) > 0 ? Number(row.height_cm) : fallback.heightCm;
      auWarehouse = Boolean(row.au_warehouse_available);
    }
  } catch {
    // If the product columns don't exist yet (pipeline migration not run),
    // we still fall back to category-default dims so the panel keeps working.
    const fallback = categoryDefaults(null);
    weightKg = fallback.weightKg;
    lengthCm = fallback.lengthCm;
    widthCm = fallback.widthCm;
    heightCm = fallback.heightCm;
  }

  // From-postcode: if we know the product is in an AU warehouse default
  // to Sydney 2000, otherwise quote ex-Melbourne 3000 as a sensible AU
  // entry-port stand-in. The to-postcode comes from the buyer.
  const fromPostcode = auWarehouse ? '2000' : '3000';

  const quote = await calculateDomesticShipping(
    fromPostcode,
    parsed.data.postcode,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
  );

  if (!quote) {
    res.json({
      error: 'auspost_unavailable',
      message: 'Could not retrieve a quote from Australia Post.',
    });
    return;
  }

  res.json({
    success: true,
    standard: quote.standard,
    express: quote.express,
    parcel_locker: quote.parcel_locker,
    eta_standard: quote.eta_standard,
    eta_express: quote.eta_express,
    weight_kg_used: weightKg,
    from_postcode: fromPostcode,
    au_warehouse: auWarehouse,
  });
});

// ─── BNPL score ────────────────────────────────────────────────────────────

const bnplQuerySchema = z.object({
  productId: z.string().min(1).max(120),
});

router.get('/bnpl/score', async (req: Request, res: Response): Promise<void> => {
  const parsed = bnplQuerySchema.safeParse({
    productId: String(req.query.productId ?? ''),
  });
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('winning_products')
      .select('price_aud, category, sold_count, rating')
      .eq('id', parsed.data.productId)
      .maybeSingle();
    if (error) {
      res.status(500).json({ error: 'db_error', message: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const row = data as { price_aud: number | null; category: string | null; sold_count: number | null; rating: number | null };
    const result = calculateBNPLScore({
      priceAud: Number(row.price_aud ?? 0),
      category: row.category,
      soldCount: row.sold_count,
      rating: row.rating,
    });
    res.json({ success: true, ...result });
  } catch (err: unknown) {
    res.status(500).json({
      error: 'internal',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
