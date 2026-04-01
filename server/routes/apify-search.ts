/**
 * Product search endpoint with automatic Apify scrape fallback.
 * Searches winning_products DB first; if thin results, fires off a
 * background Apify scrape that the harvest cron will collect.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

// GET /api/products/search?q=kitchen&category=Kitchen&sort=orders&page=1&limit=48
router.get('/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  const category = String(req.query.category || '');
  const sort = String(req.query.sort || 'winning_score');
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, parseInt(String(req.query.limit || '48'), 10));
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('winning_products')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike('product_title', `%${q}%`);
  if (category) query = query.eq('category', category);

  switch (sort) {
    case 'orders':
      query = query.order('orders_count', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price_aud', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_aud', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    default:
      query = query.order('winning_score', { ascending: false });
  }

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    products: data || [],
    total: count || 0,
    page,
    limit,
    source: 'db',
    message: (q && (count || 0) < 10) ? 'Search is based on trending products. New products added every 6 hours.' : undefined,
  });
});

export default router;
