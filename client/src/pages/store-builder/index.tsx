import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Store,
  Palette,
  ShoppingBag,
  Rocket,
  Link2,
  Sparkles,
  Zap,
  CheckCircle2,
  Download,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Design tokens ─────────────────────────────────────────────
const BG = '#080808';
const SURFACE = '#0d0d0d';
const CARD = '#0f0f0f';
const BORDER = '#1a1a1a';
const GOLD = '#d4af37';
const CTA_BLUE = '#3B82F6';
const TEXT = '#f5f5f5';
const TEXT_DIM = 'rgba(245,245,245,0.55)';
const TEXT_MUTED = 'rgba(245,245,245,0.35)';

const SYNE = "'Syne', sans-serif";
const DM_SANS = "'DM Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

// ─── Types ─────────────────────────────────────────────────────
type Mode = 'ai' | 'shopify' | 'marketplace';

type Vibe = 'minimal' | 'bold' | 'luxury' | 'streetwear';
type Market = 'AU' | 'US' | 'UK';

interface GeneratedProduct {
  title: string;
  price_aud: number;
  image_url: string;
}

// Server returns { brief, storeNameOptions, themeRecommendation, appStack }.
// We normalize to this flat shape for the preview panel.
interface GeneratedStore {
  storeName: string;
  tagline: string;
  colorPalette: string[];
  font: string;
  rationale: string;
  products: GeneratedProduct[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStoreResponse(raw: any, prefilledProduct?: { title?: string; price?: number; image?: string } | null): GeneratedStore {
  if (raw?.storeName && raw?.tagline && Array.isArray(raw?.products) && raw.products.length > 0) return raw as GeneratedStore;
  const brief = raw?.brief || {};
  const storeName = raw?.storeNameOptions?.[0] || brief.brandName || brief.storeName || 'My Store';
  const tagline = brief.tagline || brief.description || `Premium ${brief.niche || 'products'} for discerning buyers`;
  const palette = brief.colourPalette || brief.colorPalette || brief.colors || ['#d4af37', '#080808', '#ededed'];
  const font = brief.font || raw?.themeRecommendation?.name || 'Modern';
  const rationale = brief.rationale || raw?.themeRecommendation?.reason || '';

  // Products: check top-level (server's shape), then brief.products
  const rawProducts = raw?.products || brief.products || [];
  const products: GeneratedProduct[] = rawProducts.map((p: Record<string, unknown>) => ({
    title: (p.title || p.product_title || 'Product') as string,
    price_aud: Number(p.price_aud || p.price || 0),
    image_url: (p.image_url || p.image || '') as string,
  }));

  // Fallback: inject prefilled product from Products page
  if (products.length === 0 && prefilledProduct?.title) {
    products.push({
      title: prefilledProduct.title,
      price_aud: prefilledProduct.price || 0,
      image_url: prefilledProduct.image || '',
    });
  }

  // Final fallback: generate demo products from the niche
  const niche = brief.niche || (typeof raw?.niche === 'string' ? raw.niche : 'Premium');
  if (products.length === 0) {
    products.push(
      { title: `${niche} Essentials Kit`, price_aud: 49.95, image_url: '' },
      { title: `${niche} Pro Bundle`, price_aud: 89.95, image_url: '' },
      { title: `${niche} Premium Collection`, price_aud: 129.95, image_url: '' },
    );
  }

  const paletteArr = Array.isArray(palette)
    ? palette
    : typeof palette === 'object' && palette !== null
      ? [palette.primary || '#d4af37', palette.secondary || '#080808', palette.accent || '#ededed']
      : [String(palette)];

  return { storeName, tagline, colorPalette: paletteArr, font, rationale, products };
}

interface SavedStore {
  id: string;
  name: string;
  tagline: string;
  productCount: number;
  isPublished?: boolean;
}

interface ShopifyValidation {
  storeName: string;
  productCount: number;
}

interface ShopifySyncReport {
  matched: number;
  unmatched: number;
  recommendations: string[];
}

// ─── Safe fetch wrapper ────────────────────────────────────────
interface SafeResult<T> {
  ok: boolean;
  data?: T;
  pending?: boolean;
  error?: string;
}

async function safeFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<SafeResult<T>> {
  try {
    const res = await fetch(url, init);
    if (res.status === 404) {
      return { ok: false, pending: true, error: 'Endpoint pending — server route not yet wired.' };
    }
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { error?: string; message?: string };
        detail = body.message || body.error || detail;
      } catch { /* ignore parse errors */ }
      return { ok: false, error: detail };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: msg };
  }
}

// ─── Tab switcher ──────────────────────────────────────────────
interface TabDef {
  id: Mode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  desc: string;
}

const TABS: TabDef[] = [
  { id: 'ai', label: 'AI Generator', icon: Sparkles, desc: 'Conjure a store from a niche' },
  { id: 'shopify', label: 'Shopify Sync', icon: Link2, desc: 'Connect an existing store' },
  { id: 'marketplace', label: 'Marketplace', icon: Store, desc: 'Your saved Majorka stores' },
];

interface TabSwitcherProps {
  mode: Mode;
  onChange: (m: Mode) => void;
}

function TabSwitcher({ mode, onChange }: TabSwitcherProps) {
  return (
    <div
      className="grid gap-3 w-full"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}
    >
      {TABS.map((t) => {
        const active = mode === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            data-tab={t.id}
            onClick={() => onChange(t.id)}
            className="text-left rounded-md p-4 transition-all duration-200 group"
            style={{
              background: active ? CARD : SURFACE,
              border: `1px solid ${active ? GOLD : BORDER}`,
              boxShadow: active ? '0 0 24px rgba(212,175,55,0.18)' : 'none',
              fontFamily: DM_SANS,
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.boxShadow = '0 0 24px rgba(212,175,55,0.18)';
                e.currentTarget.style.borderColor = GOLD;
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = BORDER;
              }
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center"
                style={{
                  background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? GOLD : BORDER}`,
                }}
              >
                <Icon size={18} className={active ? 'text-accent' : ''} />
              </div>
              <div
                className="text-base font-semibold"
                style={{ color: TEXT, fontFamily: SYNE }}
              >
                {t.label}
              </div>
            </div>
            <div className="text-xs" style={{ color: TEXT_DIM }}>
              {t.desc}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Gold card (with hover glow) ───────────────────────────────
interface GoldCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function GoldCard({ children, className, onClick, style }: GoldCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-md p-5 transition-all duration-200 ${className ?? ''}`}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        fontFamily: DM_SANS,
        color: TEXT,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 24px rgba(212,175,55,0.18)';
        e.currentTarget.style.borderColor = GOLD;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = BORDER;
      }}
    >
      {children}
    </div>
  );
}

// ─── Primary CTA (blue with glow) ──────────────────────────────
interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  className,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 ${className ?? ''}`}
      style={{
        background: disabled ? 'rgba(59,130,246,0.3)' : CTA_BLUE,
        color: '#fff',
        fontFamily: DM_SANS,
        boxShadow: disabled ? 'none' : '0 0 20px rgba(59,130,246,0.45)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ─── Ghost button ──────────────────────────────────────────────
interface GhostButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

function GhostButton({ children, onClick, disabled }: GhostButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
      style={{
        background: 'transparent',
        color: TEXT,
        border: `1px solid ${BORDER}`,
        fontFamily: DM_SANS,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = GOLD;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = BORDER;
      }}
    >
      {children}
    </button>
  );
}

// ─── Input / Select ────────────────────────────────────────────
interface FieldLabelProps {
  children: React.ReactNode;
}

function FieldLabel({ children }: FieldLabelProps) {
  return (
    <div
      className="text-xs uppercase tracking-wider mb-2"
      style={{ color: TEXT_DIM, fontFamily: DM_SANS, letterSpacing: '0.08em' }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  color: TEXT,
  fontFamily: DM_SANS,
  padding: '10px 14px',
  borderRadius: 6,
  width: '100%',
  fontSize: 14,
  outline: 'none',
};

// ─── Endpoint pending notice ───────────────────────────────────
interface PendingNoticeProps {
  note: string;
}

function PendingNotice({ note }: PendingNoticeProps) {
  return (
    <div
      className="rounded-md px-4 py-3 text-xs"
      style={{
        background: 'rgba(212,175,55,0.06)',
        border: `1px dashed ${GOLD}`,
        color: GOLD,
        fontFamily: DM_SANS,
      }}
    >
      {note}
    </div>
  );
}

// ─── Generate premium Shopify-quality storefront HTML ──────────
function generateStoreHTML(store: GeneratedStore, niche?: string): string {
  const primary = store.colorPalette[0] || '#d4af37';
  const bg = store.colorPalette[1] || '#080808';
  const light = store.colorPalette[2] || '#ededed';
  const surfaceBg = '#0d0d0d';
  const cardBg = '#111111';
  const borderClr = '#1a1a1a';
  const year = new Date().getFullYear();
  const nicheLabel = niche || 'premium products';
  const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeName = escHtml(store.storeName);
  const safeTagline = escHtml(store.tagline);

  const productCards = store.products.slice(0, 6).map((p, i) => {
    const safeTitle = escHtml(p.title);
    const imgBlock = p.image_url
      ? `<img src="${escHtml(p.image_url)}" alt="${safeTitle}" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />`
      : `<div style="width:100%;aspect-ratio:1/1;background:linear-gradient(135deg,${cardBg} 0%,rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.12) 100%);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;"><svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="${primary}" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span style="font-size:12px;color:rgba(245,245,245,0.3);font-family:'DM Sans',sans-serif;">Product Image</span></div>`;
    const badge = i === 0 ? `<div class="badge-bestseller">BESTSELLER</div>` : '';

    return `
      <div class="product-card" itemscope itemtype="https://schema.org/Product">
        <meta itemprop="sku" content="MJK-${String(i + 1).padStart(3, '0')}" />
        <div style="position:relative;overflow:hidden;">${imgBlock}${badge}</div>
        <div style="padding:20px;">
          <div class="product-rating"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <span class="rating-text">4.8</span></div>
          <h3 itemprop="name" style="margin:8px 0 4px;font-family:'Syne',sans-serif;font-size:16px;font-weight:600;color:${light};line-height:1.3;">${safeTitle}</h3>
          <div style="font-size:12px;color:rgba(245,245,245,0.35);margin-bottom:12px;">Ships from AU warehouse</div>
          <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="priceCurrency" content="AUD" />
            <span itemprop="price" content="${p.price_aud.toFixed(2)}" style="font-family:'JetBrains Mono',monospace;font-size:22px;color:${primary};font-weight:700;">A$${p.price_aud.toFixed(2)}</span>
            <link itemprop="availability" href="https://schema.org/InStock" />
          </div>
          <div class="afterpay-line">or 4 x A$${(p.price_aud / 4).toFixed(2)} with <strong>Afterpay</strong></div>
          <button class="add-to-cart-btn">Add to Cart</button>
        </div>
      </div>`;
  }).join('\n');

  const testimonials = [
    { name: 'Sarah M.', loc: 'Sydney, NSW', text: `Absolutely love my purchase from ${store.storeName}! Quality exceeded my expectations and shipping was incredibly fast.`, stars: 5 },
    { name: 'Jake T.', loc: 'Brisbane, QLD', text: 'Best purchase I\'ve made this year. The Afterpay option made it so easy. Will definitely be ordering again!', stars: 5 },
    { name: 'Emma K.', loc: 'Melbourne, VIC', text: 'Great product, excellent packaging, and the customer service team was super helpful. Highly recommend to anyone.', stars: 5 },
  ];

  const testimonialCards = testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${'&#9733;'.repeat(t.stars)}</div>
      <p class="testimonial-text">"${escHtml(t.text)}"</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.name[0]}</div>
        <div>
          <div style="font-weight:600;font-size:14px;color:${light};">${escHtml(t.name)}</div>
          <div style="font-size:12px;color:rgba(245,245,245,0.4);">${escHtml(t.loc)}</div>
        </div>
      </div>
    </div>`).join('\n');

  const faqItems = [
    { q: 'How fast is shipping within Australia?', a: 'We dispatch same-day before 2pm AEST. Standard delivery is 2-5 business days. Express options are available at checkout.' },
    { q: 'What is your return policy?', a: 'We offer a 30-day no-questions-asked return policy on all orders. Simply contact our team and we\'ll arrange a prepaid return label.' },
    { q: 'Do you offer Afterpay?', a: 'Yes! Pay in 4 interest-free instalments with Afterpay on all orders over $35. Select Afterpay at checkout.' },
  ];

  const faqHTML = faqItems.map((f, i) => `
    <div class="faq-item">
      <input type="checkbox" id="faq-${i}" class="faq-toggle" />
      <label for="faq-${i}" class="faq-question">${escHtml(f.q)}<span class="faq-chevron">&#8250;</span></label>
      <div class="faq-answer"><p>${escHtml(f.a)}</p></div>
    </div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName} - ${escHtml(nicheLabel)} | Australian Online Store</title>
  <meta name="description" content="${safeTagline}. Premium ${escHtml(nicheLabel)} for Australian shoppers. Free shipping, Afterpay available, 30-day returns." />
  <meta property="og:title" content="${safeName}" />
  <meta property="og:description" content="${safeTagline}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="en_AU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeName}" />
  <meta name="twitter:description" content="${safeTagline}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: ${bg};
      color: ${light};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.6;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; height: auto; }

    /* ── Nav ── */
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 clamp(16px, 4vw, 48px); height: 64px;
      border-bottom: 1px solid ${borderClr}; background: ${surfaceBg};
      position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px);
    }
    .nav-brand { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: ${light}; letter-spacing: -0.02em; }
    .nav-brand span { color: ${primary}; }
    .nav-links { display: flex; gap: 32px; align-items: center; }
    .nav-links a { font-size: 14px; font-weight: 500; color: rgba(245,245,245,0.55); transition: color 0.2s; }
    .nav-links a:hover { color: ${primary}; }
    .nav-cart { position: relative; padding: 8px; cursor: pointer; }
    .nav-cart svg { stroke: rgba(245,245,245,0.6); transition: stroke 0.2s; }
    .nav-cart:hover svg { stroke: ${primary}; }
    .nav-cart-badge {
      position: absolute; top: 2px; right: 0; width: 18px; height: 18px;
      background: ${primary}; color: ${bg}; border-radius: 50%;
      font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
      font-family: 'JetBrains Mono', monospace;
    }
    .hamburger { display: none; cursor: pointer; padding: 8px; background: none; border: none; }
    .hamburger span { display: block; width: 22px; height: 2px; background: ${light}; margin: 5px 0; transition: all 0.3s; }
    #mobile-toggle { display: none; }
    #mobile-toggle:checked ~ .nav-links { display: flex; }
    #mobile-toggle:checked ~ .hamburger span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    #mobile-toggle:checked ~ .hamburger span:nth-child(2) { opacity: 0; }
    #mobile-toggle:checked ~ .hamburger span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

    /* ── Hero ── */
    .hero {
      text-align: center; padding: 96px 24px 80px;
      background: linear-gradient(180deg, ${surfaceBg} 0%, rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.03) 50%, ${bg} 100%);
    }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px;
      background: rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.08);
      border: 1px solid rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.2);
      border-radius: 100px; font-size: 12px; font-weight: 600; color: ${primary};
      text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 24px;
    }
    .hero h1 {
      font-family: 'Syne', sans-serif; font-size: clamp(36px, 6vw, 64px);
      font-weight: 800; letter-spacing: -0.03em; margin-bottom: 20px; color: ${light};
      line-height: 1.1; max-width: 720px; margin-left: auto; margin-right: auto;
    }
    .hero-sub {
      font-size: clamp(16px, 2vw, 20px); color: rgba(245,245,245,0.5);
      max-width: 560px; margin: 0 auto 40px; line-height: 1.6;
    }
    .hero-cta {
      display: inline-block; padding: 16px 40px; background: ${primary}; color: ${bg};
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px;
      border-radius: 8px; border: none; cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 24px rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.3);
    }
    .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.4); }
    .trust-badges {
      display: flex; justify-content: center; flex-wrap: wrap; gap: 24px;
      margin-top: 48px; padding-top: 32px; border-top: 1px solid ${borderClr};
    }
    .trust-badge-item {
      display: flex; align-items: center; gap: 8px; font-size: 13px;
      color: rgba(245,245,245,0.45); font-weight: 500;
    }
    .trust-badge-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.06);
      font-size: 16px;
    }

    /* ── Section headers ── */
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-header h2 {
      font-family: 'Syne', sans-serif; font-size: clamp(24px, 3.5vw, 36px);
      font-weight: 700; color: ${light}; margin-bottom: 12px;
    }
    .section-header p { font-size: 16px; color: rgba(245,245,245,0.45); max-width: 480px; margin: 0 auto; }

    /* ── Products ── */
    .products-section { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
    .products-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
    }
    .product-card {
      background: ${cardBg}; border: 1px solid ${borderClr}; border-radius: 8px;
      overflow: hidden; transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
    }
    .product-card:hover {
      transform: translateY(-4px); border-color: ${primary};
      box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.1);
    }
    .badge-bestseller {
      position: absolute; top: 12px; left: 12px; padding: 4px 12px;
      background: ${primary}; color: ${bg}; font-size: 11px; font-weight: 700;
      border-radius: 4px; letter-spacing: 0.05em; font-family: 'DM Sans', sans-serif;
    }
    .product-rating { display: flex; align-items: center; gap: 6px; }
    .stars { color: #facc15; font-size: 14px; letter-spacing: 1px; }
    .rating-text { font-size: 12px; color: rgba(245,245,245,0.4); font-family: 'JetBrains Mono', monospace; }
    .afterpay-line {
      font-size: 12px; color: rgba(245,245,245,0.35); margin: 8px 0 16px;
    }
    .afterpay-line strong { color: rgba(245,245,245,0.55); }
    .add-to-cart-btn {
      width: 100%; padding: 12px 20px; background: ${primary}; color: ${bg};
      font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 14px;
      border: none; border-radius: 6px; cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
    }
    .add-to-cart-btn:hover { opacity: 0.9; transform: scale(1.01); }

    /* ── Social Proof ── */
    .social-proof { padding: 80px 24px; background: ${surfaceBg}; border-top: 1px solid ${borderClr}; border-bottom: 1px solid ${borderClr}; }
    .social-proof .section-header p { color: rgba(245,245,245,0.4); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
    .testimonial-card {
      background: ${cardBg}; border: 1px solid ${borderClr}; border-radius: 8px;
      padding: 28px; transition: border-color 0.2s;
    }
    .testimonial-card:hover { border-color: rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.3); }
    .testimonial-stars { color: #facc15; font-size: 16px; letter-spacing: 2px; margin-bottom: 16px; }
    .testimonial-text { font-size: 14px; color: rgba(245,245,245,0.6); line-height: 1.7; margin-bottom: 20px; font-style: italic; }
    .testimonial-author { display: flex; align-items: center; gap: 12px; }
    .testimonial-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.1);
      border: 1px solid rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.25);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; color: ${primary};
    }

    /* ── Features ── */
    .features-section { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
    .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .feature-card {
      text-align: center; padding: 32px 20px; background: ${cardBg};
      border: 1px solid ${borderClr}; border-radius: 8px; transition: border-color 0.2s;
    }
    .feature-card:hover { border-color: rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.3); }
    .feature-icon {
      width: 56px; height: 56px; border-radius: 12px; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.08);
      border: 1px solid rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.15);
      font-size: 24px;
    }
    .feature-card h3 { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 600; color: ${light}; margin-bottom: 8px; }
    .feature-card p { font-size: 13px; color: rgba(245,245,245,0.4); line-height: 1.5; }

    /* ── FAQ ── */
    .faq-section { max-width: 720px; margin: 0 auto; padding: 80px 24px; }
    .faq-item { border-bottom: 1px solid ${borderClr}; }
    .faq-toggle { display: none; }
    .faq-question {
      display: flex; justify-content: space-between; align-items: center; cursor: pointer;
      padding: 20px 0; font-size: 15px; font-weight: 600; color: ${light};
      font-family: 'DM Sans', sans-serif; user-select: none;
    }
    .faq-chevron {
      font-size: 20px; color: rgba(245,245,245,0.3); transition: transform 0.3s;
      display: inline-block;
    }
    .faq-toggle:checked + .faq-question .faq-chevron { transform: rotate(90deg); color: ${primary}; }
    .faq-answer {
      max-height: 0; overflow: hidden; transition: max-height 0.3s ease;
    }
    .faq-toggle:checked ~ .faq-answer { max-height: 200px; }
    .faq-answer p { padding: 0 0 20px; font-size: 14px; color: rgba(245,245,245,0.45); line-height: 1.7; }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid ${borderClr}; padding: 64px 24px 40px;
      background: ${surfaceBg};
    }
    .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; }
    .footer-brand-section .footer-brand {
      font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
      color: ${light}; margin-bottom: 12px;
    }
    .footer-brand-section .footer-desc { font-size: 13px; color: rgba(245,245,245,0.4); max-width: 280px; line-height: 1.6; }
    .footer-col h4 {
      font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
      color: ${light}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;
    }
    .footer-col a {
      display: block; font-size: 13px; color: rgba(245,245,245,0.4);
      margin-bottom: 10px; transition: color 0.2s;
    }
    .footer-col a:hover { color: ${primary}; }
    .footer-bottom {
      max-width: 1200px; margin: 40px auto 0; padding-top: 24px;
      border-top: 1px solid ${borderClr};
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
    }
    .footer-copy { font-size: 12px; color: rgba(245,245,245,0.25); }
    .footer-powered { font-size: 12px; color: rgba(245,245,245,0.2); }
    .footer-powered a { color: ${primary}; transition: opacity 0.2s; }
    .footer-powered a:hover { opacity: 0.8; }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .products-grid { grid-template-columns: repeat(2, 1fr); }
      .testimonials-grid { grid-template-columns: repeat(2, 1fr); }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .footer-inner { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 640px) {
      .nav { padding: 0 16px; height: 56px; }
      .nav-links {
        display: none; position: absolute; top: 56px; left: 0; right: 0;
        background: ${surfaceBg}; border-bottom: 1px solid ${borderClr};
        flex-direction: column; padding: 16px; gap: 12px;
      }
      .hamburger { display: block; }
      .nav-cart-badge { width: 16px; height: 16px; font-size: 9px; }
      .hero { padding: 64px 16px 56px; }
      .hero h1 { font-size: 32px; }
      .trust-badges { gap: 16px; }
      .products-section { padding: 56px 16px; }
      .products-grid { grid-template-columns: 1fr; }
      .social-proof { padding: 56px 16px; }
      .testimonials-grid { grid-template-columns: 1fr; }
      .features-section { padding: 56px 16px; }
      .features-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
      .faq-section { padding: 56px 16px; }
      .footer { padding: 48px 16px 32px; }
      .footer-inner { grid-template-columns: 1fr; gap: 32px; }
      .footer-bottom { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 400px) {
      .features-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <!-- Nav -->
  <nav class="nav">
    <div class="nav-brand">${safeName}</div>
    <input type="checkbox" id="mobile-toggle" />
    <label for="mobile-toggle" class="hamburger" aria-label="Menu"><span></span><span></span><span></span></label>
    <div class="nav-links">
      <a href="#products">Shop</a>
      <a href="#about">About</a>
      <a href="#faq">FAQ</a>
      <a href="#contact">Contact</a>
      <div class="nav-cart">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>
        <div class="nav-cart-badge">0</div>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="hero" id="about">
    <div class="hero-eyebrow">&#10022; Australian Owned &amp; Shipped</div>
    <h1>${safeTagline}</h1>
    <p class="hero-sub">Premium ${escHtml(nicheLabel)} for Australian shoppers. Curated for quality, backed by our 30-day guarantee.</p>
    <a href="#products" class="hero-cta">Shop Now &#8594;</a>
    <div class="trust-badges">
      <div class="trust-badge-item"><div class="trust-badge-icon">&#128666;</div> Free AU Shipping</div>
      <div class="trust-badge-item"><div class="trust-badge-icon">&#128179;</div> Afterpay Available</div>
      <div class="trust-badge-item"><div class="trust-badge-icon">&#128260;</div> 30-Day Returns</div>
      <div class="trust-badge-item"><div class="trust-badge-icon">&#128274;</div> Secure Checkout</div>
    </div>
  </section>

  <!-- Products -->
  <section class="products-section" id="products">
    <div class="section-header">
      <h2>Featured Products</h2>
      <p>Hand-selected and tested for the Australian market</p>
    </div>
    <div class="products-grid">
      ${productCards}
    </div>
  </section>

  <!-- Social Proof -->
  <section class="social-proof">
    <div class="section-header">
      <h2>Trusted by 2,400+ Australian Customers</h2>
      <p>See what our community has to say</p>
    </div>
    <div class="testimonials-grid">
      ${testimonialCards}
    </div>
  </section>

  <!-- Features -->
  <section class="features-section">
    <div class="section-header">
      <h2>Why Shop With Us</h2>
      <p>Built for Australian shoppers, from checkout to delivery</p>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">&#128666;</div>
        <h3>Free Shipping</h3>
        <p>Complimentary standard delivery on all Australian orders. No minimum spend.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#128179;</div>
        <h3>Afterpay</h3>
        <p>Pay in 4 interest-free instalments. Shop now, pay later with zero fees.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#128260;</div>
        <h3>30-Day Returns</h3>
        <p>Not happy? Return it within 30 days for a full refund. No questions asked.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#127462;&#127482;</div>
        <h3>AU Support</h3>
        <p>Local Australian customer support team. We reply within 24 hours, Mon-Fri.</p>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="faq-section" id="faq">
    <div class="section-header">
      <h2>Frequently Asked Questions</h2>
    </div>
    ${faqHTML}
  </section>

  <!-- Footer -->
  <footer class="footer" id="contact">
    <div class="footer-inner">
      <div class="footer-brand-section">
        <div class="footer-brand">${safeName}</div>
        <p class="footer-desc">${safeTagline}. Proudly serving Australian customers with premium ${escHtml(nicheLabel)} and exceptional service.</p>
      </div>
      <div class="footer-col">
        <h4>Quick Links</h4>
        <a href="#products">Shop All</a>
        <a href="#about">About Us</a>
        <a href="#faq">FAQ</a>
        <a href="#contact">Contact</a>
      </div>
      <div class="footer-col">
        <h4>Customer Care</h4>
        <a href="#faq">Shipping Info</a>
        <a href="#faq">Returns Policy</a>
        <a href="#faq">Afterpay</a>
        <a href="mailto:hello@${store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com.au">Email Us</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">&copy; ${year} ${safeName}. All rights reserved. ABN pending.</div>
      <div class="footer-powered">Powered by <a href="https://majorka.io" target="_blank" rel="noopener">Majorka</a></div>
    </div>
  </footer>
</body>
</html>`;
}

// ─── Store Preview Section ────────────────────────────────────
function StorePreviewSection({ store, niche }: { store: GeneratedStore; niche?: string }) {
  const htmlContent = useMemo(() => generateStoreHTML(store, niche), [store, niche]);
  const iframeSrcDoc = htmlContent;
  const [publishing, setPublishing] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  const handleDownload = useCallback(() => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    a.href = url;
    a.download = `${safeName || 'store'}-store.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Store HTML downloaded');
  }, [htmlContent, store.storeName]);

  const handlePreviewTab = useCallback(() => {
    const encoded = btoa(unescape(encodeURIComponent(htmlContent)));
    const dataUri = `data:text/html;base64,${encoded}`;
    window.open(dataUri, '_blank');
  }, [htmlContent]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    const slug = store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30) || 'my-store';
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? '';

    const res = await safeFetch<{ success: boolean; liveUrl?: string }>('/api/store-builder/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        storeName: store.storeName,
        niche: niche || '',
        primaryColor: store.colorPalette[0] || '#d4af37',
        subdomain: slug,
        mode: 'ai',
        htmlContent: htmlContent,
        selectedProducts: store.products,
      }),
    });
    setPublishing(false);
    if (res.ok && res.data?.liveUrl) {
      setLiveUrl(res.data.liveUrl);
      toast.success('Store published to Majorka');
    } else {
      toast.error(res.error ?? 'Publish failed');
    }
  }, [store, niche, htmlContent]);

  return (
    <div className="mt-8">
      <GoldCard>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center"
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: `1px solid rgba(59,130,246,0.3)`,
            }}
          >
            <Store size={18} style={{ color: CTA_BLUE }} />
          </div>
          <div>
            <div className="text-lg" style={{ fontFamily: SYNE, color: TEXT }}>
              Your Store Preview
            </div>
            <div className="text-xs" style={{ color: TEXT_DIM }}>
              A complete, downloadable storefront ready to sell from
            </div>
          </div>
        </div>

        <div
          className="store-preview-iframe"
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            overflow: 'hidden',
            width: '100%',
            height: 500,
          }}
        >
          <iframe
            srcDoc={iframeSrcDoc}
            title="Store preview"
            sandbox="allow-scripts"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#080808',
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={handleDownload}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: CTA_BLUE,
              color: '#fff',
              fontFamily: DM_SANS,
              boxShadow: '0 0 20px rgba(59,130,246,0.45)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Download size={16} />
            Download HTML
          </button>
          <button
            onClick={handlePreviewTab}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: TEXT,
              border: `1px solid ${BORDER}`,
              fontFamily: DM_SANS,
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={16} />
            Preview in tab
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: GOLD,
              color: '#080808',
              border: 'none',
              fontFamily: DM_SANS,
              fontWeight: 600,
              cursor: publishing ? 'not-allowed' : 'pointer',
              opacity: publishing ? 0.7 : 1,
            }}
          >
            <Rocket size={16} />
            {publishing ? 'Publishing...' : 'Publish to Majorka'}
          </button>
          <button
            onClick={() => {
              const el = document.querySelector('[data-tab="shopify"]');
              if (el instanceof HTMLElement) el.click();
            }}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: TEXT_DIM,
              border: `1px solid ${BORDER}`,
              fontFamily: DM_SANS,
              cursor: 'pointer',
            }}
          >
            <Link2 size={16} />
            Push to Shopify
          </button>
        </div>

        {liveUrl && (
          <div
            className="mt-4 rounded-md px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: TEXT, fontFamily: DM_SANS }}>
              Live at{' '}
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: GOLD, textDecoration: 'underline' }}
              >
                {liveUrl}
              </a>
            </div>
          </div>
        )}
      </GoldCard>
    </div>
  );
}

// ─── Mode 1: AI Generator ──────────────────────────────────────
function AIGeneratorMode({ onSaved }: { onSaved: () => void }) {
  // Pre-fill from Products page handoff (sessionStorage)
  const prefilled = (() => {
    try {
      const raw = sessionStorage.getItem('majorka_import_product');
      if (!raw) return null;
      sessionStorage.removeItem('majorka_import_product');
      return JSON.parse(raw) as {
        id?: string; title?: string; image?: string; price?: number;
        cost?: number; category?: string; description?: string;
        score?: number; orders?: number; aliexpress_url?: string;
      };
    } catch { return null; }
  })();

  const [niche, setNiche] = useState(prefilled?.category || '');
  const [market, setMarket] = useState<Market>('AU');
  const [vibe, setVibe] = useState<Vibe>('minimal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedStore | null>(null);

  // Show a pre-fill banner if a product was passed from the Products page
  const prefilledProduct = prefilled;

  const handleGenerate = useCallback(async () => {
    if (!niche.trim()) {
      toast.error('Enter a niche first');
      return;
    }
    setLoading(true);
    setPending(null);
    const res = await safeFetch<Record<string, unknown>>('/api/store-builder/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        niche,
        market,
        vibe,
        // Send the server's expected fields (storeBuilderSchema: productName, niche, pricePoint)
        productName: prefilledProduct?.title || niche,
        productDescription: prefilledProduct?.description || '',
        pricePoint: String(prefilledProduct?.price ?? ''),
      }),
    });
    setLoading(false);
    if (res.ok && res.data) {
      const store = normalizeStoreResponse(res.data, prefilledProduct);
      setPreview(store);
      toast.success('Store generated');
      return;
    }
    if (res.pending) {
      setPending('AI generation endpoint pending — wire in server/routes/store.ts');
      return;
    }
    toast.error(res.error ?? 'Generation failed');
  }, [niche, market, vibe]);

  const handleSave = useCallback(async () => {
    if (!preview) return;
    setSaving(true);
    const res = await safeFetch<{ id: string }>('/api/store-builder/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preview),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Store saved to marketplace');
      onSaved();
      return;
    }
    if (res.pending) {
      toast.error('Save endpoint pending — wire in server/routes/store.ts');
      return;
    }
    toast.error(res.error ?? 'Save failed');
  }, [preview, onSaved]);

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <GoldCard>
        <div
          className="text-lg mb-5"
          style={{ fontFamily: SYNE, color: TEXT }}
        >
          Store Brief
        </div>
        {prefilledProduct && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.25)`, borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
              Product imported from database
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {prefilledProduct.image && (
                <img src={prefilledProduct.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: `1px solid ${BORDER}` }} />
              )}
              <div>
                <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{prefilledProduct.title?.slice(0, 50)}</div>
                <div style={{ fontSize: 11, color: TEXT_DIM, fontFamily: MONO }}>
                  {prefilledProduct.price ? `A$${prefilledProduct.price}` : ''} · Score {prefilledProduct.score ?? '—'}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mb-4">
          <FieldLabel>Store Niche</FieldLabel>
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. minimalist kitchen tools"
            style={inputStyle}
          />
        </div>
        <div className="mb-4">
          <FieldLabel>Target Market</FieldLabel>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value as Market)}
            style={inputStyle}
          >
            <option value="AU">Australia</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
          </select>
        </div>
        <div className="mb-6">
          <FieldLabel>Vibe</FieldLabel>
          <select
            value={vibe}
            onChange={(e) => setVibe(e.target.value as Vibe)}
            style={inputStyle}
          >
            <option value="minimal">Minimal</option>
            <option value="bold">Bold</option>
            <option value="luxury">Luxury</option>
            <option value="streetwear">Streetwear</option>
          </select>
        </div>
        <PrimaryButton onClick={handleGenerate} disabled={loading} className="w-full">
          <span className="inline-flex items-center justify-center gap-2">
            <Zap size={16} />
            {loading ? 'Generating...' : 'Generate Store'}
          </span>
        </PrimaryButton>
        {pending && (
          <div className="mt-4">
            <PendingNotice note={pending} />
          </div>
        )}
      </GoldCard>

      <GoldCard>
        <div
          className="text-lg mb-5"
          style={{ fontFamily: SYNE, color: TEXT }}
        >
          Preview
        </div>
        {!preview ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            style={{ color: TEXT_MUTED, fontFamily: DM_SANS }}
          >
            <Palette size={32} className="text-accent mb-3" />
            <div className="text-sm">Your generated store will appear here</div>
          </div>
        ) : (
          <div>
            <div
              className="text-3xl mb-1"
              style={{ fontFamily: SYNE, color: TEXT }}
            >
              {preview.storeName}
            </div>
            <div className="text-sm mb-4" style={{ color: TEXT_DIM }}>
              {preview.tagline}
            </div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {preview.colorPalette.map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-md"
                  style={{ background: c, border: `1px solid ${BORDER}` }}
                  title={c}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              {preview.products.slice(0, 6).map((p, i) => (
                <div
                  key={i}
                  className="rounded-md overflow-hidden"
                  style={{
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <div
                    className="aspect-square"
                    style={{
                      backgroundImage: p.image_url ? `url(${p.image_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      background: p.image_url ? undefined : 'rgba(255,255,255,0.03)',
                    }}
                  />
                  <div className="p-2">
                    <div
                      className="text-xs truncate"
                      style={{ color: TEXT, fontFamily: DM_SANS }}
                    >
                      {p.title}
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{ color: GOLD, fontFamily: MONO }}
                    >
                      ${p.price_aud.toFixed(2)} AUD
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <PrimaryButton onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save to Marketplace'}
              </PrimaryButton>
              <GhostButton onClick={() => setPreview(null)}>Discard</GhostButton>
            </div>

            {/* ── MAKE IT REAL ── */}
            <div
              className="rounded-lg mt-5 p-5"
              style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}
            >
              <div className="text-base font-bold mb-3" style={{ fontFamily: SYNE, color: TEXT }}>
                Turn this into a real store
              </div>
              <div className="flex flex-col gap-3">
                {[
                  'Create a Shopify store at shopify.com (14-day free trial)',
                  'Come back here and connect it via the Shopify Sync tab',
                  'Push your products and brand settings directly to Shopify',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'rgba(212,175,55,0.15)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: GOLD,
                        fontFamily: MONO,
                      }}
                    >{i + 1}</div>
                    <span className="text-sm leading-relaxed" style={{ color: TEXT_DIM, fontFamily: DM_SANS }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <a
                  href="https://www.shopify.com/free-trial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white"
                  style={{ background: '#3B82F6', textDecoration: 'none', fontFamily: DM_SANS }}
                >Create Shopify store &rarr;</a>
              </div>
              <div className="text-xs mt-3" style={{ color: TEXT_MUTED, fontFamily: DM_SANS }}>
                Already have a store? Switch to the Shopify Sync tab above.
              </div>
            </div>
          </div>
        )}
      </GoldCard>

      {preview && <StorePreviewSection store={preview} niche={niche} />}
    </div>
  );
}

// ─── Mode 2: Shopify Sync ──────────────────────────────────────
function ShopifySyncMode() {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState<ShopifyValidation | null>(null);
  const [report, setReport] = useState<ShopifySyncReport | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  // Helper to get the current Supabase session token
  const getAuthToken = useCallback(async (): Promise<string> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  }, []);

  const handleConnect = useCallback(async () => {
    if (!url.trim() || !apiKey.trim()) {
      toast.error('Enter URL and API key');
      return;
    }
    setConnecting(true);
    setPending(null);
    const token = await getAuthToken();
    const res = await safeFetch<{ success: boolean; shopName: string; productCount: number }>('/api/shopify/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ shopUrl: url, accessToken: apiKey }),
    });
    setConnecting(false);
    if (res.ok && res.data?.success) {
      setConnected({ storeName: res.data.shopName, productCount: res.data.productCount });
      toast.success(`Connected to ${res.data.shopName}`);
      return;
    }
    toast.error(res.error ?? 'Connection failed');
  }, [url, apiKey, getAuthToken]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    const token = await getAuthToken();
    const res = await safeFetch<{ synced: number; products: unknown[] }>('/api/shopify/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    setSyncing(false);
    if (res.ok && res.data) {
      setReport({ matched: res.data.synced, unmatched: 0, recommendations: [] });
      toast.success(`Synced ${res.data.synced} products`);
      return;
    }
    toast.error(res.error ?? 'Sync failed');
  }, [getAuthToken]);

  const isConnected = connected !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <GoldCard>
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg" style={{ fontFamily: SYNE, color: TEXT }}>
            Shopify Connection
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-md text-xs"
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              fontFamily: MONO,
              color: isConnected ? GOLD : TEXT_DIM,
            }}
          >
            <span
              className="w-2 h-2 rounded-md"
              style={{
                background: isConnected ? GOLD : '#555',
                boxShadow: isConnected ? '0 0 8px rgba(212,175,55,0.6)' : 'none',
              }}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="mb-4">
          <FieldLabel>Shopify Store URL</FieldLabel>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="my-store.myshopify.com"
            style={inputStyle}
          />
        </div>
        <div className="mb-5">
          <FieldLabel>API Key</FieldLabel>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="shpat_..."
            style={inputStyle}
          />
        </div>
        <div className="flex gap-2">
          <PrimaryButton onClick={handleConnect} disabled={connecting}>
            <span className="inline-flex items-center gap-2">
              <Link2 size={16} />
              {connecting ? 'Connecting...' : 'Connect'}
            </span>
          </PrimaryButton>
          {isConnected && (
            <GhostButton onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync Products'}
            </GhostButton>
          )}
        </div>
        {pending && (
          <div className="mt-4">
            <PendingNotice note={pending} />
          </div>
        )}
      </GoldCard>

      <GoldCard>
        <div className="text-lg mb-5" style={{ fontFamily: SYNE, color: TEXT }}>
          Store Overview
        </div>
        {!isConnected ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            style={{ color: TEXT_MUTED, fontFamily: DM_SANS }}
          >
            <ShoppingBag size={32} className="text-accent mb-3" />
            <div className="text-sm">Connect a Shopify store to see details</div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div
                className="rounded-md p-4"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: TEXT_DIM }}>
                  Store Name
                </div>
                <div className="text-base" style={{ color: TEXT, fontFamily: SYNE }}>
                  {connected.storeName}
                </div>
              </div>
              <div
                className="rounded-md p-4"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: TEXT_DIM }}>
                  Products
                </div>
                <div className="text-base" style={{ color: GOLD, fontFamily: MONO }}>
                  {connected.productCount}
                </div>
              </div>
            </div>
            {report && (
              <div
                className="rounded-md p-4"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div className="text-sm mb-3" style={{ color: TEXT, fontFamily: SYNE }}>
                  Overlap Report
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs" style={{ color: TEXT_DIM }}>Matched</div>
                    <div className="text-xl" style={{ color: GOLD, fontFamily: MONO }}>
                      {report.matched}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: TEXT_DIM }}>Unmatched</div>
                    <div className="text-xl" style={{ color: TEXT, fontFamily: MONO }}>
                      {report.unmatched}
                    </div>
                  </div>
                </div>
                {report.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-2" style={{ color: TEXT_DIM }}>
                      Recommendations
                    </div>
                    <ul className="space-y-1">
                      {report.recommendations.map((r, i) => (
                        <li key={i} className="text-xs flex items-start gap-2" style={{ color: TEXT }}>
                          <CheckCircle2 size={12} className="text-accent mt-0.5 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </GoldCard>
    </div>
  );
}

// ─── Mode 3: Marketplace ───────────────────────────────────────
interface MarketplaceModeProps {
  reloadKey: number;
}

function MarketplaceMode({ reloadKey }: MarketplaceModeProps) {
  const [stores, setStores] = useState<SavedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await safeFetch<SavedStore[]>('/api/store-builder/list');
    setLoading(false);
    if (res.ok && res.data) {
      setStores(res.data);
      setPending(null);
      return;
    }
    if (res.pending) {
      setStores([]);
      setPending('Marketplace list endpoint pending — wire in server/routes/store.ts');
      return;
    }
    setPending(res.error ?? 'Failed to load stores');
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const handlePublish = useCallback(
    async (id: string) => {
      setPublishing(id);
      const res = await safeFetch<{ isPublished: boolean }>(
        `/api/store-builder/publish`,
        { method: 'POST' },
      );
      setPublishing(null);
      if (res.ok && res.data) {
        setStores((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, isPublished: res.data?.isPublished } : s,
          ),
        );
        toast.success(res.data.isPublished ? 'Store is live' : 'Store unpublished');
        return;
      }
      if (res.pending) {
        toast.error('Publish endpoint pending — wire in server/routes/store.ts');
        return;
      }
      toast.error(res.error ?? 'Publish failed');
    },
    [],
  );

  if (loading) {
    return (
      <GoldCard>
        <div
          className="py-12 text-center text-sm"
          style={{ color: TEXT_DIM, fontFamily: DM_SANS }}
        >
          Loading stores...
        </div>
      </GoldCard>
    );
  }

  if (pending) {
    return <PendingNotice note={pending} />;
  }

  if (stores.length === 0) {
    return (
      <GoldCard>
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          style={{ color: TEXT_MUTED, fontFamily: DM_SANS }}
        >
          <Store size={32} className="text-accent mb-3" />
          <div className="text-sm">No stores yet — generate one in the AI tab</div>
        </div>
      </GoldCard>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stores.map((s) => {
        const expanded = expandedId === s.id;
        return (
          <GoldCard
            key={s.id}
            onClick={() => setExpandedId(expanded ? null : s.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div
                className="text-lg"
                style={{ fontFamily: SYNE, color: TEXT }}
              >
                {s.name}
              </div>
              {s.isPublished && (
                <div
                  className="px-2 py-0.5 rounded-md text-xs flex items-center gap-1"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontFamily: MONO,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-md"
                    style={{ background: '#10b981' }}
                  />
                  Live
                </div>
              )}
            </div>
            <div
              className="text-xs mb-4"
              style={{ color: TEXT_DIM }}
            >
              {s.tagline}
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs" style={{ color: TEXT_MUTED }}>
                Products
              </div>
              <div
                className="text-sm"
                style={{ color: GOLD, fontFamily: MONO }}
              >
                {s.productCount}
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <PrimaryButton
                onClick={() => handlePublish(s.id)}
                disabled={publishing === s.id}
                className="w-full"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Rocket size={14} />
                  {publishing === s.id
                    ? 'Working...'
                    : s.isPublished
                      ? 'Unpublish'
                      : 'Publish'}
                </span>
              </PrimaryButton>
            </div>
            {expanded && (
              <div
                className="mt-4 pt-4"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <div
                  className="text-xs uppercase tracking-wider mb-2"
                  style={{ color: TEXT_DIM }}
                >
                  Details
                </div>
                <div className="text-xs space-y-1" style={{ color: TEXT }}>
                  <div>
                    ID: <span style={{ fontFamily: MONO, color: TEXT_DIM }}>{s.id}</span>
                  </div>
                  <div>
                    Status:{' '}
                    <span style={{ color: s.isPublished ? '#10b981' : TEXT_DIM }}>
                      {s.isPublished ? 'Live' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </GoldCard>
        );
      })}
    </div>
  );
}

// ─── Root page ─────────────────────────────────────────────────
export default function StoreBuilderPage() {
  const [mode, setMode] = useState<Mode>('ai');
  const [reloadKey, setReloadKey] = useState(0);

  const handleSaved = useCallback(() => {
    setReloadKey((k) => k + 1);
    setMode('marketplace');
  }, []);

  return (
    <>
      <Helmet>
        <title>Store Builder · Majorka</title>
      </Helmet>
      <div
        className="min-h-screen px-4 sm:px-6 lg:px-10 py-8"
        style={{
          background: BG,
          color: TEXT,
          fontFamily: DM_SANS,
          ['--color-accent' as string]: GOLD,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div
              className="text-3xl sm:text-4xl mb-2"
              style={{ fontFamily: SYNE, color: TEXT, letterSpacing: '-0.01em' }}
            >
              Store Builder
            </div>
            <div className="text-sm" style={{ color: TEXT_DIM }}>
              Three paths to a live AUD storefront.
            </div>
          </div>

          <div className="mb-8">
            <TabSwitcher mode={mode} onChange={setMode} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {mode === 'ai' && <AIGeneratorMode onSaved={handleSaved} />}
              {mode === 'shopify' && <ShopifySyncMode />}
              {mode === 'marketplace' && <MarketplaceMode reloadKey={reloadKey} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
