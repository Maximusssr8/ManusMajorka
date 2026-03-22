# Majorka — Claude Code Instructions

You are the senior engineer on Majorka. Implement everything below without stopping or asking questions.
Work in ~/ManusMajorka. Use --dangerously-skip-permissions is already set.

## ⚡ Design System — READ FIRST

**Before building any UI component, page, or style change**, read:
`.claude/skills/majorka-design-system/SKILL.md`

Follow the Majorka design system exactly:
- Primary accent: `#6366F1` (indigo) — NEVER use `#d4af37` (old gold)
- Sidebar: white/light mode with indigo active states
- Fonts: Bricolage Grotesque (display) + Geist/DM Sans (UI)
- All buttons: scale(1.02) hover, scale(0.97) active, 150ms transition
- Score badges: indigo/violet/grey tier system (not orange/gold)
- Dark mode: `html.dark` class-based, `localStorage` key `majorka-theme`

---

## OVERVIEW
3 parts: (1) Generator rewrite in server/lib/website-api.ts, (2) Shopify OAuth backend, (3) 4-step wizard frontend.

---

## PART 1 — GENERATOR REWRITE (server/lib/website-api.ts)

### 1A. Add expandStoreBrief() before generateFullStore

```typescript
async function expandStoreBrief(params: {
  niche: string;
  storeName: string;
  accentColor: string;
  designDirection?: string;
  productData?: Record<string, any>;
}): Promise<Record<string, any>> {
  const client = getAnthropicClient();
  const productSummary = params.productData
    ? `Title: ${params.productData.product_title || params.productData.title || 'N/A'}, Price: ${params.productData.price_aud || params.productData.price || 'N/A'}, Desc: ${String(params.productData.description || '').slice(0, 200)}`
    : 'none provided';
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      temperature: 0.8,
      system: `You are a DTC brand strategist for Australian Shopify stores. Return valid JSON only — no markdown, no backticks.`,
      messages: [{ role: 'user', content: `Store: ${params.storeName}\nNiche: ${params.niche}\nAccent: ${params.accentColor}\nProduct: ${productSummary}\n\nReturn JSON:\n{"brandName":"...","tagline":"...(6-10 words)","uniqueValueProp":"...(1 sentence)","heroHeadline":"...(8-12 words, specific)","heroSubheadline":"...(15-20 words, benefit-focused)","fontPairing":{"heading":"Syne","body":"DM Sans"},"colourPalette":{"primary":"${params.accentColor}","secondary":"#1a1a2e","accent":"#ffffff"},"testimonials":[{"name":"...","location":"AU city","text":"...(2 sentences)"},{"name":"...","location":"AU city","text":"..."},{"name":"...","location":"AU city","text":"..."}],"faq":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}],"stats":[{"value":"12,400+","label":"Happy Customers"},{"value":"4.8★","label":"Avg Rating"},{"value":"98%","label":"Would Recommend"}]}` }],
    });
    const raw = ((msg.content[0] as any)?.text || '').trim()
      .replace(/^```[\w]*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    return JSON.parse(raw);
  } catch {
    return {
      brandName: params.storeName,
      tagline: `Quality ${params.niche} for Australians`,
      uniqueValueProp: `We source and test every product specifically for Australian conditions.`,
      heroHeadline: `The ${params.niche} brand built for Australia`,
      heroSubheadline: `Premium quality, fast AU shipping, results you can feel from day one.`,
      fontPairing: { heading: 'Syne', body: 'DM Sans' },
      colourPalette: { primary: params.accentColor, secondary: '#1a1a2e', accent: '#ffffff' },
      testimonials: [
        { name: 'Sarah M.', location: 'Sydney', text: `Finally found ${params.niche} that delivers. Arrived in 2 days and the quality is outstanding.` },
        { name: 'Jake T.', location: 'Brisbane', text: `Tried heaps of brands. This one is genuinely different.` },
        { name: 'Emma K.', location: 'Melbourne', text: `Super fast delivery and amazing customer service.` },
      ],
      faq: [
        { q: 'How fast is shipping?', a: 'Same-day dispatch before 2pm AEST. 2-5 business days Australia-wide.' },
        { q: 'Do you offer Afterpay?', a: 'Yes! Pay in 4 interest-free instalments on orders over $35.' },
        { q: "What's your return policy?", a: '30-day no-questions-asked returns.' },
      ],
      stats: [{ value: '12,400+', label: 'Happy Customers' }, { value: '4.8★', label: 'Avg Rating' }, { value: '98%', label: 'Would Recommend' }],
    };
  }
}
```

### 1B. Rename old generateFullStore to generateFullStore_legacy
Find `export async function generateFullStore(` and rename to `async function generateFullStore_legacy(`. Keep body intact.

### 1C. New generateFullStore V2
The function signature must use same params type as legacy. Full implementation:

```typescript
export async function generateFullStore(params: Parameters<typeof generateFullStore_legacy>[0]): Promise<ReturnType<typeof generateFullStore_legacy>> {
  const { onProgress, onComplete, onError } = params;
  function progress(pct: number, msg: string) { onProgress?.(pct, msg); }

  try {
    // Images
    progress(5, '🔍 Finding the perfect images...');
    const pd = params.productData as Record<string, any> | undefined;
    const productTitle = sanitizeProductTitle(pd?.product_title || pd?.title || '', params.niche);
    const images = await fetchImagesForStore(productTitle || params.niche, params.niche);

    // Brand brief
    progress(10, '🧠 Building your brand brief...');
    const brief = await expandStoreBrief({
      niche: params.niche,
      storeName: params.storeName || 'My Store',
      accentColor: params.accentColor || '#d4af37',
      designDirection: params.designDirection,
      productData: pd,
    });

    // CSS head (same as legacy — look at the legacy function for the exact buildBaseCSS call and params)
    const dirKey = (params.designDirection || 'default') as keyof typeof DESIGN_DIRECTIONS;
    const dir = (DESIGN_DIRECTIONS[dirKey] || DESIGN_DIRECTIONS['default' as keyof typeof DESIGN_DIRECTIONS]) as any;
    const color = params.accentColor || '#d4af37';
    const colorRgb = color.replace('#', '').match(/.{2}/g)?.map((h: string) => parseInt(h, 16)).join(',') || '212,175,55';
    const bgColor = dir?.defaultBg || '#080a0e';
    const surfColor = dir?.defaultSurface || '#0e1015';
    const textColor = dir?.defaultText || '#f0ede8';
    const cardRadius = dir?.cardRadius || '16px';
    const headingFont = brief.fontPairing?.heading || 'Syne';
    const bodyFont = brief.fontPairing?.body || 'DM Sans';

    const fullHead = buildBaseCSS({
      color, colorRgb, bgColor, surfColor, textColor,
      headingFont, bodyFont, cardRadius,
      btnRadius: dir?.btnRadius || '8px',
      h1Size: dir?.h1Size || 'clamp(36px,5vw,68px)',
      headingWeight: dir?.headingWeight || '700',
      letterSpacing: dir?.letterSpacing || '-0.02em',
      storeName: brief.brandName || params.storeName || 'My Store',
      tagline: brief.tagline || '',
      niche: params.niche,
      heroImage: images.hero,
      productImage: images.product,
    });

    // Single streaming Sonnet pass
    progress(25, '✍️ Crafting your brand story...');

    const systemPrompt = `You are an expert ecommerce web developer building high-converting Australian DTC stores. Write semantic HTML body content only — no <!DOCTYPE>, no <html>, no <head>, no <style>, no <script> tags. All styling uses pre-existing CSS classes and CSS variables (--accent, --bg, --surface, --text, --muted, --card-radius, --btn-radius).

RULES:
- Output raw HTML only. No markdown. No backticks. No explanations.
- Use these CSS classes: .section .container .btn-primary .btn-secondary .hero .features-grid .feature-card .testimonials-grid .testimonial-card .stats-bar .faq-item .faq-question .faq-answer .cta-section .footer .nav .announcement-bar
- Use exact copy from brief. No placeholder text.
- AU English, AU cities, AUD prices ($X.XX AUD format).
- Include Afterpay copy. Minimum 8000 characters.`;

    const userPrompt = `Brief: ${JSON.stringify(brief)}

Images: hero=${images.hero} product=${images.product} lifestyle1=${images.lifestyle1} lifestyle2=${images.lifestyle2}

Store: ${brief.brandName || params.storeName} | Niche: ${params.niche} | Accent: ${color}

Start with <div data-page="home" style="display:block"> as FIRST element. Do NOT close this div.

Sections in order:
1. <div class="announcement-bar"> free AU shipping + urgency
2. <nav class="nav"> logo "${brief.brandName}", data-nav links (home/shop/about/contact), cart btn class="btn-cart"
3. <section class="hero"> h1=heroHeadline, p=heroSubheadline, btn-primary + btn-secondary, hero image
4. <div class="stats-bar"> 3 stat blocks from brief.stats
5. <section class="section"> problem/solution with uniqueValueProp + product image
6. <section class="section features-section"><div class="features-grid"> 3 .feature-card with emoji + heading + copy
7. <section class="section"> How It Works — 3 numbered steps
8. <section class="testimonials-section section"><div class="testimonials-grid"> 3 .testimonial-card (name, AU city, text, avatar initials div)
9. <section class="cta-section"> urgency + btn-primary + Afterpay mention
10. <div class="faq-section section"> 4+ .faq-item (each: div.faq-question with span.faq-toggle "+", div.faq-answer)
11. <footer class="footer"> brand, tagline, columns, ABN, AUD pricing, Afterpay accepted`;

    progress(30, '✍️ Your store is being written...');

    const anthropicClient = getAnthropicClient();
    let part1 = '';
    let lastPct = 30;

    const stream = anthropicClient.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 7000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      const ev = event as any;
      if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
        part1 += ev.delta.text;
        const pct = Math.min(75, 30 + Math.floor((part1.length / 32000) * 45));
        if (pct > lastPct + 3) { lastPct = pct; progress(pct, '✍️ Sections coming together...'); }
      }
    }
    progress(75, '✍️ Sections coming together...');

    // Subpages (Haiku, brief-aware)
    progress(80, '📄 Building subpages...');
    const storeName_ = brief.brandName || params.storeName || 'My Store';
    const pass3Prompt = `Write 3 HTML sections for "${storeName_}" selling ${params.niche}.
Tagline: "${brief.tagline}" | Value prop: "${brief.uniqueValueProp}"

Output ONLY:
<div data-page="about" style="display:none">
  [About: brand story using uniqueValueProp, 3 brand values. Specific AU copy.]
</div>
<div data-page="contact" style="display:none">
  [Contact: form with name/email/message/submit, AU phone, email, address]
</div>
<div data-page="shipping" style="display:none;padding-top:100px;min-height:100vh;background:var(--bg,${bgColor})">
  [Shipping: AU rates table, same-day dispatch, returns, Afterpay info]
</div>
No style/script tags. Raw HTML only.`;

    const msg3 = await anthropicClient.messages.create({
      model: 'claude-haiku-4-5', max_tokens: 2500,
      messages: [{ role: 'user', content: pass3Prompt }],
    });
    const part3Text = ((msg3.content[0] as any)?.text || '').trim()
      .replace(/```[\s\S]*?```/g, '').replace(/^```\w*\n?/gm, '').replace(/^```\s*$/gm, '');

    // Hard-coded shop (same logic as legacy)
    progress(90, '⚙️ Applying your design...');
    const scrapedImages = pd?.product_images as string[] | undefined;
    const scrapedHeroImg = (pd?.hero_image as string) || scrapedImages?.[0] || '';
    const shopImagePool = [scrapedHeroImg, ...(scrapedImages?.slice(1) || []), ...images.shopImages]
      .filter(Boolean).slice(0, 6) as string[];
    while (shopImagePool.length < 6) shopImagePool.push(images.shopImages[shopImagePool.length % images.shopImages.length] || images.product);

    const basePrice = parseFloat(String(pd?.suggested_price_aud || pd?.price_aud || '49.95').replace(/[^0-9.]/g, '')) || 49.95;
    const priceMultipliers = [1, 1.3, 0.85, 2.1, 1.6, 0.7];
    const colors = (pd?.colors as string[]) || [];
    const sizes = (pd?.sizes as string[]) || [];
    const nicheWords = params.niche.split(' ');
    const shopProductNames = [
      sanitizeProductTitle(pd?.product_title || pd?.title || '', params.niche) || `${brief.brandName} ${nicheWords[0] || ''} Pro`,
      colors[0] ? `${colors[0]} Edition` : `${nicheWords[0] || ''} Bundle`,
      sizes[0] ? `${sizes[0]} Pack` : `${brief.brandName} Essential`,
      `${nicheWords[0] || ''} Premium Set`,
      colors[1] ? `${colors[1]} Collection` : `${brief.brandName} Advanced`,
      `${nicheWords.slice(0, 2).join(' ')} Starter Kit`,
    ];

    const hardCodedShop = `
<div data-page="shop" style="display:none">
  <section style="padding:100px 5% 80px;min-height:100vh;background:var(--bg,${bgColor})">
    <div style="max-width:1200px;margin:0 auto">
      <h1 style="font-family:var(--font-heading,'Syne',sans-serif);font-size:clamp(28px,4vw,48px);font-weight:700;color:var(--text,${textColor});margin-bottom:8px;letter-spacing:-0.02em">Shop All</h1>
      <p style="color:var(--muted);margin-bottom:48px;font-size:16px">Free shipping on orders over $60 · Afterpay available</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px">
        ${shopProductNames.map((name: string, i: number) => {
          const price = (basePrice * priceMultipliers[i]).toFixed(2);
          const img = shopImagePool[i] || images.product;
          const origPrice = (basePrice * priceMultipliers[i] * 1.3).toFixed(2);
          return `<div class="product-card" style="background:var(--surface,${surfColor});border-radius:var(--card-radius,16px);border:1px solid rgba(255,255,255,0.06);overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;cursor:pointer" onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.3)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">
            <div style="aspect-ratio:1;overflow:hidden;background:#111">
              <img src="${img}" alt="${name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.4s" onerror="this.src='${images.product}'" onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform=''">
            </div>
            <div style="padding:20px">
              <h3 style="font-size:15px;font-weight:600;color:var(--text,${textColor});margin-bottom:4px;line-height:1.3">${name}</h3>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                <span class="product-price" style="font-size:18px;font-weight:700;color:var(--accent,${color})">$${price} AUD</span>
                <span class="product-price-orig" style="font-size:13px;color:var(--muted);text-decoration:line-through">$${origPrice}</span>
              </div>
              <p style="font-size:11px;color:var(--muted);margin-bottom:14px">or 4 × $${(parseFloat(price) / 4).toFixed(2)} with <strong>Afterpay</strong></p>
              <button class="btn-cart" onclick="window.addToCart('${name.replace(/'/g, "\\'")}',${parseFloat(price)},'${img}')" style="width:100%;padding:12px;border-radius:var(--btn-radius,8px);border:none;cursor:pointer;font-size:14px;font-weight:700;background:var(--accent,${color});color:#080a0e;transition:opacity 0.2s" onmouseenter="this.style.opacity='0.85'" onmouseleave="this.style.opacity='1'">Add to Cart 🛒</button>
            </div>
          </div>`;
        }).join('\n')}
      </div>
    </div>
  </section>
</div>`;

    // Assembly
    progress(98, '🔧 Wiring everything up...');
    const part1Clean = part1
      .replace(/```[\s\S]*?```/g, '').replace(/^```\w*\n?/gm, '').replace(/^```\s*$/gm, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/?(html|head|body)[^>]*>/gi, '');

    const jsWithAnim = buildHardCodedJs().replace('</script>', buildAnimationJs() + '\n</script>');
    const merged = fullHead + '\n' + part1Clean
      + '\n<div id="__home-end__" style="display:none"></div>\n'
      + hardCodedShop + '\n' + part3Text + '\n' + jsWithAnim;

    const finalHtml = postProcessHtml(merged, storeName_, params.niche, color, colorRgb, surfColor, bgColor, cardRadius);
    const manifest = buildManifest(storeName_, color, brief.tagline || params.niche);

    progress(100, '✅ Your store is ready!');
    onComplete?.(finalHtml, manifest);
    return { html: finalHtml, manifest };

  } catch (err: any) {
    console.warn('[website-gen] V2 failed, falling back to legacy:', err?.message);
    console.error('[website-gen] V2 stack:', err?.stack);
    return generateFullStore_legacy(params);
  }
}
```

---

## PART 2 — SHOPIFY OAUTH

### 2A. Install packages
```bash
cd ~/ManusMajorka && pnpm add @shopify/shopify-api cookie-parser @types/cookie-parser
```

### 2B. Create server/lib/shopify.ts

```typescript
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';

export function getShopifyConfig() {
  return {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    scopes: (process.env.SHOPIFY_SCOPES || 'write_products,write_content,read_themes,write_themes').split(','),
    redirectUri: process.env.SHOPIFY_REDIRECT_URI || 'https://majorka.io/api/shopify/callback',
  };
}

export function buildAuthUrl(shop: string, state: string): string {
  const cfg = getShopifyConfig();
  const params = new URLSearchParams({
    client_id: cfg.apiKey,
    scope: cfg.scopes.join(','),
    redirect_uri: cfg.redirectUri,
    state,
    'grant_options[]': 'per-user',
  });
  return `https://${shop}/admin/oauth/authorize?${params}`;
}

export async function exchangeCode(shop: string, code: string): Promise<string> {
  const cfg = getShopifyConfig();
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: cfg.apiKey, client_secret: cfg.apiSecret, code }),
  });
  if (!res.ok) throw new Error(`OAuth exchange failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export function verifyHmac(query: Record<string, string>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;
  const cfg = getShopifyConfig();
  const message = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('&');
  const crypto = require('crypto');
  const digest = crypto.createHmac('sha256', cfg.apiSecret).update(message).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}
```

### 2C. Create server/routes/shopify.ts

```typescript
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { buildAuthUrl, exchangeCode, verifyHmac } from '../lib/shopify';
import crypto from 'crypto';

const router = Router();

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/shopify/auth
router.get('/auth', (req, res) => {
  const shop = req.query.shop as string;
  if (!shop || !shop.includes('.myshopify.com')) {
    return res.status(400).json({ error: 'Invalid shop domain' });
  }
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('shopify_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600000 });
  return res.redirect(buildAuthUrl(shop, state));
});

// GET /api/shopify/callback
router.get('/callback', async (req, res) => {
  try {
    const { shop, code, state, hmac, ...rest } = req.query as Record<string, string>;
    const cookieState = (req as any).cookies?.shopify_state;
    if (!state || state !== cookieState) return res.status(403).send('State mismatch');
    if (!verifyHmac({ shop, code, state, hmac, ...rest })) return res.status(403).send('HMAC invalid');

    const accessToken = await exchangeCode(shop, code);

    // Get user from auth header
    const authHeader = req.headers.authorization || '';
    const jwt = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !user) return res.redirect('/store-builder?error=auth');

    await supabase.from('shopify_connections').upsert({
      user_id: user.id,
      shop_domain: shop,
      access_token: accessToken,
    }, { onConflict: 'user_id' });

    res.clearCookie('shopify_state');
    return res.redirect('/store-builder?connected=true&shop=' + encodeURIComponent(shop));
  } catch (err: any) {
    console.error('[shopify/callback]', err);
    return res.redirect('/store-builder?error=oauth');
  }
});

// GET /api/shopify/status
router.get('/status', async (req, res) => {
  try {
    const jwt = (req.headers.authorization || '').replace('Bearer ', '');
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser(jwt);
    if (!user) return res.json({ connected: false });
    const { data } = await supabase.from('shopify_connections').select('shop_domain').eq('user_id', user.id).single();
    return res.json({ connected: !!data, shop: data?.shop_domain || null });
  } catch {
    return res.json({ connected: false });
  }
});

// DELETE /api/shopify/disconnect
router.delete('/disconnect', async (req, res) => {
  try {
    const jwt = (req.headers.authorization || '').replace('Bearer ', '');
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser(jwt);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    await supabase.from('shopify_connections').delete().eq('user_id', user.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
```

### 2D. Create server/routes/store-builder.ts

```typescript
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { expandStoreBrief, generateFullStore } from '../lib/website-api';

const router = Router();

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// POST /api/store-builder/generate
router.post('/generate', async (req, res) => {
  try {
    const { productName, productDescription, niche, pricePoint } = req.body as {
      productName?: string; productDescription?: string; niche?: string; pricePoint?: string;
    };
    if (!niche) return res.status(400).json({ error: 'niche required' });

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

    // Store name options (3 variants)
    const brandName = brief.brandName || productName || niche;
    const storeNameOptions = [
      brandName,
      brandName + ' AU',
      brandName.split(' ')[0] + ' Co.',
    ];

    return res.json({
      brief,
      storeNameOptions,
      themeRecommendation: {
        name: 'Modern Dark',
        reason: 'High-converting dark theme with gold accents, optimised for Australian DTC brands.',
      },
      appStack: [
        { name: 'Afterpay', icon: '💚', reason: 'Increases conversion by 20-30% for AU shoppers' },
        { name: 'Loox Reviews', icon: '⭐', reason: 'Photo reviews build trust fast' },
        { name: 'ReConvert', icon: '🔄', reason: 'Post-purchase upsell boosts AOV' },
      ],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/shopify/push
router.post('/push', async (req, res) => {
  try {
    const jwt = (req.headers.authorization || '').replace('Bearer ', '');
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser(jwt);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: conn } = await supabase.from('shopify_connections')
      .select('shop_domain,access_token').eq('user_id', user.id).single();
    if (!conn) return res.status(400).json({ error: 'No Shopify connection' });

    const { brief, selectedStoreName } = req.body as { brief: Record<string, any>; selectedStoreName: string };
    const { shop_domain: shop, access_token: token } = conn;

    const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
    const base = `https://${shop}/admin/api/2025-01`;
    const steps: Record<string, any> = {};

    // Step 1: Create product
    try {
      const productRes = await fetch(`${base}/products.json`, {
        method: 'POST', headers,
        body: JSON.stringify({ product: {
          title: selectedStoreName,
          body_html: `<p>${brief.uniqueValueProp}</p>`,
          tags: `majorka,${brief.brandName || ''}`,
          published: true,
        }}),
      });
      const productData = await productRes.json() as any;
      steps.product = { success: productRes.ok, id: productData?.product?.id };
    } catch (e: any) {
      steps.product = { success: false, error: e.message };
    }

    // Step 2: Update theme colours
    try {
      const themesRes = await fetch(`${base}/themes.json`, { headers });
      const themesData = await themesRes.json() as any;
      const mainTheme = themesData?.themes?.find((t: any) => t.role === 'main');
      if (mainTheme) {
        const assetRes = await fetch(`${base}/themes/${mainTheme.id}/assets.json`, {
          method: 'PUT', headers,
          body: JSON.stringify({ asset: {
            key: 'config/settings_data.json',
            value: JSON.stringify({ current: { colors_accent_1: brief.colourPalette?.primary || '#d4af37' } }),
          }}),
        });
        steps.theme = { success: assetRes.ok, themeId: mainTheme.id };
      } else {
        steps.theme = { success: false, error: 'No main theme found' };
      }
    } catch (e: any) {
      steps.theme = { success: false, error: e.message };
    }

    // Step 3: Create pages
    try {
      await fetch(`${base}/pages.json`, {
        method: 'POST', headers,
        body: JSON.stringify({ page: { title: 'About Us', body_html: `<p>${brief.uniqueValueProp}</p><p>Built for Australia. Powered by Majorka.</p>` }}),
      });
      await fetch(`${base}/pages.json`, {
        method: 'POST', headers,
        body: JSON.stringify({ page: { title: 'Contact', body_html: '<p>Get in touch with our team.</p>' }}),
      });
      steps.pages = { success: true };
    } catch (e: any) {
      steps.pages = { success: false, error: e.message };
    }

    const productUrl = steps.product?.id
      ? `https://${shop}/admin/products/${steps.product.id}`
      : `https://${shop}/admin/products`;

    return res.json({
      success: Object.values(steps).every((s: any) => s.success),
      steps,
      productUrl,
      storeUrl: `https://${shop}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
```

### 2E. Register routes in api/_server.ts
Add these imports and route registrations after existing routes:

```typescript
import cookieParser from 'cookie-parser';
import shopifyRouter from '../server/routes/shopify';
import storeBuilderRouter from '../server/routes/store-builder';

// After app.use(express.json()):
app.use(cookieParser());

// Route registrations (add after existing routes):
app.use('/api/shopify', shopifyRouter);
app.use('/api/store-builder', storeBuilderRouter);
```

Also export expandStoreBrief from server/lib/website-api.ts (add `export` keyword to the function).

---

## PART 3 — FRONTEND (4-step wizard)

### 3A. Create client/src/pages/store-builder/index.tsx

```tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import ProductInput from '@/components/store-builder/ProductInput';
import BlueprintPreview from '@/components/store-builder/BlueprintPreview';
import ShopifyConnect from '@/components/store-builder/ShopifyConnect';
import PushSuccess from '@/components/store-builder/PushSuccess';

const STEPS = ['Product', 'Blueprint', 'Connect', 'Success'];

export default function StoreBuilder() {
  const [step, setStep] = useState(1);
  const [productInput, setProductInput] = useState<any>(null);
  const [blueprint, setBlueprint] = useState<any>(null);
  const [selectedStoreName, setSelectedStoreName] = useState('');
  const [pushResult, setPushResult] = useState<any>(null);
  const [location] = useLocation();
  const { session } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') setStep(3);
    if (params.get('error')) console.warn('OAuth error:', params.get('error'));
  }, [location]);

  const syne = 'Syne, sans-serif';
  const gold = '#d4af37';

  return (
    <div style={{ minHeight: '100vh', background: '#080a0e', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 18, color: gold }}>Store Builder</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step === i + 1 ? gold : step > i + 1 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                color: step === i + 1 ? '#080a0e' : step > i + 1 ? gold : '#52525b',
                fontSize: 12, fontWeight: 700,
              }}>{step > i + 1 ? '✓' : i + 1}</div>
              <span style={{ fontSize: 12, color: step === i + 1 ? gold : '#52525b', display: window.innerWidth < 600 ? 'none' : 'inline' }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.08)', marginLeft: 4 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        {step === 1 && (
          <ProductInput onComplete={(input, bp) => {
            setProductInput(input);
            setBlueprint(bp);
            setSelectedStoreName(bp.storeNameOptions?.[0] || input.productName);
            setStep(2);
          }} session={session} />
        )}
        {step === 2 && blueprint && (
          <BlueprintPreview
            blueprint={blueprint}
            selectedStoreName={selectedStoreName}
            onSelectStoreName={setSelectedStoreName}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ShopifyConnect
            blueprint={blueprint}
            selectedStoreName={selectedStoreName}
            session={session}
            onPushComplete={(result) => { setPushResult(result); setStep(4); }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && pushResult && (
          <PushSuccess
            result={pushResult}
            onReset={() => { setStep(1); setBlueprint(null); setPushResult(null); setProductInput(null); }}
          />
        )}
      </div>
    </div>
  );
}
```

### 3B. Create client/src/components/store-builder/ProductInput.tsx

```tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const NICHES = ['Fashion', 'Beauty', 'Tech', 'Home & Garden', 'Fitness', 'Supplements', 'Pet', 'Baby', 'General'];
const gold = '#d4af37';
const syne = 'Syne, sans-serif';

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)', color: '#f0ede8', fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' as const,
};

export default function ProductInput({ onComplete, session }: { onComplete: (input: any, blueprint: any) => void; session: any }) {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('General');
  const [pricePoint, setPricePoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!productName.trim()) { setError('Product name is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/store-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ productName, productDescription: description, niche, pricePoint }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');
      const bp = await res.json();
      onComplete({ productName, description, niche, pricePoint }, bp);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>What are you selling?</h2>
      <p style={{ color: '#71717a', marginBottom: 32, fontSize: 15 }}>Tell us about your product and we'll build the blueprint.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Product Name *</label>
          <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. LED Desk Lamp with Wireless Charger" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your product, its benefits, and who it's for..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Niche</label>
            <select value={niche} onChange={e => setNiche(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Price Point (AUD)</label>
            <input value={pricePoint} onChange={e => setPricePoint(e.target.value)} placeholder="49.95" type="number" style={inputStyle} />
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

        <button onClick={handleGenerate} disabled={loading} style={{
          padding: '14px 24px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? 'rgba(212,175,55,0.3)' : gold, color: '#080a0e',
          fontFamily: syne, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading ? 0.7 : 1, minHeight: 50,
        }}>
          {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating Blueprint...</> : 'Generate Blueprint →'}
        </button>
      </div>
    </div>
  );
}
```

### 3C. Create client/src/components/store-builder/BlueprintPreview.tsx

```tsx
const gold = '#d4af37';
const syne = 'Syne, sans-serif';

export default function BlueprintPreview({ blueprint, selectedStoreName, onSelectStoreName, onNext, onBack }: {
  blueprint: any; selectedStoreName: string; onSelectStoreName: (n: string) => void; onNext: () => void; onBack: () => void;
}) {
  const { brief, storeNameOptions, themeRecommendation, appStack } = blueprint;
  return (
    <div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Your Blueprint</h2>
      <p style={{ color: '#71717a', marginBottom: 32, fontSize: 15 }}>Review your brand strategy. Select a store name to continue.</p>

      {/* Store name options */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, fontFamily: syne }}>Store Name</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(storeNameOptions || [selectedStoreName]).map((n: string) => (
            <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: `1px solid ${selectedStoreName === n ? gold : 'rgba(255,255,255,0.08)'}`, background: selectedStoreName === n ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
              <input type="radio" checked={selectedStoreName === n} onChange={() => onSelectStoreName(n)} style={{ accentColor: gold }} />
              <span style={{ fontWeight: 600, color: '#f0ede8' }}>{n}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tagline + hero copy */}
      {brief && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#52525b', fontWeight: 600, marginBottom: 4, fontFamily: syne, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Brand Copy</p>
          <p style={{ fontFamily: syne, fontSize: 18, fontWeight: 700, color: '#f0ede8', marginBottom: 8 }}>{brief.heroHeadline}</p>
          <p style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 12 }}>{brief.heroSubheadline}</p>
          <p style={{ color: '#71717a', fontSize: 13 }}>"{brief.tagline}"</p>
        </div>
      )}

      {/* Colour swatches */}
      {brief?.colourPalette && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, fontFamily: syne }}>Colour Palette</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {Object.entries(brief.colourPalette).map(([k, v]: [string, any]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: v, border: '2px solid rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 10, color: '#52525b' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme + apps */}
      {themeRecommendation && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: syne }}>Recommended Theme</p>
          <p style={{ fontWeight: 600, color: '#f0ede8', marginBottom: 4 }}>{themeRecommendation.name}</p>
          <p style={{ color: '#71717a', fontSize: 13 }}>{themeRecommendation.reason}</p>
        </div>
      )}

      {appStack && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, fontFamily: syne }}>Recommended Apps</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {appStack.map((app: any) => (
              <div key={app.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                <span style={{ fontSize: 22 }}>{app.icon}</span>
                <div><p style={{ fontWeight: 600, color: '#f0ede8', marginBottom: 2 }}>{app.name}</p><p style={{ color: '#71717a', fontSize: 13 }}>{app.reason}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', cursor: 'pointer', fontFamily: syne, fontWeight: 600 }}>← Back</button>
        <button onClick={onNext} style={{ flex: 2, padding: '14px', borderRadius: 8, border: 'none', background: gold, color: '#080a0e', cursor: 'pointer', fontFamily: syne, fontWeight: 700, fontSize: 15 }}>Connect Shopify & Push →</button>
      </div>
    </div>
  );
}
```

### 3D. Create client/src/components/store-builder/ShopifyConnect.tsx

```tsx
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const gold = '#d4af37';
const syne = 'Syne, sans-serif';

export default function ShopifyConnect({ blueprint, selectedStoreName, session, onPushComplete, onBack }: {
  blueprint: any; selectedStoreName: string; session: any; onPushComplete: (r: any) => void; onBack: () => void;
}) {
  const [shopDomain, setShopDomain] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState('');
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/shopify/status', { headers: { Authorization: `Bearer ${session?.access_token || ''}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); setConnectedShop(d.shop); } }).catch(() => {});
  }, [session]);

  const handleConnect = () => {
    const domain = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!domain.includes('.myshopify.com')) { setError('Enter a valid .myshopify.com domain'); return; }
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`;
  };

  const handleDisconnect = async () => {
    await fetch('/api/shopify/disconnect', { method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
    setConnected(false); setConnectedShop('');
  };

  const handlePush = async () => {
    setPushing(true); setError('');
    try {
      const res = await fetch('/api/shopify/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ brief: blueprint?.brief, selectedStoreName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Push failed');
      onPushComplete(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPushing(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Connect Your Store</h2>
      <p style={{ color: '#71717a', marginBottom: 32, fontSize: 15 }}>Connect your Shopify store to push the blueprint live.</p>

      {connected ? (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CheckCircle size={18} style={{ color: '#22c55e' }} />
            <span style={{ fontWeight: 600, color: '#f0ede8' }}>Connected to {connectedShop}</span>
          </div>
          <button onClick={handleDisconnect} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Disconnect</button>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Shopify Store Domain</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={shopDomain} onChange={e => setShopDomain(e.target.value)} placeholder="mystore.myshopify.com"
              style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f0ede8', fontSize: 14, outline: 'none' }} />
            <button onClick={handleConnect} style={{ padding: '12px 18px', borderRadius: 8, border: 'none', background: gold, color: '#080a0e', cursor: 'pointer', fontFamily: syne, fontWeight: 700, whiteSpace: 'nowrap' }}>Connect →</button>
          </div>
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', cursor: 'pointer', fontFamily: syne, fontWeight: 600 }}>← Back</button>
        <button onClick={handlePush} disabled={!connected || pushing} style={{ flex: 2, padding: '14px', borderRadius: 8, border: 'none', background: connected ? gold : 'rgba(212,175,55,0.2)', color: connected ? '#080a0e' : '#71717a', cursor: connected ? 'pointer' : 'not-allowed', fontFamily: syne, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {pushing ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Pushing to Shopify...</> : 'Push to Store →'}
        </button>
      </div>
    </div>
  );
}
```

### 3E. Create client/src/components/store-builder/PushSuccess.tsx

```tsx
import { CheckCircle, ExternalLink } from 'lucide-react';
const gold = '#d4af37';
const syne = 'Syne, sans-serif';

export default function PushSuccess({ result, onReset }: { result: any; onReset: () => void }) {
  const steps = [
    { key: 'product', label: 'Product Created' },
    { key: 'theme', label: 'Theme Updated' },
    { key: 'pages', label: 'Pages Created' },
  ];
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Store Launched!</h2>
      <p style={{ color: '#71717a', marginBottom: 32 }}>Your blueprint has been pushed to Shopify.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, textAlign: 'left' }}>
        {steps.map(s => {
          const ok = result?.steps?.[s.key]?.success;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: ok ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10 }}>
              <CheckCircle size={16} style={{ color: ok ? '#22c55e' : '#ef4444' }} />
              <span style={{ fontWeight: 600, color: '#f0ede8' }}>{s.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: ok ? '#22c55e' : '#ef4444' }}>{ok ? '✓ Done' : '✗ Failed'}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {result?.productUrl && (
          <a href={result.productUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '12px', borderRadius: 8, border: `1px solid ${gold}`, color: gold, textDecoration: 'none', fontFamily: syne, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
            <ExternalLink size={14} /> Shopify Admin
          </a>
        )}
        {result?.storeUrl && (
          <a href={result.storeUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: gold, color: '#080a0e', textDecoration: 'none', fontFamily: syne, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
            <ExternalLink size={14} /> Open Store
          </a>
        )}
      </div>
      <button onClick={onReset} style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', cursor: 'pointer', fontFamily: syne, fontWeight: 600 }}>Build Another Store</button>
    </div>
  );
}
```

### 3F. Register route in client/src/App.tsx

Add import and Route:
```tsx
const StoreBuilder = lazy(() => import('./pages/store-builder/index'));
// In the Route list, add:
<Route path="/store-builder" component={() => <StoreBuilder />} />
// Also add /app/store-builder if there's an app section
```

Also add it to the tool list in client/src/lib/tools.ts if that file exists.

---

## BUILD & VERIFY

1. Run: `pnpm run build` — must pass with 0 TypeScript errors
2. Run: `npx tsc --noEmit` — must pass with 0 errors
3. Run: `git add -A && git commit -m "feat: Store Builder V2 — generator rewrite + Shopify OAuth + 4-step wizard" && git push origin main`
4. Run: `openclaw system event --text "Done: Store Builder V2 complete — generator V2 + Shopify OAuth + 4-step wizard deployed" --mode now`

## REPORT BACK

After finishing, print:
- Files created/modified (list)
- Supabase SQL to run (copy-paste ready)
- ENV vars needed for Vercel dashboard
- Build result (pass/fail)

---

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- Append "use subagents" to any request where you want more compute thrown at it
- One tack per subagent for focused execution
- Offload individual tasks to subagents to keep main agent context clean and focused

### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how
- If given a Slack bug thread link: read it and fix it, say "fix" — nothing more needed

## Task Management

1. Plan First: Write plan to tasks/todo.md with checkable items
2. Verify Plan: Check in before starting implementation
3. Track Progress: Mark items complete as you go
4. Explain Changes: High-level summary at each step
5. Document Results: Add review section to tasks/todo.md
6. Capture Lessons: Update tasks/lessons.md after corrections

## Prompting Rules (how Max communicates with you)

- "Grill me on these changes" = be my reviewer, don't make a PR until I pass your test
- "Prove to me this works" = diff behavior between main and feature branch
- "Knowing everything you know now, implement the elegant solution" = scrap mediocre fix, do it properly
- More specific specs = better output. If the brief is vague, ask one clarifying question before building
- "use subagents" appended to any message = throw parallel agents at it

## Core Principles

- Simplicity First: Make every change as simple as possible. Impact minimal code.
- No Laziness: Find root causes. No temporary fixes. Senior developer standards.
- Minimal Impact: Changes should only touch what's necessary. Avoid introducing bugs.
- No hand-holding required: operate autonomously, report results.

---

# CURRENT ACTIVE TASK: WebsiteGenerator Improvements (Tasks 1–7)

You are the senior engineer on Majorka. Read tasks/wg-improvements.md for full spec.
Implement all 7 tasks. Do not stop. Work in ~/ManusMajorka.
After completing, run: pnpm run build && npx tsc --noEmit
Then: git add -A && git commit -m "feat: WebsiteGenerator — live preview, template UX, progress overlay, Shopify connect, quick-start, store history" && git push origin main

---

## TASKS 8 & 9 (also implement these after Tasks 1-7)

### TASK 8 — Mobile Responsiveness Audit (WebsiteGenerator.tsx)

The left sidebar (form) and right preview panel sit side by side.
At 375px viewport (mobile), this breaks.

Apply these responsive CSS changes using inline styles + JS window width checks:

1. Detect mobile: `const isMobile = typeof window !== 'undefined' && window.innerWidth < 768`
   Use `useState + useEffect` that listens to window resize and updates `isMobile` boolean.

2. The outer container (flex row with sidebar + preview): on mobile, change to `flexDirection: 'column'`

3. Left sidebar: on mobile, set `overflowX: 'auto'`, `maxHeight: 'none'`, `width: '100%'`

4. Template list: on mobile, wrap with a `div style={{ overflowX: 'auto', display: 'flex', gap: 8, flexWrap: 'nowrap' }}` so templates scroll horizontally.
   Each template button on mobile gets `flexShrink: 0, width: 180`

5. All input elements already get `minHeight: 44` — verify they all have this.

6. Generate button on mobile: `width: '100%'` and `minHeight: 52`

7. Right preview panel on mobile: `minHeight: 400`, placed below the form

### TASK 9 — Maya AI Suggestions (bottom bar, WebsiteGenerator.tsx)

Find the Maya suggestion area (search for "Maya" or "Find suppliers" in the file).
Wire it contextually:

```tsx
// Compute Maya suggestion based on current state:
const mayaSuggestion = importedProduct
  ? `Find suppliers for "${importedProduct.title.slice(0,30)}" →`
  : hasOutput
    ? `Calculate margin for "${(storeName || niche).slice(0,25)}" →`
    : 'Paste a product URL to get started';

const mayaLink = importedProduct
  ? `/app/suppliers?q=${encodeURIComponent(importedProduct.title)}`
  : hasOutput
    ? `/app/profit-check?store=${encodeURIComponent(storeName || niche)}`
    : null;
```

Replace the static Maya suggestion text with `{mayaSuggestion}` and wrap it in an `<a>` if `mayaLink` is non-null.

Also: after generation completes (directHtml is set), add a second Maya suggestion:
"Calculate margin for [store name] →" that links to `/app/profit-check`.

### TASK 10 — Recent Stores section

Below the Quick Start section in the left sidebar, add a "Recent Stores" section.

Use the existing `siteHistory` state (already populated from C3 feature).
Render the last 3 items from `siteHistory`:

```tsx
{siteHistory.length > 0 && (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(212,175,55,0.6)', fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>RECENT STORES</div>
    {siteHistory.slice(0, 3).map(item => (
      <div key={item.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,237,232,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>{new Date(item.timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
        </div>
        <button onClick={() => { setDirectHtml(item.html); setHasOutput_or_activeTab('preview'); }} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37', cursor: 'pointer' }}>Load</button>
      </div>
    ))}
  </div>
)}
```

Note: `setHasOutput_or_activeTab` — use whatever sets the preview tab as active so the iframe appears.


---

## Session Log — Store Builder V2

### What shipped
- Generator V2: `expandStoreBrief()` Haiku call + single Sonnet streaming pass (7000 tokens)
- Shopify OAuth: full CSRF-protected flow, token stored in `shopify_connections` (Supabase)
- 4-step wizard replaced by integrated Store Builder UI at `/store-builder`
- Live preview panel: real-time updates as user types
- Generation progress overlay: SSE events 5%→100% with status messages
- Design template switcher: 6 templates (DTC Minimal, Dropship Bold, Premium Brand, Coastal AU, Tech Mono, Bloom Beauty) with hover previews and auto-suggest by niche
- Product import: AliExpress/Amazon/eBay URL → Haiku extracts product data → auto-fills form
- Quick start examples: 4 pre-filled example products with one-click generate
- Shopify connect integrated into main UI: OAuth → push product + theme colours + pages
- Store history: `generated_stores` table in Supabase, last 3 stores shown with regenerate + push options
- Maya contextual bar: suggestions update based on flow state (import → generate → push)
- Mobile responsive: 375px layout, horizontal template scroll, 44px tap targets
- Smoke test: 31/32 PASS (1 expected 401 auth gate on `/api/website/generate`)

### Tables added to Supabase
- `shopify_connections` (user_id, shop_domain, access_token)
- `generated_stores` (user_id, store_name, niche, template, blueprint jsonb, html, shopify_product_id, pushed_at)

### Env vars added to Vercel
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_REDIRECT_URI`
- `SHOPIFY_SCOPES`

### Key files
- `server/lib/shopify.ts` — OAuth client, HMAC verification
- `server/routes/shopify.ts` — auth, callback, status, disconnect
- `server/routes/store-builder.ts` — generate blueprint, push to Shopify
- `server/migrations/runGeneratedStores.ts` — REST API migration
- `client/src/pages/store-builder/index.tsx` — main UI (live preview, wizard, history)

### Known limitations
- `exec_sql` RPC not enabled on Supabase project — migrations use REST API check only
- Supabase DB is IPv6-only, unreachable from local and Vercel directly
- All DB operations go through Supabase REST API (not direct postgres)
- `generated_stores` table needs manual creation via Supabase dashboard SQL Editor

### Next priorities (not yet built)
- Product → Store Builder shortcut from Winning Products cards
- Shopify sync status dashboard (which products were pushed + when)
- Store Builder on `/scale` tier — usage limits enforcement
- A/B template testing (generate same product in 2 templates, compare)

## TypeUI Design Skills — Always Read Before Building UI

53 design system skills are installed at `.claude/skills/design-system/[skill].md`

**When to use:** Before building any new page or component, read the relevant skill file.
**Fallback:** If no skill matches, use `clean` as the default.

### Full Skill Inventory

| Category | Skills |
|---|---|
| Modern & Minimal | clean, contemporary, flat, minimal, modern, mono, refined, shadcn, simple, sleek |
| Bold & Expressive | bold, brutalism, colorful, dramatic, energetic, expressive, neobrutalism, vibrant |
| Creative & Artistic | artistic, cafe, cosmic, creative, doodle, editorial, fantasy, friendly, publication, storytelling |
| Professional | corporate, elegant, enterprise, luxury, material, premium, professional |
| Morphism & Effects | claymorphism, glassmorphism, gradient, neon, neumorphism, skeumorphism |
| Retro | dithered, paper, retro, vintage |
| Layout | bento, levels, perspective, spacious |
| Themed | agentic, futuristic, pacman, tetris |

### Template to Skill Mappings

| Template | Skill | Use for |
|---|---|---|
| Prestige | luxury | High-ticket dark luxury UI |
| Aurora | gradient | Beauty/skincare soft gradients |
| Velocity | energetic | Sports/fitness bold UI |
| Minimal | minimal | Clean whitespace editorial |
| Neon Pulse | neon | Tech gadgets dark neon |
| Botanical | paper | Eco/natural artisanal |
| Metro | editorial | Fashion magazine layout |
| Playful | colorful | Kids/family bright UI |
| Heritage | vintage | Food/gourmet warm tones |
| Storm | dramatic | Outdoor/adventure bold |
| Rose | elegant | Jewellery/accessories |
| Clinical | corporate | Health/wellness clinical |
| Coastal | spacious | Beach/summer airy |
| Noir | mono | Photography dark editorial |
| Sunrise | cafe | Coffee/beverages warm |

### Majorka Own UI
Always use `majorka-design-system/SKILL.md` — #6366F1 indigo, Bricolage Grotesque headings.
