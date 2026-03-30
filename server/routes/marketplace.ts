import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

function getToken(req: Request): string {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

const USERNAME_REGEX = /^[a-z0-9-]{3,30}$/;

// GET /api/marketplace/profile — get seller's marketplace profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('marketplace_profiles')
      .select('*')
      .eq('user_id', req.user!.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ profile: data || null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// POST /api/marketplace/profile — create/update seller profile
router.post('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, display_name, bio, avatar_url } = req.body as {
      username?: string;
      display_name?: string;
      bio?: string;
      avatar_url?: string;
    };

    if (username && !USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-30 characters, lowercase alphanumeric and hyphens only',
      });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('marketplace_profiles')
      .upsert(
        {
          user_id: req.user!.userId,
          username,
          display_name,
          bio,
          avatar_url,
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ profile: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// GET /api/marketplace/check-username — check username availability
router.get('/check-username', async (req: Request, res: Response) => {
  try {
    const username = req.query.username as string | undefined;
    if (!username) {
      return res.status(400).json({ error: 'username query param required' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('marketplace_profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ available: !data, username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// GET /api/marketplace/listings — get seller's product listings
router.get('/listings', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .eq('user_id', req.user!.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ listings: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// POST /api/marketplace/listings — create new listing
router.post('/listings', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      images,
      price_aud,
      compare_at_price,
      inventory_qty,
      sku,
      shipping_type,
      shipping_rate,
      category,
      majorka_product_id,
    } = req.body as {
      title?: string;
      description?: string;
      images?: string[];
      price_aud?: number;
      compare_at_price?: number;
      inventory_qty?: number;
      sku?: string;
      shipping_type?: string;
      shipping_rate?: number;
      category?: string;
      majorka_product_id?: string;
    };

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    const supabase = getSupabaseAdmin();
    const userId = req.user!.userId;

    // Get or create marketplace store
    let { data: store } = await supabase
      .from('generated_stores')
      .select('id')
      .eq('user_id', userId)
      .eq('mode', 'marketplace')
      .single();

    if (!store) {
      const { data: newStore, error: storeErr } = await supabase
        .from('generated_stores')
        .insert({
          user_id: userId,
          mode: 'marketplace',
          store_name: 'Marketplace Store',
          niche: category || 'general',
        })
        .select('id')
        .single();

      if (storeErr) {
        return res.status(500).json({ error: storeErr.message });
      }
      store = newStore;
    }

    const { data, error } = await supabase
      .from('store_products')
      .insert({
        store_id: store!.id,
        user_id: userId,
        title: title.trim(),
        description,
        images,
        price_aud,
        compare_at_price,
        inventory_qty,
        sku,
        status: 'active',
        majorka_product_id,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ listing: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// PUT /api/marketplace/listings/:id — update listing
router.put('/listings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('store_products')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user!.userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ listing: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// DELETE /api/marketplace/listings/:id — delete listing
router.delete('/listings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('store_products')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// GET /api/marketplace/orders — get seller's orders
router.get('/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('store_orders')
      .select('*')
      .eq('seller_user_id', req.user!.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ orders: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// PATCH /api/marketplace/orders/:id — update order (mark shipped)
router.patch('/orders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, tracking_number } = req.body as {
      status?: string;
      tracking_number?: string;
    };

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('store_orders')
      .update({
        ...(status !== undefined && { status }),
        ...(tracking_number !== undefined && { tracking_number }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('seller_user_id', req.user!.userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ order: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// GET /api/marketplace/earnings — get earnings summary
router.get('/earnings', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: orders, error } = await supabase
      .from('store_orders')
      .select('subtotal, platform_fee, net_seller_payout, status')
      .eq('seller_user_id', req.user!.userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const allOrders = orders || [];

    const total_sales = allOrders.length;
    const total_revenue = allOrders.reduce(
      (sum, o) => sum + (parseFloat(String(o.subtotal)) || 0),
      0,
    );
    const total_fees = allOrders.reduce(
      (sum, o) => sum + (parseFloat(String(o.platform_fee)) || 0),
      0,
    );
    const net_earnings = allOrders.reduce(
      (sum, o) => sum + (parseFloat(String(o.net_seller_payout)) || 0),
      0,
    );
    const pending_orders = allOrders.filter((o) => o.status === 'pending').length;

    return res.json({
      earnings: {
        total_sales,
        total_revenue,
        total_fees,
        net_earnings,
        pending_orders,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

export default router;
