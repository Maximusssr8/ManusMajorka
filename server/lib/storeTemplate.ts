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
  } = plan;

  const tk = getTokens(template, primaryColour, accentColour);
  const rgb = colorRgb(tk.primary);
  const isLight = ['coastal','bloom','beauty','minimal'].some(x => (template||'').toLowerCase().includes(x));
  const onerror = `this.onerror=null;this.parentElement.style.background='linear-gradient(135deg,rgba(${rgb},0.25),${tk.surface})';this.style.display='none'`;

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

  const faqHtml = (faqItems||[]).slice(0,4).map(f=>`
    <details class="faq-item">
      <summary class="faq-q">${esc(f.q)}</summary>
      <p class="faq-a">${esc(f.a)}</p>
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
  transition:transform .18s var(--ease),box-shadow .18s var(--ease);
}
.t-card:hover,.trust-item:hover{
  transform:translateY(-3px);
  box-shadow:0 8px 24px rgba(0,0,0,.15);
}
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
.t-card{background:${tk.testimonialCard};border-left:3px solid ${tk.testimonialBorder};border-radius:var(--radius);padding:28px;animation:fadeUp .5s var(--ease) both;transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
.t-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.12)}
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
}
</style>
</head>
<body>

<div class="announce">🚚 Free AU Shipping Over $75 &nbsp;·&nbsp; Afterpay Available &nbsp;·&nbsp; 30-Day Returns</div>

<nav class="nav">
  <div class="nav-logo">${esc(storeName)}</div>
  <div class="nav-links">
    <a href="#">Home</a><a href="#">Shop</a><a href="#">About</a><a href="#">Contact</a>
  </div>
  <button class="nav-cta">${esc(heroCTA || 'Shop Now')}</button>
</nav>

<section class="hero">
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
    <img src="${heroImageUrl || productImageUrl}" alt="${esc(storeName)}" onerror="${onerror}">
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

<section class="faq">
  <div class="faq-inner">
    <div class="section-label" style="text-align:left;margin-bottom:6px">Support</div>
    <h2 class="section-heading" style="text-align:left;margin-bottom:40px">Frequently Asked Questions</h2>
    ${faqHtml}
  </div>
</section>

<footer class="footer">
  <div class="footer-grid">
    <div>
      <div class="footer-brand">${esc(storeName)}</div>
      <p class="footer-tag">${esc(tagline)}</p>
    </div>
    <div>
      <div class="footer-col-h">Quick Links</div>
      <ul class="footer-links">
        <li><a href="#">Home</a></li><li><a href="#">Shop</a></li>
        <li><a href="#">About</a></li><li><a href="#">Contact</a></li><li><a href="#">FAQ</a></li>
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
</footer>

<script>
// Scroll reveal
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// FAQ accordion close others
document.querySelectorAll('details.faq-item').forEach(d => {
  d.addEventListener('toggle', () => {
    if (d.open) document.querySelectorAll('details.faq-item').forEach(other => { if (other !== d) other.open = false; });
  });
});
</script>
</body>
</html>`;
}
