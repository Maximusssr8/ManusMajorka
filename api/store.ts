import type { IncomingMessage, ServerResponse } from 'http';
type VercelRequest = IncomingMessage & { query: Record<string, string>; body: any };
type VercelResponse = ServerResponse & { status: (code: number) => VercelResponse; json: (data: any) => void; send: (data: any) => void };
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ievekuazsjbdrltsdksn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];

  if (!subdomain || subdomain === 'www' || subdomain === 'api' || subdomain === 'majorka') {
    res.redirect(302, 'https://www.majorka.io');
    return;
  }

  const { data: store } = await supabase
    .from('generated_stores')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('published', true)
    .single();

  if (!store) {
    res.redirect(302, 'https://www.majorka.io');
    return;
  }

  const copy = store.generated_copy || {};
  const products: any[] = store.selected_products || [];
  const primaryColor = store.primary_color || '#6366F1';
  const storeName = store.name || 'My Store';

  const productCardsHtml = products.slice(0, 9).map((p: any) => `
    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      ${p.image_url ? `<img src="${p.image_url}" alt="${(p.seo_title || p.product_title || '').replace(/"/g, '&quot;')}" style="width:100%;height:240px;object-fit:cover">` : '<div style="width:100%;height:240px;background:#F3F4F6"></div>'}
      <div style="padding:16px">
        <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:8px;line-height:1.4">${p.seo_title || p.product_title || 'Product'}</div>
        <div style="font-size:18px;font-weight:700;color:${primaryColor}">$${p.price_aud || '29.99'}</div>
        <button style="width:100%;margin-top:12px;padding:10px;background:${primaryColor};color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Add to Cart</button>
      </div>
    </div>
  `).join('');

  const trustBadges = (copy.trust_badges || ['Secure Checkout', 'Free Returns', 'Fast Shipping', 'Quality Guarantee']).map((b: string) => `
    <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:white;border-radius:8px;border:1px solid #E5E7EB">
      <span style="color:${primaryColor}">✓</span>
      <span style="font-size:13px;font-weight:500;color:#374151">${b}</span>
    </div>
  `).join('');

  const faqItems = (copy.faq || []).slice(0, 5).map((f: any, i: number) => `
    <div style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:8px">
      <div style="padding:16px;font-weight:600;color:#1a1a1a;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">${f.question}</div>
      <div style="padding:0 16px 16px;color:#6B7280;font-size:14px;line-height:1.6;display:${i===0?'block':'none'}">${f.answer}</div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${(copy.meta_title || storeName).replace(/"/g, '&quot;')}</title>
  <meta name="description" content="${(copy.meta_description || '').replace(/"/g, '&quot;')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; color: #1a1a1a; background: #FFFFFF; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .trust-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    @media (max-width: 768px) {
      .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .trust-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) { .products-grid { grid-template-columns: 1fr; } }
    @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  </style>
</head>
<body>
  <nav style="background:white;border-bottom:1px solid #E5E7EB;padding:16px 0;position:sticky;top:0;z-index:100">
    <div class="container" style="display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:20px;font-weight:800;color:${primaryColor}">${storeName}</div>
      <div style="display:flex;gap:24px;font-size:14px;font-weight:500;color:#374151">
        <a href="#" style="text-decoration:none;color:inherit">Home</a>
        <a href="#products" style="text-decoration:none;color:inherit">Products</a>
        <a href="#about" style="text-decoration:none;color:inherit">About</a>
      </div>
    </div>
  </nav>
  <section style="background:linear-gradient(135deg,${primaryColor}08,${primaryColor}15);padding:80px 0">
    <div class="container" style="text-align:center;max-width:800px;margin:0 auto">
      <div style="font-size:13px;font-weight:600;color:${primaryColor};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:16px">${copy.tagline || 'Premium Quality Products'}</div>
      <h1 style="font-size:clamp(32px,5vw,56px);font-weight:800;color:#0a0a0a;line-height:1.15;margin-bottom:20px">${copy.hero_headline || "Discover Products You'll Love"}</h1>
      <p style="font-size:18px;color:#6B7280;max-width:560px;margin:0 auto 32px;line-height:1.6">${copy.hero_subheading || 'Quality products delivered fast. Customer satisfaction guaranteed.'}</p>
      <a href="#products" style="display:inline-block;padding:16px 36px;background:${primaryColor};color:white;text-decoration:none;border-radius:12px;font-size:16px;font-weight:700">${copy.hero_cta || 'Shop Now'} →</a>
    </div>
  </section>
  <div style="background:${primaryColor};color:white;padding:10px 0;overflow:hidden">
    <div style="white-space:nowrap;animation:ticker 20s linear infinite;display:inline-block;padding-left:100%">★ 500+ Happy Customers &nbsp;&nbsp;·&nbsp;&nbsp; Free Shipping on orders over $50 &nbsp;&nbsp;·&nbsp;&nbsp; 4.8★ Average Rating &nbsp;&nbsp;·&nbsp;&nbsp; 14-Day Returns &nbsp;&nbsp;·&nbsp;&nbsp; ★ 500+ Happy Customers &nbsp;&nbsp;·&nbsp;&nbsp; Free Shipping on orders over $50 &nbsp;&nbsp;·&nbsp;&nbsp; 4.8★ Average Rating &nbsp;&nbsp;·&nbsp;&nbsp; 14-Day Returns</div>
  </div>
  <section id="products" style="padding:80px 0;background:#F9FAFB">
    <div class="container">
      <h2 style="font-size:32px;font-weight:800;color:#0a0a0a;margin-bottom:8px;text-align:center">Our Products</h2>
      <p style="text-align:center;color:#6B7280;margin-bottom:40px">Carefully selected for quality and value</p>
      <div class="products-grid">${productCardsHtml}</div>
    </div>
  </section>
  <section style="padding:40px 0"><div class="container"><div class="trust-grid">${trustBadges}</div></div></section>
  <section id="about" style="padding:80px 0;background:#F9FAFB">
    <div class="container" style="max-width:600px;margin:0 auto;text-align:center">
      <h2 style="font-size:28px;font-weight:800;color:#0a0a0a;margin-bottom:16px">About Us</h2>
      <p style="font-size:16px;color:#6B7280;line-height:1.7">${copy.about_text || 'We are dedicated to bringing you the best products at fair prices with excellent customer service.'}</p>
    </div>
  </section>
  ${faqItems ? `<section style="padding:80px 0"><div class="container" style="max-width:700px;margin:0 auto"><h2 style="font-size:28px;font-weight:800;color:#0a0a0a;margin-bottom:32px;text-align:center">Frequently Asked Questions</h2>${faqItems}</div></section>` : ''}
  <footer style="background:#1a1a1a;color:white;padding:40px 0;margin-top:40px">
    <div class="container" style="text-align:center">
      <div style="font-size:18px;font-weight:700;color:${primaryColor};margin-bottom:12px">${storeName}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:12px">© ${new Date().getFullYear()} ${storeName}. All rights reserved.</div>
      <div style="display:flex;gap:20px;justify-content:center;font-size:13px">
        <a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">Privacy Policy</a>
        <a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">Terms of Service</a>
        <a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">Contact</a>
      </div>
    </div>
  </footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
}
