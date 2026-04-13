import { Router, Request } from 'express';
import Anthropic from '@anthropic-ai/sdk';

import { expandStoreBrief } from '../lib/website-api';
import { requireSubscription } from '../middleware/requireSubscription';
import { requireAuth } from '../middleware/requireAuth';
import { storeBuilderSchema, validateBody } from '../lib/validators';
import { buildStoreHTML } from '../lib/storeTemplate';
import { getPlanLimit, type Plan } from '../../shared/plans';

const router = Router();

// ── Niche → category mapping ────────────────────────────────────
function nicheToCategory(niche: string): string {
  const map: Record<string, string> = {
    'Pet Products': 'pet',
    'Beauty & Skincare': 'beauty',
    'Home & Garden': 'home',
    'Fashion': 'fashion',
    'Electronics': 'electronics',
    'Fitness': 'fitness',
    'Baby & Kids': 'baby',
  };
  return map[niche] || '';
}

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
    const {
      productName, productDescription, niche, pricePoint,
      storeName: requestedStoreName, targetCustomer, priceRange, usp,
      includeAfterpay, includeReviews, colorScheme, market, vibe,
    } = validation.data;

    // Build the AI prompt with all available context
    const customerLabel = targetCustomer || 'general shoppers';
    const priceLabel = priceRange || '$20-$50';
    const uspText = usp || `Curated ${niche} products tested for the Australian market`;
    const marketLabel = market || 'AU';
    const vibeLabel = vibe || 'minimal';
    const showAfterpay = includeAfterpay !== false;
    const showReviews = includeReviews !== false;

    let brief: Record<string, any>;
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const aiPrompt = `Generate complete store copy for a ${vibeLabel} ${niche} dropshipping store targeting ${customerLabel} in ${marketLabel}.
Price range: ${priceLabel}
USP: ${uspText}
${productName ? `Hero product: ${productName} (${productDescription || ''}) at $${pricePoint || '49.95'}` : ''}
${showAfterpay ? 'Store offers Afterpay/buy-now-pay-later.' : ''}

Return ONLY valid JSON (no markdown):
{
  "brandName": "memorable 1-2 word brand name",
  "tagline": "8 words max, specific to USP",
  "heroHeadline": "10 words max, speaks to ${customerLabel}",
  "heroSubheadline": "20 words max, includes USP",
  "uniqueValueProp": "one compelling sentence",
  "products": [
    {"title": "product name 1", "description": "benefit-focused 15-word description for ${customerLabel}", "price_aud": 0},
    {"title": "product name 2", "description": "benefit-focused 15-word description for ${customerLabel}", "price_aud": 0},
    {"title": "product name 3", "description": "benefit-focused 15-word description for ${customerLabel}", "price_aud": 0}
  ],
  "testimonials": [
    {"name": "first name + last initial", "location": "Australian city", "text": "20-word review matching ${customerLabel} persona", "rating": 5},
    {"name": "first name + last initial", "location": "Australian city", "text": "20-word review matching ${customerLabel} persona", "rating": 5},
    {"name": "first name + last initial", "location": "Australian city", "text": "20-word review matching ${customerLabel} persona", "rating": 5}
  ],
  "faqItems": [
    {"q": "question addressing ${customerLabel} objection", "a": "helpful answer"},
    {"q": "question addressing ${customerLabel} objection", "a": "helpful answer"},
    {"q": "question addressing ${customerLabel} objection", "a": "helpful answer"}
  ],
  "metaDescription": "155 chars max, SEO-focused",
  "socialShareText": "short share-worthy sentence"
}`;

      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: aiPrompt }],
      });

      const text = (msg.content[0] as { type: string; text: string }).text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      brief = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      if (!brief.brandName) throw new Error('No brandName in response');
    } catch {
      // Fallback — also try expandStoreBrief
      try {
        brief = await expandStoreBrief({
          niche,
          storeName: requestedStoreName || productName || niche,
          accentColor: '#d4af37',
          productData: productDescription ? {
            product_title: productName,
            description: productDescription,
            price_aud: pricePoint,
          } : undefined,
        });
      } catch {
        brief = {
          brandName: requestedStoreName || productName || niche,
          tagline: `Quality ${niche} for Australian shoppers`,
          uniqueValueProp: uspText,
          heroHeadline: `Premium ${niche} — built for Australia`,
          heroSubheadline: `Fast AU shipping, Afterpay ready, quality guaranteed.`,
          metaDescription: `Shop premium ${niche} at the best prices. Free shipping, ${showAfterpay ? 'Afterpay available, ' : ''}30-day returns.`,
          socialShareText: `Check out this amazing ${niche} store!`,
        };
      }
    }

    // Override brandName with requested store name if provided
    if (requestedStoreName) {
      brief.brandName = requestedStoreName;
    }

    const brandName = (brief.brandName as string) || requestedStoreName || productName || niche;
    const storeNameOptions = [
      brandName,
      `${brandName} AU`,
      `${brandName.split(' ')[0]} Co.`,
    ];

    // Build products array — ensure it's never empty for the client
    const products: Array<{ title: string; price_aud: number; image_url: string; description?: string }> = [];
    if (productName) {
      products.push({ title: productName, price_aud: Number(pricePoint) || 0, image_url: '' });
    }
    // Pull any products from the brief (AI-generated)
    if (Array.isArray(brief.products)) {
      for (const p of brief.products as Array<Record<string, unknown>>) {
        const title = (p.title || p.product_title || '') as string;
        if (title && !products.some(existing => existing.title === title)) {
          products.push({
            title,
            price_aud: Number(p.price_aud || p.price || 0),
            image_url: (p.image_url || p.image || '') as string,
            description: (p.description || '') as string,
          });
        }
      }
    }
    // If still empty, generate demo products from the niche
    if (products.length === 0) {
      const nicheLabel = niche || 'Premium';
      products.push(
        { title: `${nicheLabel} Essentials Kit`, price_aud: 49.95, image_url: '', description: `Our best-selling ${nicheLabel.toLowerCase()} starter pack for ${customerLabel}.` },
        { title: `${nicheLabel} Pro Bundle`, price_aud: 89.95, image_url: '', description: `Everything you need — curated for ${customerLabel} who want the best.` },
        { title: `${nicheLabel} Premium Collection`, price_aud: 129.95, image_url: '', description: `The ultimate ${nicheLabel.toLowerCase()} experience, hand-tested in Australia.` },
      );
    }

    // Assign default prices based on priceRange if products have 0 price
    const priceDefaults: Record<string, number[]> = {
      'Under $20': [14.95, 17.95, 19.95],
      '$20-$50': [29.95, 39.95, 49.95],
      '$50-$100': [59.95, 79.95, 99.95],
      '$100+': [119.95, 149.95, 199.95],
    };
    const defaults = priceDefaults[priceRange || '$20-$50'] || [29.95, 39.95, 49.95];
    for (let i = 0; i < products.length; i++) {
      if (products[i].price_aud <= 0) {
        products[i] = { ...products[i], price_aud: defaults[i % defaults.length] };
      }
    }

    return res.json({
      brief: {
        ...brief,
        colourPalette: brief.colourPalette || brief.colorPalette || { primary: '#d4af37', secondary: '#0d0d0d', accent: '#ffffff' },
        fontPairing: brief.fontPairing || { heading: 'Syne', body: 'DM Sans' },
        includeAfterpay: showAfterpay,
        includeReviews: showReviews,
        targetCustomer: customerLabel,
        priceRange: priceLabel,
      },
      storeNameOptions,
      products,
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
    const base = `https://${shop}/admin/api/2024-01`;
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

// ── GET /api/store-builder/products-for-niche ──────────────────
router.get('/products-for-niche', requireAuth, async (req, res) => {
  try {
    const { niche } = req.query;
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('winning_products')
      .select('id,product_title,image_url,price_aud,supplier_cost_aud,cost_price_aud,winning_score,trend,category')
      .order('winning_score', { ascending: false })
      .limit(12);

    if (niche && niche !== 'General') {
      const cat = nicheToCategory(niche as string);
      if (cat) {
        query = query.ilike('category', `%${cat}%`);
      }
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ products: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// ── POST /api/store-builder/generate-copy ──────────────────────
router.post('/generate-copy', requireAuth, async (req, res) => {
  try {
    const { rateLimit } = await import('../lib/rate-limit');
    const userId = req.user?.userId || 'anon';
    const rl = rateLimit(`store-copy:${userId}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again in 1 hour.' });
    }

    const { storeName, niche, targetMarket, tone, products } = req.body as {
      storeName?: string;
      niche?: string;
      targetMarket?: string;
      tone?: string;
      products?: Array<{ id?: string; product_title?: string; price_aud?: number }>;
    };

    if (!storeName || !niche) {
      return res.status(400).json({ error: 'storeName and niche are required' });
    }

    const productList = (products || [])
      .map((p) => `- ${p.product_title || 'Product'} ($${p.price_aud || 0})`)
      .join('\n');

    const prompt = `Generate store copy for a ${tone || 'Professional'} ${niche} dropshipping store called "${storeName}" targeting ${targetMarket || 'Global'} customers.
Products:
${productList || '(no products selected yet)'}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "tagline": "8 words max",
  "hero_headline": "10 words max",
  "hero_subheading": "20 words max, benefit-focused",
  "hero_cta": "4 words max",
  "about_text": "40 words about the store",
  "trust_badges": ["badge1", "badge2", "badge3", "badge4"],
  "faq": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ],
  "meta_title": "60 chars max",
  "meta_description": "160 chars max",
  "products": [
    {
      "id": "product_id_here",
      "seo_title": "SEO optimised title",
      "description": "80 words, benefit-focused",
      "bullet_points": ["benefit 1", "benefit 2", "benefit 3"]
    }
  ]
}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (msg.content[0] as { type: string; text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const copy = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (copy && Object.keys(copy).length > 0) {
      return res.json({ copy });
    }
    // Claude returned but the parse failed — use server-side fallback
    return res.json({ copy: buildFallbackCopy(storeName, niche || 'General', products || []) });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    void errMsg;
    // Return a deterministic fallback instead of 500 so the user can
    // still build their store. The copy can be regenerated later.
    const { storeName: sn, niche: n, products: ps } = req.body || {};
    return res.json({
      copy: buildFallbackCopy(sn || 'My Store', n || 'General', ps || []),
      fallback: true,
      reason: errMsg,
    });
  }
});

function buildFallbackCopy(storeName: string, niche: string, products: Array<{ id?: string; product_title?: string; price_aud?: number }>) {
  return {
    tagline: `Quality ${niche} delivered fast`,
    hero_headline: `Welcome to ${storeName}`,
    hero_subheading: `Discover our curated ${niche.toLowerCase()} collection — trusted by thousands worldwide.`,
    hero_cta: 'Shop Now',
    about_text: `${storeName} offers the best ${niche.toLowerCase()} products with fast shipping and a 30-day guarantee.`,
    trust_badges: ['Free Shipping', 'Secure Checkout', '30-Day Returns', '24/7 Support'],
    faq: [
      { question: 'How fast is shipping?', answer: 'Standard shipping takes 7-14 business days. Express options available at checkout.' },
      { question: 'What is your return policy?', answer: '30-day money-back guarantee on all orders.' },
      { question: 'Is checkout secure?', answer: 'Yes — we use SSL encryption and trusted payment processors.' },
    ],
    meta_title: `${storeName} — ${niche}`,
    meta_description: `Shop ${niche.toLowerCase()} at ${storeName}. Fast shipping, secure checkout, 30-day returns.`,
    products: products.map((p, i) => ({
      id: String(p.id || i),
      seo_title: p.product_title || 'Product',
      description: `Premium quality ${niche.toLowerCase()} product with worldwide shipping.`,
      bullet_points: ['High quality materials', 'Fast worldwide shipping', 'Trusted by thousands'],
    })),
  };
}

// ── GET /api/store-builder/check-subdomain ─────────────────────
router.get('/check-subdomain', async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug || typeof slug !== 'string') {
      return res.json({ available: false, error: 'slug required' });
    }
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('generated_stores')
      .select('id')
      .eq('subdomain', slug)
      .single();
    res.json({ available: !data });
  } catch {
    res.json({ available: true });
  }
});

// ── GET /api/store-builder/list — return user's generated stores ────────────
router.get('/list', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('generated_stores')
      .select('id, store_name, niche, subdomain, is_published, created_at, target_market, primary_color')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const stores = (data || []).map((s: any) => ({
      id: s.id,
      name: s.store_name,
      tagline: s.niche || '',
      productCount: 0,
      isPublished: !!s.is_published,
      createdAt: s.created_at,
      market: s.target_market,
      color: s.primary_color,
      subdomain: s.subdomain,
    }));
    return res.json(stores);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/store-builder/publish ────────────────────────────
router.post('/publish', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const {
      storeName, niche, targetMarket, tone, primaryColor,
      templateId, selectedProducts, generatedCopy, subdomain,
      customDomain, mode, htmlContent,
    } = req.body as {
      storeName?: string; niche?: string; targetMarket?: string;
      tone?: string; primaryColor?: string; templateId?: string;
      selectedProducts?: unknown[]; generatedCopy?: Record<string, unknown>;
      subdomain?: string; customDomain?: string; mode?: string;
      htmlContent?: string;
    };

    if (!storeName) return res.status(400).json({ error: 'storeName required' });
    if (!subdomain) return res.status(400).json({ error: 'subdomain required' });

    // Validate subdomain format
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(subdomain)) {
      return res.status(400).json({ error: 'Subdomain must be 3-30 lowercase alphanumeric characters or hyphens' });
    }

    const supabase = getSupabaseAdmin();

    // Check uniqueness
    const { data: existing } = await supabase
      .from('generated_stores')
      .select('id')
      .eq('subdomain', subdomain)
      .single();
    if (existing) {
      return res.status(409).json({ error: 'Subdomain already taken' });
    }

    // Store count limit check
    const { data: storeRows } = await supabase
      .from('generated_stores')
      .select('id')
      .eq('user_id', userId);
    const storeCount = storeRows?.length ?? 0;

    // Default to builder plan limit
    const plan = ((req as unknown as Record<string, unknown>).subscription as { plan?: string })?.plan || 'builder';
    const limit = getPlanLimit(plan as Plan, 'store_builder');
    if (storeCount >= limit) {
      return res.status(429).json({
        error: 'limit_exceeded',
        used: storeCount,
        limit,
        message: `You have ${storeCount}/${limit} stores. Upgrade to Scale for unlimited stores.`,
      });
    }

    const { data: store, error } = await supabase
      .from('generated_stores')
      .insert({
        user_id: userId,
        store_name: storeName,
        niche,
        target_market: targetMarket,
        tone,
        primary_color: primaryColor || '#6366F1',
        template: templateId,
        selected_products: selectedProducts || [],
        generated_copy: htmlContent ? { ...((generatedCopy || {}) as Record<string, unknown>), html_content: htmlContent } : (generatedCopy || {}),
        subdomain,
        custom_domain: customDomain || null,
        mode: mode || 'ai',
        published: true,
      })
      .select('id, subdomain')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Path-based URL — no DNS / wildcard cert needed. The subdomain
    // field is kept for legacy reasons (and as a fallback display name)
    // but the actual storefront lives at /store/<slug>.
    res.json({
      success: true,
      storeId: store?.id,
      liveUrl: `https://majorka.io/store/${subdomain}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

export default router;
