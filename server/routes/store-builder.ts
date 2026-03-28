import { Router, Request } from 'express';

import { expandStoreBrief } from '../lib/website-api';
import { requireSubscription } from '../middleware/requireSubscription';
import { storeBuilderSchema, validateBody } from '../lib/validators';
import { buildStoreHTML } from '../lib/storeTemplate';
import { getPlanLimit, type Plan } from '../../shared/plans';

const router = Router();

function getSupabaseAdmin() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

function getToken(req: Request): string {
  return (req.headers.authorization || '').replace('Bearer ', '');
}

// POST /api/store-builder/generate — expand brief + return blueprint
router.post('/generate', async (req, res) => {
  try {
    // Rate limit: 10 blueprint generates per hour per user
    const { rateLimit } = await import('../lib/rate-limit');
    const token = getToken(req);
    const userId = token ? (() => { try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub; } catch { return token.slice(0,16); } })() : req.ip;
    const rl = rateLimit(`store-gen:${userId}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ error: 'rate_limit_exceeded', message: 'Too many requests. Try again in 1 hour.' });
    }

    // Store count limit enforcement
    try {
      const supabase = getSupabaseAdmin();
      const { data: storeRows } = await supabase.from('generated_stores').select('id').eq('user_id', userId);
      const storeCount = storeRows?.length ?? 0;
      const plan = ((req as any).subscription?.plan || 'builder') as Plan;
      const limit = getPlanLimit(plan, 'store_builder');
      if (storeCount >= limit) {
        return res.status(429).json({ error: 'limit_exceeded', used: storeCount, limit, message: `You have ${storeCount}/${limit} stores. Upgrade to Scale for unlimited stores.` });
      }
    } catch {
      // Non-fatal — proceed if check fails
    }

    const validation = validateBody(storeBuilderSchema, req.body);
    if ('error' in validation) return res.status(400).json({ error: validation.error });
    const { productName, productDescription, niche, pricePoint } = validation.data;

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
router.post('/push', requireSubscription, async (req, res) => {
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

// POST /api/store-builder/preview — render full store HTML for iframe display
router.post('/preview', async (req, res) => {
  try {
    const {
      template = 'minimal',
      storeName = 'My Store',
      storeTagline = 'Trending products, fast delivery',
      niche = 'General',
      primaryColor = '#6366F1',
      products = [],
    } = req.body as {
      template?: string;
      storeName?: string;
      storeTagline?: string;
      niche?: string;
      primaryColor?: string;
      products?: Array<{ product_title?: string; image_url?: string | null; price_aud?: number }>;
    };

    const html = buildStoreHTML({
      template,
      storeName,
      tagline: storeTagline,
      heroHeadline: `The ${niche} Store You Deserve`,
      heroSubheadline: `Premium ${niche.toLowerCase()} products curated for quality, value, and fast delivery.`,
      heroCTA: 'Shop Now',
      productName: products[0]?.product_title || `Premium ${niche} Product`,
      productDescription: `Hand-selected ${niche.toLowerCase()} product, tested for quality and value.`,
      productBullets: [
        'Premium quality materials',
        'Fast tracked shipping',
        '30-day money-back guarantee',
        'Secure checkout',
        'Dedicated support team',
      ],
      price: products[0]?.price_aud || 49.95,
      afterpayPrice: ((products[0]?.price_aud || 49.95) / 4),
      testimonials: [
        { name: 'Sarah M.', location: 'Sydney', text: 'Amazing quality and super fast delivery. Highly recommend!', rating: 5 },
        { name: 'Jake T.', location: 'Brisbane', text: 'Best purchase I have made this year. Will buy again.', rating: 5 },
        { name: 'Emma K.', location: 'Melbourne', text: 'Great product and excellent customer service.', rating: 5 },
      ],
      faqItems: [
        { q: 'How fast is shipping?', a: 'Same-day dispatch before 2pm. 2-5 business days delivery.' },
        { q: 'What is your return policy?', a: '30-day no-questions-asked returns on all orders.' },
        { q: 'Do you offer Afterpay?', a: 'Yes! Pay in 4 interest-free instalments on orders over $35.' },
      ],
      howItWorks: [
        { step: '1', title: 'Browse', description: 'Explore our curated collection' },
        { step: '2', title: 'Order', description: 'Secure checkout with Afterpay' },
        { step: '3', title: 'Enjoy', description: 'Fast delivery to your door' },
      ],
      niche,
      heroImageUrl: '',
      productImageUrl: products[0]?.image_url || '',
      primaryColour: primaryColor,
      accentColour: primaryColor,
      headingFont: 'Syne',
      bodyFont: 'DM Sans',
      headingFontName: 'Syne',
      bodyFontName: 'DM Sans',
      supportEmail: 'hello@example.com',
      includeAbout: true,
      includeContact: true,
      products: products.slice(0, 8),
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
