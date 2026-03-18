import type { StorePlan } from './website-api';

function esc(s: string): string {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function stars(n = 5): string {
  return '\u2605'.repeat(Math.min(5, Math.max(0, n)));
}

function colorRgb(hex: string): string {
  const c = (hex || '#d4af37').replace('#','');
  return `${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)}`;
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

  const t = (template || '').toLowerCase();
  const rgb = colorRgb(primaryColour);

  // Template-driven CSS vars
  const isLuxury = t.includes('luxury');
  const isBloomy = t.includes('bloom') || t.includes('beauty') || t.includes('minimal');
  const isTech = t.includes('tech') || t.includes('mono') || t.includes('saas');
  const isCoastal = t.includes('coastal') || t.includes('editorial');

  let bgColor = '#080808';
  let surfaceColor = '#111111';
  let textColor = '#ffffff';
  let mutedColor = 'rgba(255,255,255,0.6)';
  let sectionBg = '#f7f7f7';
  let sectionText = '#0a0a0a';
  let cardBg = '#111118';
  let cardBorder = `4px solid ${primaryColour}`;
  let btnStyle = `background:${primaryColour};color:#fff;border:none`;
  let btnOutlineStyle = `background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.3)`;
  let h1Weight = '900';
  let h1Italic = '';
  let navBg = 'rgba(8,8,8,0.96)';
  let navTextColor = '#ffffff';
  let announceBg = primaryColour;
  let announceText = '#ffffff';

  if (isLuxury) {
    bgColor = '#0a0806'; surfaceColor = '#120f0a'; textColor = '#f5f0e8';
    mutedColor = 'rgba(245,240,232,0.5)'; sectionBg = '#0d0a07'; sectionText = '#f5f0e8';
    cardBg = '#120f0a'; cardBorder = `1px solid rgba(${rgb},0.2)`;
    btnStyle = `background:transparent;color:${primaryColour};border:1px solid rgba(${rgb},0.5)`;
    btnOutlineStyle = `background:transparent;color:rgba(245,240,232,0.6);border:1px solid rgba(245,240,232,0.2)`;
    h1Weight = '300';
    announceBg = `rgba(${rgb},0.08)`; announceText = `rgba(245,240,232,0.5)`;
    navBg = 'rgba(10,8,6,0.97)'; navTextColor = '#f5f0e8';
  } else if (isBloomy) {
    bgColor = '#fdf6f8'; surfaceColor = '#fff8f9'; textColor = '#4a2c35';
    mutedColor = 'rgba(74,44,53,0.6)'; sectionBg = '#fff'; sectionText = '#4a2c35';
    cardBg = '#fff'; cardBorder = `1px solid rgba(201,107,138,0.15)`;
    btnStyle = `background:linear-gradient(135deg,#c96b8a,#e8a0b4);color:#fff;border:none`;
    btnOutlineStyle = `background:transparent;color:#c96b8a;border:2px solid #c96b8a`;
    h1Weight = '400'; h1Italic = 'font-style:italic;';
    navBg = '#fdf6f8'; navTextColor = '#4a2c35';
    announceBg = '#c96b8a'; announceText = '#fff';
  } else if (isTech) {
    bgColor = '#0a0f1e'; surfaceColor = '#0d1117'; textColor = '#e0e6f0';
    mutedColor = 'rgba(224,230,240,0.6)'; sectionBg = '#0d1117'; sectionText = '#e0e6f0';
    cardBg = '#161b22'; cardBorder = '1px solid #30363d';
    btnStyle = 'background:#238636;color:#fff;border:1px solid #2ea043';
    btnOutlineStyle = 'background:transparent;color:#58a6ff;border:1px solid #58a6ff';
    h1Weight = '700';
    navBg = 'rgba(13,17,23,0.97)'; navTextColor = '#e0e6f0';
    announceBg = '#238636'; announceText = '#fff';
  } else if (isCoastal) {
    bgColor = '#fafaf8'; surfaceColor = '#ffffff'; textColor = '#1a1a1a';
    mutedColor = 'rgba(26,26,26,0.55)'; sectionBg = '#f4f4f0'; sectionText = '#1a1a1a';
    cardBg = '#ffffff'; cardBorder = '1px solid rgba(0,0,0,0.08)';
    btnStyle = 'background:transparent;color:#1a1a1a;border:2px solid #1a1a1a';
    btnOutlineStyle = 'background:transparent;color:rgba(26,26,26,0.55);border:2px solid rgba(26,26,26,0.2)';
    h1Weight = '400'; h1Italic = 'font-style:italic;';
    navBg = '#fff'; navTextColor = '#1a1a1a';
    announceBg = '#1a1a1a'; announceText = '#fff';
  }

  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFontName).replace(/%20/g,'+')}:wght@300;400;600;700;900&family=${encodeURIComponent(bodyFontName).replace(/%20/g,'+')}:wght@300;400;500;600&display=swap`;

  // Determine contrast color for text on section backgrounds
  const sectionBorderColor = (sectionText === '#ffffff' || sectionText === '#f5f0e8' || sectionText === '#e0e6f0') ? '255,255,255' : '0,0,0';

  const bulletRows = (productBullets || []).slice(0, 5).map(b => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(${sectionBorderColor},0.08)">
          <span style="color:${primaryColour};font-size:18px;font-weight:900;line-height:1.4;flex-shrink:0">\u2713</span>
          <span style="font-size:15px;line-height:1.55;color:${sectionText}">${esc(b)}</span>
        </div>`).join('');

  const testimonialCards = (testimonials || []).slice(0, 3).map(ti => `
        <div style="background:${cardBg};border-radius:14px;padding:32px;border-left:${cardBorder};box-shadow:0 2px 20px rgba(0,0,0,0.12)">
          <div style="color:${accentColour};font-size:20px;margin-bottom:14px">${stars(ti.rating)}</div>
          <p style="color:${textColor};font-size:16px;line-height:1.65;font-style:italic;margin-bottom:20px;opacity:0.9">"${esc(ti.text)}"</p>
          <div style="font-weight:700;color:${textColor};font-size:15px">${esc(ti.name)}</div>
          <div style="color:${primaryColour};font-size:13px;margin-top:3px">${esc(ti.location)}</div>
          <div style="color:#27ae60;font-size:11px;margin-top:6px;font-weight:600">\u2713 Verified Purchase</div>
        </div>`).join('');

  const faqBorderColor = (sectionText === '#1a1a1a' || sectionText === '#0a0a0a' || sectionText === '#4a2c35') ? '0,0,0' : '255,255,255';

  const faqRows = (faqItems || []).slice(0, 4).map(f => `
        <div style="border-bottom:1px solid rgba(${faqBorderColor},0.1);padding:28px 0">
          <h3 style="font-family:'${headingFontName}',sans-serif;font-size:18px;font-weight:700;color:${textColor};margin-bottom:12px">${esc(f.q)}</h3>
          <p style="font-size:15px;color:${mutedColor};line-height:1.65">${esc(f.a)}</p>
        </div>`).join('');

  const howSteps = (howItWorks || []).slice(0, 3).map(h => `
        <div style="text-align:center;padding:20px">
          <div style="font-family:'${headingFontName}',sans-serif;font-size:72px;font-weight:900;color:${primaryColour};opacity:0.2;line-height:1;margin-bottom:16px">${esc(h.step)}</div>
          <h3 style="font-family:'${headingFontName}',sans-serif;font-size:20px;font-weight:800;color:${sectionText};margin-bottom:12px">${esc(h.title)}</h3>
          <p style="font-size:15px;color:${mutedColor};line-height:1.6;max-width:280px;margin:0 auto">${esc(h.description)}</p>
        </div>`).join('');

  const imgOnError = `this.onerror=null;this.parentElement.style.background='linear-gradient(135deg,rgba(${rgb},0.25),${surfaceColor})';this.style.display='none'`;

  const navLinks = ['Home','Shop','About','Contact'].map(l =>
    `<a href="#" style="font-size:14px;color:${navTextColor};opacity:0.7;letter-spacing:1px;transition:opacity .2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">${l}</a>`
  ).join('');

  const trustBadges = [
    ['\ud83d\ude9a', 'Free AU Shipping', 'Orders over $75'],
    ['\u2b50', '4.9/5 Stars', '2,400+ verified reviews'],
    ['\ud83d\udd04', '30-Day Returns', 'No questions asked'],
    ['\ud83d\udd12', 'Secure Checkout', 'Afterpay & all cards'],
  ].map((b, i) => `
    <div style="padding:20px 16px${i < 3 ? ';border-right:1px solid #eee' : ''}">
      <div style="font-size:28px;margin-bottom:10px">${b[0]}</div>
      <div style="font-weight:700;font-size:14px;color:#111;margin-bottom:4px">${b[1]}</div>
      <div style="font-size:12px;color:#888">${b[2]}</div>
    </div>`).join('');

  const statsItems = [['2,400+','Happy Customers'],['4.9/5','Average Rating'],['3-5 Days','AU Delivery'],['30 Days','Free Returns']].map(s => `
    <div>
      <div style="font-family:'${headingFontName}',sans-serif;font-size:clamp(32px,4vw,48px);font-weight:900;color:#fff">${s[0]}</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:6px;letter-spacing:1px">${s[1]}</div>
    </div>`).join('');

  const footerLinks = ['Home','Shop','About','Contact','FAQ'].map(l =>
    `<a href="#" style="display:block;color:rgba(255,255,255,0.5);padding:7px 0;font-size:14px;transition:color .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.5)'">${l}</a>`
  ).join('');

  const socialIcons = ['FB','IG','TT'].map(s =>
    `<div style="width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;cursor:pointer">${s}</div>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(storeName)} \u2014 ${esc(niche)} for Australia</title>
<meta name="description" content="${esc(tagline)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${googleFontsUrl}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:${bgColor};color:${textColor};font-family:'${bodyFontName}',sans-serif;line-height:1.6;overflow-x:hidden}
img{max-width:100%;display:block}
a{text-decoration:none;color:inherit}
button,a.btn{font-family:'${bodyFontName}',sans-serif;cursor:pointer;transition:all .2s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.fade-up{animation:fadeUp .6s ease both}
@media(max-width:768px){
  .hero-grid{grid-template-columns:1fr!important}
  .hero-img-col{display:none!important}
  .product-grid{grid-template-columns:1fr!important}
  .trust-grid{grid-template-columns:1fr 1fr!important}
  .testimonials-grid{grid-template-columns:1fr!important}
  .how-grid{grid-template-columns:1fr!important}
  .stats-grid{grid-template-columns:1fr 1fr!important}
  .footer-grid{grid-template-columns:1fr!important;gap:32px!important}
  .desktop-nav{display:none!important}
  .hero-left{padding:80px 24px 48px!important}
  .section-pad{padding:60px 24px!important}
  .product-right{padding:32px 24px!important}
  .faq-inner{padding:60px 24px!important}
  h1{font-size:clamp(32px,8vw,52px)!important}
}
</style>
</head>
<body>

<!-- ANNOUNCEMENT BAR -->
<div style="background:${announceBg};color:${announceText};padding:11px 24px;text-align:center;font-size:13px;letter-spacing:1px;font-weight:600;position:relative;z-index:1001">
  \ud83d\ude9a Free Shipping on AU Orders Over $75 &nbsp;|&nbsp; Afterpay Available &nbsp;|&nbsp; 30-Day Returns
</div>

<!-- NAVIGATION -->
<nav style="position:sticky;top:0;z-index:1000;background:${navBg};backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(128,128,128,0.1);height:70px;padding:0 60px;display:flex;align-items:center;justify-content:space-between">
  <a href="#" style="font-family:'${headingFontName}',sans-serif;font-size:20px;font-weight:900;color:${navTextColor};letter-spacing:3px;text-transform:uppercase">${esc(storeName)}</a>
  <div class="desktop-nav" style="display:flex;gap:36px">
    ${navLinks}
  </div>
  <button style="${btnStyle};padding:11px 28px;border-radius:6px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:'${headingFontName}',sans-serif">
    ${esc(heroCTA || 'Shop Now')}
  </button>
</nav>

<!-- HERO -->
<section style="background:${bgColor};min-height:100vh;display:grid;grid-template-columns:1fr 1fr;align-items:center" class="hero-grid">
  <div class="hero-left" style="padding:100px 60px 80px">
    <div style="display:inline-block;background:rgba(${rgb},0.12);color:${primaryColour};font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;padding:6px 14px;border-radius:4px;margin-bottom:24px">
      \ud83c\udde6\ud83c\uddfa PROUDLY AUSTRALIAN
    </div>
    <h1 style="font-family:'${headingFontName}',sans-serif;font-size:clamp(38px,4.5vw,68px);font-weight:${h1Weight};${h1Italic}color:${textColor};line-height:1.08;letter-spacing:-1px;margin-bottom:24px">
      ${esc(heroHeadline)}
    </h1>
    <p style="font-size:18px;color:${mutedColor};line-height:1.65;margin-bottom:40px;max-width:480px">
      ${esc(heroSubheadline)}
    </p>
    <div style="display:flex;gap:14px;flex-wrap:wrap">
      <button style="${btnStyle};padding:16px 36px;border-radius:6px;font-size:15px;font-weight:800;letter-spacing:1px;font-family:'${headingFontName}',sans-serif">
        ${esc(heroCTA || 'Shop Now')}
      </button>
      <button style="${btnOutlineStyle};padding:16px 36px;border-radius:6px;font-size:15px;font-weight:600;font-family:'${headingFontName}',sans-serif">
        Learn More
      </button>
    </div>
  </div>
  <div class="hero-img-col" style="height:100vh;overflow:hidden">
    <img src="${heroImageUrl}" alt="${esc(storeName)}" style="width:100%;height:100%;object-fit:cover" onerror="${imgOnError}">
  </div>
</section>

<!-- TRUST BADGES -->
<div style="background:#ffffff;border-bottom:1px solid #f0f0f0;padding:32px 60px" class="section-pad">
  <div class="trust-grid" style="display:grid;grid-template-columns:repeat(4,1fr);text-align:center">
    ${trustBadges}
  </div>
</div>

<!-- FEATURED PRODUCT -->
<section style="background:${sectionBg};padding:100px 60px" class="section-pad">
  <div style="text-align:center;margin-bottom:56px">
    <div style="color:${primaryColour};font-size:11px;letter-spacing:4px;font-weight:700;text-transform:uppercase;margin-bottom:10px">FEATURED PRODUCT</div>
    <h2 style="font-family:'${headingFontName}',sans-serif;font-size:clamp(28px,3.5vw,44px);font-weight:900;color:${sectionText}">${esc(productName)}</h2>
  </div>
  <div class="product-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:flex-start;max-width:1200px;margin:0 auto">
    <div style="border-radius:14px;overflow:hidden;position:relative;min-height:400px;background:${surfaceColor}">
      <img src="${productImageUrl}" alt="${esc(productName)}" style="width:100%;border-radius:14px;object-fit:cover;max-height:560px" onerror="${imgOnError}">
    </div>
    <div class="product-right" style="padding:8px 0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="color:${accentColour};font-size:20px">${stars(5)}</span>
        <span style="color:${mutedColor};font-size:14px">(487 verified reviews)</span>
      </div>
      <div style="font-family:'${headingFontName}',sans-serif;font-size:48px;font-weight:900;color:${primaryColour};margin-bottom:8px">$${price} <span style="font-size:22px;font-weight:400">AUD</span></div>
      <div style="background:rgba(0,0,0,0.05);border-radius:6px;padding:8px 14px;display:inline-block;margin-bottom:24px;font-size:14px;color:${mutedColor}">
        or 4 \u00d7 <strong>$${afterpayPrice}</strong> with Afterpay
      </div>
      <div style="border-top:1px solid rgba(128,128,128,0.15);padding-top:20px;margin-bottom:4px">
        <p style="font-size:15px;line-height:1.65;color:${mutedColor};margin-bottom:20px">${esc(productDescription)}</p>
        ${bulletRows}
      </div>
      <div style="color:#e74c3c;font-size:13px;font-weight:700;margin:18px 0 8px">\u26a1 Only 7 left in stock \u2014 order soon</div>
      <button style="${btnStyle};width:100%;padding:18px;font-size:15px;letter-spacing:2px;text-transform:uppercase;font-weight:800;border-radius:8px;margin-top:16px;font-family:'${headingFontName}',sans-serif">
        ADD TO CART
      </button>
      <button style="background:#0a0a0a;color:#fff;border:none;width:100%;padding:18px;font-size:14px;letter-spacing:1px;font-weight:700;border-radius:8px;margin-top:10px;cursor:pointer;font-family:'${headingFontName}',sans-serif">
        BUY NOW WITH AFTERPAY
      </button>
    </div>
  </div>
</section>

<!-- STATS BAR -->
<section style="background:${primaryColour};padding:60px" class="section-pad">
  <div class="stats-grid" style="display:grid;grid-template-columns:repeat(4,1fr);text-align:center;max-width:1000px;margin:0 auto">
    ${statsItems}
  </div>
</section>

<!-- TESTIMONIALS -->
<section style="background:${bgColor};padding:100px 60px" class="section-pad">
  <div style="text-align:center;margin-bottom:56px">
    <div style="color:${primaryColour};font-size:11px;letter-spacing:4px;font-weight:700;text-transform:uppercase;margin-bottom:10px">WHAT AUSTRALIANS SAY</div>
    <h2 style="font-family:'${headingFontName}',sans-serif;font-size:clamp(26px,3vw,40px);font-weight:900;color:${textColor}">Real Reviews From Real Customers</h2>
  </div>
  <div class="testimonials-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1100px;margin:0 auto">
    ${testimonialCards}
  </div>
</section>

<!-- HOW IT WORKS -->
<section style="background:${sectionBg};padding:100px 60px" class="section-pad">
  <div style="text-align:center;margin-bottom:56px">
    <div style="color:${primaryColour};font-size:11px;letter-spacing:4px;font-weight:700;text-transform:uppercase;margin-bottom:10px">HOW IT WORKS</div>
    <h2 style="font-family:'${headingFontName}',sans-serif;font-size:clamp(26px,3vw,42px);font-weight:900;color:${sectionText}">Simple. Fast. Reliable.</h2>
  </div>
  <div class="how-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px;max-width:900px;margin:0 auto">
    ${howSteps}
  </div>
</section>

<!-- FAQ -->
<section style="background:${bgColor};padding:100px 60px" class="section-pad">
  <div class="faq-inner" style="max-width:760px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:'${headingFontName}',sans-serif;font-size:clamp(26px,3vw,38px);font-weight:900;color:${textColor}">Frequently Asked Questions</h2>
    </div>
    ${faqRows}
  </div>
</section>

<!-- FOOTER -->
<footer style="background:#080808;padding:80px 60px 40px" class="section-pad">
  <div class="footer-grid" style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:48px;max-width:1200px;margin:0 auto">
    <div>
      <div style="font-family:'${headingFontName}',sans-serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px">${esc(storeName)}</div>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;line-height:1.65;margin-bottom:24px;max-width:300px">${esc(tagline)}</p>
      <div style="display:flex;gap:10px">
        ${socialIcons}
      </div>
    </div>
    <div>
      <div style="color:rgba(255,255,255,0.3);font-size:11px;letter-spacing:4px;font-weight:700;margin-bottom:20px;text-transform:uppercase">Quick Links</div>
      ${footerLinks}
    </div>
    <div>
      <div style="color:rgba(255,255,255,0.3);font-size:11px;letter-spacing:4px;font-weight:700;margin-bottom:20px;text-transform:uppercase">Get In Touch</div>
      <a href="mailto:${esc(supportEmail)}" style="display:block;color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:8px">${esc(supportEmail)}</a>
      <div style="color:rgba(255,255,255,0.3);font-size:13px">Mon\u2013Fri 9am\u20135pm AEST</div>
      <div style="color:rgba(255,255,255,0.2);font-size:12px;margin-top:16px">ABN: 12 345 678 901</div>
    </div>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,0.07);margin-top:60px;padding-top:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <span style="color:rgba(255,255,255,0.3);font-size:13px">\u00a9 2026 ${esc(storeName)}. All rights reserved.</span>
    <span style="color:rgba(255,255,255,0.3);font-size:13px">Proudly Australian \ud83c\udde6\ud83c\uddfa</span>
  </div>
</footer>

</body>
</html>`;
}
