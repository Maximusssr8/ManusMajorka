/**
 * /api/stores — CRUD for saved_stores + saved_ad_sets.
 * Includes Shopify Admin API validation ping.
 * All endpoints require auth. RLS tables scoped by user_id.
 */
import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../middleware/requireAuth';
import { getSupabaseAdmin } from '../_core/supabase';
import { validateShopifyStore } from '../lib/shopifyValidate';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Shopify validation
// ─────────────────────────────────────────────────────────────
const shopifyValidateSchema = z.object({
  shop: z.string().min(3).max(200),
  accessToken: z.string().min(10).max(500),
});

router.post('/shopify/validate', requireAuth, async (req, res) => {
  const parsed = shopifyValidateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'invalid_input' });
  }
  const result = await validateShopifyStore(parsed.data.shop, parsed.data.accessToken);
  if (!result.ok) {
    return res.status(200).json(result);
  }
  return res.json(result);
});

// ─────────────────────────────────────────────────────────────
// saved_stores
// ─────────────────────────────────────────────────────────────
const paletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
}).partial();

const fontsSchema = z.object({
  heading: z.string(),
  body: z.string(),
}).partial();

const conceptProductSchema = z.object({
  id: z.string().optional(),
  product_title: z.string().optional(),
  image_url: z.string().nullable().optional(),
  price_aud: z.number().nullable().optional(),
  rationale: z.string().optional(),
}).passthrough();

const saveStoreSchema = z.object({
  name: z.string().min(1).max(200),
  niche: z.string().max(200).optional(),
  market: z.string().max(100).optional(),
  tagline: z.string().max(500).optional(),
  palette: paletteSchema.optional(),
  fonts: fontsSchema.optional(),
  products: z.array(conceptProductSchema).max(50).optional(),
  concept: z.record(z.string(), z.unknown()).optional(),
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('saved_stores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, data: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const parsed = saveStoreSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('saved_stores')
      .insert({
        user_id: userId,
        name: parsed.data.name,
        niche: parsed.data.niche ?? null,
        market: parsed.data.market ?? null,
        tagline: parsed.data.tagline ?? null,
        palette: parsed.data.palette ?? null,
        fonts: parsed.data.fonts ?? null,
        products: parsed.data.products ?? null,
        concept: parsed.data.concept ?? null,
      })
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: message });
  }
});

const patchSchema = saveStoreSchema.partial().extend({
  published: z.boolean().optional(),
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input' });
    }

    const sb = getSupabaseAdmin();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) patch[k] = v;
    }

    const { data, error } = await sb
      .from('saved_stores')
      .update(patch)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'not_found' });
    return res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const sb = getSupabaseAdmin();
    const { error } = await sb
      .from('saved_stores')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: message });
  }
});

// ─────────────────────────────────────────────────────────────
// saved_ad_sets
// ─────────────────────────────────────────────────────────────
const saveAdSetSchema = z.object({
  productTitle: z.string().min(1).max(300),
  productImage: z.string().url().optional().nullable(),
  productUrl: z.string().url().optional().nullable(),
  platform: z.string().max(50).optional(),
  format: z.string().max(50).optional(),
  headlines: z.array(z.string()).max(10),
  bodies: z.array(z.string()).max(10),
  ctas: z.array(z.string()).max(10),
  hook: z.string().max(1000).optional(),
  audience: z.string().max(2000).optional(),
  interests: z.array(z.string()).max(20).optional(),
});

router.get('/ad-sets', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('saved_ad_sets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, data: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: message });
  }
});

router.post('/ad-sets', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const parsed = saveAdSetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('saved_ad_sets')
      .insert({
        user_id: userId,
        product_title: parsed.data.productTitle,
        product_image: parsed.data.productImage ?? null,
        product_url: parsed.data.productUrl ?? null,
        platform: parsed.data.platform ?? null,
        format: parsed.data.format ?? null,
        headlines: parsed.data.headlines,
        bodies: parsed.data.bodies,
        ctas: parsed.data.ctas,
        hook: parsed.data.hook ?? null,
        audience: parsed.data.audience ?? null,
        interests: parsed.data.interests ?? null,
      })
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: message });
  }
});

router.delete('/ad-sets/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const sb = getSupabaseAdmin();
    const { error } = await sb
      .from('saved_ad_sets')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: message });
  }
});

export default router;
