// ── Website Templates Library ─────────────────────────────────────────────
// 3 premium, self-contained HTML templates for the Website Generator.
// Placeholders: {BRAND_NAME}, {BRAND_COLOR}, {PRODUCT_NAME}, {NICHE},
//               {HEADLINE}, {SUBHEADLINE}, {CTA_PRIMARY}, {CTA_SECONDARY},
//               {FEATURES_HTML}, {TRUST_BADGES}, {ABOUT}, {BRAND_SLUG}

export interface WebsiteTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  category: 'minimal' | 'bold' | 'premium'
  html: string
  liquid?: string
}

// ── Template A — Minimalist DTC ───────────────────────────────────────────
const templateDTCMinimal: WebsiteTemplate = {
  id: 'template-dtc-minimal',
  name: 'Minimalist DTC',
  description: 'Clean, conversion-focused. One hero product, maximum clarity. Perfect for single-product stores.',
  thumbnail: '🎯',
  category: 'minimal',
  html: `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{BRAND_NAME}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:{BRAND_COLOR};--bg:#fffef9;--text:#1a1a1a;--muted:#777;--surface:#f5f3ee}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;line-height:1.6}
a{text-decoration:none;color:inherit}
nav{position:sticky;top:0;background:rgba(255,254,249,0.96);backdrop-filter:blur(12px);padding:0 6%;height:60px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(0,0,0,0.07);z-index:100}
.logo{font-size:17px;font-weight:900;letter-spacing:-.5px}
.nav-links{display:flex;gap:28px;list-style:none}
.nav-links a{font-size:13px;font-weight:500;color:var(--muted);transition:color .2s}
.nav-links a:hover{color:var(--text)}
.nav-cta{padding:9px 20px;background:var(--accent);color:#fff;border-radius:7px;font-size:12px;font-weight:800;letter-spacing:.3px;transition:opacity .2s;cursor:pointer}
.nav-cta:hover{opacity:.85}
#hero{min-height:88vh;display:flex;align-items:center;padding:60px 6%;max-width:1140px;margin:0 auto;gap:60px}
.hero-content{flex:1;max-width:600px}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
h1{font-size:clamp(36px,5.5vw,62px);font-weight:900;letter-spacing:-2px;line-height:1.04;margin-bottom:18px}
h1 em{font-style:normal;color:var(--accent)}
.hero-sub{font-size:17px;color:var(--muted);line-height:1.75;margin-bottom:34px;max-width:460px}
.ctas{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:28px}
.btn-primary{padding:15px 34px;background:var(--accent);color:#fff;border-radius:9px;font-size:14px;font-weight:800;display:inline-flex;align-items:center;gap:8px;transition:all .2s;cursor:pointer;border:none;box-shadow:0 4px 18px rgba(0,0,0,0.12)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.18)}
.btn-outline{padding:13px 26px;background:transparent;color:var(--text);border:2px solid rgba(0,0,0,0.13);border-radius:9px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:7px;transition:all .2s;cursor:pointer}
.btn-outline:hover{border-color:var(--accent);color:var(--accent)}
.trust-strip{display:flex;flex-wrap:wrap;gap:18px}
.trust-item{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--muted)}
.trust-item::before{content:'✓';color:var(--accent);font-weight:900;font-size:13px}
.hero-visual{flex:1;max-width:480px;border-radius:20px;overflow:hidden;background:var(--surface);min-height:400px;display:flex;align-items:center;justify-content:center}
.hero-visual-inner{text-align:center;padding:40px}
.product-emoji{font-size:80px;display:block;margin-bottom:16px}
.product-label{font-size:14px;font-weight:700;color:var(--accent)}
#products{padding:90px 6%;background:var(--surface)}
.section-inner{max-width:1080px;margin:0 auto}
.section-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:10px;text-align:center}
h2{font-size:clamp(26px,3.5vw,40px);font-weight:900;letter-spacing:-1px;text-align:center;margin-bottom:14px}
.section-sub{font-size:15px;color:var(--muted);text-align:center;max-width:520px;margin:0 auto 48px;line-height:1.7}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.feat{background:var(--bg);padding:26px;border-radius:12px;border:1px solid rgba(0,0,0,0.07);transition:transform .2s,box-shadow .2s}
.feat:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.08)}
.feat-num{font-size:11px;font-weight:800;color:var(--accent);letter-spacing:1px;margin-bottom:10px}
.feat h3{font-size:15px;font-weight:800;margin-bottom:7px}
.feat p{font-size:13px;color:var(--muted);line-height:1.65}
#proof{padding:80px 6%}
.proof-inner{max-width:900px;margin:0 auto;text-align:center}
.stars{font-size:26px;letter-spacing:3px;margin-bottom:10px}
.rating-text{font-size:14px;color:var(--muted);margin-bottom:40px}
.testimonials{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:left}
.testi{background:var(--surface);padding:22px;border-radius:12px;border:1px solid rgba(0,0,0,0.06)}
.testi-stars{font-size:12px;color:var(--accent);margin-bottom:8px}
.testi p{font-size:13px;color:var(--text);line-height:1.65;margin-bottom:10px}
.testi-author{font-size:11px;font-weight:700;color:var(--muted)}
#email-capture{padding:80px 6%;background:var(--accent);text-align:center}
#email-capture h2{font-size:clamp(24px,4vw,40px);font-weight:900;letter-spacing:-1px;color:#fff;margin-bottom:10px}
#email-capture p{font-size:15px;color:rgba(255,255,255,.8);margin-bottom:30px;max-width:440px;margin-left:auto;margin-right:auto;line-height:1.7}
.email-form{display:flex;gap:8px;max-width:400px;margin:0 auto}
.email-form input{flex:1;padding:13px 18px;border-radius:8px;border:none;font-size:14px;outline:none;background:#fff;color:#1a1a1a}
.email-form button{padding:13px 22px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;transition:opacity .2s}
.email-form button:hover{opacity:.82}
.success-msg{display:none;padding:14px 20px;color:#fff;font-size:14px;font-weight:600;background:rgba(255,255,255,.2);border-radius:10px;max-width:400px;margin:0 auto}
footer{padding:48px 6% 28px;background:#111}
.footer-top{display:flex;justify-content:space-between;gap:32px;flex-wrap:wrap;margin-bottom:36px}
.footer-brand .logo{color:#fff;font-size:16px}
.footer-brand p{font-size:12px;color:rgba(255,255,255,.35);margin-top:8px;line-height:1.65;max-width:220px}
.footer-col h4{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:12px}
.footer-col a{display:block;font-size:13px;color:rgba(255,255,255,.55);margin-bottom:7px;transition:color .2s}
.footer-col a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,.07);padding-top:18px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:11px;color:rgba(255,255,255,.25)}
@media(max-width:900px){#hero{flex-direction:column}.hero-visual{max-width:100%;width:100%}.testimonials{grid-template-columns:1fr}}
@media(max-width:600px){.nav-links{display:none}.footer-top{flex-direction:column}.email-form{flex-direction:column}}
</style>
</head>
<body>
<nav>
  <span class="logo">{BRAND_NAME}</span>
  <ul class="nav-links">
    <li><a href="#products" onclick="event.preventDefault();document.getElementById('products').scrollIntoView({behavior:'smooth'})">Product</a></li>
    <li><a href="#proof" onclick="event.preventDefault();document.getElementById('proof').scrollIntoView({behavior:'smooth'})">Reviews</a></li>
    <li><a href="#email-capture" onclick="event.preventDefault();document.getElementById('email-capture').scrollIntoView({behavior:'smooth'})">Offer</a></li>
  </ul>
  <a class="nav-cta" href="#products" onclick="event.preventDefault();document.getElementById('products').scrollIntoView({behavior:'smooth'})">Shop Now</a>
</nav>

<section id="hero">
  <div class="hero-content">
    <div class="eyebrow">Australian {NICHE}</div>
    <h1>{HEADLINE}</h1>
    <p class="hero-sub">{SUBHEADLINE}</p>
    <div class="ctas">
      <a class="btn-primary" href="#products" onclick="event.preventDefault();document.getElementById('products').scrollIntoView({behavior:'smooth'})">{CTA_PRIMARY} →</a>
      <a class="btn-outline" href="#proof" onclick="event.preventDefault();document.getElementById('proof').scrollIntoView({behavior:'smooth'})">{CTA_SECONDARY}</a>
    </div>
    <div class="trust-strip">
      <span class="trust-item">30-day guarantee</span>
      <span class="trust-item">Free AU shipping</span>
      <span class="trust-item">Afterpay available</span>
      <span class="trust-item">Ships in 2 days</span>
    </div>
  </div>
  <div class="hero-visual">
    <div class="hero-visual-inner">
      <span class="product-emoji">🛍️</span>
      <div class="product-label">{PRODUCT_NAME}</div>
    </div>
  </div>
</section>

<section id="products">
  <div class="section-inner">
    <div class="section-label">Why {BRAND_NAME}</div>
    <h2>Built for <em style="font-style:normal;color:{BRAND_COLOR}">Australians</em></h2>
    <p class="section-sub">Everything you need, nothing you don't. Designed for the way Australians actually live.</p>
    <div class="features-grid">
      {FEATURES_HTML}
    </div>
  </div>
</section>

<section id="proof">
  <div class="proof-inner">
    <div class="stars">★★★★★</div>
    <p class="rating-text">Rated 4.9 / 5 from 200+ verified Australian customers</p>
    <div class="testimonials">
      <div class="testi"><div class="testi-stars">★★★★★</div><p>"Absolutely love it. Fast shipping and quality you can actually feel."</p><div class="testi-author">Sarah M. — Sydney, NSW</div></div>
      <div class="testi"><div class="testi-stars">★★★★★</div><p>"Finally a product that works. Would 100% buy again. Great value too."</p><div class="testi-author">Jake T. — Melbourne, VIC</div></div>
      <div class="testi"><div class="testi-stars">★★★★★</div><p>"Quick delivery from the AU warehouse. Exactly as described. Very happy!"</p><div class="testi-author">Amy K. — Brisbane, QLD</div></div>
    </div>
  </div>
</section>

<section id="email-capture">
  <h2>Get 10% Off Your First Order</h2>
  <p>Join 3,000+ Australians who've discovered {BRAND_NAME}. Free shipping on orders over $99.</p>
  <form class="email-form" onsubmit="event.preventDefault();this.style.display='none';document.getElementById('dtc-success').style.display='block'">
    <input type="email" placeholder="Enter your email" required>
    <button type="submit">Claim Discount</button>
  </form>
  <div id="dtc-success" class="success-msg">🎉 Discount code sent! Check your inbox.</div>
</section>

<footer>
  <div class="footer-top">
    <div class="footer-brand">
      <div class="logo">{BRAND_NAME}</div>
      <p>{ABOUT}</p>
    </div>
    <div class="footer-col">
      <h4>Shop</h4>
      <a href="#products" onclick="event.preventDefault();document.getElementById('products').scrollIntoView({behavior:'smooth'})">All Products</a>
      <a href="#proof" onclick="event.preventDefault();document.getElementById('proof').scrollIntoView({behavior:'smooth'})">Reviews</a>
      <a href="#email-capture" onclick="event.preventDefault();document.getElementById('email-capture').scrollIntoView({behavior:'smooth'})">Offers</a>
    </div>
    <div class="footer-col">
      <h4>Support</h4>
      <a href="mailto:hello@{BRAND_SLUG}.com.au">Contact Us</a>
      <a href="mailto:returns@{BRAND_SLUG}.com.au">Returns</a>
      <a href="mailto:hello@{BRAND_SLUG}.com.au">Shipping Info</a>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/refund-policy">Refund Policy</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 {BRAND_NAME}. All rights reserved. ABN: [Enter your ABN]</span>
    <span>All prices AUD incl. GST · Proudly Australian 🇦🇺</span>
  </div>
</footer>
<script>
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var id=this.getAttribute('href').slice(1);
    var t=document.getElementById(id);
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}
  });
});
</script>
</body>
</html>`,
}

// ── Template B — Bold Dropship Store ─────────────────────────────────────
const templateDropshipBold: WebsiteTemplate = {
  id: 'template-dropship-bold',
  name: 'Bold Dropship Store',
  description: 'High-energy dark design with urgency, countdown timer, and scarcity signals.',
  thumbnail: '⚡',
  category: 'bold',
  html: `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{BRAND_NAME} — Limited Stock</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:{BRAND_COLOR};--bg:#0d0d1a;--surface:#13131f;--card:#1a1a2e;--text:#f0ecff;--muted:#8888aa}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;line-height:1.6}
a{text-decoration:none;color:inherit}
.announce{background:var(--accent);text-align:center;padding:9px 16px;font-size:12px;font-weight:700;letter-spacing:.5px;color:#fff}
.announce span{opacity:.85;margin:0 8px}
nav{background:var(--surface);padding:0 5%;height:62px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.07);position:sticky;top:0;z-index:100}
.logo{font-size:18px;font-weight:900;letter-spacing:-.5px;color:var(--accent)}
.nav-links{display:flex;gap:24px;list-style:none}
.nav-links a{font-size:13px;font-weight:600;color:var(--muted);transition:color .2s}
.nav-links a:hover{color:var(--text)}
.nav-right{display:flex;align-items:center;gap:10px}
.stock-pill{font-size:11px;font-weight:700;padding:5px 12px;background:rgba(255,60,60,.12);color:#ff6666;border:1px solid rgba(255,60,60,.3);border-radius:99px}
.btn-nav{padding:9px 20px;background:var(--accent);color:#fff;border-radius:7px;font-size:12px;font-weight:800;transition:opacity .2s;cursor:pointer}
.btn-nav:hover{opacity:.85}
#hero{min-height:88vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 5%;position:relative;overflow:hidden}
#hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 30%,rgba(108,99,255,.18) 0%,transparent 70%);pointer-events:none}
.hero-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 16px;background:rgba(255,200,60,.1);border:1px solid rgba(255,200,60,.3);border-radius:99px;font-size:12px;font-weight:700;color:#ffc83c;margin-bottom:20px}
.hero-badge::before{content:'🔥'}
h1{font-size:clamp(32px,5.5vw,62px);font-weight:900;letter-spacing:-1.5px;line-height:1.06;margin-bottom:16px;max-width:800px}
h1 em{font-style:normal;color:var(--accent)}
.hero-sub{font-size:17px;color:var(--muted);max-width:580px;line-height:1.7;margin-bottom:28px}
.countdown-wrap{margin-bottom:32px}
.countdown-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.countdown{display:flex;gap:12px;justify-content:center}
.count-block{background:var(--card);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:14px 18px;min-width:60px;text-align:center}
.count-num{font-size:28px;font-weight:900;color:var(--accent);display:block;letter-spacing:-1px;font-variant-numeric:tabular-nums}
.count-lbl{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);display:block;margin-top:2px}
.hero-ctas{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:16px}
.btn-primary{padding:16px 38px;background:var(--accent);color:#fff;border-radius:10px;font-size:15px;font-weight:900;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:all .2s;box-shadow:0 4px 24px rgba(0,0,0,.3);border:none}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.4)}
.btn-secondary{padding:14px 28px;background:transparent;color:var(--text);border:2px solid rgba(255,255,255,.15);border-radius:10px;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:7px;cursor:pointer;transition:all .2s}
.btn-secondary:hover{border-color:var(--accent);color:var(--accent)}
.social-proof{font-size:13px;color:var(--muted)}
.social-proof strong{color:var(--text)}
#products{padding:80px 5%;background:var(--surface)}
.products-inner{max-width:1100px;margin:0 auto}
.section-header{text-align:center;margin-bottom:48px}
.section-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
h2{font-size:clamp(24px,3.5vw,38px);font-weight:900;letter-spacing:-1px}
.products-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.product-card{background:var(--card);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;transition:transform .2s,box-shadow .2s}
.product-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.4)}
.product-img{height:200px;background:linear-gradient(135deg,var(--bg) 0%,var(--surface) 100%);display:flex;align-items:center;justify-content:center;font-size:48px;position:relative}
.badge-sold{position:absolute;top:10px;right:10px;background:rgba(255,60,60,.9);color:#fff;font-size:10px;font-weight:800;padding:4px 9px;border-radius:6px}
.product-info{padding:16px}
.product-title{font-size:14px;font-weight:800;margin-bottom:6px}
.product-sold{font-size:11px;color:var(--muted);margin-bottom:8px}
.product-sold strong{color:#ffc83c}
.product-price{font-size:18px;font-weight:900;color:var(--accent);margin-bottom:10px}
.product-old{text-decoration:line-through;font-size:13px;color:var(--muted);margin-left:6px;font-weight:400}
.product-cta{width:100%;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;transition:opacity .2s}
.product-cta:hover{opacity:.85}
#reviews{padding:70px 5%;overflow:hidden}
.reviews-inner{max-width:1100px;margin:0 auto}
.reviews-track{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:32px}
.review-card{background:var(--card);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:20px;max-width:280px;flex-shrink:0}
.review-stars{font-size:13px;color:var(--accent);margin-bottom:8px}
.review-text{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:10px}
.review-author{font-size:12px;font-weight:700;color:var(--text)}
#badges{padding:50px 5%;background:var(--surface)}
.badges-inner{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center}
.guarantee-badge{padding:24px 16px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:var(--card)}
.badge-icon{font-size:28px;margin-bottom:10px}
.badge-title{font-size:13px;font-weight:800;margin-bottom:5px;color:var(--text)}
.badge-desc{font-size:11px;color:var(--muted);line-height:1.5}
#email-capture{padding:80px 5%;text-align:center;background:linear-gradient(180deg,var(--bg) 0%,rgba(108,99,255,.12) 100%)}
#email-capture h2{font-size:clamp(24px,4vw,38px);font-weight:900;letter-spacing:-1px;margin-bottom:10px}
#email-capture p{font-size:15px;color:var(--muted);margin-bottom:28px;max-width:420px;margin-left:auto;margin-right:auto;line-height:1.7}
.email-form{display:flex;gap:8px;max-width:400px;margin:0 auto}
.email-form input{flex:1;padding:13px 18px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--text);font-size:14px;outline:none}
.email-form input:focus{border-color:var(--accent)}
.email-form button{padding:13px 22px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;transition:opacity .2s}
.email-form button:hover{opacity:.85}
.success-msg{display:none;padding:14px 20px;font-size:14px;font-weight:600;background:rgba(108,99,255,.15);border:1px solid rgba(108,99,255,.3);border-radius:10px;max-width:400px;margin:0 auto;color:var(--text)}
footer{padding:48px 5% 24px;background:var(--surface);border-top:1px solid rgba(255,255,255,.06)}
.footer-top{display:flex;justify-content:space-between;gap:28px;flex-wrap:wrap;margin-bottom:32px}
.footer-brand .logo{font-size:16px}
.footer-brand p{font-size:12px;color:var(--muted);margin-top:7px;line-height:1.6;max-width:200px}
.footer-col h4{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
.footer-col a{display:block;font-size:13px;color:rgba(255,255,255,.5);margin-bottom:7px;transition:color .2s}
.footer-col a:hover{color:var(--text)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.06);padding-top:16px;font-size:11px;color:rgba(255,255,255,.2);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
.afterpay-note{font-size:11px;color:var(--muted);margin-top:14px}
@media(max-width:900px){.products-grid{grid-template-columns:repeat(2,1fr)}.badges-inner{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.nav-links{display:none}.products-grid{grid-template-columns:1fr}.badges-inner{grid-template-columns:1fr}.footer-top{flex-direction:column}.email-form{flex-direction:column}.countdown{gap:8px}}
</style>
</head>
<body>
<div class="announce">🚚 FREE AU Shipping on orders $99+ <span>·</span> Afterpay in 4 installments <span>·</span> Ships from AU warehouse 🇦🇺</div>
<nav>
  <span class="logo">{BRAND_NAME}</span>
  <ul class="nav-links">
    <li><a href="#products" onclick="event.preventDefault();document.getElementById('products').scrollIntoView({behavior:'smooth'})">Shop</a></li>
    <li><a href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a></li>
    <li><a href="#badges" onclick="event.preventDefault();document.getElementById('badges').scrollIntoView({behavior:'smooth'})">Guarantees</a></li>
  </ul>
  <div class="nav-right">
    <span class="stock-pill">⚠ Limited Stock</span>
    <a class="btn-nav" href="#products" onclick="event.preventDefault();document.getElementById('products').scrollIntoView({behavior:'smooth'})">Shop Now</a>
  </div>
</nav>

<section id="hero">
  <div class="hero-badge">SALE ENDS SOON</div>
  <h1>{HEADLINE}</h1>
  <p class="hero-sub">{SUBHEADLINE}</p>
  <div class="countdown-wrap">
    <div class="countdown-label">Sale ends in</div>
    <div class="countdown">
      <div class="count-block"><span class="count-num" id="c-h">00</span><span class="count-lbl">Hours</span></div>
      <div class="count-block"><span class="count-num" id="c-m">00</span><span class="count-lbl">Mins</span></div>
      <div class="count-block"><span class="count-num" id="c-s">00</span><span class="count-lbl">Secs</span></div>
    </div>
  </div>
  <div class="hero-ctas">
    <a class="btn-primary" href="#products" onclick="event.preventDefault();document.getElementById('products').scrollIntoView({behavior:'smooth'})">🛒 {CTA_PRIMARY}</a>
    <a class="btn-secondary" href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">{CTA_SECONDARY}</a>
  </div>
  <p class="social-proof">⭐ <strong>127 people</strong> bought this today · Ships from AU warehouse</p>
  <p class="afterpay-note">Pay in 4 with Afterpay · Zip available at checkout</p>
</section>

<section id="products">
  <div class="products-inner">
    <div class="section-header">
      <div class="section-label">Featured Products</div>
      <h2>{PRODUCT_NAME} — Ships from <em style="font-style:normal;color:{BRAND_COLOR}">AU Warehouse</em></h2>
    </div>
    <div class="products-grid">
      <div class="product-card">
        <div class="product-img">🛍️<span class="badge-sold">🔥 HOT</span></div>
        <div class="product-info">
          <div class="product-title">{PRODUCT_NAME} — Standard</div>
          <div class="product-sold"><strong>43</strong> sold today</div>
          <div class="product-price">$49.95 AUD <span class="product-old">$79.95</span></div>
          <button class="product-cta" onclick="document.getElementById('email-capture').scrollIntoView({behavior:'smooth'})">Add to Cart</button>
        </div>
      </div>
      <div class="product-card">
        <div class="product-img">✨<span class="badge-sold">LIMITED</span></div>
        <div class="product-info">
          <div class="product-title">{PRODUCT_NAME} — Pro Bundle</div>
          <div class="product-sold"><strong>18</strong> sold today</div>
          <div class="product-price">$89.95 AUD <span class="product-old">$139.95</span></div>
          <button class="product-cta" onclick="document.getElementById('email-capture').scrollIntoView({behavior:'smooth'})">Add to Cart</button>
        </div>
      </div>
      <div class="product-card">
        <div class="product-img">🎁</div>
        <div class="product-info">
          <div class="product-title">{PRODUCT_NAME} — Gift Set</div>
          <div class="product-sold"><strong>9</strong> sold today</div>
          <div class="product-price">$129.95 AUD <span class="product-old">$199.95</span></div>
          <button class="product-cta" onclick="document.getElementById('email-capture').scrollIntoView({behavior:'smooth'})">Add to Cart</button>
        </div>
      </div>
    </div>
    <div class="features-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-top:32px">
      {FEATURES_HTML}
    </div>
  </div>
</section>

<section id="reviews">
  <div class="reviews-inner">
    <div class="section-header">
      <div class="section-label">Customer Reviews</div>
      <h2>⭐ 4.9 / 5 from 847 Reviews</h2>
    </div>
    <div class="reviews-track">
      <div class="review-card"><div class="review-stars">★★★★★</div><p class="review-text">"Absolutely smashed my expectations. Quality is top notch and arrived from the AU warehouse super fast."</p><div class="review-author">Brad H. — Gold Coast, QLD</div></div>
      <div class="review-card"><div class="review-stars">★★★★★</div><p class="review-text">"Limited stock for real! Almost missed out. So glad I grabbed it — worth every cent."</p><div class="review-author">Mia C. — Melbourne, VIC</div></div>
      <div class="review-card"><div class="review-stars">★★★★★</div><p class="review-text">"Used Afterpay, arrived in 3 days. Exactly what I needed. Will be buying the bundle next."</p><div class="review-author">Daniel R. — Sydney, NSW</div></div>
      <div class="review-card"><div class="review-stars">★★★★★</div><p class="review-text">"Was sceptical at first but the reviews were right. Brilliant product at a fair price."</p><div class="review-author">Jess P. — Perth, WA</div></div>
    </div>
  </div>
</section>

<section id="badges">
  <div class="badges-inner">
    <div class="guarantee-badge"><div class="badge-icon">🛡️</div><div class="badge-title">30-Day Guarantee</div><div class="badge-desc">Not happy? Full refund. No questions asked.</div></div>
    <div class="guarantee-badge"><div class="badge-icon">🚚</div><div class="badge-title">Free AU Shipping</div><div class="badge-desc">Orders over $99. Ships from Australian warehouse.</div></div>
    <div class="guarantee-badge"><div class="badge-icon">💳</div><div class="badge-title">Afterpay / Zip</div><div class="badge-desc">Split into 4 payments. Zero interest.</div></div>
    <div class="guarantee-badge"><div class="badge-icon">🔒</div><div class="badge-title">Secure Checkout</div><div class="badge-desc">256-bit SSL. All major cards accepted.</div></div>
  </div>
</section>

<section id="email-capture">
  <h2>Get Early Access + 15% Off</h2>
  <p>Join {BRAND_NAME} insiders. First access to new drops, exclusive Afterpay deals, and AU-only offers.</p>
  <form class="email-form" onsubmit="event.preventDefault();this.style.display='none';document.getElementById('bold-success').style.display='block'">
    <input type="email" placeholder="Enter your email" required>
    <button type="submit">Get Access</button>
  </form>
  <div id="bold-success" class="success-msg">🎉 You're in! Check your inbox for 15% off.</div>
</section>

<footer>
  <div class="footer-top">
    <div class="footer-brand">
      <div class="logo">{BRAND_NAME}</div>
      <p>{ABOUT}</p>
    </div>
    <div class="footer-col">
      <h4>Shop</h4>
      <a href="#products" onclick="event.preventDefault();document.getElementById('products').scrollIntoView({behavior:'smooth'})">All Products</a>
      <a href="#reviews" onclick="event.preventDefault();document.getElementById('reviews').scrollIntoView({behavior:'smooth'})">Reviews</a>
      <a href="#badges" onclick="event.preventDefault();document.getElementById('badges').scrollIntoView({behavior:'smooth'})">Guarantees</a>
    </div>
    <div class="footer-col">
      <h4>Support</h4>
      <a href="mailto:hello@{BRAND_SLUG}.com.au">Contact</a>
      <a href="mailto:returns@{BRAND_SLUG}.com.au">Returns</a>
      <a href="mailto:hello@{BRAND_SLUG}.com.au">Shipping</a>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/refund-policy">Refund Policy</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 {BRAND_NAME}. All rights reserved. ABN: [Enter your ABN]</span>
    <span>All prices AUD incl. GST · Ships from Australia 🇦🇺</span>
  </div>
</footer>
<script>
(function(){
  function pad(n){return n<10?'0'+n:n}
  var end=Date.now()+18*3600*1000;
  function tick(){
    var d=end-Date.now();
    if(d<=0){document.getElementById('c-h').textContent='00';document.getElementById('c-m').textContent='00';document.getElementById('c-s').textContent='00';return}
    document.getElementById('c-h').textContent=pad(Math.floor(d/3600000));
    document.getElementById('c-m').textContent=pad(Math.floor((d%3600000)/60000));
    document.getElementById('c-s').textContent=pad(Math.floor((d%60000)/1000));
    setTimeout(tick,1000);
  }
  tick();
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=this.getAttribute('href').slice(1);
      var t=document.getElementById(id);
      if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}
    });
  });
})();
</script>
</body>
</html>`,
}

// ── Template C — Premium Brand ────────────────────────────────────────────
const templatePremiumBrand: WebsiteTemplate = {
  id: 'template-premium-brand',
  name: 'Premium Brand',
  description: 'Aesop-inspired luxury design. Brand story, founder section, and premium email capture.',
  thumbnail: '✨',
  category: 'premium',
  html: `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{BRAND_NAME}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:{BRAND_COLOR};--gold:#c9a84c;--bg:#faf9f7;--surface:#f3f0ea;--dark:#1c1a17;--text:#2a2520;--muted:#8a8278}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',system-ui,sans-serif;line-height:1.7}
a{text-decoration:none;color:inherit}
h1,h2,h3,h4{font-family:'Playfair Display',Georgia,serif;line-height:1.15}
nav{padding:0 6%;height:70px;display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-bottom:1px solid rgba(0,0,0,0.06);position:sticky;top:0;z-index:100}
.logo{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:900;letter-spacing:-.3px;color:var(--dark)}
.logo em{font-style:italic;color:var(--accent)}
.nav-links{display:flex;gap:32px;list-style:none}
.nav-links a{font-size:13px;font-weight:500;color:var(--muted);letter-spacing:.3px;transition:color .2s}
.nav-links a:hover{color:var(--text)}
.nav-right{display:flex;align-items:center;gap:16px}
.nav-au{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold)}
.nav-cta{padding:10px 22px;border:1.5px solid var(--accent);color:var(--accent);border-radius:6px;font-size:12px;font-weight:600;letter-spacing:.5px;transition:all .2s;cursor:pointer}
.nav-cta:hover{background:var(--accent);color:#fff}
#hero{min-height:92vh;display:flex;align-items:center;padding:80px 6%;position:relative;overflow:hidden;background:var(--dark)}
#hero::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(201,168,76,.08) 0%,transparent 60%)}
.hero-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;width:100%}
.hero-content{color:#faf9f7}
.hero-overline{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.hero-overline::before{content:'';display:block;width:32px;height:1px;background:var(--gold)}
.hero-overline span{font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold)}
h1{font-size:clamp(36px,5vw,58px);font-weight:900;letter-spacing:-.5px;color:#faf9f7;margin-bottom:20px}
h1 em{font-style:italic;color:var(--gold)}
.hero-sub{font-size:16px;color:rgba(250,249,247,.65);line-height:1.75;margin-bottom:36px;max-width:440px}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:40px}
.btn-primary{padding:15px 34px;background:var(--gold);color:var(--dark);border-radius:6px;font-size:13px;font-weight:700;letter-spacing:.5px;display:inline-flex;align-items:center;gap:8px;transition:all .2s;cursor:pointer;border:none}
.btn-primary:hover{opacity:.9;transform:translateY(-1px)}
.btn-ghost{padding:13px 28px;background:transparent;color:rgba(250,249,247,.8);border:1.5px solid rgba(250,249,247,.2);border-radius:6px;font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:7px;transition:all .2s;cursor:pointer}
.btn-ghost:hover{border-color:rgba(250,249,247,.5);color:#faf9f7}
.au-marks{display:flex;flex-wrap:wrap;gap:20px}
.au-mark{display:flex;align-items:center;gap:7px;font-size:12px;color:rgba(250,249,247,.4);font-weight:400}
.au-mark::before{content:'—';color:var(--gold);font-size:14px}
.hero-visual{display:flex;align-items:center;justify-content:center}
.hero-card{background:rgba(250,249,247,.05);border:1px solid rgba(250,249,247,.1);border-radius:16px;padding:40px;text-align:center;min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.product-glyph{font-size:64px;margin-bottom:16px}
.product-name-display{font-family:'Playfair Display',Georgia,serif;font-size:16px;font-style:italic;color:var(--gold)}
#brand-story{padding:100px 6%;background:var(--bg)}
.story-inner{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.story-tag{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:12px}
.story-inner h2{font-size:clamp(28px,3.5vw,42px);margin-bottom:20px;letter-spacing:-.5px}
.story-inner p{font-size:15px;color:var(--muted);line-height:1.8;margin-bottom:16px}
.story-visual{background:var(--surface);border-radius:14px;min-height:320px;display:flex;align-items:center;justify-content:center;font-size:56px;border:1px solid rgba(0,0,0,.06)}
.story-facts{display:flex;flex-wrap:wrap;gap:20px;margin-top:28px}
.fact{border-left:2px solid var(--accent);padding-left:14px}
.fact-num{font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:900;color:var(--dark)}
.fact-label{font-size:12px;color:var(--muted);font-weight:500;margin-top:2px}
#product-feature{padding:100px 6%;background:var(--surface)}
.feature-inner{max-width:1080px;margin:0 auto;text-align:center}
.feature-inner h2{font-size:clamp(26px,3.5vw,40px);margin-bottom:14px}
.feature-inner .section-intro{font-size:16px;color:var(--muted);max-width:500px;margin:0 auto 56px;line-height:1.75}
.features-premium{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:left}
.fp{padding:28px;background:var(--bg);border-radius:12px;border:1px solid rgba(0,0,0,.07)}
.fp-dot{width:36px;height:36px;border-radius:50%;background:color-mix(in srgb,var(--accent) 12%,transparent);display:flex;align-items:center;justify-content:center;font-size:14px;margin-bottom:16px;border:1px solid color-mix(in srgb,var(--accent) 25%,transparent)}
.fp h3{font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:700;margin-bottom:8px}
.fp p{font-size:13px;color:var(--muted);line-height:1.7}
#lead-capture{padding:100px 6%;background:var(--dark);text-align:center;position:relative;overflow:hidden}
#lead-capture::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 50%,rgba(201,168,76,.12) 0%,transparent 70%);pointer-events:none}
.lead-overline{font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold);margin-bottom:16px}
#lead-capture h2{font-size:clamp(26px,4vw,42px);color:#faf9f7;margin-bottom:12px;letter-spacing:-.5px}
#lead-capture p{font-size:15px;color:rgba(250,249,247,.55);max-width:460px;margin:0 auto 32px;line-height:1.75}
.lead-form{display:flex;gap:8px;max-width:400px;margin:0 auto}
.lead-form input{flex:1;padding:14px 20px;border-radius:7px;border:1px solid rgba(250,249,247,.15);background:rgba(250,249,247,.06);color:#faf9f7;font-size:14px;outline:none;font-family:inherit}
.lead-form input:focus{border-color:var(--gold)}
.lead-form input::placeholder{color:rgba(250,249,247,.3)}
.lead-form button{padding:14px 24px;background:var(--gold);color:var(--dark);border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:opacity .2s}
.lead-form button:hover{opacity:.88}
.lead-guarantee{font-size:12px;color:rgba(250,249,247,.3);margin-top:14px}
.success-msg{display:none;padding:14px 24px;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);border-radius:8px;color:var(--gold);font-size:14px;font-weight:600;max-width:400px;margin:0 auto}
#founder{padding:100px 6%;background:var(--bg)}
.founder-inner{max-width:900px;margin:0 auto;display:grid;grid-template-columns:200px 1fr;gap:60px;align-items:center}
.founder-photo{width:160px;height:160px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;font-size:48px;border:3px solid rgba(0,0,0,.07)}
.founder-tag{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.founder-name{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;margin-bottom:4px}
.founder-title{font-size:13px;color:var(--muted);margin-bottom:16px}
.founder-quote{font-family:'Playfair Display',Georgia,serif;font-size:18px;font-style:italic;color:var(--dark);line-height:1.6;border-left:3px solid var(--accent);padding-left:20px}
footer{padding:60px 6% 28px;background:var(--dark);color:rgba(250,249,247,.6)}
.footer-top{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px}
.footer-brand .logo{color:#faf9f7}
.footer-brand p{font-size:12px;color:rgba(250,249,247,.3);margin-top:10px;line-height:1.7;max-width:200px}
.footer-au-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--gold);margin-top:16px;letter-spacing:.5px}
.footer-col h4{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(250,249,247,.25);margin-bottom:14px}
.footer-col a{display:block;font-size:13px;color:rgba(250,249,247,.45);margin-bottom:8px;transition:color .2s}
.footer-col a:hover{color:#faf9f7}
.footer-bottom{border-top:1px solid rgba(250,249,247,.07);padding-top:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:11px;color:rgba(250,249,247,.2)}
@media(max-width:960px){.hero-inner{grid-template-columns:1fr}.hero-visual{display:none}.story-inner{grid-template-columns:1fr}.story-visual{display:none}.features-premium{grid-template-columns:1fr 1fr}.footer-top{grid-template-columns:1fr 1fr}.founder-inner{grid-template-columns:1fr}}
@media(max-width:600px){.nav-links{display:none}.features-premium{grid-template-columns:1fr}.footer-top{grid-template-columns:1fr}.lead-form{flex-direction:column}.hero-ctas{flex-direction:column;align-items:flex-start}}
</style>
</head>
<body>
<nav>
  <span class="logo">{BRAND_NAME}</span>
  <ul class="nav-links">
    <li><a href="#brand-story" onclick="event.preventDefault();document.getElementById('brand-story').scrollIntoView({behavior:'smooth'})">Our Story</a></li>
    <li><a href="#product-feature" onclick="event.preventDefault();document.getElementById('product-feature').scrollIntoView({behavior:'smooth'})">Products</a></li>
    <li><a href="#founder" onclick="event.preventDefault();document.getElementById('founder').scrollIntoView({behavior:'smooth'})">Founder</a></li>
  </ul>
  <div class="nav-right">
    <span class="nav-au">🇦🇺 Proudly Australian</span>
    <a class="nav-cta" href="#lead-capture" onclick="event.preventDefault();document.getElementById('lead-capture').scrollIntoView({behavior:'smooth'})">Explore</a>
  </div>
</nav>

<section id="hero">
  <div class="hero-inner">
    <div class="hero-content">
      <div class="hero-overline"><span>Craft · Quality · Australia</span></div>
      <h1>{HEADLINE}</h1>
      <p class="hero-sub">{SUBHEADLINE}</p>
      <div class="hero-ctas">
        <a class="btn-primary" href="#product-feature" onclick="event.preventDefault();document.getElementById('product-feature').scrollIntoView({behavior:'smooth'})">{CTA_PRIMARY}</a>
        <a class="btn-ghost" href="#brand-story" onclick="event.preventDefault();document.getElementById('brand-story').scrollIntoView({behavior:'smooth'})">{CTA_SECONDARY}</a>
      </div>
      <div class="au-marks">
        <span class="au-mark">Proudly Australian</span>
        <span class="au-mark">Carbon-offset shipping</span>
        <span class="au-mark">Afterpay available</span>
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-card">
        <span class="product-glyph">🌿</span>
        <div class="product-name-display">{PRODUCT_NAME}</div>
      </div>
    </div>
  </div>
</section>

<section id="brand-story">
  <div class="story-inner">
    <div>
      <div class="story-tag">Our Story</div>
      <h2>Where <em>Craft</em> Meets {NICHE}</h2>
      <p>{ABOUT}</p>
      <p>We believe in making things properly — sustainable materials, ethical sourcing, and Australian craftsmanship that lasts.</p>
      <div class="story-facts">
        <div class="fact"><div class="fact-num">3K+</div><div class="fact-label">Australian customers</div></div>
        <div class="fact"><div class="fact-num">4.9★</div><div class="fact-label">Average rating</div></div>
        <div class="fact"><div class="fact-num">100%</div><div class="fact-label">Carbon-offset shipping</div></div>
      </div>
    </div>
    <div class="story-visual">🌿</div>
  </div>
</section>

<section id="product-feature">
  <div class="feature-inner">
    <div class="story-tag">Why {BRAND_NAME}</div>
    <h2>Thoughtfully Made for<br><em style="font-style:italic;color:{BRAND_COLOR}">Australian Living</em></h2>
    <p class="section-intro">Every detail considered. Every material chosen with intention. This is what premium looks like.</p>
    <div class="features-premium">
      {FEATURES_HTML}
    </div>
  </div>
</section>

<section id="lead-capture">
  <div class="lead-overline">Exclusive Access</div>
  <h2>The {BRAND_NAME} Edit</h2>
  <p>Receive our curated guide to {NICHE}, plus early access to limited releases and members-only pricing.</p>
  <form class="lead-form" onsubmit="event.preventDefault();this.style.display='none';document.getElementById('prem-success').style.display='block'">
    <input type="email" placeholder="Your email address" required>
    <button type="submit">Join the Edit</button>
  </form>
  <div id="prem-success" class="success-msg">Welcome to the Edit. Check your inbox.</div>
  <div class="lead-guarantee">No spam, ever. Unsubscribe any time.</div>
</section>

<section id="founder">
  <div class="founder-inner">
    <div class="founder-photo">👤</div>
    <div>
      <div class="founder-tag">From the Founder</div>
      <div class="founder-name">The {BRAND_NAME} Promise</div>
      <div class="founder-title">{NICHE} · Gold Coast, Australia</div>
      <blockquote class="founder-quote">"We started {BRAND_NAME} because we couldn't find {NICHE} products that felt genuinely Australian — thoughtfully made, honestly priced, and built to last."</blockquote>
    </div>
  </div>
</section>

<footer>
  <div class="footer-top">
    <div class="footer-brand">
      <div class="logo">{BRAND_NAME}</div>
      <p>Premium Australian {NICHE}. Crafted with intention. Delivered with care.</p>
      <div class="footer-au-badge">🇦🇺 Proudly Australian · Carbon-offset</div>
    </div>
    <div class="footer-col">
      <h4>Explore</h4>
      <a href="#brand-story" onclick="event.preventDefault();document.getElementById('brand-story').scrollIntoView({behavior:'smooth'})">Our Story</a>
      <a href="#product-feature" onclick="event.preventDefault();document.getElementById('product-feature').scrollIntoView({behavior:'smooth'})">Products</a>
      <a href="#founder" onclick="event.preventDefault();document.getElementById('founder').scrollIntoView({behavior:'smooth'})">Founder</a>
    </div>
    <div class="footer-col">
      <h4>Support</h4>
      <a href="mailto:hello@{BRAND_SLUG}.com.au">Contact Us</a>
      <a href="mailto:returns@{BRAND_SLUG}.com.au">Returns</a>
      <a href="mailto:hello@{BRAND_SLUG}.com.au">Afterpay Info</a>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/refund-policy">Refund Policy</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 {BRAND_NAME}. All rights reserved. ABN: [Enter your ABN]</span>
    <span>All prices AUD incl. GST · Australian Consumer Law applies</span>
  </div>
</footer>
<script>
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var id=this.getAttribute('href').slice(1);
    var t=document.getElementById(id);
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}
  });
});
</script>
</body>
</html>`,
}

// ── Export ────────────────────────────────────────────────────────────────────
export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  templateDTCMinimal,
  templateDropshipBold,
  templatePremiumBrand,
]

export function buildTemplatePreview(
  template: WebsiteTemplate,
  data: {
    headline?: string
    subheadline?: string
    ctaPrimary?: string
    ctaSecondary?: string
    features?: string[]
    about?: string
    trustBadges?: string[]
  } | null,
  brandName: string,
  accentColor: string,
  productName: string,
  niche: string
): string {
  const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const headline = data?.headline || `Premium ${niche} for Australians`
  const subheadline = data?.subheadline || `Quality ${niche} delivered to your door. Proudly Australian.`
  const ctaPrimary = data?.ctaPrimary || 'Shop Now'
  const ctaSecondary = data?.ctaSecondary || 'Learn More'
  const about = data?.about || `${brandName} is an Australian-owned ${niche} brand focused on quality, value, and exceptional service.`

  const featuresHtml = (data?.features || [
    `Premium quality ${niche}`,
    'Free AU shipping on orders $99+',
    'Afterpay available at checkout',
    '30-day money-back guarantee',
    'Ships from Australian warehouse',
  ]).map((f, i) => {
    const [title, desc] = f.includes(' — ') ? f.split(' — ') : [f, `Quality feature for Australian customers. Designed for performance and value.`]
    return `<div class="feat feat-card fp">
      <div class="feat-num feature-num fp-dot">${String(i + 1).padStart(2, '0')}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>`
  }).join('\n')

  return template.html
    .replace(/{BRAND_NAME}/g, brandName || 'Your Brand')
    .replace(/{BRAND_COLOR}/g, accentColor || '#d4af37')
    .replace(/{PRODUCT_NAME}/g, productName || 'Our Product')
    .replace(/{NICHE}/g, niche || 'products')
    .replace(/{HEADLINE}/g, headline)
    .replace(/{SUBHEADLINE}/g, subheadline)
    .replace(/{CTA_PRIMARY}/g, ctaPrimary)
    .replace(/{CTA_SECONDARY}/g, ctaSecondary)
    .replace(/{FEATURES_HTML}/g, featuresHtml)
    .replace(/{ABOUT}/g, about)
    .replace(/{BRAND_SLUG}/g, brandSlug || 'yourbrand')
}
