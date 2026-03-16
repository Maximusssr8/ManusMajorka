import { Router, Request } from 'express';
import { createClient } from '@supabase/supabase-js';
import { expandStoreBrief } from '../lib/website-api';

const router = Router();

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function getToken(req: Request): string {
  return (req.headers.authorization || '').replace('Bearer ', '');
}

// POST /api/store-builder/generate — expand brief + return blueprint
router.post('/generate', async (req, res) => {
  try {
    const { productName, productDescription, niche, pricePoint } = req.body as {
      productName?: string; productDescription?: string; niche?: string; pricePoint?: string;
    };
    if (!niche) return res.status(400).json({ error: 'niche is required' });

    const brief = await expandStoreBrief({
      niche,
      storeName: productName || niche,
      accentColor: '#d4af37',
      productData: productDescription ? {
        product_title: productName,
        description: productDescription,
        price_aud: pricePoint,
      } : undefined,
    });

    const brandName = (brief.brandName as string) || productName || niche;
    const storeNameOptions = [
      brandName,
      `${brandName} AU`,
      `${brandName.split(' ')[0]} Co.`,
    ];

    return res.json({
      brief,
      storeNameOptions,
      themeRecommendation: {
        name: 'Modern Dark DTC',
        reason: 'High-converting dark theme with gold accents — optimised for Australian DTC brands and proven to increase add-to-cart by 18%.',
      },
      appStack: [
        { name: 'Afterpay', icon: '💚', reason: 'Increases conversion by 20–30% for AU shoppers — non-negotiable.' },
        { name: 'Loox Reviews', icon: '⭐', reason: 'Photo reviews build trust fast and add UGC social proof.' },
        { name: 'ReConvert Upsell', icon: '🔄', reason: 'Post-purchase upsell flows boost AOV by 15% on average.' },
      ],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/shopify/push — push blueprint to connected Shopify store
router.post('/push', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser(getToken(req));
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: conn } = await supabase
      .from('shopify_connections')
      .select('shop_domain,access_token')
      .eq('user_id', user.id)
      .single();
    if (!conn) return res.status(400).json({ error: 'No Shopify store connected. Please connect your store first.' });

    const { brief, selectedStoreName } = req.body as {
      brief: Record<string, any>;
      selectedStoreName: string;
    };

    const { shop_domain: shop, access_token: token } = conn;
    const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
    const base = `https://${shop}/admin/api/2025-01`;
    const steps: Record<string, { success: boolean; id?: string | number; error?: string }> = {};

    // Step 1: Create product
    try {
      const productRes = await fetch(`${base}/products.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product: {
            title: selectedStoreName,
            body_html: `<p><strong>${brief.tagline || ''}</strong></p><p>${brief.uniqueValueProp || ''}</p>`,
            tags: `majorka,${(brief.brandName || '').toLowerCase()}`,
            published: true,
          },
        }),
      });
      const d = await productRes.json() as any;
      steps.product = { success: productRes.ok, id: d?.product?.id };
      if (!productRes.ok) steps.product.error = d?.errors ? JSON.stringify(d.errors) : `HTTP ${productRes.status}`;
    } catch (e: any) {
      steps.product = { success: false, error: e.message };
    }

    // Step 2: Update main theme colours
    try {
      const themesRes = await fetch(`${base}/themes.json`, { headers });
      const themesData = await themesRes.json() as any;
      const mainTheme = (themesData?.themes || []).find((t: any) => t.role === 'main');
      if (mainTheme) {
        const settingsRes = await fetch(`${base}/themes/${mainTheme.id}/assets.json?asset[key]=config/settings_data.json`, { headers });
        const settingsData = await settingsRes.json() as any;
        let currentSettings: Record<string, any> = {};
        try { currentSettings = JSON.parse(settingsData?.asset?.value || '{}'); } catch {}
        const updated = {
          ...currentSettings,
          current: {
            ...(currentSettings.current || {}),
            colors_accent_1: brief.colourPalette?.primary || '#d4af37',
          },
        };
        const patchRes = await fetch(`${base}/themes/${mainTheme.id}/assets.json`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ asset: { key: 'config/settings_data.json', value: JSON.stringify(updated) } }),
        });
        steps.theme = { success: patchRes.ok, id: mainTheme.id };
      } else {
        steps.theme = { success: false, error: 'No main theme found' };
      }
    } catch (e: any) {
      steps.theme = { success: false, error: e.message };
    }

    // Step 3: Create About + Contact pages
    try {
      await fetch(`${base}/pages.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          page: {
            title: 'About Us',
            body_html: `<h2>${brief.heroHeadline || ''}</h2><p>${brief.uniqueValueProp || ''}</p><p>Built for Australia. Powered by Majorka.</p>`,
            published: true,
          },
        }),
      });
      await fetch(`${base}/pages.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          page: {
            title: 'Contact',
            body_html: '<p>Get in touch with our team. We reply within 24 hours Mon–Fri 9am–5pm AEST.</p>',
            published: true,
          },
        }),
      });
      steps.pages = { success: true };
    } catch (e: any) {
      steps.pages = { success: false, error: e.message };
    }

    const productUrl = steps.product?.id
      ? `https://${shop}/admin/products/${steps.product.id}`
      : `https://${shop}/admin/products`;

    return res.json({
      success: Object.values(steps).every(s => s.success),
      steps,
      productUrl,
      storeUrl: `https://${shop}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
