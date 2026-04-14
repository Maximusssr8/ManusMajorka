// ── Website Templates Library ─────────────────────────────────────────────
// 3 premium, self-contained HTML templates for the Website Generator.
// Placeholders: {BRAND_NAME}, {BRAND_COLOR}, {PRODUCT_NAME}, {NICHE},
//   {TAGLINE}, {PRICE}, {HEADLINE}, {SUBHEADLINE}, {PRODUCT_DESC},
//   {CTA_TEXT}, {BRAND_STORY}, {TESTIMONIAL_1}, {TESTIMONIAL_2},
//   {TESTIMONIAL_3}, {FEATURES_HTML}, {BRAND_SLUG}

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'bold' | 'premium' | 'lifestyle' | 'tech' | 'beauty';
  palette: { bg: string; accent: string; text: string };
  bestFor?: string;
  emoji?: string;
  html: string;
}

const tplA: WebsiteTemplate = {
  id: 'dtc-minimal',
  name: 'DTC Minimal',
  description: 'Conversion-focused single product. Dark OLED, gold accents, maximum clarity.',
  category: 'minimal',
  palette: { bg: '#FAFAFA', accent: '#d4af37', text: '#f2efe9' },
  emoji: '⚡',
  bestFor: 'Any niche — universal DTC',
  html: '<!DOCTYPE html>\n<html lang="en-AU">\n<head>\n<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>{BRAND_NAME} — {TAGLINE}</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\n:root{--accent:{BRAND_COLOR};--bg:#080a0e;--surface:#0d1018;--card:#111720;--text:#f2efe9;--muted:rgba(242,239,233,0.5);--border:rgba(242,239,233,0.08)}\nhtml{scroll-behavior:smooth}body{background:var(--bg);color:var(--text);font-family:\'DM Sans\',system-ui,sans-serif;line-height:1.6;overflow-x:hidden}\na{text-decoration:none;color:inherit}button{cursor:pointer;font-family:inherit;border:none}\n.nav{position:sticky;top:0;z-index:100;background:rgba(8,10,14,0.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);height:64px;display:flex;align-items:center;padding:0 5%;gap:20px}\n.nl{font-family:\'Syne\',sans-serif;font-size:18px;font-weight:900;letter-spacing:-0.5px;flex-shrink:0;cursor:pointer}\n.nv{display:flex;gap:28px;list-style:none;flex:1;justify-content:center}\n.nv a{font-size:13px;font-weight:500;color:var(--muted);transition:color 200ms ease}\n.nv a:hover{color:var(--text)}\n.nc{padding:10px 22px;background:var(--accent);color:#080a0e;border-radius:8px;font-size:13px;font-weight:700;font-family:\'Syne\',sans-serif;transition:opacity 200ms ease}\n.nc:hover{opacity:.85}\n.nh{display:none;flex-direction:column;gap:5px;background:none;padding:6px;margin-left:auto}\n.nh span{display:block;width:22px;height:2px;background:var(--text);transition:all 300ms ease;border-radius:2px}\n.nh.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}\n.nh.open span:nth-child(2){opacity:0}\n.nh.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}\n.nm{display:none;flex-direction:column;background:rgba(8,10,14,0.98);border-bottom:1px solid var(--border);position:fixed;top:64px;left:0;right:0;z-index:99}\n.nm.open{display:flex}\n.nm a{padding:15px 5%;font-size:15px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--border);transition:color 200ms ease}\n.nm a:hover{color:var(--text)}\n#hero{min-height:100vh;display:flex;align-items:center;padding:100px 5% 80px;background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(212,175,55,.07) 0%,transparent 70%)}\n.hi{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;width:100%}\n.ey{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:16px;display:flex;align-items:center;gap:10px}\n.ey::before{content:\'\';display:block;width:28px;height:1px;background:var(--accent)}\nh1{font-family:\'Syne\',sans-serif;font-size:clamp(36px,5vw,60px);font-weight:900;letter-spacing:-2px;line-height:1.04;margin-bottom:20px}\nh1 em{font-style:normal;color:var(--accent)}\n.hs{font-size:17px;color:var(--muted);line-height:1.75;margin-bottom:32px;max-width:480px}\n.hb{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:28px}\n.bp{display:inline-flex;align-items:center;gap:8px;padding:15px 32px;background:var(--accent);color:#080a0e;border-radius:9px;font-size:14px;font-weight:700;font-family:\'Syne\',sans-serif;transition:all 200ms ease;white-space:nowrap}\n.bp:hover{opacity:.9;transform:translateY(-1px)}\n.bp:focus-visible{outline:2px solid var(--accent);outline-offset:3px}\n.bo{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;background:transparent;color:var(--text);border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-weight:600;transition:all 200ms ease;white-space:nowrap}\n.bo:hover{border-color:var(--accent);color:var(--accent)}\n.tr{display:flex;flex-wrap:wrap;gap:16px}\n.ti{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--muted)}\n.td{width:16px;height:16px;border-radius:50%;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.25);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}\n.hv{border-radius:20px;overflow:hidden;border:1px solid var(--border);min-height:440px;display:flex;align-items:center;justify-content:center}\n#product{padding:100px 5%;background:var(--surface)}\n.pi{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}\n.pw{border-radius:16px;overflow:hidden;background:var(--card);min-height:480px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border)}\n.sl{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:12px}\nh2{font-family:\'Syne\',sans-serif;font-size:clamp(24px,3.5vw,38px);font-weight:900;letter-spacing:-1px;line-height:1.15;margin-bottom:14px}\n.pr{font-family:\'Syne\',sans-serif;font-size:30px;font-weight:900;color:var(--accent);margin-bottom:6px}\n.pn{font-size:13px;color:var(--muted);margin-bottom:20px}\n.pd{font-size:15px;color:var(--muted);line-height:1.75;margin-bottom:24px}\n.apb{display:flex;align-items:center;gap:9px;padding:11px 16px;background:rgba(212,175,55,.05);border:1px solid rgba(212,175,55,.18);border-radius:8px;font-size:13px;font-weight:600;margin-bottom:14px}\n.sh{font-size:13px;color:var(--muted);margin-bottom:22px;display:flex;align-items:center;gap:7px}\n.atc{width:100%;padding:16px;background:var(--accent);color:#080a0e;border-radius:10px;font-size:15px;font-weight:700;font-family:\'Syne\',sans-serif;transition:all 200ms ease}\n.atc:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}\n.atc:disabled{opacity:.6;cursor:not-allowed}\n#features{padding:100px 5%}\n.fi{max-width:1100px;margin:0 auto;text-align:center}\n.si{font-size:16px;color:var(--muted);max-width:520px;margin:0 auto 52px;line-height:1.75}\n.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;text-align:left}\n.fc{padding:28px;background:var(--surface);border-radius:14px;border:1px solid var(--border);transition:all 200ms ease}\n.fc:hover{border-color:rgba(212,175,55,.3);transform:translateY(-2px)}\n.fn{font-family:\'Syne\',sans-serif;font-size:10px;font-weight:800;color:var(--accent);letter-spacing:2px;margin-bottom:12px;opacity:.7}\n.fc h3{font-family:\'Syne\',sans-serif;font-size:15px;font-weight:700;margin-bottom:8px}\n.fc p{font-size:13px;color:var(--muted);line-height:1.65}\n#proof{padding:100px 5%;background:var(--surface)}\n.poi{max-width:1100px;margin:0 auto}\n.ph{text-align:center;margin-bottom:48px}\n.rr{display:flex;align-items:center;gap:10px;justify-content:center;margin-top:10px;color:var(--accent)}\n.rc{font-size:14px;color:var(--muted)}\n.rg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}\n.rv{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:24px}\n.rs{display:flex;gap:2px;margin-bottom:12px;color:var(--accent)}\n.rt{font-size:14px;color:var(--muted);line-height:1.65;margin-bottom:14px}\n.rm{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px}\n.ra{font-size:13px;font-weight:700}\n.vb{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--accent);background:rgba(212,175,55,.1);padding:3px 8px;border-radius:4px}\n#cta-strip{padding:100px 5%;background:linear-gradient(135deg,var(--surface) 0%,rgba(212,175,55,.06) 100%);text-align:center}\n.ci{max-width:680px;margin:0 auto}\n.ci h2{margin-bottom:12px}\n.cs{font-size:16px;color:var(--muted);margin-bottom:36px;line-height:1.7}\n.cb{font-size:16px;padding:17px 48px;margin-bottom:28px;display:inline-flex}\n.cw{display:inline-flex;flex-direction:column;align-items:center;gap:10px}\n.cl{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}\n.cd{display:flex;align-items:center;gap:8px}\n.cdb{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 18px;min-width:56px;text-align:center}\n.cdn{font-family:\'Syne\',sans-serif;font-size:26px;font-weight:900;color:var(--accent);display:block;font-variant-numeric:tabular-nums;letter-spacing:-1px}\n.cds{font-family:\'Syne\',sans-serif;font-size:24px;font-weight:900;color:var(--accent);opacity:.4}\nfooter{padding:64px 5% 28px;background:#050710}\n.ft{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}\n.fl{font-family:\'Syne\',sans-serif;font-size:18px;font-weight:900;margin-bottom:10px}\n.fa{font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:16px}\n.soc{display:flex;gap:10px}\n.sli{width:34px;height:34px;border-radius:8px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;transition:all 200ms ease;color:var(--muted)}\n.sli:hover{border-color:var(--accent);color:var(--accent)}\n.fh h4{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(242,239,233,.22);margin-bottom:14px}\n.fh a{display:block;font-size:13px;color:var(--muted);margin-bottom:9px;transition:color 200ms ease}\n.fh a:hover{color:var(--text)}\n.fb{border-top:1px solid var(--border);padding-top:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:11px;color:rgba(242,239,233,.18)}\n@media(max-width:900px){.hi{grid-template-columns:1fr}.hv{display:none}.pi{grid-template-columns:1fr}.fg{grid-template-columns:1fr 1fr}.rg{grid-template-columns:1fr 1fr}.ft{grid-template-columns:1fr 1fr}}\n@media(max-width:600px){.nv,.nc{display:none}.nh{display:flex}.fg,.rg{grid-template-columns:1fr}.ft{grid-template-columns:1fr}.hb{flex-direction:column}.hb .bp,.hb .bo{width:100%;justify-content:center}}\n@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition-duration:0ms!important}}\n</style>\n</head>\n<body>\n<nav class="nav">\n  <span class="nl" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">{BRAND_NAME}</span>\n  <ul class="nv">\n    <li><a href="#product" onclick="event.preventDefault();document.getElementById(\'product\').scrollIntoView({behavior:\'smooth\'})">Product</a></li>\n    <li><a href="#features" onclick="event.preventDefault();document.getElementById(\'features\').scrollIntoView({behavior:\'smooth\'})">Features</a></li>\n    <li><a href="#proof" onclick="event.preventDefault();document.getElementById(\'proof\').scrollIntoView({behavior:\'smooth\'})">Reviews</a></li>\n  </ul>\n  <button class="nc" onclick="document.getElementById(\'product\').scrollIntoView({behavior:\'smooth\'})">Shop Now</button>\n  <button class="nh" id="nav-ham" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>\n</nav>\n<div class="nm" id="nav-mob">\n  <a href="#product" onclick="event.preventDefault();nm(0);document.getElementById(\'product\').scrollIntoView({behavior:\'smooth\'})">Product</a>\n  <a href="#features" onclick="event.preventDefault();nm(0);document.getElementById(\'features\').scrollIntoView({behavior:\'smooth\'})">Features</a>\n  <a href="#proof" onclick="event.preventDefault();nm(0);document.getElementById(\'proof\').scrollIntoView({behavior:\'smooth\'})">Reviews</a>\n  <a href="#cta-strip" onclick="event.preventDefault();nm(0);document.getElementById(\'cta-strip\').scrollIntoView({behavior:\'smooth\'})">Shop Now</a>\n</div>\n<section id="hero">\n  <div class="hi">\n    <div>\n      <div class="ey">Australian {NICHE}</div>\n      <h1>{HEADLINE}</h1>\n      <p class="hs">{SUBHEADLINE}</p>\n      <div class="hb">\n        <button class="bp" onclick="document.getElementById(\'product\').scrollIntoView({behavior:\'smooth\'})">Shop Now</button>\n        <button class="bo" onclick="document.getElementById(\'features\').scrollIntoView({behavior:\'smooth\'})">Learn More</button>\n      </div>\n      <div class="tr">\n        <span class="ti"><span class="td"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2,6 5,9 10,3"></polyline></svg></span>30-day guarantee</span>\n        <span class="ti"><span class="td"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2,6 5,9 10,3"></polyline></svg></span>Free AU shipping</span>\n        <span class="ti"><span class="td"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2,6 5,9 10,3"></polyline></svg></span>Afterpay available</span>\n      </div>\n    </div>\n    <div class="hv"><div style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}44);width:100%;min-height:440px;display:flex;align-items:center;justify-content:center"><span style="font-size:3rem">&#128444;</span></div></div>\n  </div>\n</section>\n<section id="product">\n  <div class="pi">\n    <div class="pw"><div style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}44);width:100%;min-height:480px;display:flex;align-items:center;justify-content:center"><span style="font-size:3rem">&#128444;</span></div></div>\n    <div>\n      <div class="sl">{NICHE}</div>\n      <h2>{PRODUCT_NAME}</h2>\n      <div class="pr">{PRICE} AUD</div>\n      <div class="pn">GST included &middot; Pay in 4 with Afterpay</div>\n      <p class="pd">{PRODUCT_DESC}</p>\n      <div class="apb"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Pay in 4 interest-free instalments with Afterpay</div>\n      <div class="sh"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>Free AU shipping on orders over $80</div>\n      <button class="atc" id="atc-main">Add to Cart</button>\n    </div>\n  </div>\n</section>\n<section id="features">\n  <div class="fi">\n    <div class="sl">Why {BRAND_NAME}</div>\n    <h2>Built for <em>{NICHE}</em></h2>\n    <p class="si">Everything you need, nothing you don&rsquo;t. Designed for the way Australians actually live.</p>\n    <div class="fg">{FEATURES_HTML}</div>\n  </div>\n</section>\n<section id="proof">\n  <div class="poi">\n    <div class="ph">\n      <div class="sl">Customer Reviews</div>\n      <h2>Trusted by Australians</h2>\n      <div class="rr"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span class="rc">4.9 / 5 from 200+ verified reviews</span></div>\n    </div>\n    <div class="rg">\n      <div class="rv"><div class="rs"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rt">{TESTIMONIAL_1}</p><div class="rm"><span class="ra">Sarah M. &mdash; Sydney, NSW</span><span class="vb">Verified purchase</span></div></div>\n      <div class="rv"><div class="rs"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rt">{TESTIMONIAL_2}</p><div class="rm"><span class="ra">James K. &mdash; Melbourne, VIC</span><span class="vb">Verified purchase</span></div></div>\n      <div class="rv"><div class="rs"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rt">{TESTIMONIAL_3}</p><div class="rm"><span class="ra">Emma T. &mdash; Brisbane, QLD</span><span class="vb">Verified purchase</span></div></div>\n    </div>\n  </div>\n</section>\n<section id="cta-strip">\n  <div class="ci">\n    <div class="sl">Limited Time</div>\n    <h2>Ready to transform your {NICHE}?</h2>\n    <p class="cs">{CTA_TEXT}</p>\n    <button class="bp cb" onclick="document.getElementById(\'product\').scrollIntoView({behavior:\'smooth\'})">Shop {BRAND_NAME} Now</button>\n    <div class="cw">\n      <div class="cl">Offer ends in</div>\n      <div class="cd">\n        <div class="cdb"><span class="cdn" id="cd-m">10</span></div>\n        <span class="cds">:</span>\n        <div class="cdb"><span class="cdn" id="cd-s">00</span></div>\n      </div>\n    </div>\n  </div>\n</section>\n<footer>\n  <div class="ft">\n    <div>\n      <div class="fl">{BRAND_NAME}</div>\n      <p class="fa">{BRAND_STORY}</p>\n      <div class="soc">\n        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="sli" aria-label="Instagram"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>\n        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="sli" aria-label="Facebook"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>\n        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" class="sli" aria-label="TikTok"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.79a4.85 4.85 0 01-1.02-.1z"/></svg></a>\n      </div>\n    </div>\n    <div class="fh"><h4>Shop</h4><a href="#product" onclick="event.preventDefault();document.getElementById(\'product\').scrollIntoView({behavior:\'smooth\'})">All Products</a><a href="#features" onclick="event.preventDefault();document.getElementById(\'features\').scrollIntoView({behavior:\'smooth\'})">Features</a><a href="#proof" onclick="event.preventDefault();document.getElementById(\'proof\').scrollIntoView({behavior:\'smooth\'})">Reviews</a><a href="#cta-strip" onclick="event.preventDefault();document.getElementById(\'cta-strip\').scrollIntoView({behavior:\'smooth\'})">Offers</a></div>\n    <div class="fh"><h4>Support</h4><a href="mailto:hello@{BRAND_SLUG}.com.au">Contact Us</a><a href="mailto:returns@{BRAND_SLUG}.com.au">Returns Policy</a><a href="mailto:hello@{BRAND_SLUG}.com.au">Shipping Info</a></div>\n    <div class="fh"><h4>Legal</h4><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/refund-policy">Refund Policy</a></div>\n  </div>\n  <div class="fb"><span>&copy; 2025 {BRAND_NAME}. All rights reserved. ABN: [Enter your ABN] &nbsp;&middot;&nbsp; &#127462;&#127482; Proudly Australian</span><span>All prices AUD incl. GST &middot; Australian Consumer Law applies</span></div>\n</footer>\n<script>(function(){var ham=document.getElementById(\'nav-ham\'),mob=document.getElementById(\'nav-mob\');function nm(o){mob.classList.toggle(\'open\',!!o);ham.classList.toggle(\'open\',!!o);ham.setAttribute(\'aria-expanded\',o?\'true\':\'false\')}window.nm=nm;ham.addEventListener(\'click\',function(){nm(!mob.classList.contains(\'open\'))});document.querySelectorAll(\'.atc,.atb\').forEach(function(b){b.addEventListener(\'click\',function(){var o=this.textContent;this.textContent=\'Added \\u2713\';this.disabled=true;var me=this;setTimeout(function(){me.textContent=o;me.disabled=false},2000)})});var _t=600;function _pad(n){return n<10?\'0\'+n:n}function _tick(){var _m=document.getElementById(\'cd-m\'),_s=document.getElementById(\'cd-s\');if(!_m||!_s)return;_m.textContent=_pad(Math.floor(_t/60));_s.textContent=_pad(_t%60);_t--;if(_t<0)_t=600}_tick();setInterval(_tick,1000);})();</script>\n</body>\n</html>',
};

const tplB: WebsiteTemplate = {
  id: 'dropship-bold',
  name: 'Dropship Bold',
  description: 'Multi-product urgency store. Marquee bar, countdown, stock scarcity.',
  category: 'bold',
  palette: { bg: '#0d0d1a', accent: '#d4af37', text: '#f0ecff' },
  emoji: '🔥',
  bestFor: 'Multi-product urgency stores',
  html: '<!DOCTYPE html>\n<html lang="en-AU">\n<head>\n<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>{BRAND_NAME}</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Rubik:wght@300;400;500;600&display=swap" rel="stylesheet">\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\n:root{--accent:{BRAND_COLOR};--bg:#0d0d1a;--surface:#13131f;--card:#0a0a0a;--text:#f0ecff;--muted:#8888aa;--border:rgba(255,255,255,.07)}\nhtml{scroll-behavior:smooth}body{background:var(--bg);color:var(--text);font-family:\'Rubik\',system-ui,sans-serif;line-height:1.6;overflow-x:hidden}\na{text-decoration:none;color:inherit}button{cursor:pointer;font-family:inherit;border:none}\n.ann{background:var(--accent);overflow:hidden;padding:8px 0}\n.ann-t{display:flex;gap:64px;animation:marquee 22s linear infinite;width:max-content}\n.ann-t span{font-size:12px;font-weight:700;color:#fff;white-space:nowrap;letter-spacing:.4px}\n@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}\n.nav{position:sticky;top:0;z-index:100;background:rgba(13,13,26,.94);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);height:60px;display:flex;align-items:center;padding:0 5%;gap:20px}\n.nl{font-family:\'Outfit\',sans-serif;font-size:19px;font-weight:900;letter-spacing:-.5px;color:var(--accent);flex-shrink:0;cursor:pointer}\n.nv{display:flex;gap:24px;list-style:none;flex:1;justify-content:center}\n.nv a{font-size:13px;font-weight:600;color:var(--muted);transition:color 200ms ease}\n.nv a:hover{color:var(--text)}\n.sb{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;background:rgba(255,70,70,.15);color:#ff7070;border:1px solid rgba(255,70,70,.3);padding:4px 10px;border-radius:6px}\n.nc{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--text);padding:8px 14px;border:1px solid var(--border);border-radius:8px;transition:all 200ms ease}\n.nc:hover{border-color:var(--accent);color:var(--accent)}\n.nh{display:none;flex-direction:column;gap:5px;background:none;padding:6px;margin-left:auto}\n.nh span{display:block;width:22px;height:2px;background:var(--text);transition:all 300ms ease;border-radius:2px}\n.nh.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}\n.nh.open span:nth-child(2){opacity:0}\n.nh.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}\n.nm{display:none;flex-direction:column;background:rgba(13,13,26,.98);border-bottom:1px solid var(--border);position:fixed;top:60px;left:0;right:0;z-index:99}\n.nm.open{display:flex}\n.nm a{padding:15px 5%;font-size:15px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--border);transition:color 200ms ease}\n.nm a:hover{color:var(--text)}\n#hero{min-height:90vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:80px 5%;gap:40px;position:relative;overflow:hidden}\n#hero::before{content:\'\';position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 0% 50%,rgba(124,58,237,.12) 0%,transparent 70%);pointer-events:none}\n.hbadge{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;background:rgba(255,200,60,.08);border:1px solid rgba(255,200,60,.25);border-radius:99px;font-size:11px;font-weight:700;color:#ffc040;margin-bottom:18px;letter-spacing:.5px}\nh1{font-family:\'Outfit\',sans-serif;font-size:clamp(32px,5vw,58px);font-weight:900;letter-spacing:-1.5px;line-height:1.06;margin-bottom:16px}\nh1 em{font-style:normal;color:var(--accent)}\n.hs{font-size:17px;color:var(--muted);max-width:520px;line-height:1.7;margin-bottom:28px}\n.cdw{margin-bottom:28px}\n.cdl{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px}\n.cd{display:flex;gap:10px}\n.cdb{background:var(--card);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px 16px;min-width:58px;text-align:center}\n.cdn{font-family:\'Outfit\',sans-serif;font-size:26px;font-weight:900;color:var(--accent);display:block;font-variant-numeric:tabular-nums;letter-spacing:-1px}\n.cdlb{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);display:block;margin-top:2px}\n.hbtns{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}\n.bp{display:inline-flex;align-items:center;gap:8px;padding:15px 32px;background:var(--accent);color:#fff;border-radius:10px;font-size:15px;font-weight:800;font-family:\'Outfit\',sans-serif;transition:all 200ms ease;white-space:nowrap}\n.bp:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.3)}\n.bp:focus-visible{outline:2px solid var(--accent);outline-offset:3px}\n.bg{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;background:transparent;color:var(--text);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;font-size:14px;font-weight:700;transition:all 200ms ease}\n.bg:hover{border-color:var(--accent);color:var(--accent)}\n.hp{font-size:13px;color:var(--muted)}\n.hp strong{color:var(--text)}\n.hv{display:flex;align-items:center;justify-content:center}\n.hiw{border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08);width:100%;min-height:400px;display:flex;align-items:center;justify-content:center;position:relative}\n.hib{position:absolute;top:14px;right:14px;background:var(--accent);color:#fff;font-size:11px;font-weight:800;padding:6px 12px;border-radius:8px;letter-spacing:.5px;font-family:\'Outfit\',sans-serif}\nh2{font-family:\'Outfit\',sans-serif;font-size:clamp(24px,3.5vw,38px);font-weight:900;letter-spacing:-1px}\n.sl{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:10px}\n#products{padding:80px 5%;background:var(--surface)}\n.sh{text-align:center;margin-bottom:48px}\n.pg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}\n.pc{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:all 200ms ease}\n.pc:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.35)}\n.pimg{height:200px;display:flex;align-items:center;justify-content:center;position:relative}\n.pbadge{position:absolute;top:10px;right:10px;font-size:10px;font-weight:800;padding:4px 10px;border-radius:6px;background:rgba(255,60,60,.9);color:#fff;letter-spacing:.5px;font-family:\'Outfit\',sans-serif}\n.pinfo{padding:16px}\n.pn{font-family:\'Outfit\',sans-serif;font-size:14px;font-weight:800;margin-bottom:5px}\n.psold{font-size:11px;color:var(--muted);margin-bottom:8px}\n.psold strong{color:#ffc040}\n.pp{font-family:\'Outfit\',sans-serif;font-size:18px;font-weight:900;color:var(--accent);margin-bottom:10px}\n.po{text-decoration:line-through;font-size:13px;color:var(--muted);margin-left:6px;font-weight:400}\n.atc{width:100%;padding:11px;background:var(--accent);color:#fff;border-radius:8px;font-size:13px;font-weight:800;font-family:\'Outfit\',sans-serif;transition:all 200ms ease}\n.atc:hover:not(:disabled){opacity:.85}\n.atc:disabled{opacity:.6;cursor:not-allowed}\n#urgency{padding:64px 5%;text-align:center;background:linear-gradient(135deg,var(--bg) 0%,var(--surface) 100%)}\n.ui{max-width:700px;margin:0 auto}\n.ui h2{margin-bottom:10px}\n.us{font-size:15px;color:var(--muted);margin-bottom:32px}\n.ucd{display:flex;gap:12px;justify-content:center;margin-bottom:24px}\n.ucd .cdb{min-width:72px;padding:14px 20px}\n.ucd .cdn{font-size:32px}\n.stk{font-size:14px;color:var(--muted)}\n.stk strong{color:#ff8080}\n#trust{padding:60px 5%;background:var(--surface)}\n.ti{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(5,1fr);gap:16px;text-align:center}\n.tb{padding:20px 12px;border:1px solid var(--border);border-radius:12px;background:var(--card);transition:all 200ms ease}\n.tb:hover{border-color:rgba(var(--accent-rgb),.3)}\n.tbi{width:36px;height:36px;border-radius:50%;background:rgba(var(--accent-rgb),.1);border:1px solid rgba(var(--accent-rgb),.2);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:var(--accent)}\n.tbn{font-family:\'Outfit\',sans-serif;font-size:12px;font-weight:800;margin-bottom:4px}\n.tbd{font-size:11px;color:var(--muted);line-height:1.5}\n#reviews{padding:80px 5%;overflow:hidden}\n.ri{max-width:1100px;margin:0 auto}\n.rtw{overflow:hidden;margin-top:32px;-webkit-mask-image:linear-gradient(to right,transparent,black 10%,black 90%,transparent)}\n.rtr{display:flex;gap:16px;animation:rscroll 28s linear infinite;width:max-content}\n.rtr:hover{animation-play-state:paused}\n@keyframes rscroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}\n.rc2{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px;max-width:280px;flex-shrink:0}\n.rc2-s{display:flex;gap:2px;margin-bottom:8px;color:var(--accent)}\n.rc2-t{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:10px}\n.rc2-a{font-size:12px;font-weight:700;color:var(--text)}\nfooter{padding:48px 5% 24px;background:var(--surface);border-top:1px solid var(--border)}\n.ft{display:flex;justify-content:space-between;gap:28px;flex-wrap:wrap;margin-bottom:32px}\n.fl{font-family:\'Outfit\',sans-serif;font-size:18px;font-weight:900;color:var(--accent);margin-bottom:8px}\n.fa{font-size:12px;color:var(--muted);line-height:1.6;max-width:200px}\n.fh h4{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px}\n.fh a{display:block;font-size:13px;color:rgba(255,255,255,.45);margin-bottom:7px;transition:color 200ms ease}\n.fh a:hover{color:var(--text)}\n.fb{border-top:1px solid var(--border);padding-top:16px;font-size:11px;color:rgba(255,255,255,.18);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}\n@media(max-width:1000px){.ti{grid-template-columns:repeat(3,1fr)}}\n@media(max-width:900px){#hero{grid-template-columns:1fr}.hv{display:none}.pg{grid-template-columns:repeat(2,1fr)}}\n@media(max-width:600px){.nv,.nc,.sb{display:none}.nh{display:flex}.pg{grid-template-columns:1fr}.ti{grid-template-columns:repeat(2,1fr)}.ucd{flex-wrap:wrap}.ft{flex-direction:column}}\n@media(prefers-reduced-motion:reduce){.ann-t,.rtr{animation:none}html{scroll-behavior:auto}*{transition-duration:0ms!important}}\n</style>\n</head>\n<body>\n<div class="ann"><div class="ann-t"><span>&#128293; Free shipping AU-wide on orders over $75</span><span>&#9889; 47 sold today</span><span>&#127462;&#127482; Ships from AU warehouse</span><span>&#128293; Free shipping AU-wide on orders over $75</span><span>&#9889; 47 sold today</span><span>&#127462;&#127482; Ships from AU warehouse</span><span>&#128293; Free shipping AU-wide on orders over $75</span><span>&#9889; 47 sold today</span><span>&#127462;&#127482; Ships from AU warehouse</span></div></div>\n<nav class="nav">\n  <span class="nl" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">{BRAND_NAME}</span>\n  <ul class="nv">\n    <li><a href="#products" onclick="event.preventDefault();document.getElementById(\'products\').scrollIntoView({behavior:\'smooth\'})">Shop</a></li>\n    <li><a href="#reviews" onclick="event.preventDefault();document.getElementById(\'reviews\').scrollIntoView({behavior:\'smooth\'})">Reviews</a></li>\n    <li><a href="#trust" onclick="event.preventDefault();document.getElementById(\'trust\').scrollIntoView({behavior:\'smooth\'})">Guarantees</a></li>\n    <li><span class="sb">SALE</span></li>\n  </ul>\n  <a href="#products" onclick="event.preventDefault();document.getElementById(\'products\').scrollIntoView({behavior:\'smooth\'})" class="nc"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Cart</a>\n  <button class="nh" id="nav-ham" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>\n</nav>\n<div class="nm" id="nav-mob">\n  <a href="#products" onclick="event.preventDefault();nm(0);document.getElementById(\'products\').scrollIntoView({behavior:\'smooth\'})">Shop</a>\n  <a href="#reviews" onclick="event.preventDefault();nm(0);document.getElementById(\'reviews\').scrollIntoView({behavior:\'smooth\'})">Reviews</a>\n  <a href="#trust" onclick="event.preventDefault();nm(0);document.getElementById(\'trust\').scrollIntoView({behavior:\'smooth\'})">Guarantees</a>\n  <a href="#urgency" onclick="event.preventDefault();nm(0);document.getElementById(\'urgency\').scrollIntoView({behavior:\'smooth\'})">Sale Ends Soon</a>\n</div>\n<section id="hero">\n  <div>\n    <div class="hbadge">&#9889; LIMITED STOCK</div>\n    <h1>{HEADLINE}</h1>\n    <p class="hs">{SUBHEADLINE}</p>\n    <div class="cdw">\n      <div class="cdl">Sale ends in</div>\n      <div class="cd">\n        <div class="cdb"><span class="cdn" id="h-h">00</span><span class="cdlb">Hrs</span></div>\n        <div class="cdb"><span class="cdn" id="h-m">10</span><span class="cdlb">Mins</span></div>\n        <div class="cdb"><span class="cdn" id="h-s">00</span><span class="cdlb">Secs</span></div>\n      </div>\n    </div>\n    <div class="hbtns">\n      <button class="bp" onclick="document.getElementById(\'products\').scrollIntoView({behavior:\'smooth\'})">Shop Now</button>\n      <button class="bg" onclick="document.getElementById(\'reviews\').scrollIntoView({behavior:\'smooth\'})">See Reviews</button>\n    </div>\n    <p class="hp">&#11088; <strong>127 people</strong> bought this today &middot; Ships from AU warehouse</p>\n  </div>\n  <div class="hv">\n    <div class="hiw">\n      <div style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}44);width:100%;min-height:400px;display:flex;align-items:center;justify-content:center"><span style="font-size:3rem">&#128444;</span></div>\n      <span class="hib">&#11088; #1 Best Seller</span>\n    </div>\n  </div>\n</section>\n<section id="products">\n  <div class="sh"><div class="sl">Featured Products</div><h2>{PRODUCT_NAME} &mdash; Ships from <em style="font-style:normal;color:{BRAND_COLOR}">AU Warehouse</em></h2></div>\n  <div class="pg">\n    <div class="pc">\n      <div class="pimg" style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}33)"><span style="font-size:2.5rem">&#128444;</span><span class="pbadge">&#128293; HOT</span></div>\n      <div class="pinfo"><div class="pn">{PRODUCT_NAME} &mdash; Standard</div><div class="psold"><strong>43</strong> sold today</div><div class="pp">$49.95 AUD <span class="po">$79.95</span></div><button class="atc">Add to Cart</button></div>\n    </div>\n    <div class="pc">\n      <div class="pimg" style="background:linear-gradient(135deg,{BRAND_COLOR}33,{BRAND_COLOR}44)"><span style="font-size:2.5rem">&#128444;</span><span class="pbadge">LIMITED</span></div>\n      <div class="pinfo"><div class="pn">{PRODUCT_NAME} &mdash; Pro Bundle</div><div class="psold"><strong>18</strong> sold today</div><div class="pp">$89.95 AUD <span class="po">$139.95</span></div><button class="atc">Add to Cart</button></div>\n    </div>\n    <div class="pc">\n      <div class="pimg" style="background:linear-gradient(135deg,{BRAND_COLOR}1a,{BRAND_COLOR}33)"><span style="font-size:2.5rem">&#128444;</span></div>\n      <div class="pinfo"><div class="pn">{PRODUCT_NAME} &mdash; Gift Set</div><div class="psold"><strong>9</strong> sold today</div><div class="pp">$129.95 AUD <span class="po">$199.95</span></div><button class="atc">Add to Cart</button></div>\n    </div>\n  </div>\n</section>\n<section id="urgency">\n  <div class="ui">\n    <div class="sl">Flash Sale</div>\n    <h2>Sale ends in:</h2>\n    <p class="us">Don&rsquo;t miss out &mdash; these prices end soon.</p>\n    <div class="ucd cd">\n      <div class="cdb"><span class="cdn" id="u-h">00</span><span class="cdlb">Hrs</span></div>\n      <div class="cdb"><span class="cdn" id="u-m">10</span><span class="cdlb">Mins</span></div>\n      <div class="cdb"><span class="cdn" id="u-s">00</span><span class="cdlb">Secs</span></div>\n    </div>\n    <p class="stk">Only <strong id="stock-count">4</strong> left in stock at this price</p>\n  </div>\n</section>\n<section id="trust">\n  <div class="ti">\n    <div class="tb"><div class="tbi"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div><div class="tbn">AU Warehouse</div><div class="tbd">Ships from Australia. Fast, reliable delivery.</div></div>\n    <div class="tb"><div class="tbi"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.51"/></svg></div><div class="tbn">30-Day Returns</div><div class="tbd">Not happy? Full refund, no questions asked.</div></div>\n    <div class="tb"><div class="tbi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div><div class="tbn">Afterpay Available</div><div class="tbd">Split into 4 payments. Zero interest.</div></div>\n    <div class="tb"><div class="tbi"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div class="tbn">Secure Checkout</div><div class="tbd">256-bit SSL. All major cards accepted.</div></div>\n    <div class="tb"><div class="tbi"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="tbn">24/7 Support</div><div class="tbd">We respond within hours, every day.</div></div>\n  </div>\n</section>\n<section id="reviews">\n  <div class="ri">\n    <div class="sh"><div class="sl">Customer Reviews</div><h2>&#11088; 4.9 / 5 from 847 Reviews</h2></div>\n    <div class="rtw"><div class="rtr"><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Absolutely smashed my expectations. Quality is top notch and arrived super fast from the AU warehouse.</p><div class="rc2-a">Brad H. &mdash; Gold Coast, QLD</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Limited stock for real! Almost missed out. So glad I grabbed it &mdash; worth every cent.</p><div class="rc2-a">Mia C. &mdash; Melbourne, VIC</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Used Afterpay, arrived in 3 days. Exactly what I needed. Will be buying the bundle next.</p><div class="rc2-a">Daniel R. &mdash; Sydney, NSW</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Was sceptical at first but the reviews were right. Brilliant product at a fair price.</p><div class="rc2-a">Jess P. &mdash; Perth, WA</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Fast, reliable, and the Afterpay option made it a no-brainer. The bundle is incredible value.</p><div class="rc2-a">Tom B. &mdash; Adelaide, SA</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Absolutely smashed my expectations. Quality is top notch and arrived super fast from the AU warehouse.</p><div class="rc2-a">Brad H. &mdash; Gold Coast, QLD</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Limited stock for real! Almost missed out. So glad I grabbed it &mdash; worth every cent.</p><div class="rc2-a">Mia C. &mdash; Melbourne, VIC</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Used Afterpay, arrived in 3 days. Exactly what I needed. Will be buying the bundle next.</p><div class="rc2-a">Daniel R. &mdash; Sydney, NSW</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Was sceptical at first but the reviews were right. Brilliant product at a fair price.</p><div class="rc2-a">Jess P. &mdash; Perth, WA</div></div><div class="rc2"><div class="rc2-s"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><p class="rc2-t">Fast, reliable, and the Afterpay option made it a no-brainer. The bundle is incredible value.</p><div class="rc2-a">Tom B. &mdash; Adelaide, SA</div></div></div></div>\n  </div>\n</section>\n<footer>\n  <div class="ft">\n    <div><div class="fl">{BRAND_NAME}</div><p class="fa">{BRAND_STORY}</p></div>\n    <div class="fh"><h4>Shop</h4><a href="#products" onclick="event.preventDefault();document.getElementById(\'products\').scrollIntoView({behavior:\'smooth\'})">All Products</a><a href="#reviews" onclick="event.preventDefault();document.getElementById(\'reviews\').scrollIntoView({behavior:\'smooth\'})">Reviews</a><a href="#trust" onclick="event.preventDefault();document.getElementById(\'trust\').scrollIntoView({behavior:\'smooth\'})">Guarantees</a></div>\n    <div class="fh"><h4>Support</h4><a href="mailto:hello@{BRAND_SLUG}.com.au">Contact</a><a href="mailto:returns@{BRAND_SLUG}.com.au">Returns</a><a href="mailto:hello@{BRAND_SLUG}.com.au">Shipping</a></div>\n    <div class="fh"><h4>Legal</h4><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/refund-policy">Refund Policy</a></div>\n  </div>\n  <div class="fb"><span>&copy; 2025 {BRAND_NAME}. All rights reserved. ABN: [Enter your ABN] &middot; &#127462;&#127482; Ships from Australia</span><span>All prices AUD incl. GST &middot; Afterpay available</span></div>\n</footer>\n<script>(function(){var ham=document.getElementById(\'nav-ham\'),mob=document.getElementById(\'nav-mob\');function nm(o){mob.classList.toggle(\'open\',!!o);ham.classList.toggle(\'open\',!!o);ham.setAttribute(\'aria-expanded\',o?\'true\':\'false\')}window.nm=nm;ham.addEventListener(\'click\',function(){nm(!mob.classList.contains(\'open\'))});document.querySelectorAll(\'.atc,.atb\').forEach(function(b){b.addEventListener(\'click\',function(){var o=this.textContent;this.textContent=\'Added \\u2713\';this.disabled=true;var me=this;setTimeout(function(){me.textContent=o;me.disabled=false},2000)})});var _t=600;function _pad(n){return n<10?\'0\'+n:n}function _tick(){[\'h-h\',\'u-h\'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=\'00\'});var m=_pad(Math.floor(_t/60)),s=_pad(_t%60);[\'h-m\',\'u-m\'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=m});[\'h-s\',\'u-s\'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=s});_t--;if(_t<0)_t=600}_tick();setInterval(_tick,1000);var stock=Math.floor(Math.random()*5)+3;var sc=document.getElementById(\'stock-count\');if(sc){sc.textContent=stock;setInterval(function(){if(stock>1){stock--;sc.textContent=stock}},45000);}var acc=\'{BRAND_COLOR}\';var r=parseInt(acc.slice(1,3),16)||124,g=parseInt(acc.slice(3,5),16)||58,b=parseInt(acc.slice(5,7),16)||237;document.documentElement.style.setProperty(\'--accent-rgb\',r+\',\'+g+\',\'+b);})();</script>\n</body>\n</html>',
};

const tplC: WebsiteTemplate = {
  id: 'premium-brand',
  name: 'Premium Brand',
  description: 'Luxury storytelling. Off-white, serif headings, gold accents, spacious.',
  category: 'premium',
  palette: { bg: '#faf9f7', accent: '#ca8a04', text: '#1c1917' },
  emoji: '✦',
  bestFor: 'Luxury, lifestyle, premium',
  html: '<!DOCTYPE html>\n<html lang="en-AU">\n<head>\n<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>{BRAND_NAME}</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\n:root{--accent:{BRAND_COLOR};--gold:#ca8a04;--bg:#faf9f7;--surface:#f3f0ea;--dark:#1c1917;--card:#eee9e0;--text:#2a2520;--muted:#78716c;--border:rgba(28,25,23,.08)}\nhtml{scroll-behavior:smooth}body{background:var(--bg);color:var(--text);font-family:\'Jost\',Georgia,sans-serif;line-height:1.7;overflow-x:hidden}\na{text-decoration:none;color:inherit}button{cursor:pointer;font-family:inherit;border:none}\nh1,h2,h3{font-family:\'Bodoni Moda\',Georgia,serif;line-height:1.15}\n.nav{height:70px;display:flex;align-items:center;justify-content:center;padding:0 5%;background:var(--bg);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;gap:0}\n.nav-links{display:flex;gap:32px;list-style:none}\n.nav-links a{font-size:12px;font-weight:500;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;transition:color 200ms ease}\n.nav-links a:hover{color:var(--text)}\n.nl{font-family:\'Bodoni Moda\',Georgia,serif;font-size:22px;font-weight:900;letter-spacing:-.3px;color:var(--dark);white-space:nowrap;margin:0 48px;cursor:pointer}\n.nl em{font-style:italic;color:var(--accent)}\n#hero{min-height:92vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:80px 5%;background:var(--dark);position:relative;overflow:hidden}\n#hero::before{content:\'\';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 50%,rgba(202,138,4,.08) 0%,transparent 70%);pointer-events:none}\n.ho{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:24px}\n.ho::before,.ho::after{content:\'\';display:block;width:32px;height:1px;background:var(--gold)}\n.ho span{font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--gold)}\n#hero h1{font-size:clamp(38px,5.5vw,68px);font-weight:900;letter-spacing:-1px;color:#faf9f7;margin-bottom:20px;line-height:1.08}\n#hero h1 em{font-style:italic;color:var(--gold)}\n.hsub{font-size:16px;color:rgba(250,249,247,.55);max-width:480px;margin:0 auto 36px;line-height:1.8}\n.bg{display:inline-flex;align-items:center;gap:8px;padding:15px 36px;background:var(--gold);color:var(--dark);border-radius:6px;font-size:13px;font-weight:600;letter-spacing:.5px;transition:all 250ms ease;font-family:\'Jost\',sans-serif}\n.bg:hover{opacity:.9;transform:translateY(-1px)}\n.bg:focus-visible{outline:2px solid var(--gold);outline-offset:3px}\n.hmarks{display:flex;flex-wrap:wrap;gap:20px;justify-content:center;margin-top:32px}\n.hm{display:flex;align-items:center;gap:7px;font-size:12px;color:rgba(250,249,247,.35)}\n.hm::before{content:\'—\';color:var(--gold);font-size:13px}\n#story{padding:100px 5%;background:var(--bg)}\n.sti{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}\n.stag{font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}\n.sti h2{font-size:clamp(28px,3.5vw,42px);margin-bottom:18px;letter-spacing:-.5px}\n.sti h2 em{font-style:italic;color:var(--accent)}\n.sti p{font-size:15px;color:var(--muted);line-height:1.8;margin-bottom:16px}\n.stv{border-radius:12px;background:var(--surface);border:1px solid var(--border);aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;overflow:hidden}\n.sff{display:flex;flex-wrap:wrap;gap:24px;margin-top:28px}\n.sf{border-left:2px solid var(--accent);padding-left:14px}\n.sfn{font-family:\'Bodoni Moda\',Georgia,serif;font-size:28px;font-weight:900;color:var(--dark)}\n.sfl{font-size:12px;color:var(--muted);font-weight:500;margin-top:2px}\n#product-feature{padding:100px 5%;background:var(--surface)}\n.pfi{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}\n.pfimg{border-radius:12px;border:1px solid var(--border);background:var(--card);aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;overflow:hidden}\n.pft{font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:12px}\n.pfn{font-family:\'Bodoni Moda\',Georgia,serif;font-size:clamp(24px,3vw,36px);font-weight:700;margin-bottom:16px;letter-spacing:-.3px}\n.pfd{font-size:15px;color:var(--muted);line-height:1.8;margin-bottom:24px}\n.pfp{font-family:\'Bodoni Moda\',Georgia,serif;font-size:26px;font-weight:700;color:var(--dark);margin-bottom:6px}\n.pfs{font-size:13px;color:var(--muted);margin-bottom:24px;display:flex;align-items:center;gap:6px}\n.atb{width:100%;padding:15px;background:var(--dark);color:var(--bg);border-radius:6px;font-size:14px;font-weight:600;font-family:\'Jost\',sans-serif;letter-spacing:.3px;transition:all 250ms ease}\n.atb:hover:not(:disabled){opacity:.85}\n.atb:disabled{opacity:.6;cursor:not-allowed}\n#values{padding:100px 5%;background:var(--bg)}\n.vi{max-width:1000px;margin:0 auto;text-align:center}\n.vi h2{margin-bottom:14px}\n.vintro{font-size:15px;color:var(--muted);max-width:460px;margin:0 auto 56px;line-height:1.75}\n.vg{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;text-align:left}\n.vv{padding:32px;background:var(--surface);border-radius:12px;border:1px solid var(--border);transition:all 250ms ease}\n.vv:hover{border-color:rgba(202,138,4,.25)}\n.vvi{width:40px;height:40px;border-radius:10px;background:rgba(202,138,4,.08);border:1px solid rgba(202,138,4,.18);display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:var(--gold)}\n.vv h3{font-family:\'Bodoni Moda\',Georgia,serif;font-size:16px;font-weight:700;margin-bottom:8px}\n.vv p{font-size:13px;color:var(--muted);line-height:1.7}\n#email-capture{padding:100px 5%;background:var(--dark);text-align:center;position:relative;overflow:hidden}\n#email-capture::before{content:\'\';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 50%,rgba(202,138,4,.1) 0%,transparent 70%);pointer-events:none}\n.eco{font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:16px}\n#email-capture h2{font-size:clamp(26px,4vw,44px);color:#faf9f7;margin-bottom:12px;letter-spacing:-.5px}\n#email-capture p{font-size:15px;color:rgba(250,249,247,.5);max-width:440px;margin:0 auto 32px;line-height:1.75}\n.ecf{display:flex;gap:8px;max-width:400px;margin:0 auto}\n.ecf input{flex:1;padding:14px 20px;border-radius:6px;border:1px solid rgba(250,249,247,.15);background:rgba(250,249,247,.05);color:#faf9f7;font-size:14px;outline:none;font-family:\'Jost\',sans-serif}\n.ecf input:focus{border-color:var(--gold)}\n.ecf input::placeholder{color:rgba(250,249,247,.3)}\n.ecf button{padding:14px 24px;background:var(--gold);color:var(--dark);border-radius:6px;font-size:13px;font-weight:600;font-family:\'Jost\',sans-serif;transition:opacity 200ms ease;white-space:nowrap}\n.ecf button:hover{opacity:.88}\n.ecs{display:none;padding:14px 24px;background:rgba(202,138,4,.1);border:1px solid rgba(202,138,4,.3);border-radius:8px;color:var(--gold);font-size:14px;font-weight:600;max-width:400px;margin:0 auto}\n.ecn{font-size:12px;color:rgba(250,249,247,.25);margin-top:14px}\nfooter{padding:60px 5% 28px;background:var(--dark)}\n.ft{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px}\n.fl{font-family:\'Bodoni Moda\',Georgia,serif;font-size:20px;font-weight:900;color:#faf9f7;margin-bottom:10px}\n.fl em{font-style:italic;color:var(--gold)}\n.fa{font-size:12px;color:rgba(250,249,247,.3);margin-top:8px;line-height:1.7;max-width:200px}\n.fau{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--gold);margin-top:14px;letter-spacing:.5px}\n.fh h4{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(250,249,247,.22);margin-bottom:14px}\n.fh a{display:block;font-size:13px;color:rgba(250,249,247,.4);margin-bottom:9px;transition:color 200ms ease;font-family:\'Jost\',sans-serif}\n.fh a:hover{color:#faf9f7}\n.fb{border-top:1px solid rgba(250,249,247,.07);padding-top:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:11px;color:rgba(250,249,247,.18);font-family:\'Jost\',sans-serif}\n@media(max-width:960px){.sti{grid-template-columns:1fr}.stv{display:none}.pfi{grid-template-columns:1fr}.vg{grid-template-columns:1fr 1fr}.ft{grid-template-columns:1fr 1fr}}\n@media(max-width:600px){.nav-links{display:none}.nl{margin:0 16px}.vg{grid-template-columns:1fr}.ft{grid-template-columns:1fr}.ecf{flex-direction:column}}\n@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition-duration:0ms!important}}\n</style>\n</head>\n<body>\n<nav class="nav">\n  <ul class="nav-links">\n    <li><a href="#story" onclick="event.preventDefault();document.getElementById(\'story\').scrollIntoView({behavior:\'smooth\'})">Our Story</a></li>\n    <li><a href="#product-feature" onclick="event.preventDefault();document.getElementById(\'product-feature\').scrollIntoView({behavior:\'smooth\'})">Shop</a></li>\n  </ul>\n  <span class="nl" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">{BRAND_NAME}</span>\n  <ul class="nav-links">\n    <li><a href="#values" onclick="event.preventDefault();document.getElementById(\'values\').scrollIntoView({behavior:\'smooth\'})">Values</a></li>\n    <li><a href="#email-capture" onclick="event.preventDefault();document.getElementById(\'email-capture\').scrollIntoView({behavior:\'smooth\'})">Join</a></li>\n  </ul>\n</nav>\n<section id="hero">\n  <div style="max-width:700px;margin:0 auto;position:relative;z-index:1">\n    <div class="ho"><span>Craft &middot; Quality &middot; Australia</span></div>\n    <h1>{HEADLINE}</h1>\n    <p class="hsub">{SUBHEADLINE}</p>\n    <a class="bg" href="#product-feature" onclick="event.preventDefault();document.getElementById(\'product-feature\').scrollIntoView({behavior:\'smooth\'})">Discover the Collection &rarr;</a>\n    <div class="hmarks">\n      <span class="hm">Proudly Australian</span>\n      <span class="hm">Carbon-offset shipping</span>\n      <span class="hm">Afterpay available</span>\n    </div>\n  </div>\n</section>\n<section id="story">\n  <div class="sti">\n    <div>\n      <div class="stag">Our Story</div>\n      <h2>Where <em>Craft</em> Meets {NICHE}</h2>\n      <p>{BRAND_STORY}</p>\n      <p>We believe in making things properly &mdash; sustainable materials, ethical sourcing, and Australian craftsmanship built to last.</p>\n      <div class="sff">\n        <div class="sf"><div class="sfn">3K+</div><div class="sfl">Australian customers</div></div>\n        <div class="sf"><div class="sfn">4.9&#9733;</div><div class="sfl">Average rating</div></div>\n        <div class="sf"><div class="sfn">100%</div><div class="sfl">Carbon-offset shipping</div></div>\n      </div>\n    </div>\n    <div class="stv"><div style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}44);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:3rem">&#128444;</span></div></div>\n  </div>\n</section>\n<section id="product-feature">\n  <div class="pfi">\n    <div class="pfimg"><div style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}44);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:3rem">&#128444;</span></div></div>\n    <div>\n      <div class="pft">{NICHE}</div>\n      <div class="pfn">{PRODUCT_NAME}</div>\n      <p class="pfd">{PRODUCT_DESC}</p>\n      <div class="pfp">{PRICE} AUD</div>\n      <div class="pfs"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>Complimentary AU shipping on all orders.</div>\n      <button class="atb" id="atb-main">Add to Bag</button>\n    </div>\n  </div>\n</section>\n<section id="values">\n  <div class="vi">\n    <div class="stag">Our Commitment</div>\n    <h2>Made with Intention</h2>\n    <p class="vintro">Every detail considered. Every material chosen with care. This is what premium looks like.</p>\n    <div class="vg">\n      <div class="vv"><div class="vvi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><h3>Ethically Made</h3><p>Sourced from verified ethical suppliers. Every partner meets our strict standards for fair wages and safe conditions.</p></div>\n      <div class="vv"><div class="vvi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div><h3>Certified AU Owned</h3><p>100% Australian owned and operated. When you buy from us, you&rsquo;re supporting local jobs and the Australian economy.</p></div>\n      <div class="vv"><div class="vvi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div><h3>Carbon Neutral Delivery</h3><p>Every order is carbon offset through verified Australian environmental projects. Shop with a clear conscience.</p></div>\n    </div>\n  </div>\n</section>\n<section id="email-capture">\n  <div style="position:relative;z-index:1">\n    <div class="eco">Exclusive Access</div>\n    <h2>Join the Inner Circle</h2>\n    <p>Receive our curated guide to {NICHE}, plus early access to limited releases and members-only pricing.</p>\n    <form class="ecf" id="ec-form">\n      <input type="email" placeholder="Your email address" required aria-label="Email address">\n      <button type="submit">Join</button>\n    </form>\n    <div class="ecs" id="ec-success">Welcome to the family &#10024;</div>\n    <div class="ecn">No spam, ever. Unsubscribe any time.</div>\n  </div>\n</section>\n<footer>\n  <div class="ft">\n    <div>\n      <div class="fl">{BRAND_NAME}</div>\n      <p class="fa">Premium Australian {NICHE}. Crafted with intention. Delivered with care.</p>\n      <div class="fau">&#127462;&#127482; Proudly Australian &middot; Carbon-offset</div>\n    </div>\n    <div class="fh"><h4>Explore</h4><a href="#story" onclick="event.preventDefault();document.getElementById(\'story\').scrollIntoView({behavior:\'smooth\'})">Our Story</a><a href="#product-feature" onclick="event.preventDefault();document.getElementById(\'product-feature\').scrollIntoView({behavior:\'smooth\'})">Products</a><a href="#values" onclick="event.preventDefault();document.getElementById(\'values\').scrollIntoView({behavior:\'smooth\'})">Values</a></div>\n    <div class="fh"><h4>Support</h4><a href="mailto:hello@{BRAND_SLUG}.com.au">Contact Us</a><a href="mailto:returns@{BRAND_SLUG}.com.au">Returns</a><a href="mailto:hello@{BRAND_SLUG}.com.au">Afterpay Info</a></div>\n    <div class="fh"><h4>Legal</h4><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/refund-policy">Refund Policy</a></div>\n  </div>\n  <div class="fb"><span>&copy; 2025 {BRAND_NAME}. All rights reserved. ABN: [Enter your ABN]</span><span>All prices AUD incl. GST &middot; Australian Consumer Law applies</span></div>\n</footer>\n<script>(function(){document.querySelectorAll(\'.atc,.atb\').forEach(function(b){b.addEventListener(\'click\',function(){var o=this.textContent;this.textContent=\'Added \\u2713\';this.disabled=true;var me=this;setTimeout(function(){me.textContent=o;me.disabled=false},2000)})});var f=document.getElementById(\'ec-form\');if(f)f.addEventListener(\'submit\',function(e){e.preventDefault();f.style.display=\'none\';var s=document.getElementById(\'ec-success\');if(s)s.style.display=\'block\'});})();</script>\n</body>\n</html>',
};

// ── Template D: Coastal AU ─────────────────────────────────────────────────────
const tplD: WebsiteTemplate = {
  id: 'coastal-au',
  name: 'Coastal AU',
  description: 'Light, airy outdoor/lifestyle store with earthy tones and nature imagery.',
  category: 'lifestyle',
  palette: { bg: '#f8f5f0', accent: '#0d9488', text: '#1a2b2b' },
  emoji: '🌊',
  bestFor: 'Outdoor, lifestyle, sports, pets',
  html: `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{BRAND_NAME} — {NICHE} AU</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800;900&family=Mulish:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:{BRAND_COLOR};--bg:#f8f5f0;--surface:#f0ece5;--dark:#1a2b2b;--text:#2d3f3f;--muted:#6b7c7c;--border:rgba(26,43,43,.1)}
html{scroll-behavior:smooth}body{background:var(--bg);color:var(--text);font-family:'Mulish',system-ui,sans-serif;line-height:1.7;overflow-x:hidden}
a{text-decoration:none;color:inherit}button{cursor:pointer;font-family:inherit;border:none}h1,h2,h3{font-family:'Raleway',sans-serif;line-height:1.1}
.ann{background:var(--dark);color:rgba(248,245,240,.7);text-align:center;padding:9px;font-size:12px;letter-spacing:.3px}
.ann strong{color:#f8f5f0}
.nav{height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 5%;background:var(--bg);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
.nl{font-family:'Raleway',sans-serif;font-size:20px;font-weight:900;color:var(--dark);letter-spacing:-.5px}
.nv{display:flex;gap:28px;list-style:none}.nv a{font-size:13px;font-weight:600;color:var(--muted);transition:color 200ms}.nv a:hover{color:var(--dark)}
.nc{padding:10px 22px;background:var(--dark);color:var(--bg);border-radius:50px;font-size:13px;font-weight:700;font-family:'Raleway',sans-serif;transition:opacity 200ms}.nc:hover{opacity:.85}
.nh{display:none;flex-direction:column;gap:5px;background:none;padding:6px}.nh span{display:block;width:22px;height:2px;background:var(--dark);border-radius:2px;transition:all 300ms}
.nh.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}.nh.open span:nth-child(2){opacity:0}.nh.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}
.nm{display:none;flex-direction:column;background:var(--bg);border-bottom:1px solid var(--border);position:fixed;top:68px;left:0;right:0;z-index:99}.nm.open{display:flex}
.nm a{padding:15px 5%;font-size:15px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--border);transition:color 200ms}.nm a:hover{color:var(--dark)}
#hero{min-height:90vh;display:flex;align-items:center;padding:80px 5%;position:relative;overflow:hidden}
.hbg{position:absolute;inset:0;background:url('https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=1400') center/cover no-repeat}
.hov{position:absolute;inset:0;background:linear-gradient(135deg,rgba(26,43,43,.75) 0%,rgba(26,43,43,.4) 60%,transparent 100%)}
.hc{position:relative;z-index:2;max-width:600px}
.htag{display:inline-flex;align-items:center;gap:8px;padding:5px 14px;border:1px solid rgba(248,245,240,.25);border-radius:50px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(248,245,240,.75);margin-bottom:18px}
#hero h1{font-size:clamp(36px,5.5vw,64px);font-weight:900;letter-spacing:-1.5px;color:#f8f5f0;margin-bottom:18px}
#hero h1 em{font-style:normal;color:var(--accent)}.hsub{font-size:16px;color:rgba(248,245,240,.7);line-height:1.8;margin-bottom:32px;max-width:480px}
.hbtns{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:28px}
.hbtn{display:inline-flex;align-items:center;gap:9px;padding:15px 34px;background:var(--accent);color:#fff;border-radius:50px;font-size:14px;font-weight:700;font-family:'Raleway',sans-serif;transition:all 200ms}
.hbtn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.25)}.hbtn:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.hbt2{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border:1.5px solid rgba(248,245,240,.35);color:#f8f5f0;border-radius:50px;font-size:13px;font-weight:700;transition:all 200ms}.hbt2:hover{border-color:#f8f5f0}
.htrust{display:flex;flex-wrap:wrap;gap:16px}.ht{font-size:11px;color:rgba(248,245,240,.5);font-weight:600;display:flex;align-items:center;gap:5px}.ht::before{content:'✓';color:var(--accent);font-size:13px}
.tstrip{background:var(--surface);padding:14px 5%;display:flex;justify-content:center;flex-wrap:wrap;gap:28px;border-bottom:1px solid var(--border)}
.ts{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--muted)}
#product{padding:90px 5%;background:var(--bg)}.pi{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:start}
.pimg{border-radius:16px;overflow:hidden;background:var(--surface);border:1px solid var(--border);aspect-ratio:4/5;display:flex;align-items:center;justify-content:center}
.ptag{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.pname{font-family:'Raleway',sans-serif;font-size:clamp(22px,3vw,32px);font-weight:900;margin-bottom:12px;letter-spacing:-.5px;color:var(--dark)}
.prat{display:flex;align-items:center;gap:8px;margin-bottom:14px}.pstars{color:#f59e0b;font-size:15px}.prc{font-size:13px;color:var(--muted)}
.pprice{font-family:'Raleway',sans-serif;font-size:32px;font-weight:900;color:var(--accent);margin-bottom:5px}
.pship{font-size:13px;color:var(--muted);margin-bottom:16px}
.pdesc{font-size:15px;color:var(--muted);line-height:1.8;margin-bottom:22px}
.pap{display:flex;align-items:center;gap:9px;padding:11px 16px;background:rgba(13,148,136,.06);border:1px solid rgba(13,148,136,.2);border-radius:9px;font-size:13px;font-weight:600;color:var(--dark);margin-bottom:18px}
.atc{width:100%;padding:16px;background:var(--dark);color:var(--bg);border-radius:50px;font-size:15px;font-weight:800;font-family:'Raleway',sans-serif;transition:all 200ms;margin-bottom:10px}
.atc:hover:not(:disabled){opacity:.88}.atc:disabled{opacity:.6;cursor:not-allowed}
.atcg{width:100%;padding:14px;background:transparent;color:var(--dark);border:1.5px solid var(--border);border-radius:50px;font-size:14px;font-weight:700;font-family:'Raleway',sans-serif;transition:all 200ms}.atcg:hover{border-color:var(--dark)}
#features{padding:90px 5%;background:var(--surface)}.fi{max-width:1080px;margin:0 auto;text-align:center}
.sectag{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.fi h2{font-size:clamp(26px,3.5vw,38px);font-weight:900;letter-spacing:-.5px;margin-bottom:12px;color:var(--dark)}
.fsub{font-size:15px;color:var(--muted);max-width:460px;margin:0 auto 52px;line-height:1.75}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:left}
.fc{padding:28px;background:var(--bg);border-radius:14px;border:1px solid var(--border);transition:all 200ms}
.fc:hover{border-color:rgba(13,148,136,.3);transform:translateY(-2px)}
.fci{font-size:26px;margin-bottom:14px}.fc h3{font-family:'Raleway',sans-serif;font-size:15px;font-weight:800;margin-bottom:8px;color:var(--dark)}.fc p{font-size:13px;color:var(--muted);line-height:1.65}
#reviews{padding:90px 5%;background:var(--bg)}.ri{max-width:1080px;margin:0 auto}
.rhead{text-align:center;margin-bottom:48px}
.rsum{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;color:var(--muted);font-size:14px}.rstars{color:#f59e0b;font-size:17px}
.rg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.rv{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px}
.rs{color:#f59e0b;font-size:14px;margin-bottom:10px}.rt{font-size:14px;color:var(--muted);line-height:1.65;margin-bottom:14px}
.ra{font-size:12px;font-weight:700;color:var(--dark)}.rav{font-size:10px;font-weight:700;letter-spacing:.8px;color:var(--accent);text-transform:uppercase;margin-top:3px}
footer{padding:60px 5% 24px;background:var(--dark)}
.ft{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px}
.fl{font-family:'Raleway',sans-serif;font-size:20px;font-weight:900;color:#f8f5f0;margin-bottom:8px}
.fd{font-size:12px;color:rgba(248,245,240,.35);line-height:1.7;max-width:200px;margin-top:4px}
.fh h4{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(248,245,240,.2);margin-bottom:12px}
.fh a{display:block;font-size:13px;color:rgba(248,245,240,.45);margin-bottom:8px;transition:color 200ms}.fh a:hover{color:#f8f5f0}
.fb{border-top:1px solid rgba(248,245,240,.08);padding-top:18px;font-size:11px;color:rgba(248,245,240,.2);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
@media(max-width:900px){.pi{grid-template-columns:1fr}.fg{grid-template-columns:1fr 1fr}.rg{grid-template-columns:1fr 1fr}.ft{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.nv,.nc{display:none}.nh{display:flex}.fg,.rg{grid-template-columns:1fr}.ft{grid-template-columns:1fr}.hbtns{flex-direction:column}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition-duration:0ms!important}}
</style>
</head>
<body>
<div class="ann">🚚 <strong>Free AU shipping</strong> on orders over $65 · 3–7 days with Australia Post</div>
<nav class="nav">
  <span class="nl" onclick="window.scrollTo({top:0,behavior:'smooth'})">{BRAND_NAME}</span>
  <ul class="nv">
    <li><a href="#product" onclick="event.preventDefault();document.getElementById('product').scrollIntoView({behavior:'smooth'})">Product</a></li>
    <li><a href="#features" onclick="event.preventDefault();document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</a></li>
    <li><a href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a></li>
  </ul>
  <button class="nc" onclick="document.getElementById('product').scrollIntoView({behavior:'smooth'})">Shop Now</button>
  <button class="nh" id="nav-ham" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
</nav>
<div class="nm" id="nav-mob">
  <a href="#product" onclick="event.preventDefault();nm(0);document.getElementById('product').scrollIntoView({behavior:'smooth'})">Product</a>
  <a href="#features" onclick="event.preventDefault();nm(0);document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</a>
  <a href="#reviews" onclick="event.preventDefault();nm(0);document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a>
</div>
<section id="hero">
  <div class="hbg"></div><div class="hov"></div>
  <div class="hc">
    <div class="htag">🌿 {NICHE}</div>
    <h1>{HEADLINE}</h1>
    <p class="hsub">{SUBHEADLINE}</p>
    <div class="hbtns">
      <button class="hbtn" onclick="document.getElementById('product').scrollIntoView({behavior:'smooth'})">Shop Now →</button>
      <button class="hbt2" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">Learn More</button>
    </div>
    <div class="htrust"><span class="ht">30-day guarantee</span><span class="ht">Free AU shipping</span><span class="ht">Afterpay</span></div>
  </div>
</section>
<div class="tstrip">
  <div class="ts">🌿 Sustainably sourced</div>
  <div class="ts">🚚 3–7 day AU delivery</div>
  <div class="ts">💚 Carbon-offset shipping</div>
  <div class="ts">🛡️ 30-day returns</div>
  <div class="ts">💳 Afterpay & Zip Pay</div>
</div>
<section id="product">
  <div class="pi">
    <div class="pimg"><div style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}44);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:3rem">🖼️</span></div></div>
    <div>
      <div class="ptag">{NICHE}</div>
      <div class="pname">{PRODUCT_NAME}</div>
      <div class="prat"><span class="pstars">★★★★★</span><span class="prc">4.9 · 312 reviews</span></div>
      <div class="pprice">{PRICE} AUD</div>
      <div class="pship">🚚 Free AU shipping · GST included · Pay in 4 with Afterpay</div>
      <p class="pdesc">{PRODUCT_DESC}</p>
      <div class="pap">💳 Pay in 4 interest-free with <strong>Afterpay</strong></div>
      <button class="atc" id="atc-main">Add to Cart</button>
      <button class="atcg">View Details</button>
    </div>
  </div>
</section>
<section id="features">
  <div class="fi">
    <div class="sectag">Why {BRAND_NAME}</div>
    <h2>Designed for Australian Life</h2>
    <p class="fsub">Everything you need, built for the way we live down under.</p>
    <div class="fg">{FEATURES_HTML}</div>
  </div>
</section>
<section id="reviews">
  <div class="ri">
    <div class="rhead">
      <div class="sectag">Customer Reviews</div>
      <h2>Loved by Australians</h2>
      <div class="rsum"><span class="rstars">★★★★★</span> 4.9 / 5 from 312 verified reviews</div>
    </div>
    <div class="rg">
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_1}</p><div class="ra">Sarah M. — Sydney, NSW</div><div class="rav">✓ Verified</div></div>
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_2}</p><div class="ra">James K. — Melbourne, VIC</div><div class="rav">✓ Verified</div></div>
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_3}</p><div class="ra">Emma T. — Brisbane, QLD</div><div class="rav">✓ Verified</div></div>
    </div>
  </div>
</section>
<footer>
  <div class="ft">
    <div><div class="fl">{BRAND_NAME}</div><p class="fd">{BRAND_STORY}</p><p style="font-size:11px;color:rgba(248,245,240,.3);margin-top:12px">🇦🇺 Proudly Australian · Carbon-offset</p></div>
    <div class="fh"><h4>Shop</h4><a href="#product" onclick="event.preventDefault();document.getElementById('product').scrollIntoView({behavior:'smooth'})">Products</a><a href="#features" onclick="event.preventDefault();document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</a><a href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a></div>
    <div class="fh"><h4>Support</h4><a href="mailto:hello@{BRAND_SLUG}.com.au">Contact</a><a href="mailto:returns@{BRAND_SLUG}.com.au">Returns</a><a href="mailto:hello@{BRAND_SLUG}.com.au">Shipping Info</a></div>
    <div class="fh"><h4>Legal</h4><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund-policy">Refund Policy</a></div>
  </div>
  <div class="fb"><span>© 2025 {BRAND_NAME}. ABN: [Enter your ABN] · 🇦🇺 Australian Owned</span><span>All prices AUD incl. GST · Afterpay available</span></div>
</footer>
<script>(function(){
  var ham=document.getElementById('nav-ham'),mob=document.getElementById('nav-mob');
  function nm(o){mob.classList.toggle('open',!!o);ham.classList.toggle('open',!!o);ham.setAttribute('aria-expanded',o?'true':'false')}
  window.nm=nm;ham.addEventListener('click',function(){nm(!mob.classList.contains('open'))});
  document.querySelectorAll('.atc').forEach(function(b){b.addEventListener('click',function(){var o=this.textContent;this.textContent='Added ✓';this.disabled=true;var me=this;setTimeout(function(){me.textContent=o;me.disabled=false},2000)})});
})();</script>
</body>
</html>`,
};

// ── Template E: Tech Mono ──────────────────────────────────────────────────────
const tplE: WebsiteTemplate = {
  id: 'tech-mono',
  name: 'Tech Mono',
  description: 'Ultra-minimal dark tech store. Apple-esque precision, electric accents.',
  category: 'tech',
  palette: { bg: '#080808', accent: '#3b82f6', text: '#f5f5f7' },
  emoji: '🖥️',
  bestFor: 'Gadgets, electronics, home office',
  html: `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{BRAND_NAME} — {PRODUCT_NAME}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:{BRAND_COLOR};--bg:#080808;--surface:#101010;--card:#161616;--text:#f5f5f7;--muted:#86868b;--border:rgba(255,255,255,.07)}
html{scroll-behavior:smooth}body{background:var(--bg);color:var(--text);font-family:'DM Sans',system-ui,sans-serif;line-height:1.6;overflow-x:hidden}
a{text-decoration:none;color:inherit}button{cursor:pointer;font-family:inherit;border:none}h1,h2,h3{font-family:'Space Grotesk',sans-serif;line-height:1.1}
.nav{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 5%;background:rgba(8,8,8,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
.nl{font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:700;color:var(--text);letter-spacing:-.3px;cursor:pointer}
.nv{display:flex;gap:24px;list-style:none}.nv a{font-size:13px;color:var(--muted);transition:color 200ms}.nv a:hover{color:var(--text)}
.nc{font-size:13px;font-weight:600;color:var(--accent);transition:opacity 200ms}.nc:hover{opacity:.7}
.nh{display:none;flex-direction:column;gap:5px;background:none;padding:6px}.nh span{display:block;width:20px;height:1.5px;background:var(--text);border-radius:2px;transition:all 300ms}
.nh.open span:nth-child(1){transform:rotate(45deg) translate(4px,4px)}.nh.open span:nth-child(2){opacity:0}.nh.open span:nth-child(3){transform:rotate(-45deg) translate(4px,-4px)}
.nm{display:none;flex-direction:column;background:rgba(8,8,8,.98);border-bottom:1px solid var(--border);position:fixed;top:52px;left:0;right:0;z-index:99}.nm.open{display:flex}
.nm a{padding:14px 5%;font-size:14px;color:var(--muted);border-bottom:1px solid var(--border);transition:color 200ms}.nm a:hover{color:var(--text)}
#hero{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 5%;gap:64px;position:relative;overflow:hidden}
#hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 50% 60% at 20% 50%,rgba(59,130,246,.06) 0%,transparent 70%);pointer-events:none}
.hey{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:16px;display:flex;align-items:center;gap:10px}
.hey::before{content:'';display:block;width:24px;height:1px;background:var(--accent)}
#hero h1{font-size:clamp(36px,5vw,60px);font-weight:700;letter-spacing:-1.5px;color:var(--text);margin-bottom:18px}
#hero h1 em{font-style:normal;color:var(--accent)}
.hsub{font-size:16px;color:var(--muted);line-height:1.75;margin-bottom:32px;max-width:460px}
.hbtns{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px}
.bp{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:var(--accent);color:#fff;border-radius:8px;font-size:14px;font-weight:600;font-family:'Space Grotesk',sans-serif;transition:all 200ms}
.bp:hover{opacity:.88;transform:translateY(-1px)}.bp:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.bo{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border:1px solid var(--border);color:var(--muted);border-radius:8px;font-size:13px;font-weight:500;transition:all 200ms}.bo:hover{border-color:var(--muted);color:var(--text)}
.ht{font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:12px}
.ht span{display:flex;align-items:center;gap:5px}
.hv{display:flex;align-items:center;justify-content:center}
.himg{border-radius:12px;background:var(--card);border:1px solid var(--border);width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;overflow:hidden}
.specs{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin:0 5% 0}
.sp{background:var(--surface);padding:24px 20px;text-align:center}
.spv{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:var(--accent);margin-bottom:4px}
.spl{font-size:12px;color:var(--muted)}
#product{padding:80px 5%;background:var(--surface)}
.pi{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.pimg{border-radius:10px;background:var(--card);border:1px solid var(--border);aspect-ratio:1;display:flex;align-items:center;justify-content:center;overflow:hidden}
.sl{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
h2{font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,3vw,34px);font-weight:700;letter-spacing:-.8px;margin-bottom:12px}
.pr{font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;color:var(--text);margin-bottom:5px}
.ps{font-size:13px;color:var(--muted);margin-bottom:18px}.pd{font-size:14px;color:var(--muted);line-height:1.75;margin-bottom:22px}
.pap{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.15);border-radius:7px;font-size:13px;font-weight:500;margin-bottom:16px}
.atc{width:100%;padding:14px;background:var(--accent);color:#fff;border-radius:8px;font-size:14px;font-weight:600;font-family:'Space Grotesk',sans-serif;transition:all 200ms}
.atc:hover:not(:disabled){opacity:.88}.atc:disabled{opacity:.6;cursor:not-allowed}
#features{padding:80px 5%;background:var(--bg)}.fi{max-width:1080px;margin:0 auto;text-align:center}
.fisub{font-size:15px;color:var(--muted);max-width:440px;margin:0 auto 48px;line-height:1.75}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:left}
.fc{padding:28px;background:var(--surface);border-radius:10px;border:1px solid var(--border);transition:all 200ms}
.fc:hover{border-color:rgba(59,130,246,.25);transform:translateY(-2px)}
.fn{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:10px;opacity:.8}
.fc h3{font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:600;margin-bottom:7px}.fc p{font-size:13px;color:var(--muted);line-height:1.65}
#reviews{padding:80px 5%;background:var(--surface)}.ri{max-width:1080px;margin:0 auto}
.rhead{text-align:center;margin-bottom:40px}.rg{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.rv{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:22px}
.rs{color:var(--accent);font-size:13px;margin-bottom:10px}.rt{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:12px}
.ra{font-size:12px;font-weight:600;color:var(--text)}.rav{font-size:10px;font-weight:600;color:var(--accent);letter-spacing:.8px;text-transform:uppercase;margin-top:3px}
#cta{padding:80px 5%;text-align:center;background:linear-gradient(135deg,var(--bg) 0%,var(--surface) 100%)}
.ci{max-width:560px;margin:0 auto}
.ci h2{margin-bottom:10px}.cs{font-size:15px;color:var(--muted);margin-bottom:28px;line-height:1.7}
footer{padding:52px 5% 20px;background:var(--bg);border-top:1px solid var(--border)}
.ft{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px;margin-bottom:36px}
.fl{font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:700;color:var(--text);margin-bottom:8px}
.fd{font-size:12px;color:var(--muted);line-height:1.7;max-width:190px}
.fh h4{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.18);margin-bottom:12px}
.fh a{display:block;font-size:13px;color:var(--muted);margin-bottom:8px;transition:color 200ms}.fh a:hover{color:var(--text)}
.fb{border-top:1px solid var(--border);padding-top:18px;font-size:11px;color:rgba(255,255,255,.18);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
@media(max-width:900px){#hero{grid-template-columns:1fr}.hv{display:none}.pi{grid-template-columns:1fr}.specs{grid-template-columns:repeat(2,1fr)}.fg{grid-template-columns:1fr 1fr}.rg{grid-template-columns:1fr 1fr}.ft{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.nv,.nc{display:none}.nh{display:flex}.specs{grid-template-columns:1fr 1fr}.fg,.rg{grid-template-columns:1fr}.ft{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition-duration:0ms!important}}
</style>
</head>
<body>
<nav class="nav">
  <span class="nl" onclick="window.scrollTo({top:0,behavior:'smooth'})">{BRAND_NAME}</span>
  <ul class="nv">
    <li><a href="#product" onclick="event.preventDefault();document.getElementById('product').scrollIntoView({behavior:'smooth'})">Product</a></li>
    <li><a href="#features" onclick="event.preventDefault();document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</a></li>
    <li><a href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a></li>
  </ul>
  <a href="#product" onclick="event.preventDefault();document.getElementById('product').scrollIntoView({behavior:'smooth'})" class="nc">Buy Now →</a>
  <button class="nh" id="nav-ham" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
</nav>
<div class="nm" id="nav-mob">
  <a href="#product" onclick="event.preventDefault();nm(0);document.getElementById('product').scrollIntoView({behavior:'smooth'})">Product</a>
  <a href="#features" onclick="event.preventDefault();nm(0);document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</a>
  <a href="#reviews" onclick="event.preventDefault();nm(0);document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a>
</div>
<section id="hero">
  <div>
    <div class="hey">{NICHE}</div>
    <h1>{HEADLINE}</h1>
    <p class="hsub">{SUBHEADLINE}</p>
    <div class="hbtns">
      <button class="bp" onclick="document.getElementById('product').scrollIntoView({behavior:'smooth'})">Order Now</button>
      <button class="bo" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">See Features</button>
    </div>
    <div class="ht">
      <span>✓ Free AU shipping</span>
      <span>✓ 30-day returns</span>
      <span>✓ Afterpay available</span>
    </div>
  </div>
  <div class="hv">
    <div class="himg"><div style="background:linear-gradient(135deg,{BRAND_COLOR}18,{BRAND_COLOR}30);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:4rem">🖼️</span></div></div>
  </div>
</section>
<div class="specs">
  <div class="sp"><div class="spv">4.9★</div><div class="spl">Customer Rating</div></div>
  <div class="sp"><div class="spv">3–7d</div><div class="spl">AU Delivery</div></div>
  <div class="sp"><div class="spv">30d</div><div class="spl">Return Window</div></div>
  <div class="sp"><div class="spv">24/7</div><div class="spl">AU Support</div></div>
</div>
<section id="product">
  <div class="pi">
    <div class="pimg"><div style="background:linear-gradient(135deg,{BRAND_COLOR}18,{BRAND_COLOR}30);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:4rem">🖼️</span></div></div>
    <div>
      <div class="sl">{NICHE}</div>
      <h2>{PRODUCT_NAME}</h2>
      <div class="pr">{PRICE} AUD</div>
      <div class="ps">GST included · Pay in 4 with Afterpay · Free AU shipping</div>
      <p class="pd">{PRODUCT_DESC}</p>
      <div class="pap">💳 Afterpay available — 4 interest-free payments</div>
      <button class="atc" id="atc-main">Add to Cart</button>
    </div>
  </div>
</section>
<section id="features">
  <div class="fi">
    <div class="sl">Specifications</div>
    <h2>{BRAND_NAME} Features</h2>
    <p class="fisub">Engineered for performance. Designed for Australia.</p>
    <div class="fg">{FEATURES_HTML}</div>
  </div>
</section>
<section id="reviews">
  <div class="ri">
    <div class="rhead"><div class="sl">Reviews</div><h2>★★★★★ 4.9 / 5 from 200+ Customers</h2></div>
    <div class="rg">
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_1}</p><div class="ra">Sarah M. — Sydney, NSW</div><div class="rav">✓ Verified</div></div>
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_2}</p><div class="ra">James K. — Melbourne, VIC</div><div class="rav">✓ Verified</div></div>
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_3}</p><div class="ra">Emma T. — Brisbane, QLD</div><div class="rav">✓ Verified</div></div>
    </div>
  </div>
</section>
<section id="cta">
  <div class="ci">
    <div class="sl">Limited Offer</div>
    <h2>Ready to Upgrade?</h2>
    <p class="cs">{CTA_TEXT}</p>
    <button class="bp" onclick="document.getElementById('product').scrollIntoView({behavior:'smooth'})">Order {BRAND_NAME} Now</button>
  </div>
</section>
<footer>
  <div class="ft">
    <div><div class="fl">{BRAND_NAME}</div><p class="fd">{BRAND_STORY}</p></div>
    <div class="fh"><h4>Product</h4><a href="#product" onclick="event.preventDefault();document.getElementById('product').scrollIntoView({behavior:'smooth'})">Buy Now</a><a href="#features" onclick="event.preventDefault();document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</a><a href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a></div>
    <div class="fh"><h4>Support</h4><a href="mailto:hello@{BRAND_SLUG}.com.au">Contact</a><a href="mailto:returns@{BRAND_SLUG}.com.au">Returns</a><a href="mailto:hello@{BRAND_SLUG}.com.au">Shipping</a></div>
    <div class="fh"><h4>Legal</h4><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund-policy">Refund Policy</a></div>
  </div>
  <div class="fb"><span>© 2025 {BRAND_NAME}. ABN: [Enter your ABN] · 🇦🇺 Australian Business</span><span>All prices AUD incl. GST · Afterpay available</span></div>
</footer>
<script>(function(){
  var ham=document.getElementById('nav-ham'),mob=document.getElementById('nav-mob');
  function nm(o){mob.classList.toggle('open',!!o);ham.classList.toggle('open',!!o);ham.setAttribute('aria-expanded',o?'true':'false')}
  window.nm=nm;ham.addEventListener('click',function(){nm(!mob.classList.contains('open'))});
  document.querySelectorAll('.atc').forEach(function(b){b.addEventListener('click',function(){var o=this.textContent;this.textContent='Added ✓';this.disabled=true;var me=this;setTimeout(function(){me.textContent=o;me.disabled=false},2000)})});
})();</script>
</body>
</html>`,
};

// ── Template F: Bloom Beauty ───────────────────────────────────────────────────
const tplF: WebsiteTemplate = {
  id: 'bloom-beauty',
  name: 'Bloom Beauty',
  description: 'Soft feminine beauty store. Elegant serif headings, spacious, rose-toned.',
  category: 'beauty',
  palette: { bg: '#fefcfb', accent: '#db2777', text: '#2a1520' },
  emoji: '🌸',
  bestFor: 'Skincare, beauty, wellness, supplements',
  html: `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{BRAND_NAME} — {NICHE} AU</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Nunito:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:{BRAND_COLOR};--bg:#fefcfb;--surface:#fdf6f9;--card:#f9ecf2;--dark:#2a1520;--text:#3d2030;--muted:#9b7285;--border:rgba(42,21,32,.08)}
html{scroll-behavior:smooth}body{background:var(--bg);color:var(--text);font-family:'Nunito',system-ui,sans-serif;line-height:1.7;overflow-x:hidden}
a{text-decoration:none;color:inherit}button{cursor:pointer;font-family:inherit;border:none}h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;line-height:1.1}
.ann{background:var(--card);color:var(--muted);text-align:center;padding:9px;font-size:12px;letter-spacing:.3px;border-bottom:1px solid var(--border)}
.ann strong{color:var(--accent)}
.nav{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 5%;background:var(--bg);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
.nl{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:700;color:var(--dark);letter-spacing:-.3px;cursor:pointer}
.nl em{font-style:italic;color:var(--accent)}
.nv{display:flex;gap:28px;list-style:none}.nv a{font-size:12px;font-weight:600;letter-spacing:.5px;color:var(--muted);transition:color 200ms;text-transform:uppercase}.nv a:hover{color:var(--dark)}
.nc{padding:10px 24px;background:var(--accent);color:#fff;border-radius:50px;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;transition:opacity 200ms}.nc:hover{opacity:.88}
.nh{display:none;flex-direction:column;gap:5px;background:none;padding:6px}.nh span{display:block;width:22px;height:1.5px;background:var(--dark);border-radius:2px;transition:all 300ms}
.nh.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}.nh.open span:nth-child(2){opacity:0}.nh.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}
.nm{display:none;flex-direction:column;background:var(--bg);border-bottom:1px solid var(--border);position:fixed;top:72px;left:0;right:0;z-index:99}.nm.open{display:flex}
.nm a{padding:15px 5%;font-size:14px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--border);transition:color 200ms}.nm a:hover{color:var(--dark)}
#hero{min-height:88vh;display:flex;align-items:center;padding:80px 5%;position:relative;overflow:hidden;background:linear-gradient(135deg,var(--surface) 0%,var(--card) 100%)}
#hero::after{content:'';position:absolute;top:-60px;right:-60px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(219,39,119,.08),transparent);pointer-events:none}
.hc{max-width:560px;position:relative;z-index:1}
.htag{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:16px;display:flex;align-items:center;gap:10px}
.htag::before{content:'';display:block;width:24px;height:1px;background:var(--accent)}
#hero h1{font-size:clamp(38px,5.5vw,68px);font-weight:700;letter-spacing:-.5px;color:var(--dark);margin-bottom:18px}
#hero h1 em{font-style:italic;color:var(--accent)}
.hsub{font-size:16px;color:var(--muted);line-height:1.85;margin-bottom:32px;max-width:460px}
.hbtns{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:28px}
.hbtn{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:var(--accent);color:#fff;border-radius:50px;font-size:14px;font-weight:700;transition:all 200ms}
.hbtn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(219,39,119,.25)}.hbtn:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.hbt2{display:inline-flex;align-items:center;gap:8px;padding:12px 26px;border:1.5px solid var(--border);color:var(--muted);border-radius:50px;font-size:13px;font-weight:600;transition:all 200ms}.hbt2:hover{border-color:var(--accent);color:var(--accent)}
.htrust{display:flex;flex-wrap:wrap;gap:16px}.ht{font-size:12px;color:var(--muted);font-weight:600;display:flex;align-items:center;gap:5px}.ht::before{content:'✦';color:var(--accent);font-size:10px}
.himg-wrap{display:flex;align-items:center;justify-content:center;position:absolute;right:5%;top:50%;transform:translateY(-50%)}
.himg{width:340px;height:420px;border-radius:20px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden}
.tstrip{background:var(--card);padding:14px 5%;display:flex;justify-content:center;flex-wrap:wrap;gap:28px;border-bottom:1px solid var(--border)}
.ts{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--muted)}
#product{padding:90px 5%;background:var(--bg)}.pi{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start}
.pimg{border-radius:20px;background:var(--surface);border:1px solid var(--border);aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ptag{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:12px}
.pname{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(22px,3vw,36px);font-weight:700;margin-bottom:14px;color:var(--dark)}
.prat{display:flex;align-items:center;gap:8px;margin-bottom:14px}.pstars{color:#f59e0b;font-size:15px}.prc{font-size:13px;color:var(--muted)}
.pprice{font-family:'Cormorant Garamond',Georgia,serif;font-size:34px;font-weight:700;color:var(--dark);margin-bottom:5px}
.pship{font-size:13px;color:var(--muted);margin-bottom:18px}
.pdesc{font-size:15px;color:var(--muted);line-height:1.85;margin-bottom:22px}
.pap{display:flex;align-items:center;gap:9px;padding:11px 16px;background:rgba(219,39,119,.05);border:1px solid rgba(219,39,119,.18);border-radius:50px;font-size:13px;font-weight:600;color:var(--dark);margin-bottom:20px}
.atc{width:100%;padding:16px;background:var(--accent);color:#fff;border-radius:50px;font-size:14px;font-weight:700;font-family:'Nunito',sans-serif;letter-spacing:.3px;transition:all 200ms;margin-bottom:10px}
.atc:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}.atc:disabled{opacity:.6;cursor:not-allowed}
.atcg{width:100%;padding:14px;background:transparent;color:var(--dark);border:1.5px solid var(--border);border-radius:50px;font-size:13px;font-weight:600;transition:all 200ms}.atcg:hover{border-color:var(--accent);color:var(--accent)}
#ritual{padding:90px 5%;background:var(--surface)}.rti{max-width:900px;margin:0 auto;text-align:center}
.sectag{font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--accent);margin-bottom:12px}
.rti h2{font-size:clamp(26px,3.5vw,42px);font-weight:700;letter-spacing:-.5px;margin-bottom:12px;color:var(--dark)}
.rti h2 em{font-style:italic}
.rtsub{font-size:15px;color:var(--muted);max-width:440px;margin:0 auto 52px;line-height:1.8}
.rtg{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:left}
.rtc{padding:32px;background:var(--bg);border-radius:20px;border:1px solid var(--border);position:relative;transition:all 200ms}
.rtc:hover{border-color:rgba(219,39,119,.2);transform:translateY(-2px)}
.rtn{font-family:'Cormorant Garamond',Georgia,serif;font-size:48px;font-weight:700;color:rgba(219,39,119,.12);position:absolute;top:16px;right:20px;line-height:1}
.rtc h3{font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:700;margin-bottom:8px;color:var(--dark)}.rtc p{font-size:13px;color:var(--muted);line-height:1.7}
#reviews{padding:90px 5%;background:var(--bg)}.ri{max-width:1000px;margin:0 auto}.rhead{text-align:center;margin-bottom:48px}
.rsum{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;color:var(--muted);font-size:14px}.rstars{color:#f59e0b;font-size:17px}
.rg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.rv{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px}
.rs{color:#f59e0b;font-size:14px;margin-bottom:12px}.rt{font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:14px}
.ra{font-size:12px;font-weight:700;color:var(--dark)}.rav{font-size:10px;font-weight:700;letter-spacing:.8px;color:var(--accent);text-transform:uppercase;margin-top:3px}
#newsletter{padding:80px 5%;background:var(--card);text-align:center}
.ni{max-width:500px;margin:0 auto}.ni h2{font-size:clamp(26px,3.5vw,42px);font-weight:700;margin-bottom:12px;color:var(--dark)}.ni h2 em{font-style:italic}
.ns{font-size:15px;color:var(--muted);margin-bottom:28px;line-height:1.75}
.nf{display:flex;gap:8px;max-width:420px;margin:0 auto}
.nf input{flex:1;padding:13px 20px;border-radius:50px;border:1.5px solid var(--border);background:var(--bg);color:var(--dark);font-size:14px;outline:none;font-family:'Nunito',sans-serif}
.nf input:focus{border-color:var(--accent)}.nf input::placeholder{color:var(--muted)}
.nf button{padding:13px 24px;background:var(--accent);color:#fff;border-radius:50px;font-size:13px;font-weight:700;transition:opacity 200ms;white-space:nowrap}.nf button:hover{opacity:.88}
.nsub{font-size:11px;color:var(--muted);margin-top:12px}
footer{padding:60px 5% 24px;background:var(--dark)}
.ft{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px}
.fl{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:700;color:#fefcfb;margin-bottom:8px}.fl em{font-style:italic;color:var(--accent)}
.fd{font-size:12px;color:rgba(254,252,251,.35);line-height:1.7;max-width:200px}
.fh h4{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(254,252,251,.2);margin-bottom:12px}
.fh a{display:block;font-size:13px;color:rgba(254,252,251,.45);margin-bottom:8px;transition:color 200ms}.fh a:hover{color:#fefcfb}
.fb{border-top:1px solid rgba(254,252,251,.08);padding-top:18px;font-size:11px;color:rgba(254,252,251,.2);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
@media(max-width:900px){.himg-wrap{display:none}.pi{grid-template-columns:1fr}.rtg{grid-template-columns:1fr 1fr}.rg{grid-template-columns:1fr 1fr}.ft{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.nv,.nc{display:none}.nh{display:flex}.rtg,.rg{grid-template-columns:1fr}.ft{grid-template-columns:1fr}.nf{flex-direction:column}.hbtns{flex-direction:column}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition-duration:0ms!important}}
</style>
</head>
<body>
<div class="ann">✦ <strong>Free AU shipping</strong> on all orders over $60 · Afterpay & Zip Pay available ✦</div>
<nav class="nav">
  <span class="nl" onclick="window.scrollTo({top:0,behavior:'smooth'})">{BRAND_NAME}</span>
  <ul class="nv">
    <li><a href="#product" onclick="event.preventDefault();document.getElementById('product').scrollIntoView({behavior:'smooth'})">Shop</a></li>
    <li><a href="#ritual" onclick="event.preventDefault();document.getElementById('ritual').scrollIntoView({behavior:'smooth'})">Ritual</a></li>
    <li><a href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a></li>
  </ul>
  <button class="nc" onclick="document.getElementById('product').scrollIntoView({behavior:'smooth'})">Shop Now</button>
  <button class="nh" id="nav-ham" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
</nav>
<div class="nm" id="nav-mob">
  <a href="#product" onclick="event.preventDefault();nm(0);document.getElementById('product').scrollIntoView({behavior:'smooth'})">Shop</a>
  <a href="#ritual" onclick="event.preventDefault();nm(0);document.getElementById('ritual').scrollIntoView({behavior:'smooth'})">Ritual</a>
  <a href="#reviews" onclick="event.preventDefault();nm(0);document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a>
</div>
<section id="hero">
  <div class="himg-wrap"><div class="himg"><div style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}44);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:4rem">🖼️</span></div></div></div>
  <div class="hc">
    <div class="htag">{NICHE}</div>
    <h1>{HEADLINE}</h1>
    <p class="hsub">{SUBHEADLINE}</p>
    <div class="hbtns">
      <button class="hbtn" onclick="document.getElementById('product').scrollIntoView({behavior:'smooth'})">Shop Now →</button>
      <button class="hbt2" onclick="document.getElementById('ritual').scrollIntoView({behavior:'smooth'})">Our Ritual</button>
    </div>
    <div class="htrust"><span class="ht">Dermatologist tested</span><span class="ht">Cruelty-free</span><span class="ht">Afterpay available</span></div>
  </div>
</section>
<div class="tstrip">
  <div class="ts">✦ Cruelty-free &amp; vegan</div>
  <div class="ts">🚚 Free AU shipping $60+</div>
  <div class="ts">💳 Afterpay &amp; Zip Pay</div>
  <div class="ts">🛡️ 30-day money-back</div>
  <div class="ts">🇦🇺 Australian-owned</div>
</div>
<section id="product">
  <div class="pi">
    <div class="pimg"><div style="background:linear-gradient(135deg,{BRAND_COLOR}22,{BRAND_COLOR}44);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:4rem">🖼️</span></div></div>
    <div>
      <div class="ptag">{NICHE}</div>
      <div class="pname">{PRODUCT_NAME}</div>
      <div class="prat"><span class="pstars">★★★★★</span><span class="prc">4.9 · 847 reviews</span></div>
      <div class="pprice">{PRICE} AUD</div>
      <div class="pship">Free AU shipping · GST included · Pay in 4 with Afterpay</div>
      <p class="pdesc">{PRODUCT_DESC}</p>
      <div class="pap">💳 4 interest-free payments with <strong>Afterpay</strong></div>
      <button class="atc" id="atc-main">Add to Cart</button>
      <button class="atcg">Learn More</button>
    </div>
  </div>
</section>
<section id="ritual">
  <div class="rti">
    <div class="sectag">The Ritual</div>
    <h2>Your Daily <em>Beauty Ritual</em></h2>
    <p class="rtsub">Three simple steps to your most radiant skin. Designed for Australian conditions.</p>
    <div class="rtg">
      <div class="rtc"><div class="rtn">01</div><h3>Cleanse &amp; Prepare</h3><p>Begin with a gentle cleanse to remove impurities. Your skin is now ready to absorb the full benefits.</p></div>
      <div class="rtc"><div class="rtn">02</div><h3>Apply &amp; Activate</h3><p>Apply {PRODUCT_NAME} in gentle upward motions. Let the active ingredients work their magic for 60 seconds.</p></div>
      <div class="rtc"><div class="rtn">03</div><h3>Hydrate &amp; Protect</h3><p>Seal in the benefits with a moisturiser. Morning routine? Add SPF 50+ — essential for the Australian sun.</p></div>
    </div>
  </div>
</section>
<section id="reviews">
  <div class="ri">
    <div class="rhead">
      <div class="sectag">Customer Love</div>
      <h2>Trusted by Australian Women</h2>
      <div class="rsum"><span class="rstars">★★★★★</span> 4.9 / 5 from 847 verified reviews</div>
    </div>
    <div class="rg">
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_1}</p><div class="ra">Sarah M. — Sydney, NSW</div><div class="rav">✓ Verified</div></div>
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_2}</p><div class="ra">Emma T. — Brisbane, QLD</div><div class="rav">✓ Verified</div></div>
      <div class="rv"><div class="rs">★★★★★</div><p class="rt">{TESTIMONIAL_3}</p><div class="ra">Olivia K. — Melbourne, VIC</div><div class="rav">✓ Verified</div></div>
    </div>
  </div>
</section>
<section id="newsletter">
  <div class="ni">
    <div class="sectag">Join the Club</div>
    <h2>Your Skin, <em>Transformed</em></h2>
    <p class="ns">Join 15,000+ Australian women who've discovered the secret to radiant skin. Get 10% off your first order.</p>
    <form id="nl-form">
      <div class="nf">
        <input type="email" placeholder="Your email address" required aria-label="Email address">
        <button type="submit">Join Now</button>
      </div>
    </form>
    <div class="nsub" id="nl-success" style="display:none;color:var(--accent);font-weight:700">✓ Welcome! Check your inbox for your 10% off code.</div>
    <p class="nsub">No spam, ever. Unsubscribe any time.</p>
  </div>
</section>
<footer>
  <div class="ft">
    <div><div class="fl"><em>{BRAND_NAME}</em></div><p class="fd">{BRAND_STORY}</p><p style="font-size:11px;color:rgba(254,252,251,.3);margin-top:12px">🇦🇺 Australian Owned · Cruelty-Free</p></div>
    <div class="fh"><h4>Shop</h4><a href="#product" onclick="event.preventDefault();document.getElementById('product').scrollIntoView({behavior:'smooth'})">Products</a><a href="#ritual" onclick="event.preventDefault();document.getElementById('ritual').scrollIntoView({behavior:'smooth'})">Ritual</a><a href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a></div>
    <div class="fh"><h4>Support</h4><a href="mailto:hello@{BRAND_SLUG}.com.au">Contact</a><a href="mailto:returns@{BRAND_SLUG}.com.au">Returns</a><a href="mailto:hello@{BRAND_SLUG}.com.au">Shipping</a></div>
    <div class="fh"><h4>Legal</h4><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund-policy">Refund Policy</a></div>
  </div>
  <div class="fb"><span>© 2025 {BRAND_NAME}. ABN: [Enter your ABN] · 🇦🇺 Australian Owned</span><span>All prices AUD incl. GST · Afterpay available</span></div>
</footer>
<script>(function(){
  var ham=document.getElementById('nav-ham'),mob=document.getElementById('nav-mob');
  function nm(o){mob.classList.toggle('open',!!o);ham.classList.toggle('open',!!o);ham.setAttribute('aria-expanded',o?'true':'false')}
  window.nm=nm;ham.addEventListener('click',function(){nm(!mob.classList.contains('open'))});
  document.querySelectorAll('.atc').forEach(function(b){b.addEventListener('click',function(){var o=this.textContent;this.textContent='Added ✓';this.disabled=true;var me=this;setTimeout(function(){me.textContent=o;me.disabled=false},2000)})});
  var nlf=document.getElementById('nl-form');if(nlf)nlf.addEventListener('submit',function(e){e.preventDefault();nlf.style.display='none';var s=document.getElementById('nl-success');if(s)s.style.display='block'});
})();</script>
</body>
</html>`,
};

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [tplA, tplB, tplC, tplD, tplE, tplF];

export interface BrandData {
  brandName: string;
  brandColor: string;
  productName: string;
  niche: string;
  tagline?: string;
  price?: string;
}

export interface AIContent {
  headline?: string;
  subheadline?: string;
  productDescription?: string;
  features?: string[];
  testimonial1?: string;
  testimonial2?: string;
  testimonial3?: string;
  ctaText?: string;
  brandStory?: string;
  // Legacy fields
  cta_primary?: string;
  cta_secondary?: string;
  about_section?: string;
  trust_badges?: string[];
}

export function buildTemplatePreview(
  templateId: string,
  brandData: BrandData,
  aiContent: AIContent
): string {
  const tmpl = WEBSITE_TEMPLATES.find((t) => t.id === templateId) ?? WEBSITE_TEMPLATES[0];
  const { brandName, brandColor, productName, niche, tagline, price } = brandData;
  const {
    headline,
    subheadline,
    productDescription,
    features,
    testimonial1,
    testimonial2,
    testimonial3,
    ctaText,
    brandStory,
    cta_primary,
    about_section,
  } = aiContent;

  const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'yourbrand';
  const safeHL = headline || `Premium ${niche} for Australians`;
  const safeSub = subheadline || `Quality ${niche} delivered to your door. Proudly Australian.`;
  const safeCTA = ctaText || cta_primary || `Discover ${brandName}`;
  const safeStory =
    brandStory ||
    about_section ||
    `${brandName} is an Australian-owned ${niche} brand focused on quality, value, and exceptional service.`;
  const safeProd =
    productDescription ||
    `Discover the premium ${productName} — crafted for Australian conditions, built to last, backed by a 30-day guarantee.`;
  const safePrice = price ? `$${price}` : `$59.99`;
  const safeT1 =
    testimonial1 ||
    `Absolutely love it. Fast shipping from the AU warehouse and quality you can actually feel. Would 100% buy again.`;
  const safeT2 =
    testimonial2 ||
    `Finally a product that delivers on its promise. Great value and arrived quickly. Highly recommend!`;
  const safeT3 =
    testimonial3 ||
    `Quick delivery from the AU warehouse. Exactly as described. Very happy with the purchase.`;

  const featList = features?.length
    ? features
    : [
        `Premium quality ${niche}`,
        `Free AU shipping on orders $99+`,
        `Afterpay available at checkout`,
        `30-day money-back guarantee`,
        `Ships from Australian warehouse`,
      ];

  // Generate features HTML — style adapts to template type
  const isMinimal = tmpl.id === 'dtc-minimal';
  const isPremium = tmpl.id === 'premium-brand';
  const featuresHtml = featList
    .map((f, i) => {
      const parts = f.includes(' — ')
        ? f.split(' — ')
        : f.includes(': ')
          ? f.split(': ')
          : [f, `Designed for Australian customers.`];
      const title = parts[0].trim();
      const desc = (parts[1] ?? `Designed for Australian customers. Quality you can trust.`).trim();
      const num = String(i + 1).padStart(2, '0');
      if (isPremium) {
        return `<div class="vv"><div class="vvi"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg></div><h3>${title}</h3><p>${desc}</p></div>`;
      }
      if (isMinimal) {
        return `<div class="fc"><div class="fn">${num}</div><h3>${title}</h3><p>${desc}</p></div>`;
      }
      return `<div class="fc"><div class="fn">${num}</div><h3>${title}</h3><p>${desc}</p></div>`;
    })
    .join('\n');

  return tmpl.html
    .replace(/{BRAND_NAME}/g, brandName || 'Your Brand')
    .replace(/{BRAND_COLOR}/g, brandColor || '#d4af37')
    .replace(/{PRODUCT_NAME}/g, productName || 'Our Product')
    .replace(/{NICHE}/g, niche || 'products')
    .replace(/{TAGLINE}/g, tagline || `Quality ${niche} for Australians`)
    .replace(/{PRICE}/g, safePrice)
    .replace(/{HEADLINE}/g, safeHL)
    .replace(/{SUBHEADLINE}/g, safeSub)
    .replace(/{PRODUCT_DESC}/g, safeProd)
    .replace(/{CTA_TEXT}/g, safeCTA)
    .replace(/{BRAND_STORY}/g, safeStory)
    .replace(/{TESTIMONIAL_1}/g, safeT1)
    .replace(/{TESTIMONIAL_2}/g, safeT2)
    .replace(/{TESTIMONIAL_3}/g, safeT3)
    .replace(/{FEATURES_HTML}/g, featuresHtml)
    .replace(/{BRAND_SLUG}/g, brandSlug);
}
