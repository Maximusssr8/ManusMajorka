import type { StorePlan } from './website-api';

function esc(s: string | number | undefined | null): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function stars(n = 5): string { return '★'.repeat(Math.min(5, Math.max(0, Math.round(n)))); }
function colorRgb(hex: string): string {
  const c = (hex || '#d4af37').replace('#', '');
  const r = parseInt(c.slice(0,2),16)||212, g=parseInt(c.slice(2,4),16)||175, b=parseInt(c.slice(4,6),16)||55;
  return `${r},${g},${b}`;
}

// ── Per-template design tokens ────────────────────────────────────────────────
interface TemplateTokens {
  bg: string; bgAlt: string; surface: string;
  text: string; textMuted: string;
  primary: string; accent: string;
  headingFont: string; bodyFont: string;
  radius: string; navBg: string; navBorder: string;
  trustBg: string; trustText: string; trustBorder: string;
  productBg: string; productText: string;
  testimonialBg: string; testimonialCard: string; testimonialBorder: string; testimonialText: string;
  howBg: string; howText: string; howNumberOpacity: string;
  faqBg: string; faqText: string;
  heroBadgeColor: string; heroH1Weight: string; heroH1Style: string;
  btnPrimaryBg: string; btnPrimaryColor: string; btnOutlineBorder: string; btnOutlineColor: string;
  announcementBg: string; statsBg: string;
  googleFonts: string;
}

function getTokens(template: string, primary: string, accent: string): TemplateTokens {
  const t = (template || '').toLowerCase().replace(/[\s_]/g, '-');

  if (t.includes('bloom') || t.includes('beauty')) return {
    bg:'#fdf6f8', bgAlt:'#fff0f5', surface:'#ffffff', text:'#2d1b25', textMuted:'rgba(45,27,37,0.55)',
    primary:'#c9607f', accent:'#e8a0b4', headingFont:'Cormorant Garamond', bodyFont:'Nunito',
    radius:'20px', navBg:'rgba(253,246,248,0.97)', navBorder:'rgba(201,96,127,0.12)',
    trustBg:'#fff0f5', trustText:'#2d1b25', trustBorder:'rgba(201,96,127,0.1)',
    productBg:'#fff8f9', productText:'#2d1b25',
    testimonialBg:'#fff0f5', testimonialCard:'#ffffff', testimonialBorder:'#c9607f', testimonialText:'#2d1b25',
    howBg:'#fdf6f8', howText:'#2d1b25', howNumberOpacity:'0.12',
    faqBg:'#ffffff', faqText:'#2d1b25',
    heroBadgeColor:'#c9607f', heroH1Weight:'500', heroH1Style:'italic',
    btnPrimaryBg:'linear-gradient(135deg,#c9607f,#e8a0b4)', btnPrimaryColor:'#fff',
    btnOutlineBorder:'#c9607f', btnOutlineColor:'#c9607f',
    announcementBg:'linear-gradient(90deg,#c9607f,#e8a0b4)', statsBg:'linear-gradient(135deg,#c9607f,#a84d6a)',
    googleFonts:'Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Nunito:wght@300;400;500;600',
  };

  if (t.includes('tech') || t.includes('mono') || t.includes('saas')) return {
    bg:'#0d1117', bgAlt:'#161b22', surface:'#161b22', text:'#e6edf3', textMuted:'rgba(230,237,243,0.5)',
    primary:'#2ea043', accent:'#58a6ff', headingFont:'JetBrains Mono', bodyFont:'Inter',
    radius:'6px', navBg:'rgba(13,17,23,0.98)', navBorder:'rgba(48,54,61,0.8)',
    trustBg:'#161b22', trustText:'#e6edf3', trustBorder:'rgba(48,54,61,0.5)',
    productBg:'#0d1117', productText:'#e6edf3',
    testimonialBg:'#0d1117', testimonialCard:'#161b22', testimonialBorder:'#2ea043', testimonialText:'#e6edf3',
    howBg:'#161b22', howText:'#e6edf3', howNumberOpacity:'0.1',
    faqBg:'#0d1117', faqText:'#e6edf3',
    heroBadgeColor:'#58a6ff', heroH1Weight:'700', heroH1Style:'normal',
    btnPrimaryBg:'#2ea043', btnPrimaryColor:'#fff',
    btnOutlineBorder:'#30363d', btnOutlineColor:'#e6edf3',
    announcementBg:'#238636', statsBg:'#161b22',
    googleFonts:'JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600',
  };

  if (t.includes('premium') || t.includes('luxury')) return {
    bg:'#0a0806', bgAlt:'#120f0a', surface:'#120f0a', text:'#f5f0e8', textMuted:'rgba(245,240,232,0.45)',
    primary:'#c9a84c', accent:'#e8d5a0', headingFont:'Playfair Display', bodyFont:'Lato',
    radius:'2px', navBg:'rgba(10,8,6,0.97)', navBorder:'rgba(201,168,76,0.12)',
    trustBg:'#120f0a', trustText:'#f5f0e8', trustBorder:'rgba(201,168,76,0.1)',
    productBg:'#0a0806', productText:'#f5f0e8',
    testimonialBg:'#0a0806', testimonialCard:'#120f0a', testimonialBorder:'rgba(201,168,76,0.3)', testimonialText:'#f5f0e8',
    howBg:'#120f0a', howText:'#f5f0e8', howNumberOpacity:'0.08',
    faqBg:'#0a0806', faqText:'#f5f0e8',
    heroBadgeColor:'#c9a84c', heroH1Weight:'300', heroH1Style:'italic',
    btnPrimaryBg:'transparent', btnPrimaryColor:'#c9a84c',
    btnOutlineBorder:'rgba(201,168,76,0.3)', btnOutlineColor:'rgba(245,240,232,0.6)',
    announcementBg:'rgba(201,168,76,0.08)', statsBg:'#120f0a',
    googleFonts:'Playfair+Display:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Lato:wght@300;400;700',
  };

  if (t.includes('coastal')) return {
    bg:'#f7f4f0', bgAlt:'#edf4f2', surface:'#ffffff', text:'#1e3a32', textMuted:'rgba(30,58,50,0.55)',
    primary:'#2a9d8f', accent:'#e76f51', headingFont:'Montserrat', bodyFont:'Lato',
    radius:'12px', navBg:'rgba(247,244,240,0.97)', navBorder:'rgba(0,0,0,0.06)',
    trustBg:'#ffffff', trustText:'#1e3a32', trustBorder:'rgba(0,0,0,0.06)',
    productBg:'#f7f4f0', productText:'#1e3a32',
    testimonialBg:'#edf4f2', testimonialCard:'#ffffff', testimonialBorder:'#2a9d8f', testimonialText:'#1e3a32',
    howBg:'#ffffff', howText:'#1e3a32', howNumberOpacity:'0.1',
    faqBg:'#f7f4f0', faqText:'#1e3a32',
    heroBadgeColor:'#2a9d8f', heroH1Weight:'700', heroH1Style:'normal',
    btnPrimaryBg:'#2a9d8f', btnPrimaryColor:'#fff',
    btnOutlineBorder:'rgba(30,58,50,0.25)', btnOutlineColor:'#1e3a32',
    announcementBg:'#264e45', statsBg:'#2a9d8f',
    googleFonts:'Montserrat:wght@400;500;600;700;800&family=Lato:wght@300;400;700',
  };

  if (t.includes('bold') || t.includes('drop')) return {
    bg:'#0a0a0a', bgAlt:'#111111', surface:'#161616', text:'#ffffff', textMuted:'rgba(255,255,255,0.6)',
    primary:'#ff4500', accent:'#ffcc00', headingFont:'Barlow Condensed', bodyFont:'Inter',
    radius:'4px', navBg:'rgba(10,10,10,0.98)', navBorder:'rgba(255,69,0,0.2)',
    trustBg:'#111111', trustText:'#ffffff', trustBorder:'rgba(255,69,0,0.15)',
    productBg:'#0a0a0a', productText:'#ffffff',
    testimonialBg:'#111111', testimonialCard:'#1a1a1a', testimonialBorder:'#ff4500', testimonialText:'#ffffff',
    howBg:'#111111', howText:'#ffffff', howNumberOpacity:'0.08',
    faqBg:'#0a0a0a', faqText:'#ffffff',
    heroBadgeColor:'#ffcc00', heroH1Weight:'900', heroH1Style:'normal',
    btnPrimaryBg:'#ff4500', btnPrimaryColor:'#fff',
    btnOutlineBorder:'rgba(255,255,255,0.25)', btnOutlineColor:'#ffffff',
    announcementBg:'#ff4500', statsBg:'#ff4500',
    googleFonts:'Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,700&family=Inter:wght@300;400;500;600',
  };

  // DTC Minimal (default) — dark, premium gold
  return {
    bg:'#080808', bgAlt:'#111111', surface:'#111111', text:'#f0ede8', textMuted:'rgba(240,237,232,0.5)',
    primary:'#d4af37', accent:'#f0d060', headingFont:'Syne', bodyFont:'DM Sans',
    radius:'4px', navBg:'rgba(8,8,8,0.97)', navBorder:'rgba(255,255,255,0.05)',
    trustBg:'#f5f3f0', trustText:'#1a1a1a', trustBorder:'rgba(0,0,0,0.06)',
    productBg:'#f5f5f5', productText:'#1a1a1a',
    testimonialBg:'#080808', testimonialCard:'#111111', testimonialBorder:'#d4af37', testimonialText:'rgba(240,237,232,0.85)',
    howBg:'#f5f5f5', howText:'#1a1a1a', howNumberOpacity:'0.12',
    faqBg:'#ffffff', faqText:'#1a1a1a',
    heroBadgeColor:'#d4af37', heroH1Weight:'800', heroH1Style:'normal',
    btnPrimaryBg:'#d4af37', btnPrimaryColor:'#080808',
    btnOutlineBorder:'rgba(240,237,232,0.25)', btnOutlineColor:'rgba(240,237,232,0.8)',
    announcementBg:'#d4af37', statsBg:'#111111',
    googleFonts:'Syne:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600',
  };
}

export function buildStoreHTML(plan: StorePlan): string {
  const {
    storeName, tagline, heroHeadline, heroSubheadline, heroCTA,
    productName, productDescription, productBullets, price, afterpayPrice,
    testimonials, faqItems, howItWorks,
    heroImageUrl, productImageUrl,
    primaryColour, accentColour, headingFontName, bodyFontName,
    template, niche, supportEmail,
    supplierUrl, supplierName,
    includeAbout, includeContact, products,
  } = plan;

  const tk = getTokens(template, primaryColour, accentColour);
  const rgb = colorRgb(tk.primary);
  const isLight = ['coastal','bloom','beauty','minimal'].some(x => (template||'').toLowerCase().includes(x));
  const onerror = `this.onerror=null;this.parentElement.style.background='linear-gradient(135deg,rgba(${rgb},0.25),${tk.surface})';this.style.display='none'`;
  // Debug log for Vercel
  console.log('[store-template] heroImageUrl:', heroImageUrl?.slice(0,80), '| productImageUrl:', productImageUrl?.slice(0,80));

  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${tk.googleFonts}&display=swap`;

  const bullets = (productBullets||[]).slice(0,5).map(b=>`<li>${esc(b)}</li>`).join('\n');
  const testimonialCards = (testimonials||[]).slice(0,3).map((t,i)=>`
    <div class="t-card" style="animation-delay:${i*0.12}s">
      <div class="t-stars">${stars(t.rating)}</div>
      <p class="t-text">"${esc(t.text)}"</p>
      <div class="t-author">
        <div class="t-name">${esc(t.name)}</div>
        <div class="t-loc">${esc(t.location)} &nbsp;·&nbsp; <span class="t-verified">✓ Verified</span></div>
      </div>
    </div>`).join('');

  const faqHtml = (faqItems||[]).slice(0,4).map((f,i)=>`
    <details class="faq-item"${i===0?' open':''}>
      <summary class="faq-q">${esc(f.q)}</summary>
      <div class="faq-a">${esc(f.a)}</div>
    </details>`).join('');

  const howHtml = (howItWorks||[]).slice(0,3).map(h=>`
    <div class="how-step reveal">
      <div class="how-num">${esc(h.step)}</div>
      <div class="how-title">${esc(h.title)}</div>
      <p class="how-desc">${esc(h.description)}</p>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(storeName)} — ${esc(tagline)}</title>
<meta name="description" content="${esc(heroSubheadline)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${googleFontsUrl}" rel="stylesheet">
<style>
/* ── Reset ─────────────────────────────── */
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
img{max-width:100%;height:auto;display:block}
a{text-decoration:none;color:inherit}
button{cursor:pointer;font-family:inherit}
ul{list-style:none}
details>summary{list-style:none}
details>summary::-webkit-details-marker{display:none}

/* ── Tokens ─────────────────────────────── */
:root{
  --bg:       ${tk.bg};
  --bg-alt:   ${tk.bgAlt};
  --surface:  ${tk.surface};
  --text:     ${tk.text};
  --muted:    ${tk.textMuted};
  --primary:  ${tk.primary};
  --accent:   ${tk.accent};
  --radius:   ${tk.radius};
  --font-h:   '${tk.headingFont}', ${tk.headingFont.includes('Mono')?'monospace':tk.headingFont.includes('Garamond')||tk.headingFont.includes('Playfair')?'serif':'sans-serif'};
  --font-b:   '${tk.bodyFont}', sans-serif;
  --ease:     cubic-bezier(.16,1,.3,1);
}

/* ── Animations ─────────────────────────── */
@keyframes fadeLeft{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:none}}
@keyframes fadeRight{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:none}}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* ── Premium lift ───────────────────────── */
html{scroll-behavior:smooth}
.hero__img-wrap img,.product-img-wrap img,.t-card,.trust-item,.how-step{
  border-radius:var(--radius);
  will-change:transform,box-shadow;
  transition:transform .25s ease,box-shadow .25s ease;
}
/* Antigravity multi-layer resting shadow */
.t-card,.trust-item{
  box-shadow:0 2px 4px rgba(0,0,0,.08),0 8px 16px rgba(0,0,0,.06),0 24px 40px rgba(0,0,0,.04);
}
.t-card:hover,.trust-item:hover{
  transform:translateY(-6px);
  box-shadow:0 4px 8px rgba(0,0,0,.12),0 12px 24px rgba(0,0,0,.09),0 30px 48px rgba(0,0,0,.06);
}
/* Staggered entrance for testimonial cards */
.t-card:nth-child(1){animation-delay:0s}
.t-card:nth-child(2){animation-delay:.12s}
.t-card:nth-child(3){animation-delay:.24s}
.btn-p,.btn-o,.btn-cart,.btn-now,.nav-cta{
  transition:transform .15s var(--ease),box-shadow .15s var(--ease),opacity .15s,filter .15s;
}
.btn-p:hover,.btn-cart:hover,.nav-cta:hover{
  transform:translateY(-2px);
  box-shadow:0 6px 16px rgba(0,0,0,.25);
}
.btn-o:hover,.btn-now:hover{transform:translateY(-1px)}
.faq-item{transition:background .15s}
.faq-item:hover{background:rgba(255,255,255,.02)}

/* ── Base ───────────────────────────────── */
body{font-family:var(--font-b);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden}

/* ── Reveal on scroll (JS progressively enhances) ── */
.reveal{opacity:0;transform:translateY(20px);transition:opacity .6s var(--ease),transform .6s var(--ease)}
.reveal.visible{opacity:1;transform:none}

/* ── Announcement ───────────────────────── */
.announce{background:${tk.announcementBg};color:${isLight?'#fff':'#fff'};text-align:center;padding:11px 16px;font-size:12.5px;letter-spacing:1.5px;font-weight:600;font-family:var(--font-b)}

/* ── Nav ────────────────────────────────── */
.nav{position:sticky;top:0;z-index:100;background:${tk.navBg};backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:0 60px;height:68px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${tk.navBorder}}
.nav-logo{font-family:var(--font-h);font-size:clamp(13px,1.4vw,19px);font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text);flex-shrink:1;white-space:nowrap}
.nav-links{display:flex;gap:28px}
.nav-links a{font-size:13px;letter-spacing:.8px;color:var(--muted);transition:color .2s}
.nav-links a:hover{color:var(--text)}
.nav-cta{background:var(--primary);color:${isLight?'#fff':tk.btnPrimaryColor};padding:9px 22px;border:none;font-size:12px;letter-spacing:1px;font-weight:700;border-radius:var(--radius);text-transform:uppercase;transition:filter .2s}
.nav-cta:hover{filter:brightness(1.1)}

/* ── Hero ───────────────────────────────── */
.hero{height:100vh;display:flex;align-items:center;background:var(--bg);position:relative;overflow:hidden}
.hero__text{flex:0 0 46%;padding:0 4rem;display:flex;flex-direction:column;justify-content:center;z-index:2;animation:fadeLeft .7s var(--ease) both}
.hero__badge{color:${tk.heroBadgeColor};font-size:10.5px;letter-spacing:4px;text-transform:uppercase;font-weight:700;margin-bottom:18px}
.hero h1{font-family:var(--font-h);font-size:clamp(2.2rem,5vw,3.6rem);line-height:1.08;font-weight:${tk.heroH1Weight};font-style:${tk.heroH1Style};letter-spacing:${tk.heroH1Weight==='300'?'-.01em':'-.02em'};color:var(--text);margin-bottom:1.1rem}
.hero__sub{font-size:clamp(.95rem,1.8vw,1.1rem);line-height:1.7;color:var(--muted);margin-bottom:2rem}
.hero__btns{display:flex;gap:14px;flex-wrap:wrap}
.btn-p{background:${tk.btnPrimaryBg};color:${tk.btnPrimaryColor};padding:16px 36px;border:${tk.btnPrimaryBg==='transparent'?`1px solid ${tk.primary}`:'none'};font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;border-radius:var(--radius);transition:transform .2s var(--ease),box-shadow .2s var(--ease),filter .2s}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(${rgb},.3);filter:brightness(1.08)}
.btn-o{background:transparent;color:${tk.btnOutlineColor};padding:16px 36px;border:1.5px solid ${tk.btnOutlineBorder};font-size:13px;letter-spacing:1.2px;text-transform:uppercase;border-radius:var(--radius);transition:border-color .2s,color .2s}
.btn-o:hover{border-color:var(--text);color:var(--text)}

.hero__img-wrap{flex:1 1 54%;height:100%;position:relative;overflow:hidden;animation:fadeRight .8s .1s var(--ease) both}
.hero__img-wrap img{width:100%;height:100%;object-fit:contain;object-position:center;background:${tk.surface}}
.hero__img-wrap::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(to right,${tk.bg} 0%,rgba(${rgb},.05) 18%,transparent 48%)}
.hero__img-wrap::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(to bottom,transparent 55%,rgba(0,0,0,.45) 100%)}

/* ── Trust strip ────────────────────────── */
.trust{background:${tk.trustBg};border-top:1px solid ${tk.trustBorder};border-bottom:1px solid ${tk.trustBorder};display:grid;grid-template-columns:repeat(4,1fr)}
.trust-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:28px 20px;text-align:center;border-right:1px solid ${tk.trustBorder};animation:fadeUp .5s var(--ease) both}
.trust-item:last-child{border-right:none}
.trust-item:nth-child(1){animation-delay:.05s}
.trust-item:nth-child(2){animation-delay:.1s}
.trust-item:nth-child(3){animation-delay:.15s}
.trust-item:nth-child(4){animation-delay:.2s}
.trust-icon{font-size:26px}
.trust-title{font-family:var(--font-h);font-size:13px;font-weight:700;color:${tk.trustText}}
.trust-sub{font-size:11.5px;color:${isLight?'rgba(0,0,0,0.45)':'rgba(255,255,255,0.45)'}}

/* ── Product section ───────────────────── */
.product{background:${tk.productBg};padding:96px 60px}
.product-inner{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;max-width:1200px;margin:0 auto}
.product-img-wrap img{width:100%;border-radius:var(--radius);aspect-ratio:1;object-fit:cover;box-shadow:0 24px 48px rgba(0,0,0,.12)}
.product-label{color:var(--primary);font-size:10.5px;letter-spacing:4px;font-weight:700;text-transform:uppercase;margin-bottom:14px}
.product-name{font-family:var(--font-h);font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;color:${tk.productText};margin-bottom:10px;line-height:1.15}
.product-stars{color:${tk.primary};font-size:17px;margin-bottom:6px}
.product-revs{font-size:13px;color:${isLight?'rgba(0,0,0,.4)':'rgba(255,255,255,.4)'};margin-bottom:20px}
.product-price{font-family:var(--font-h);font-size:3rem;font-weight:700;color:var(--primary);margin-bottom:4px}
.product-price span{font-size:1.2rem;font-weight:400;opacity:.6}
.product-ap{font-size:13px;color:${isLight?'rgba(0,0,0,.45)':'rgba(255,255,255,.45)'};margin-bottom:22px}
.product-desc{font-size:15px;line-height:1.7;color:${isLight?'rgba(0,0,0,.65)':'rgba(255,255,255,.65)'};margin-bottom:22px}
.bullets{margin-bottom:24px}
.bullets li{padding:9px 0;font-size:14.5px;color:${tk.productText};display:flex;align-items:flex-start;gap:10px;border-bottom:1px solid ${isLight?'rgba(0,0,0,.06)':'rgba(255,255,255,.06)'}}
.bullets li::before{content:"✓";color:var(--primary);font-weight:700;flex-shrink:0;margin-top:1px}
.bullets li:last-child{border-bottom:none}
.urgency{color:#e53935;font-size:13px;font-weight:700;letter-spacing:.5px;margin-bottom:18px}
.btn-cart{width:100%;background:var(--primary);color:${tk.btnPrimaryColor};padding:18px;border:none;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:var(--radius);margin-bottom:10px;transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
.btn-cart:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(${rgb},.35)}
.btn-now{width:100%;background:${isLight?'#1a1a1a':tk.surface};color:${isLight?'#fff':tk.text};padding:18px;border:1px solid ${isLight?'#1a1a1a':'rgba(255,255,255,.1)'};font-size:14px;letter-spacing:1.5px;text-transform:uppercase;border-radius:var(--radius);transition:filter .2s}
.btn-now:hover{filter:brightness(1.12)}

/* ── Stats ──────────────────────────────── */
.stats{background:${tk.statsBg};padding:64px 60px;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(${rgb},.15)}
.stat{text-align:center;padding:20px;border-right:1px solid rgba(255,255,255,.1)}
.stat:last-child{border-right:none}
.stat-n{font-family:var(--font-h);font-size:clamp(2rem,4vw,3rem);font-weight:700;color:#fff;margin-bottom:6px}
.stat-l{font-size:12.5px;letter-spacing:1px;color:rgba(255,255,255,.7)}

/* ── Testimonials ───────────────────────── */
.testimonials{background:${tk.testimonialBg};padding:100px 60px}
.section-label{color:var(--primary);font-size:10.5px;letter-spacing:4px;font-weight:700;text-transform:uppercase;margin-bottom:10px;text-align:center}
.section-heading{font-family:var(--font-h);font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;color:${isLight?tk.trustText:tk.text};text-align:center;margin-bottom:52px}
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;max-width:1200px;margin:0 auto}
.t-card{background:${tk.testimonialCard};border-left:3px solid ${tk.testimonialBorder};border-radius:var(--radius);padding:28px;animation:fadeUp .5s var(--ease) both}
.t-stars{color:var(--primary);font-size:16px;margin-bottom:14px}
.t-text{color:${tk.testimonialText};font-size:14.5px;line-height:1.7;font-style:italic;margin-bottom:18px}
.t-name{font-weight:700;font-size:13.5px;color:${tk.testimonialText}}
.t-loc{font-size:12.5px;color:${isLight?'rgba(0,0,0,.4)':'rgba(255,255,255,.4)'};margin-top:2px}
.t-verified{color:#27ae60;font-weight:600}

/* ── How it works ───────────────────────── */
.how{background:${tk.howBg};padding:100px 60px}
.how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;max-width:1000px;margin:0 auto}
.how-step{text-align:center;padding:24px}
.how-num{font-family:var(--font-h);font-size:80px;font-weight:900;color:var(--primary);opacity:${tk.howNumberOpacity};line-height:1;margin-bottom:8px}
.how-title{font-family:var(--font-h);font-size:17px;font-weight:700;color:${tk.howText};margin-bottom:10px}
.how-desc{font-size:14.5px;line-height:1.65;color:${isLight?'rgba(0,0,0,.55)':'rgba(255,255,255,.5)'}}

/* ── FAQ ────────────────────────────────── */
.faq{background:${tk.faqBg};padding:100px 60px}
.faq-inner{max-width:780px;margin:0 auto}
.faq-item{border-bottom:1px solid ${isLight?'rgba(0,0,0,.08)':'rgba(255,255,255,.07)'}}
.faq-q{font-family:var(--font-h);font-size:15.5px;font-weight:700;color:${tk.faqText};padding:22px 0 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none}
.faq-q::after{content:"＋";font-size:18px;color:var(--primary);transition:transform .25s var(--ease);flex-shrink:0}
details[open]>.faq-q::after{transform:rotate(45deg)}
.faq-a{padding:0 0 20px;color:${isLight?'rgba(0,0,0,.55)':'rgba(255,255,255,.55)'};font-size:14.5px;line-height:1.75;animation:faqFade .2s var(--ease)}
@keyframes faqFade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
details[open]>.faq-q::after{transform:rotate(45deg)}
.faq-a{font-size:14.5px;line-height:1.75;color:${isLight?'rgba(0,0,0,.55)':'rgba(255,255,255,.55)'};padding-bottom:22px}

/* ── Footer ─────────────────────────────── */
.footer{background:#080808;color:#fff;padding:80px 60px 40px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:60px;margin-bottom:56px;max-width:1200px;margin-left:auto;margin-right:auto}
.footer-brand{font-family:var(--font-h);font-size:20px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;margin-bottom:12px}
.footer-tag{color:rgba(255,255,255,.35);font-size:13.5px;line-height:1.7;max-width:280px}
.footer-col-h{font-size:10.5px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.25);margin-bottom:18px}
.footer-links li{margin-bottom:10px}
.footer-links a{color:rgba(255,255,255,.45);font-size:13.5px;transition:color .2s}
.footer-links a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,.06);padding-top:26px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;max-width:1200px;margin:0 auto}
.footer-copy{color:rgba(255,255,255,.25);font-size:12.5px}
.footer-au{color:var(--primary);font-size:12.5px}

/* ── Mobile ─────────────────────────────── */
@media(max-width:768px){
  .nav{padding:0 20px}.nav-links{display:none}
  .hero{flex-direction:column;height:auto;min-height:100vh}
  .hero__text{flex:0 0 auto;padding:3.5rem 1.5rem 1.5rem;text-align:center;width:100%;animation-name:fadeUp}
  .hero__btns{justify-content:center}
  .hero__img-wrap{flex:1 1 auto;width:100%;height:52vw;max-height:380px;animation-name:fadeUp}
  .hero__img-wrap::before,.hero__img-wrap::after{display:none}
  .trust{grid-template-columns:repeat(2,1fr)}
  .trust-item{border-right:none;border-bottom:1px solid rgba(0,0,0,.06)}
  .trust-item:nth-child(odd){border-right:1px solid rgba(0,0,0,.06)}
  .product{padding:64px 24px}
  .product-inner{grid-template-columns:1fr;gap:36px}
  .stats{grid-template-columns:repeat(2,1fr);padding:48px 24px}
  .stat{border-right:none;border-bottom:1px solid rgba(255,255,255,.1);padding:14px}
  .stat:nth-child(odd){border-right:1px solid rgba(255,255,255,.1)}
  .stat:nth-child(3),.stat:last-child{border-bottom:none}
  .testimonials,.how,.faq{padding:64px 24px}
  .t-grid,.how-grid{grid-template-columns:1fr}
  .footer{padding:60px 24px 36px}
  .footer-grid{grid-template-columns:1fr;gap:36px}
  .footer-bottom{flex-direction:column;text-align:center}
  .about{padding:60px 24px!important}
  .about div[style*="grid-template-columns:repeat(3"]{grid-template-columns:1fr!important}
  #products{padding:60px 24px!important}
  #contact{padding:60px 24px!important}
  #contact div[style*="padding:40px"]{padding:24px!important}
}
</style>
</head>
<body>

<div class="announce">🚚 Free AU Shipping Over $75 &nbsp;·&nbsp; Afterpay Available &nbsp;·&nbsp; Sale ends in: <span id="cdown" style="font-weight:900;letter-spacing:1px;"></span></div>

<nav class="nav">
  <div class="nav-logo">${esc(storeName)}</div>
  <div class="nav-links">
    <a href="#hero" onclick="scrollTo(0,0);return false">Home</a>
    <a href="#products">Products</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </div>
  <button class="nav-cta">${esc(heroCTA || 'Shop Now')}</button>
</nav>

<section class="hero" id="hero">
  <div class="hero__text">
    <span class="hero__badge">🇦🇺 Proudly Australian</span>
    <h1>${esc(heroHeadline)}</h1>
    <p class="hero__sub">${esc(heroSubheadline)}</p>
    <div class="hero__btns">
      <button class="btn-p">${esc(heroCTA || 'Shop Now')}</button>
      <button class="btn-o">Learn More</button>
    </div>
  </div>
  <div class="hero__img-wrap">
    <img src="${heroImageUrl || productImageUrl}"
      alt="${esc(storeName)}"
      crossorigin="anonymous"
      style="opacity:0;transition:opacity .35s ease;width:100%;height:100%;object-fit:contain;object-position:center;display:block;background:${tk.surface}"
      onload="this.style.opacity='1'"
      onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,${tk.primary} 0%,${tk.surface} 100%)';var fb=document.createElement('div');fb.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';fb.innerHTML='<div style=\'text-align:center;color:rgba(255,255,255,0.25)\'><div style=\'font-size:56px;margin-bottom:12px\'>📦</div><div style=\'font-size:12px;letter-spacing:3px;text-transform:uppercase\'>Product Image</div></div>';this.parentElement.appendChild(fb);"
    >
  </div>
</section>

<section class="trust">
  <div class="trust-item"><div class="trust-icon">🚚</div><div class="trust-title">Free AU Shipping</div><div class="trust-sub">Orders over $75</div></div>
  <div class="trust-item"><div class="trust-icon">⭐</div><div class="trust-title">4.9 / 5 Stars</div><div class="trust-sub">2,400+ reviews</div></div>
  <div class="trust-item"><div class="trust-icon">🔄</div><div class="trust-title">30-Day Returns</div><div class="trust-sub">No questions asked</div></div>
  <div class="trust-item"><div class="trust-icon">🔒</div><div class="trust-title">Secure Checkout</div><div class="trust-sub">Afterpay &amp; all cards</div></div>
</section>

<section class="product">
  <div class="product-inner">
    <div class="product-img-wrap reveal">
      <img src="${productImageUrl}" alt="${esc(productName)}" onerror="${onerror}">
    </div>
    <div class="reveal" style="animation-delay:.1s">
      <div class="product-label">Featured Product</div>
      <h2 class="product-name">${esc(productName)}</h2>
      <div class="product-stars">★★★★★</div>
      <div class="product-revs">487 verified Australian reviews</div>
      <div class="product-price">$${esc(price)} <span>AUD</span></div>
      <div class="product-ap">or 4 × <strong>$${esc(afterpayPrice)}</strong> with Afterpay</div>
      <p class="product-desc">${esc(productDescription)}</p>
      <ul class="bullets">${bullets}</ul>
      <p class="urgency">⚡ Only 7 left in stock — order soon</p>
      <button class="btn-cart">Add to Cart</button>
      <button class="btn-now">Buy Now with Afterpay</button>
    </div>
  </div>
</section>

<section class="stats">
  <div class="stat"><div class="stat-n">2,400+</div><div class="stat-l">Happy Customers</div></div>
  <div class="stat"><div class="stat-n">4.9/5</div><div class="stat-l">Average Rating</div></div>
  <div class="stat"><div class="stat-n">3–5 Days</div><div class="stat-l">AU Delivery</div></div>
  <div class="stat"><div class="stat-n">30 Days</div><div class="stat-l">Free Returns</div></div>
</section>

<section class="testimonials">
  <div class="section-label">Real Australian Reviews</div>
  <h2 class="section-heading">What Our Customers Say</h2>
  <div class="t-grid">${testimonialCards}</div>
</section>

<section class="how">
  <div class="section-label">How It Works</div>
  <h2 class="section-heading">Simple. Fast. Reliable.</h2>
  <div class="how-grid">${howHtml}</div>
</section>

<section class="faq" id="faq">
  <div class="faq-inner">
    <div class="section-label" style="text-align:left;margin-bottom:6px">Support</div>
    <h2 class="section-heading" style="text-align:left;margin-bottom:40px">Frequently Asked Questions</h2>
    ${faqHtml}
  </div>
</section>

${includeAbout !== false ? `
<!-- ── About page ──────────────────────────────────────────────── -->
<section class="about" id="about" style="padding:100px 40px;max-width:900px;margin:0 auto">
  <div style="text-align:center;margin-bottom:60px">
    <div class="section-label">Our Story</div>
    <h2 class="section-heading">About ${esc(storeName)}</h2>
    <p style="font-size:16px;color:var(--muted);line-height:1.8;max-width:640px;margin:0 auto">
      We source the best ${esc(niche)} products from trusted global suppliers and deliver them fast to your door.
      Every product is hand-selected for quality, value, and real-world results.
    </p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
    ${[
      { icon: '\u{1F30F}', title: 'Global Sourcing', desc: `Curated ${esc(niche)} products from top-rated global suppliers` },
      { icon: '\u26A1', title: 'Fast Shipping', desc: 'Express delivery to your door, tracked every step' },
      { icon: '\u{1F4AF}', title: '30-Day Returns', desc: 'Not happy? Return it, no questions asked' },
    ].map(f => `
      <div style="background:var(--surface);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius);padding:28px 24px;text-align:center">
        <div style="font-size:36px;margin-bottom:12px">${f.icon}</div>
        <div style="font-family:var(--font-h);font-weight:700;font-size:15px;color:var(--text);margin-bottom:8px">${f.title}</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.6">${f.desc}</div>
      </div>
    `).join('')}
  </div>
</section>
` : ''}

<!-- ── Products page ──────────────────────────────────────────── -->
<section id="products" style="padding:80px 40px;background:var(--surface);margin:0">
  <div style="max-width:1100px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <div class="section-label">Full Catalogue</div>
      <h2 class="section-heading">Shop All ${esc(niche)} Products</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px">
      ${((products && products.length > 0) ? products : Array(6).fill(null)).map((p: any, i: number) => `
        <div style="background:${isLight ? '#fff' : 'var(--bg)'};border:1px solid rgba(0,0,0,0.07);border-radius:var(--radius);overflow:hidden;transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,0.12)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
          <div style="height:200px;background:${isLight ? '#F5F5F5' : '#1a1a1a'};overflow:hidden">
            ${p?.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.product_title)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px">\u{1F6CD}\uFE0F</div>`}
          </div>
          <div style="padding:16px">
            <div style="font-family:var(--font-h);font-weight:600;font-size:13px;color:var(--text);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p?.product_title || `${niche} Product ${i+1}`)}</div>
            <div style="font-size:16px;font-weight:700;color:var(--primary);margin-bottom:10px">$${p?.price_aud || (29 + i * 10)}.00</div>
            <button class="btn-cart" style="width:100%;padding:9px 0;background:var(--primary);color:${isLight ? '#fff' : tk.btnPrimaryColor};border:none;border-radius:var(--radius);font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;cursor:pointer">Add to Cart</button>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>

${includeContact !== false ? `
<!-- ── Contact page ──────────────────────────────────────────── -->
<section id="contact" style="padding:100px 40px;max-width:700px;margin:0 auto">
  <div style="text-align:center;margin-bottom:48px">
    <div class="section-label">Get In Touch</div>
    <h2 class="section-heading">Contact Us</h2>
    <p style="font-size:14px;color:var(--muted)">Questions? We respond within 24 hours.</p>
  </div>
  <div style="background:var(--surface);border:1px solid rgba(0,0,0,0.07);border-radius:var(--radius);padding:40px">
    <div style="display:grid;gap:16px">
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;display:block;margin-bottom:6px">Your Name</label>
        <input type="text" placeholder="Enter your name" style="width:100%;height:44px;padding:0 14px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:14px;background:${isLight ? '#fff' : 'var(--bg)'};color:var(--text);box-sizing:border-box">
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;display:block;margin-bottom:6px">Email</label>
        <input type="email" placeholder="your@email.com" style="width:100%;height:44px;padding:0 14px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:14px;background:${isLight ? '#fff' : 'var(--bg)'};color:var(--text);box-sizing:border-box">
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;display:block;margin-bottom:6px">Message</label>
        <textarea rows="4" placeholder="How can we help?" style="width:100%;padding:12px 14px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:14px;background:${isLight ? '#fff' : 'var(--bg)'};color:var(--text);resize:vertical;box-sizing:border-box;font-family:inherit"></textarea>
      </div>
      <button class="btn-p" style="width:100%;height:48px;background:var(--primary);color:${isLight ? '#fff' : tk.btnPrimaryColor};border:none;border-radius:var(--radius);font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer">Send Message</button>
    </div>
  </div>
</section>
` : ''}

<footer class="footer">
  <div class="footer-grid">
    <div>
      <div class="footer-brand">${esc(storeName)}</div>
      <p class="footer-tag">${esc(tagline)}</p>
    </div>
    <div>
      <div class="footer-col-h">Quick Links</div>
      <ul class="footer-links">
        <li><a href="#hero">Home</a></li><li><a href="#products">Products</a></li>
        <li><a href="#about">About</a></li><li><a href="#contact">Contact</a></li><li><a href="#faq">FAQ</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-col-h">Get In Touch</div>
      <a href="mailto:${esc(supportEmail)}" style="color:rgba(255,255,255,.45);font-size:13.5px;display:block;margin-bottom:8px">${esc(supportEmail)}</a>
      <div style="color:rgba(255,255,255,.3);font-size:12.5px">Mon–Fri 9am–5pm AEST</div>
      <div style="color:rgba(255,255,255,.2);font-size:12px;margin-top:10px">ABN: 12 345 678 901</div>
    </div>
  </div>
  <div class="footer-bottom">
    <span class="footer-copy">© 2026 ${esc(storeName)}. All rights reserved.</span>
    <span class="footer-au">Proudly Australian 🇦🇺</span>
  </div>
  ${supplierUrl || supplierName ? `<div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.04)">
    <span style="color:rgba(255,255,255,.22);font-size:11px;">Fulfilled by ${esc(supplierName || 'trusted AU supplier')} · Dropship ready · <a href="${esc(supplierUrl || '#')}" target="_blank" rel="noopener noreferrer" style="color:rgba(255,255,255,.22);text-decoration:underline;text-underline-offset:3px;">Manage fulfilment →</a></span>
  </div>` : ''}
</footer>

<!-- CART MODAL -->
<div id="cart-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.72);align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:16px;padding:40px;max-width:440px;width:90%;position:relative;box-shadow:0 24px 64px rgba(0,0,0,0.3);">
    <button onclick="document.getElementById('cart-modal').style.display='none'" style="position:absolute;top:14px;right:18px;background:none;border:none;font-size:26px;cursor:pointer;color:#888;line-height:1;">×</button>
    <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:8px;font-weight:700;">Quick Add</p>
    <h2 id="modal-product-name" style="font-size:20px;font-weight:700;color:#111;margin-bottom:10px;line-height:1.3;"></h2>
    <div id="modal-price" style="font-size:30px;font-weight:700;color:var(--primary,#d4af37);margin-bottom:4px;"></div>
    <div id="modal-afterpay" style="font-size:13px;color:#888;margin-bottom:24px;"></div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:26px;">
      <button onclick="changeQty(-1)" style="width:38px;height:38px;border:1px solid #ddd;background:#f5f5f5;border-radius:8px;font-size:20px;cursor:pointer;line-height:1;">−</button>
      <span id="qty-display" style="font-size:18px;font-weight:600;min-width:20px;text-align:center;">1</span>
      <button onclick="changeQty(1)" style="width:38px;height:38px;border:1px solid #ddd;background:#f5f5f5;border-radius:8px;font-size:20px;cursor:pointer;line-height:1;">+</button>
    </div>
    <button onclick="handleCheckout('afterpay')" style="width:100%;padding:16px;background:#b2fce4;color:#000;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;transition:filter .15s;" onmouseover="this.style.filter='brightness(0.95)'" onmouseout="this.style.filter=''">
      🛍️ Checkout with Afterpay
    </button>
    <button onclick="handleCheckout('card')" style="width:100%;padding:16px;background:var(--primary,#111);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;transition:filter .15s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
      💳 Pay with Card
    </button>
    <p style="text-align:center;font-size:12px;color:#bbb;margin-top:16px;">🔒 Secure checkout · Free AU shipping over $75</p>
  </div>
</div>

<script>
// ── Scroll reveal ────────────────────────────────────────
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── FAQ accordion ────────────────────────────────────────
document.querySelectorAll('details.faq-item').forEach(d => {
  d.addEventListener('toggle', () => {
    if (d.open) document.querySelectorAll('details.faq-item').forEach(other => { if (other !== d) other.open = false; });
  });
});

// ── Nav smooth scroll ────────────────────────────────────
document.querySelectorAll('.nav-links a, .nav-cta').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const text = (this.textContent || '').trim().toLowerCase();
    const map = {
      'home':    () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      'shop':    () => document.querySelector('.product')?.scrollIntoView({ behavior: 'smooth' }),
      'about':   () => document.querySelector('.how')?.scrollIntoView({ behavior: 'smooth' }),
      'contact': () => document.querySelector('.footer, footer')?.scrollIntoView({ behavior: 'smooth' }),
      'faq':     () => document.querySelector('.faq')?.scrollIntoView({ behavior: 'smooth' }),
    };
    const action = Object.entries(map).find(([k]) => text.includes(k));
    if (action) action[1]();
    else document.querySelector('.product')?.scrollIntoView({ behavior: 'smooth' }); // default: Shop Now
  });
});

// ── Cart modal ───────────────────────────────────────────
let cartQty = 1;
const _pName = document.querySelector('.product-name, h2.product-name')?.textContent?.trim() || '${esc(productName)}';
const _pPrice = parseFloat('${price}') || 49.95;

function updateModal() {
  const total = (_pPrice * cartQty).toFixed(2);
  const ap = (_pPrice / 4).toFixed(2);
  document.getElementById('modal-product-name').textContent = _pName;
  document.getElementById('modal-price').textContent = '$' + total + ' AUD';
  document.getElementById('modal-afterpay').textContent = 'or 4 × $' + ap + ' fortnightly with Afterpay';
  document.getElementById('qty-display').textContent = String(cartQty);
}

function openCart() {
  cartQty = 1;
  updateModal();
  document.getElementById('cart-modal').style.display = 'flex';
}

function changeQty(delta) {
  cartQty = Math.max(1, Math.min(10, cartQty + delta));
  updateModal();
}

function handleCheckout(method) {
  const modal = document.getElementById('cart-modal');
  modal.innerHTML = '<div style="color:#fff;font-size:18px;font-weight:600;text-align:center;padding:40px;">✅ Redirecting to checkout...<br><span style="font-size:13px;opacity:.7;margin-top:8px;display:block;">This store is a demo generated by Majorka</span></div>';
  setTimeout(() => { modal.style.display = 'none'; }, 2500);
}

// Close on backdrop click
document.getElementById('cart-modal').addEventListener('click', function(e) {
  if (e.target === this) this.style.display = 'none';
});

// Wire all CTA buttons
document.querySelectorAll('.btn-cart, .btn-p, .btn-now, .btn-primary, .btn-buynow').forEach(btn => {
  btn.addEventListener('click', openCart);
});
// Nav CTA (Shop Now) → scroll to product, not open cart
document.querySelectorAll('.nav-cta').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.product')?.scrollIntoView({ behavior: 'smooth' });
  });
});
</script>

<!-- STICKY MOBILE BUY BAR -->
<div id="sticky-buy" style="display:none;position:fixed;bottom:0;left:0;right:0;background:var(--primary,#111);padding:14px 20px;z-index:998;align-items:center;justify-content:space-between;box-shadow:0 -4px 20px rgba(0,0,0,.3);">
  <div>
    <div style="color:#fff;font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw;" id="sticky-name"></div>
    <div style="color:rgba(255,255,255,.75);font-size:12px;margin-top:1px;" id="sticky-price"></div>
  </div>
  <button onclick="openCart()" style="background:#fff;color:var(--primary,#111);border:none;padding:11px 22px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;flex-shrink:0;transition:filter .15s;" onmouseover="this.style.filter='brightness(.95)'" onmouseout="this.style.filter=''">Buy Now</button>
</div>

<script>
// Countdown to midnight AEST
(function() {
  function updateCountdown() {
    try {
      var now = new Date();
      var utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
      var aestMs = utcMs + (10 * 3600000);
      var aest = new Date(aestMs);
      var midnight = new Date(aest); midnight.setHours(24,0,0,0);
      var diff = midnight.getTime() - aest.getTime();
      if (diff < 0 || isNaN(diff)) { diff = 86400000; }
      var h = Math.floor(diff/3600000);
      var m = Math.floor((diff%3600000)/60000);
      var s = Math.floor((diff%60000)/1000);
      var el = document.getElementById('cdown');
      if (el) el.textContent = h + 'h ' + (m<10?'0':'')+m + 'm ' + (s<10?'0':'')+s + 's';
    } catch(e) {
      var el = document.getElementById('cdown');
      if (el) el.closest('.announce') && (el.closest('.announce').style.display='none');
    }
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
})();

// Sticky bar
(function() {
  var bar = document.getElementById('sticky-buy');
  var sn = document.getElementById('sticky-name');
  var sp = document.getElementById('sticky-price');
  if (sn) sn.textContent = _pName;
  if (sp) sp.textContent = '$' + _pPrice.toFixed(2) + ' AUD';
  if (window.innerWidth < 768) {
    var hero = document.querySelector('.hero');
    window.addEventListener('scroll', function() {
      var rect = hero ? hero.getBoundingClientRect() : null;
      bar.style.display = (!rect || rect.bottom < 0) ? 'flex' : 'none';
    }, { passive: true });
  }
})();
</script>
</body>
</html>`;
}
