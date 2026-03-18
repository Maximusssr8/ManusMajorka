import type { StorePlan } from './website-api';

function esc(s: string | number | undefined | null): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stars(n = 5): string {
  return '★'.repeat(Math.min(5, Math.max(0, Math.round(n))));
}

function colorRgb(hex: string): string {
  const c = (hex || '#d4af37').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) || 212;
  const g = parseInt(c.slice(2, 4), 16) || 175;
  const b = parseInt(c.slice(4, 6), 16) || 55;
  return `${r},${g},${b}`;
}

function getTemplateCSS(template: string, primaryColour: string, accentColour: string, headingFont: string, bodyFont: string): string {
  const t = (template || '').toLowerCase();

  if (t.includes('luxury')) {
    return `:root {
  --font-heading: '${headingFont}', serif;
  --font-body: '${bodyFont}', sans-serif;
  --color-primary: ${primaryColour};
  --color-accent: ${accentColour};
  --color-bg: #0a0806;
  --color-surface: #120f0a;
  --color-text: #f5f0e8;
  --color-muted: rgba(245,240,232,0.5);
  --border-radius: 4px;
}
.nav { background: rgba(10,8,6,0.97) !important; }
.nav-logo, .nav-links a, .hero-headline, .hero-sub { color: var(--color-text) !important; }
.btn-primary { background: transparent !important; border: 1px solid rgba(${colorRgb(primaryColour)},0.5) !important; color: ${primaryColour} !important; letter-spacing: 0.12em; text-transform: uppercase; font-size: 12px !important; }
.hero-headline { font-weight: 300 !important; }
.announcement { background: rgba(${colorRgb(primaryColour)},0.08) !important; color: rgba(245,240,232,0.5) !important; letter-spacing: 3px; font-size: 11px !important; }
.testimonial-card { background: #120f0a !important; border-left-color: rgba(${colorRgb(primaryColour)},0.3) !important; }`;
  }

  if (t.includes('bloom') || t.includes('beauty') || t.includes('minimal')) {
    return `:root {
  --font-heading: 'Cormorant Garamond', serif;
  --font-body: 'Nunito', sans-serif;
  --color-primary: #c96b8a;
  --color-accent: ${accentColour};
  --color-bg: #fdf6f8;
  --color-surface: #fff8f9;
  --color-text: #4a2c35;
  --color-muted: rgba(74,44,53,0.6);
  --border-radius: 20px;
}
body { background: #fdf6f8 !important; color: #4a2c35 !important; }
.nav { background: #fdf6f8 !important; border-bottom: 1px solid rgba(201,107,138,0.12) !important; }
.nav-logo, .nav-links a { color: #4a2c35 !important; }
.hero { background: #fdf6f8 !important; }
.hero-headline, .hero-badge { color: #4a2c35 !important; }
.hero-headline { font-style: italic; font-weight: 400 !important; }
.hero-sub { color: rgba(74,44,53,0.6) !important; }
.btn-primary { background: linear-gradient(135deg,#c96b8a,#e8a0b4) !important; color: #fff !important; }
.btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(201,107,138,0.3) !important; }
.btn-outline { border-color: #c96b8a !important; color: #c96b8a !important; }
.testimonials { background: #fff8f9 !important; }
.testimonials-heading { color: #4a2c35 !important; }
.testimonial-card { background: #fff !important; border-left-color: #c96b8a !important; }
.testimonial-text, .testimonial-name { color: #4a2c35 !important; }`;
  }

  if (t.includes('tech') || t.includes('mono') || t.includes('saas')) {
    return `:root {
  --font-heading: 'JetBrains Mono', monospace;
  --font-body: 'Inter', sans-serif;
  --color-primary: #238636;
  --color-accent: #58a6ff;
  --color-bg: #0a0f1e;
  --color-surface: #0d1117;
  --color-text: #e0e6f0;
  --color-muted: rgba(224,230,240,0.6);
  --border-radius: 4px;
}
body { background: #0a0f1e !important; color: #e0e6f0 !important; }
.nav { background: rgba(13,17,23,0.97) !important; }
.nav-logo { color: #58a6ff !important; letter-spacing: 2px; }
.nav-links a { color: rgba(224,230,240,0.7) !important; }
.hero { background: #0a0f1e !important; }
.hero-headline { color: #e0e6f0 !important; font-weight: 700 !important; }
.btn-primary { background: #238636 !important; border: 1px solid #2ea043 !important; color: #fff !important; }
.btn-primary:hover { background: #2ea043 !important; }
.announcement { background: #238636 !important; }
.testimonials { background: #0d1117 !important; }
.testimonial-card { background: #161b22 !important; border-left-color: #58a6ff !important; }`;
  }

  if (t.includes('coastal') || t.includes('editorial')) {
    return `:root {
  --font-heading: 'Cormorant Garamond', serif;
  --font-body: 'Lato', sans-serif;
  --color-primary: ${primaryColour};
  --color-accent: ${accentColour};
  --color-bg: #fafaf8;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-muted: rgba(26,26,26,0.55);
  --border-radius: 12px;
}
body { background: #fafaf8 !important; color: #1a1a1a !important; }
.nav { background: #fff !important; border-bottom: 1px solid rgba(0,0,0,0.07) !important; }
.nav-logo, .nav-links a { color: #1a1a1a !important; }
.hero { background: #fafaf8 !important; }
.hero-headline { color: #1a1a1a !important; font-style: italic; font-weight: 400 !important; }
.hero-sub { color: rgba(26,26,26,0.55) !important; }
.btn-primary { background: transparent !important; border: 2px solid #1a1a1a !important; color: #1a1a1a !important; }
.btn-primary:hover { background: #1a1a1a !important; color: #fff !important; }
.btn-outline { border-color: rgba(26,26,26,0.3) !important; color: rgba(26,26,26,0.6) !important; }
.announcement { background: #1a1a1a !important; }
.testimonials { background: #f4f4f0 !important; }
.testimonials-heading { color: #1a1a1a !important; }
.testimonial-card { background: #fff !important; border-left-color: ${primaryColour} !important; }
.testimonial-text, .testimonial-name { color: #1a1a1a !important; }`;
  }

  // Default dark DTC
  return `:root {
  --font-heading: '${headingFont}', sans-serif;
  --font-body: '${bodyFont}', sans-serif;
  --color-primary: ${primaryColour};
  --color-accent: ${accentColour};
  --color-bg: #080808;
  --color-surface: #111111;
  --color-text: #ffffff;
  --color-muted: rgba(255,255,255,0.6);
  --border-radius: 6px;
}`;
}

export function buildStoreHTML(plan: StorePlan): string {
  const {
    storeName, tagline, heroHeadline, heroSubheadline, heroCTA,
    productName, productDescription, productBullets, price, afterpayPrice,
    testimonials, faqItems, howItWorks,
    heroImageUrl, productImageUrl,
    primaryColour, accentColour, headingFontName, bodyFontName,
    template, niche, supportEmail,
  } = plan;

  const rgb = colorRgb(primaryColour);
  const templateCSS = getTemplateCSS(template, primaryColour, accentColour, headingFontName, bodyFontName);
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFontName).replace(/%20/g, '+')}:wght@300;400;600;700;900&family=${encodeURIComponent(bodyFontName).replace(/%20/g, '+')}:wght@300;400;500;600&display=swap`;

  const bullets = (productBullets || []).slice(0, 5).map(b =>
    `<li>${esc(b)}</li>`).join('\n      ');

  const testimonialCards = (testimonials || []).slice(0, 3).map(t => `
      <div class="testimonial-card">
        <div class="testimonial-stars">${stars(t.rating)}</div>
        <p class="testimonial-text">"${esc(t.text)}"</p>
        <div class="testimonial-name">${esc(t.name)}</div>
        <div class="testimonial-location">${esc(t.location)}</div>
        <div class="testimonial-verified">✓ Verified Purchase</div>
      </div>`).join('');

  const faqItems_ = (faqItems || []).slice(0, 4).map(f => `
      <div class="faq-item">
        <div class="faq-q">${esc(f.q)}</div>
        <div class="faq-a">${esc(f.a)}</div>
      </div>`).join('');

  const howSteps = (howItWorks || []).slice(0, 3).map(h => `
      <div class="how-step">
        <div class="how-number">${esc(h.step)}</div>
        <div class="how-title">${esc(h.title)}</div>
        <p class="how-desc">${esc(h.description)}</p>
      </div>`).join('');

  const onerror = `this.onerror=null;this.parentElement.style.background='linear-gradient(135deg,rgba(${rgb},0.25),#111)';this.style.display='none'`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(storeName)} — ${esc(tagline)}</title>
  <meta name="description" content="${esc(heroSubheadline)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">
  <style>
  ${templateCSS}

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: var(--font-body, 'DM Sans', sans-serif); background: var(--color-bg, #080808); color: var(--color-text, #fff); }
  img { max-width: 100%; height: auto; }
  a { text-decoration: none; }

  /* ANNOUNCEMENT BAR */
  .announcement { background: var(--color-primary); color: #fff; text-align: center; padding: 12px; font-size: 13px; letter-spacing: 1px; font-weight: 600; }

  /* NAV */
  .nav { position: sticky; top: 0; z-index: 999; background: rgba(10,10,10,0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 0 60px; height: 70px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .nav-logo { font-family: var(--font-heading, 'Syne', sans-serif); font-size: 20px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #fff; }
  .nav-links { display: flex; gap: 32px; }
  .nav-links a { color: rgba(255,255,255,0.7); font-size: 14px; letter-spacing: 1px; transition: color 0.2s; }
  .nav-links a:hover { color: #fff; }
  .nav-cta { background: var(--color-primary); color: #fff; padding: 10px 24px; border: none; cursor: pointer; font-size: 13px; letter-spacing: 1px; border-radius: var(--border-radius, 6px); font-family: var(--font-body, sans-serif); }

  /* HERO */
  .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; background: var(--color-bg, #080808); }
  .hero-content { padding: 120px 60px; display: flex; flex-direction: column; justify-content: center; }
  .hero-badge { color: var(--color-accent, #d4af37); font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px; font-weight: 700; }
  .hero-headline { font-family: var(--font-heading, 'Syne', sans-serif); font-size: clamp(36px,5vw,68px); font-weight: 700; color: #fff; line-height: 1.1; margin-bottom: 20px; }
  .hero-sub { color: rgba(255,255,255,0.65); font-size: 18px; line-height: 1.65; margin-bottom: 40px; max-width: 480px; }
  .hero-buttons { display: flex; gap: 16px; flex-wrap: wrap; }
  .btn-primary { background: var(--color-primary); color: #fff; padding: 18px 40px; border: none; cursor: pointer; font-size: 15px; letter-spacing: 1px; border-radius: var(--border-radius, 6px); font-family: var(--font-body, sans-serif); transition: opacity 0.2s; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-outline { background: transparent; color: #fff; padding: 18px 40px; border: 2px solid rgba(255,255,255,0.3); cursor: pointer; font-size: 15px; letter-spacing: 1px; border-radius: var(--border-radius, 6px); font-family: var(--font-body, sans-serif); transition: border-color 0.2s; }
  .btn-outline:hover { border-color: #fff; }
  .hero-image { overflow: hidden; }
  .hero-image img { width: 100%; height: 100vh; object-fit: cover; }

  /* TRUST BADGES */
  .trust { background: #fff; padding: 40px 60px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .trust-item { text-align: center; padding: 20px; border-right: 1px solid #eee; }
  .trust-item:last-child { border-right: none; }
  .trust-icon { font-size: 28px; margin-bottom: 8px; }
  .trust-title { font-weight: 700; font-size: 14px; color: #1a1a1a; margin-bottom: 4px; }
  .trust-sub { font-size: 12px; color: #666; }

  /* PRODUCT */
  .product { background: #f5f5f5; padding: 100px 60px; }
  .product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; max-width: 1200px; margin: 0 auto; }
  .product-image img { width: 100%; border-radius: 12px; object-fit: cover; aspect-ratio: 1; }
  .product-info { padding: 20px 0; }
  .product-name { font-family: var(--font-heading, 'Syne', sans-serif); font-size: 36px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px; }
  .product-stars { color: var(--color-accent, #d4af37); font-size: 18px; margin-bottom: 8px; }
  .product-reviews { color: #666; font-size: 14px; }
  .product-price { font-family: var(--font-heading, 'Syne', sans-serif); font-size: 48px; font-weight: 700; color: var(--color-primary); margin: 16px 0 4px; }
  .product-afterpay { color: #666; font-size: 14px; margin-bottom: 24px; }
  .product-bullets { list-style: none; margin-bottom: 24px; }
  .product-bullets li { padding: 8px 0; color: #333; font-size: 15px; display: flex; align-items: flex-start; gap: 8px; border-bottom: 1px solid #eee; }
  .product-bullets li::before { content: "✓"; color: var(--color-primary); font-weight: 700; flex-shrink: 0; }
  .product-bullets li:last-child { border-bottom: none; }
  .product-urgency { color: #e74c3c; font-size: 13px; font-weight: 700; margin: 16px 0 8px; }
  .btn-cart { width: 100%; background: var(--color-primary); color: #fff; padding: 20px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; letter-spacing: 1px; border-radius: var(--border-radius, 6px); margin-bottom: 12px; font-family: var(--font-body, sans-serif); }
  .btn-buynow { width: 100%; background: #1a1a1a; color: #fff; padding: 20px; border: none; cursor: pointer; font-size: 15px; letter-spacing: 1px; border-radius: var(--border-radius, 6px); font-family: var(--font-body, sans-serif); }

  /* STATS */
  .stats { background: var(--color-primary); padding: 60px; display: grid; grid-template-columns: repeat(4, 1fr); }
  .stat { text-align: center; color: #fff; padding: 20px; border-right: 1px solid rgba(255,255,255,0.2); }
  .stat:last-child { border-right: none; }
  .stat-number { font-family: var(--font-heading, 'Syne', sans-serif); font-size: 48px; font-weight: 700; margin-bottom: 8px; }
  .stat-label { font-size: 14px; opacity: 0.85; letter-spacing: 1px; }

  /* TESTIMONIALS */
  .testimonials { background: #0a0a0a; padding: 100px 60px; }
  .testimonials-header { text-align: center; margin-bottom: 60px; }
  .testimonials-label { color: var(--color-accent, #d4af37); font-size: 11px; letter-spacing: 4px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
  .testimonials-heading { font-family: var(--font-heading, 'Syne', sans-serif); font-size: clamp(26px,3vw,40px); font-weight: 700; color: #fff; }
  .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
  .testimonial-card { background: #141414; border-left: 4px solid var(--color-accent, #d4af37); border-radius: 8px; padding: 32px; }
  .testimonial-stars { color: var(--color-accent, #d4af37); font-size: 18px; margin-bottom: 16px; }
  .testimonial-text { color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.7; font-style: italic; margin-bottom: 20px; }
  .testimonial-name { color: #fff; font-weight: 600; font-size: 14px; }
  .testimonial-location { color: rgba(255,255,255,0.4); font-size: 13px; }
  .testimonial-verified { color: #27ae60; font-size: 12px; margin-top: 4px; font-weight: 600; }

  /* HOW IT WORKS */
  .how { background: #f5f5f5; padding: 100px 60px; }
  .how-header { text-align: center; margin-bottom: 60px; }
  .how-label { color: var(--color-primary); font-size: 11px; letter-spacing: 4px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
  .how-heading { font-family: var(--font-heading, 'Syne', sans-serif); font-size: clamp(26px,3vw,42px); font-weight: 700; color: #1a1a1a; }
  .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; max-width: 1000px; margin: 0 auto; }
  .how-step { text-align: center; padding: 20px; }
  .how-number { font-family: var(--font-heading, 'Syne', sans-serif); font-size: 72px; font-weight: 900; color: var(--color-primary); opacity: 0.2; line-height: 1; margin-bottom: 8px; }
  .how-title { font-family: var(--font-heading, 'Syne', sans-serif); font-weight: 700; font-size: 18px; color: #1a1a1a; margin-bottom: 12px; }
  .how-desc { color: #555; font-size: 15px; line-height: 1.6; }

  /* FAQ */
  .faq { background: #fff; padding: 100px 60px; }
  .faq-inner { max-width: 800px; margin: 0 auto; }
  .faq-heading { text-align: center; font-family: var(--font-heading, 'Syne', sans-serif); font-size: clamp(26px,3vw,38px); font-weight: 700; color: #1a1a1a; margin-bottom: 60px; }
  .faq-item { border-bottom: 1px solid #eee; padding: 24px 0; }
  .faq-q { font-family: var(--font-heading, 'Syne', sans-serif); font-weight: 700; font-size: 16px; color: #1a1a1a; margin-bottom: 12px; }
  .faq-a { color: #555; font-size: 15px; line-height: 1.7; }

  /* FOOTER */
  .footer { background: #080808; color: #fff; padding: 80px 60px 40px; }
  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-bottom: 60px; max-width: 1200px; margin-left: auto; margin-right: auto; }
  .footer-brand { font-family: var(--font-heading, 'Syne', sans-serif); font-size: 22px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; color: #fff; }
  .footer-tagline { color: rgba(255,255,255,0.4); font-size: 14px; line-height: 1.65; margin-bottom: 24px; max-width: 300px; }
  .footer-heading { font-weight: 700; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 20px; color: rgba(255,255,255,0.3); }
  .footer-links { list-style: none; }
  .footer-links li { margin-bottom: 12px; }
  .footer-links a { color: rgba(255,255,255,0.5); font-size: 14px; transition: color 0.2s; }
  .footer-links a:hover { color: #fff; }
  .footer-bottom { border-top: 1px solid rgba(255,255,255,0.07); padding-top: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; max-width: 1200px; margin: 0 auto; }
  .footer-copy { color: rgba(255,255,255,0.3); font-size: 13px; }
  .footer-au { color: var(--color-accent, #d4af37); font-size: 13px; }

  /* MOBILE */
  @media (max-width: 768px) {
    .nav { padding: 0 20px; }
    .nav-links { display: none; }
    .hero { grid-template-columns: 1fr; }
    .hero-content { padding: 60px 24px; order: 2; }
    .hero-image { order: 1; height: 50vh; }
    .hero-image img { height: 50vh; }
    .hero-headline { font-size: 36px !important; }
    .trust { grid-template-columns: repeat(2, 1fr); padding: 40px 24px; }
    .product { padding: 60px 24px; }
    .product-grid { grid-template-columns: 1fr; gap: 40px; }
    .stats { grid-template-columns: repeat(2, 1fr); padding: 40px 24px; }
    .testimonials { padding: 60px 24px; }
    .testimonials-grid { grid-template-columns: 1fr; }
    .how { padding: 60px 24px; }
    .how-grid { grid-template-columns: 1fr; }
    .faq { padding: 60px 24px; }
    .footer { padding: 60px 24px 40px; }
    .footer-grid { grid-template-columns: 1fr; gap: 40px; }
    .footer-bottom { flex-direction: column; text-align: center; }
  }
  </style>
</head>
<body>

  <!-- ANNOUNCEMENT BAR -->
  <div class="announcement">
    🚚 Free Shipping on AU Orders Over $75 &nbsp;|&nbsp; Afterpay Available &nbsp;|&nbsp; 30-Day Returns
  </div>

  <!-- NAV -->
  <nav class="nav">
    <div class="nav-logo">${esc(storeName)}</div>
    <div class="nav-links">
      <a href="#">Home</a>
      <a href="#">Shop</a>
      <a href="#">About</a>
      <a href="#">Contact</a>
    </div>
    <button class="nav-cta">${esc(heroCTA || 'Shop Now')}</button>
  </nav>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-content">
      <div class="hero-badge">🇦🇺 Proudly Australian</div>
      <h1 class="hero-headline">${esc(heroHeadline)}</h1>
      <p class="hero-sub">${esc(heroSubheadline)}</p>
      <div class="hero-buttons">
        <button class="btn-primary">${esc(heroCTA || 'Shop Now')}</button>
        <button class="btn-outline">Learn More</button>
      </div>
    </div>
    <div class="hero-image">
      <img src="${heroImageUrl}" alt="${esc(storeName)}" onerror="${onerror}">
    </div>
  </section>

  <!-- TRUST BADGES -->
  <section class="trust">
    <div class="trust-item">
      <div class="trust-icon">🚚</div>
      <div class="trust-title">Free AU Shipping</div>
      <div class="trust-sub">Orders over $75</div>
    </div>
    <div class="trust-item">
      <div class="trust-icon">⭐</div>
      <div class="trust-title">4.9/5 Stars</div>
      <div class="trust-sub">2,400+ verified reviews</div>
    </div>
    <div class="trust-item">
      <div class="trust-icon">🔄</div>
      <div class="trust-title">30-Day Returns</div>
      <div class="trust-sub">No questions asked</div>
    </div>
    <div class="trust-item">
      <div class="trust-icon">🔒</div>
      <div class="trust-title">Secure Checkout</div>
      <div class="trust-sub">Afterpay &amp; all cards</div>
    </div>
  </section>

  <!-- FEATURED PRODUCT -->
  <section class="product">
    <div style="text-align:center;margin-bottom:48px">
      <div style="color:var(--color-primary);font-size:11px;letter-spacing:4px;font-weight:700;text-transform:uppercase;margin-bottom:10px">FEATURED PRODUCT</div>
    </div>
    <div class="product-grid">
      <div class="product-image">
        <img src="${productImageUrl}" alt="${esc(productName)}" onerror="${onerror}">
      </div>
      <div class="product-info">
        <h2 class="product-name">${esc(productName)}</h2>
        <div class="product-stars">★★★★★</div>
        <div class="product-reviews">487 verified reviews</div>
        <div class="product-price">$${price} <span style="font-size:22px;font-weight:400">AUD</span></div>
        <div class="product-afterpay">or 4 × <strong>$${afterpayPrice}</strong> with Afterpay</div>
        <p style="font-size:15px;line-height:1.65;color:#555;margin-bottom:20px">${esc(productDescription)}</p>
        <ul class="product-bullets">
          ${bullets}
        </ul>
        <div class="product-urgency">⚡ Only 7 left in stock — order soon</div>
        <button class="btn-cart">ADD TO CART</button>
        <button class="btn-buynow">BUY NOW WITH AFTERPAY</button>
      </div>
    </div>
  </section>

  <!-- STATS BAR -->
  <section class="stats">
    <div class="stat">
      <div class="stat-number">2,400+</div>
      <div class="stat-label">Happy Customers</div>
    </div>
    <div class="stat">
      <div class="stat-number">4.9/5</div>
      <div class="stat-label">Average Rating</div>
    </div>
    <div class="stat">
      <div class="stat-number">3-5 Days</div>
      <div class="stat-label">AU Delivery</div>
    </div>
    <div class="stat">
      <div class="stat-number">30 Days</div>
      <div class="stat-label">Free Returns</div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section class="testimonials">
    <div class="testimonials-header">
      <div class="testimonials-label">WHAT AUSTRALIANS SAY</div>
      <h2 class="testimonials-heading">Real Reviews From Real Customers</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialCards}
    </div>
  </section>

  <!-- HOW IT WORKS -->
  <section class="how">
    <div class="how-header">
      <div class="how-label">HOW IT WORKS</div>
      <h2 class="how-heading">Simple. Fast. Reliable.</h2>
    </div>
    <div class="how-grid">
      ${howSteps}
    </div>
  </section>

  <!-- FAQ -->
  <section class="faq">
    <div class="faq-inner">
      <h2 class="faq-heading">Frequently Asked Questions</h2>
      ${faqItems_}
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">${esc(storeName)}</div>
        <p class="footer-tagline">${esc(tagline)}</p>
      </div>
      <div>
        <div class="footer-heading">Quick Links</div>
        <ul class="footer-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">Shop</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#">FAQ</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-heading">Get In Touch</div>
        <a href="mailto:${esc(supportEmail)}" style="display:block;color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:8px">${esc(supportEmail)}</a>
        <div style="color:rgba(255,255,255,0.3);font-size:13px">Mon–Fri 9am–5pm AEST</div>
        <div style="color:rgba(255,255,255,0.2);font-size:12px;margin-top:12px">ABN: 12 345 678 901</div>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="footer-copy">© 2026 ${esc(storeName)}. All rights reserved.</span>
      <span class="footer-au">Proudly Australian 🇦🇺</span>
    </div>
  </footer>

</body>
</html>`;
}
