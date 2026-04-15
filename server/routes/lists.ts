/**
 * /api/lists — named product collections (Engagement Director).
 * Auto-creates a "Saved Products" default list on first GET for new users.
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

interface ProductList {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  created_at: string;
}

async function ensureDefaultList(userId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('product_lists')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (!data || data.length === 0) {
    await sb.from('product_lists').insert({
      user_id: userId,
      name: 'Saved Products',
      emoji: '📦',
    });
  }
}

// GET /api/lists — return all of the user's lists + their item counts.
router.get('/', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    await ensureDefaultList(req.user.userId);
    const sb = getSupabaseAdmin();
    const { data: lists, error } = await sb
      .from('product_lists')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const enriched = await Promise.all(
      (lists ?? []).map(async (list: ProductList) => {
        const { data: items } = await sb
          .from('product_list_items')
          .select('product_data, saved_at')
          .eq('list_id', list.id)
          .order('saved_at', { ascending: false })
          .limit(4);
        const thumbs = (items ?? [])
          .map((i: { product_data: Record<string, unknown> }) => {
            const pd = i.product_data || {};
            return (pd.image_url as string | undefined) ?? null;
          })
          .filter(Boolean);
        const { count } = await sb
          .from('product_list_items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id);
        return { ...list, item_count: count ?? 0, thumbnails: thumbs };
      }),
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'failed to fetch lists',
    });
  }
});

// POST /api/lists — create a new list.
router.post('/', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const { name, emoji } = (req.body ?? {}) as { name?: string; emoji?: string };
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, error: 'name required' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('product_lists')
      .insert({
        user_id: req.user.userId,
        name: name.trim().slice(0, 80),
        emoji: emoji && typeof emoji === 'string' ? emoji.slice(0, 8) : '📦',
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'failed to create list',
    });
  }
});

// GET /api/lists/:id — list + items.
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data: list } = await sb
      .from('product_lists')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .maybeSingle();
    if (!list) {
      res.status(404).json({ success: false, error: 'list not found' });
      return;
    }
    const { data: items } = await sb
      .from('product_list_items')
      .select('*')
      .eq('list_id', list.id)
      .order('saved_at', { ascending: false });
    res.json({ success: true, data: { list, items: items ?? [] } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'failed to fetch list',
    });
  }
});

// POST /api/lists/:id/items — save a product to a list.
router.post('/:id/items', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const { product_id, product_data } = (req.body ?? {}) as {
    product_id?: string;
    product_data?: Record<string, unknown>;
  };
  if (!product_id || !product_data) {
    res.status(400).json({ success: false, error: 'product_id + product_data required' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    // Verify list ownership.
    const { data: list } = await sb
      .from('product_lists')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .maybeSingle();
    if (!list) {
      res.status(404).json({ success: false, error: 'list not found' });
      return;
    }
    const { data, error } = await sb
      .from('product_list_items')
      .upsert(
        {
          list_id: list.id,
          product_id: String(product_id),
          product_data,
        },
        { onConflict: 'list_id,product_id' },
      )
      .select()
      .single();
    if (error) throw error;

    // Fire-and-forget: mark onboarding first_save flag.
    void sb
      .from('user_onboarding')
      .upsert({ user_id: req.user.userId, first_save: true }, { onConflict: 'user_id' });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'failed to save item',
    });
  }
});

// DELETE /api/lists/:id/items/:productId — remove a saved product.
router.delete('/:id/items/:productId', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data: list } = await sb
      .from('product_lists')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .maybeSingle();
    if (!list) {
      res.status(404).json({ success: false, error: 'list not found' });
      return;
    }
    const { error } = await sb
      .from('product_list_items')
      .delete()
      .eq('list_id', list.id)
      .eq('product_id', req.params.productId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'failed to delete item',
    });
  }
});

// DELETE /api/lists/:id — delete a list entirely (cascade removes items).
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb
      .from('product_lists')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'failed to delete list',
    });
  }
});

export default router;
