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
  Monitor,
  Smartphone,
  Copy,
  FileArchive,
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
type StoreTheme = 'dawn' | 'craft' | 'refresh' | 'impulse' | 'sense';

interface ThemeDef {
  id: StoreTheme;
  name: string;
  bestFor: string;
  swatch: string[];
}

const STORE_THEMES: ThemeDef[] = [
  { id: 'dawn', name: 'Dawn', bestFor: 'Beauty, fashion, lifestyle', swatch: ['#ffffff', '#111111', '#e5e5e5'] },
  { id: 'craft', name: 'Craft', bestFor: 'Tech, gadgets, premium goods', swatch: ['#0a0a0a', '#d4af37', '#ededed'] },
  { id: 'refresh', name: 'Refresh', bestFor: 'Pet, kids, health, kitchen', swatch: ['#f8fafc', '#22c55e', '#fbbf24'] },
  { id: 'impulse', name: 'Impulse', bestFor: 'Impulse buys, viral products', swatch: ['#ffffff', '#ef4444', '#111111'] },
  { id: 'sense', name: 'Sense', bestFor: 'Jewellery, watches, premium fashion', swatch: ['#f5f0eb', '#8b7355', '#2c2c2c'] },
];

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
function generateStoreHTML(store: GeneratedStore, niche?: string, theme: StoreTheme = 'craft'): string {
  const year = new Date().getFullYear();
  const nicheLabel = niche || 'premium products';
  const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeName = escHtml(store.storeName);
  const safeTagline = escHtml(store.tagline);
  const emailSlug = store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '');

  const testimonials = [
    { name: 'Sarah M.', loc: 'Sydney, NSW', text: `Absolutely love my purchase from ${store.storeName}! Quality exceeded my expectations and shipping was incredibly fast.`, stars: 5 },
    { name: 'Jake T.', loc: 'Brisbane, QLD', text: 'Best purchase I\'ve made this year. The Afterpay option made it so easy. Will definitely be ordering again!', stars: 5 },
    { name: 'Emma K.', loc: 'Melbourne, VIC', text: 'Great product, excellent packaging, and the customer service team was super helpful. Highly recommend to anyone.', stars: 5 },
  ];

  const faqItems = [
    { q: 'How fast is shipping within Australia?', a: 'We dispatch same-day before 2pm AEST. Standard delivery is 2-5 business days. Express options are available at checkout.' },
    { q: 'What is your return policy?', a: 'We offer a 30-day no-questions-asked return policy on all orders. Simply contact our team and we\'ll arrange a prepaid return label.' },
    { q: 'Do you offer Afterpay?', a: 'Yes! Pay in 4 interest-free instalments with Afterpay on all orders over $35. Select Afterpay at checkout.' },
  ];

  // Legacy product card builder — replaced by buildProductCardsEnhanced below
  const _buildProductCards = (cfg: {
    cardBg: string; borderClr: string; textClr: string; priceClr: string; btnBg: string; btnText: string;
    dimText: string; radius: string; imgPlaceholderBg: string; badgeBg: string; badgeText: string;
    fontBody: string; fontHeading: string; fontMono: string; showUrgency?: boolean;
  }) => store.products.slice(0, 6).map((p, i) => {
    const safeTitle = escHtml(p.title);
    const imgBlock = p.image_url
      ? `<img src="${escHtml(p.image_url)}" alt="${safeTitle}" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />`
      : `<div style="width:100%;aspect-ratio:1/1;background:${cfg.imgPlaceholderBg};display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;"><svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="${cfg.priceClr}" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span style="font-size:12px;color:${cfg.dimText};font-family:${cfg.fontBody};">Product Image</span></div>`;
    const badge = i === 0 ? `<div style="position:absolute;top:12px;left:12px;padding:4px 12px;background:${cfg.badgeBg};color:${cfg.badgeText};font-size:11px;font-weight:700;border-radius:4px;letter-spacing:0.05em;font-family:${cfg.fontBody};">BESTSELLER</div>` : '';
    const urgencyEl = cfg.showUrgency ? `<div style="font-size:11px;color:#ef4444;font-weight:600;margin-bottom:8px;font-family:${cfg.fontBody};">Only ${Math.floor(Math.random() * 8) + 2} left - Selling fast!</div>` : '';
    return `
      <div class="product-card" itemscope itemtype="https://schema.org/Product">
        <meta itemprop="sku" content="MJK-${String(i + 1).padStart(3, '0')}" />
        <div style="position:relative;overflow:hidden;border-radius:${cfg.radius} ${cfg.radius} 0 0;">${imgBlock}${badge}</div>
        <div style="padding:20px;">
          <div style="display:flex;align-items:center;gap:6px;"><span style="color:#facc15;font-size:14px;letter-spacing:1px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <span style="font-size:12px;color:${cfg.dimText};font-family:${cfg.fontMono};">4.8</span></div>
          <h3 itemprop="name" style="margin:8px 0 4px;font-family:${cfg.fontHeading};font-size:16px;font-weight:600;color:${cfg.textClr};line-height:1.3;">${safeTitle}</h3>
          ${urgencyEl}
          <div style="font-size:12px;color:${cfg.dimText};margin-bottom:12px;">Ships from AU warehouse</div>
          <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="priceCurrency" content="AUD" />
            <span itemprop="price" content="${p.price_aud.toFixed(2)}" style="font-family:${cfg.fontMono};font-size:22px;color:${cfg.priceClr};font-weight:700;">A$${p.price_aud.toFixed(2)}</span>
            <link itemprop="availability" href="https://schema.org/InStock" />
          </div>
          <div style="font-size:12px;color:${cfg.dimText};margin:8px 0 16px;">or 4 x A$${(p.price_aud / 4).toFixed(2)} with <strong style="color:${cfg.textClr};">Afterpay</strong></div>
          <button style="width:100%;padding:12px 20px;background:${cfg.btnBg};color:${cfg.btnText};font-family:${cfg.fontBody};font-weight:600;font-size:14px;border:none;border-radius:6px;cursor:pointer;transition:opacity 0.2s;">${cfg.showUrgency ? 'Buy Now' : 'Add to Cart'}</button>
        </div>
      </div>`;
  }).join('\n');

  // Shared testimonial builder
  const buildTestimonials = (cfg: { cardBg: string; borderClr: string; textClr: string; dimText: string; accentClr: string; fontHeading: string; radius: string }) =>
    testimonials.map(t => `
    <div style="background:${cfg.cardBg};border:1px solid ${cfg.borderClr};border-radius:${cfg.radius};padding:28px;transition:border-color 0.2s;">
      <div style="color:#facc15;font-size:16px;letter-spacing:2px;margin-bottom:16px;">${'&#9733;'.repeat(t.stars)}</div>
      <p style="font-size:14px;color:${cfg.dimText};line-height:1.7;margin-bottom:20px;font-style:italic;">"${escHtml(t.text)}"</p>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.06);border:1px solid ${cfg.borderClr};display:flex;align-items:center;justify-content:center;font-family:${cfg.fontHeading};font-weight:700;font-size:16px;color:${cfg.accentClr};">${t.name[0]}</div>
        <div>
          <div style="font-weight:600;font-size:14px;color:${cfg.textClr};">${escHtml(t.name)}</div>
          <div style="font-size:12px;color:${cfg.dimText};">${escHtml(t.loc)}</div>
        </div>
      </div>
    </div>`).join('\n');

  // Shared FAQ builder
  const buildFAQ = (cfg: { borderClr: string; textClr: string; dimText: string; accentClr: string }) =>
    faqItems.map((f, i) => `
    <div style="border-bottom:1px solid ${cfg.borderClr};">
      <input type="checkbox" id="faq-${i}" style="display:none;" />
      <label for="faq-${i}" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:20px 0;font-size:15px;font-weight:600;color:${cfg.textClr};user-select:none;">${escHtml(f.q)}<span style="font-size:20px;color:${cfg.dimText};transition:transform 0.3s;display:inline-block;">&#8250;</span></label>
      <div class="faq-answer"><p style="padding:0 0 20px;font-size:14px;color:${cfg.dimText};line-height:1.7;">${escHtml(f.a)}</p></div>
    </div>`).join('\n');

  // Shared responsive CSS block
  const responsiveCSS = (navBg: string, borderClr: string) => `
    @media (max-width: 1024px) {
      .products-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .testimonials-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .footer-inner { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 640px) {
      .nav { padding: 0 16px !important; height: 56px !important; }
      .nav-links {
        display: none !important; position: absolute; top: 56px; left: 0; right: 0;
        background: ${navBg}; border-bottom: 1px solid ${borderClr};
        flex-direction: column; padding: 16px; gap: 12px;
      }
      #mobile-toggle:checked ~ .nav-links { display: flex !important; }
      .hamburger { display: block !important; }
      .hero { padding: 64px 16px 56px !important; }
      .hero h1 { font-size: 32px !important; }
      .products-section, .social-proof, .features-section, .faq-section { padding: 56px 16px !important; }
      .products-grid, .testimonials-grid { grid-template-columns: 1fr !important; }
      .features-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
      .footer { padding: 48px 16px 32px !important; }
      .footer-inner { grid-template-columns: 1fr !important; gap: 32px !important; }
      .footer-bottom { flex-direction: column !important; align-items: flex-start !important; }
    }
    @media (max-width: 400px) { .features-grid { grid-template-columns: 1fr !important; } }`;

  // Shared nav builder
  const buildNav = (cfg: { bg: string; borderClr: string; brandClr: string; linkClr: string; accentClr: string; fontHeading: string; hamburgerClr: string }) => `
  <nav class="nav" style="display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,48px);height:64px;border-bottom:1px solid ${cfg.borderClr};background:${cfg.bg};position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);">
    <div style="font-family:${cfg.fontHeading};font-size:22px;font-weight:800;color:${cfg.brandClr};letter-spacing:-0.02em;">${safeName}</div>
    <input type="checkbox" id="mobile-toggle" style="display:none;" />
    <label for="mobile-toggle" class="hamburger" aria-label="Menu" style="display:none;cursor:pointer;padding:8px;background:none;border:none;"><span style="display:block;width:22px;height:2px;background:${cfg.hamburgerClr};margin:5px 0;"></span><span style="display:block;width:22px;height:2px;background:${cfg.hamburgerClr};margin:5px 0;"></span><span style="display:block;width:22px;height:2px;background:${cfg.hamburgerClr};margin:5px 0;"></span></label>
    <div class="nav-links" style="display:flex;gap:32px;align-items:center;">
      <a href="#products" style="font-size:14px;font-weight:500;color:${cfg.linkClr};text-decoration:none;">Shop</a>
      <a href="#about" style="font-size:14px;font-weight:500;color:${cfg.linkClr};text-decoration:none;">About</a>
      <a href="#faq" style="font-size:14px;font-weight:500;color:${cfg.linkClr};text-decoration:none;">FAQ</a>
      <a href="#contact" style="font-size:14px;font-weight:500;color:${cfg.linkClr};text-decoration:none;">Contact</a>
      <div style="position:relative;padding:8px;cursor:pointer;">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="${cfg.linkClr}" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>
        <div style="position:absolute;top:2px;right:0;width:18px;height:18px;background:${cfg.accentClr};color:${cfg.bg};border-radius:50%;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;">0</div>
      </div>
    </div>
  </nav>`;

  // Shared features builder
  const buildFeatures = (cfg: { cardBg: string; borderClr: string; textClr: string; dimText: string; accentClr: string; fontHeading: string; iconBg: string; radius: string }) => `
    <section class="features-section" style="max-width:1200px;margin:0 auto;padding:80px 24px;">
      <div style="text-align:center;margin-bottom:48px;">
        <h2 style="font-family:${cfg.fontHeading};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${cfg.textClr};margin-bottom:12px;">Why Shop With Us</h2>
        <p style="font-size:16px;color:${cfg.dimText};max-width:480px;margin:0 auto;">Built for Australian shoppers, from checkout to delivery</p>
      </div>
      <div class="features-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;">
        <div style="text-align:center;padding:32px 20px;background:${cfg.cardBg};border:1px solid ${cfg.borderClr};border-radius:${cfg.radius};">
          <div style="width:56px;height:56px;border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:${cfg.iconBg};font-size:24px;">&#128666;</div>
          <h3 style="font-family:${cfg.fontHeading};font-size:15px;font-weight:600;color:${cfg.textClr};margin-bottom:8px;">Free Shipping</h3>
          <p style="font-size:13px;color:${cfg.dimText};line-height:1.5;">Complimentary standard delivery on all Australian orders. No minimum spend.</p>
        </div>
        <div style="text-align:center;padding:32px 20px;background:${cfg.cardBg};border:1px solid ${cfg.borderClr};border-radius:${cfg.radius};">
          <div style="width:56px;height:56px;border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:${cfg.iconBg};font-size:24px;">&#128179;</div>
          <h3 style="font-family:${cfg.fontHeading};font-size:15px;font-weight:600;color:${cfg.textClr};margin-bottom:8px;">Afterpay</h3>
          <p style="font-size:13px;color:${cfg.dimText};line-height:1.5;">Pay in 4 interest-free instalments. Shop now, pay later with zero fees.</p>
        </div>
        <div style="text-align:center;padding:32px 20px;background:${cfg.cardBg};border:1px solid ${cfg.borderClr};border-radius:${cfg.radius};">
          <div style="width:56px;height:56px;border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:${cfg.iconBg};font-size:24px;">&#128260;</div>
          <h3 style="font-family:${cfg.fontHeading};font-size:15px;font-weight:600;color:${cfg.textClr};margin-bottom:8px;">30-Day Returns</h3>
          <p style="font-size:13px;color:${cfg.dimText};line-height:1.5;">Not happy? Return it within 30 days for a full refund. No questions asked.</p>
        </div>
        <div style="text-align:center;padding:32px 20px;background:${cfg.cardBg};border:1px solid ${cfg.borderClr};border-radius:${cfg.radius};">
          <div style="width:56px;height:56px;border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:${cfg.iconBg};font-size:24px;">&#127462;&#127482;</div>
          <h3 style="font-family:${cfg.fontHeading};font-size:15px;font-weight:600;color:${cfg.textClr};margin-bottom:8px;">AU Support</h3>
          <p style="font-size:13px;color:${cfg.dimText};line-height:1.5;">Local Australian customer support team. We reply within 24 hours, Mon-Fri.</p>
        </div>
      </div>
    </section>`;

  // Shared footer builder
  const buildFooter = (cfg: { bg: string; borderClr: string; brandClr: string; textClr: string; dimText: string; accentClr: string; fontHeading: string }) => `
  <footer style="border-top:1px solid ${cfg.borderClr};padding:64px 24px 40px;background:${cfg.bg};" id="contact">
    <div class="footer-inner" style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:48px;">
      <div>
        <div style="font-family:${cfg.fontHeading};font-size:22px;font-weight:800;color:${cfg.brandClr};margin-bottom:12px;">${safeName}</div>
        <p style="font-size:13px;color:${cfg.dimText};max-width:280px;line-height:1.6;">${safeTagline}. Proudly serving Australian customers with premium ${escHtml(nicheLabel)} and exceptional service.</p>
      </div>
      <div>
        <h4 style="font-family:${cfg.fontHeading};font-size:13px;font-weight:700;color:${cfg.textClr};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">Quick Links</h4>
        <a href="#products" style="display:block;font-size:13px;color:${cfg.dimText};margin-bottom:10px;text-decoration:none;">Shop All</a>
        <a href="#about" style="display:block;font-size:13px;color:${cfg.dimText};margin-bottom:10px;text-decoration:none;">About Us</a>
        <a href="#faq" style="display:block;font-size:13px;color:${cfg.dimText};margin-bottom:10px;text-decoration:none;">FAQ</a>
        <a href="#contact" style="display:block;font-size:13px;color:${cfg.dimText};margin-bottom:10px;text-decoration:none;">Contact</a>
      </div>
      <div>
        <h4 style="font-family:${cfg.fontHeading};font-size:13px;font-weight:700;color:${cfg.textClr};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">Customer Care</h4>
        <a href="#faq" style="display:block;font-size:13px;color:${cfg.dimText};margin-bottom:10px;text-decoration:none;">Shipping Info</a>
        <a href="#faq" style="display:block;font-size:13px;color:${cfg.dimText};margin-bottom:10px;text-decoration:none;">Returns Policy</a>
        <a href="#faq" style="display:block;font-size:13px;color:${cfg.dimText};margin-bottom:10px;text-decoration:none;">Afterpay</a>
        <a href="mailto:hello@${emailSlug}.com.au" style="display:block;font-size:13px;color:${cfg.dimText};margin-bottom:10px;text-decoration:none;">Email Us</a>
      </div>
    </div>
    <div class="footer-bottom" style="max-width:1200px;margin:40px auto 0;padding-top:24px;border-top:1px solid ${cfg.borderClr};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div style="font-size:12px;color:${cfg.dimText};">&copy; ${year} ${safeName}. All rights reserved. ABN pending.</div>
      <div style="font-size:12px;color:${cfg.dimText};">Powered by <a href="https://majorka.io" target="_blank" rel="noopener" style="color:${cfg.accentClr};text-decoration:none;">Majorka</a></div>
    </div>
  </footer>`;

  // Shared announcement bar
  const buildAnnouncementBar = (cfg: { bg: string; textClr: string; fontBody: string }) => `
  <div id="announcement-bar" style="background:${cfg.bg};color:${cfg.textClr};text-align:center;padding:10px 40px 10px 16px;font-size:13px;font-weight:600;font-family:${cfg.fontBody};position:relative;letter-spacing:0.02em;">
    Free shipping on orders over A$50 &nbsp;|&nbsp; Afterpay available &nbsp;|&nbsp; 30-day returns
    <button onclick="this.parentElement.style.display='none'" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:${cfg.textClr};cursor:pointer;font-size:18px;line-height:1;opacity:0.7;" aria-label="Dismiss">&times;</button>
  </div>`;

  // Shared social proof banner (between hero and products)
  const buildSocialProofBanner = (cfg: { bg: string; borderClr: string; textClr: string; dimText: string; accentClr: string; fontBody: string }) => `
  <section style="padding:24px;background:${cfg.bg};border-top:1px solid ${cfg.borderClr};border-bottom:1px solid ${cfg.borderClr};">
    <div style="max-width:1200px;margin:0 auto;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:24px;">
      <div style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:${cfg.textClr};font-family:${cfg.fontBody};">
        <span style="color:#facc15;font-size:16px;letter-spacing:1px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 4.8/5 from 2,400+ reviews
      </div>
      <div style="width:1px;height:20px;background:${cfg.borderClr};"></div>
      <div style="font-size:13px;color:${cfg.dimText};font-family:${cfg.fontBody};">Trusted by <strong style="color:${cfg.textClr};">2,000+</strong> Australian customers</div>
      <div style="width:1px;height:20px;background:${cfg.borderClr};"></div>
      <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:${cfg.dimText};font-family:${cfg.fontBody};">
        <span style="display:inline-block;padding:2px 8px;background:${cfg.accentClr};color:#fff;border-radius:4px;font-size:11px;font-weight:700;">TRENDING</span> As seen on TikTok
      </div>
    </div>
  </section>`;

  // Shared email capture section
  const buildEmailCapture = (cfg: { bg: string; borderClr: string; textClr: string; dimText: string; accentClr: string; fontHeading: string; fontBody: string; btnBg: string; btnText: string; inputBg: string }) => `
  <section style="padding:80px 24px;background:${cfg.bg};border-top:1px solid ${cfg.borderClr};">
    <div style="max-width:520px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${cfg.fontHeading};font-size:clamp(24px,3.5vw,32px);font-weight:700;color:${cfg.textClr};margin-bottom:12px;">Get 10% Off Your First Order</h2>
      <p style="font-size:14px;color:${cfg.dimText};margin-bottom:28px;font-family:${cfg.fontBody};">Join 2,400+ subscribers and get exclusive deals, early access, and style tips.</p>
      <form onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed!';this.querySelector('button').style.opacity='0.7';" style="display:flex;gap:8px;max-width:440px;margin:0 auto;">
        <input type="email" placeholder="Enter your email" required style="flex:1;padding:12px 16px;background:${cfg.inputBg};border:1px solid ${cfg.borderClr};border-radius:6px;font-size:14px;color:${cfg.textClr};font-family:${cfg.fontBody};outline:none;" />
        <button type="submit" style="padding:12px 24px;background:${cfg.btnBg};color:${cfg.btnText};font-family:${cfg.fontBody};font-weight:600;font-size:14px;border:none;border-radius:6px;cursor:pointer;white-space:nowrap;">Subscribe</button>
      </form>
      <p style="font-size:11px;color:${cfg.dimText};margin-top:12px;font-family:${cfg.fontBody};">No spam. Unsubscribe anytime. Privacy respected.</p>
    </div>
  </section>`;

  // Shared sticky mobile cart bar
  const buildStickyCart = (cfg: { bg: string; textClr: string; btnBg: string; btnText: string; fontBody: string; fontMono: string }) => {
    const firstProduct = store.products[0];
    if (!firstProduct) return '';
    return `
  <div class="sticky-mobile-cart" style="display:none;position:fixed;bottom:0;left:0;right:0;background:${cfg.bg};padding:12px 16px;box-shadow:0 -4px 20px rgba(0,0,0,0.2);z-index:200;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,0.1);">
    <div style="flex:1;min-width:0;">
      <div style="font-size:13px;font-weight:600;color:${cfg.textClr};font-family:${cfg.fontBody};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(firstProduct.title)}</div>
      <div style="font-size:14px;font-weight:700;color:${cfg.textClr};font-family:${cfg.fontMono};">A$${firstProduct.price_aud.toFixed(2)}</div>
    </div>
    <button onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" style="padding:10px 24px;background:${cfg.btnBg};color:${cfg.btnText};font-family:${cfg.fontBody};font-weight:700;font-size:14px;border:none;border-radius:6px;cursor:pointer;white-space:nowrap;">Add to Cart</button>
  </div>
  <script>
  (function(){
    var cart=document.querySelector('.sticky-mobile-cart');
    var products=document.getElementById('products');
    if(!cart||!products)return;
    function check(){
      var isMobile=window.innerWidth<=640;
      var rect=products.getBoundingClientRect();
      cart.style.display=(isMobile&&rect.top<0)?'flex':'none';
    }
    window.addEventListener('scroll',check,{passive:true});
    window.addEventListener('resize',check,{passive:true});
  })();
  </script>`;
  };

  // Enhanced SEO head meta with JSON-LD
  const buildSEOHead = (fontLink: string) => `<meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName} - ${escHtml(nicheLabel)} | Australian Online Store</title>
  <meta name="description" content="${safeTagline}. Premium ${escHtml(nicheLabel)} for Australian shoppers. Free shipping, Afterpay available, 30-day returns." />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="${safeName}" />
  <meta property="og:description" content="${safeTagline}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="en_AU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeName}" />
  <meta name="twitter:description" content="${safeTagline}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  ${fontLink}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "${safeName}",
    "description": "${safeTagline}",
    "url": "https://${emailSlug}.com.au"
  }
  </script>
  ${store.products.slice(0, 3).map((p, i) => `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${escHtml(p.title)}",
    "sku": "MJK-${String(i + 1).padStart(3, '0')}",
    "offers": {
      "@type": "Offer",
      "price": "${p.price_aud.toFixed(2)}",
      "priceCurrency": "AUD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "${Math.floor(Math.random() * 200) + 50}"
    }
  }
  </script>`).join('\n')}`;

  // Enhanced product card builder with strikethrough, badges, quantity
  const buildProductCardsEnhanced = (cfg: {
    cardBg: string; borderClr: string; textClr: string; priceClr: string; btnBg: string; btnText: string;
    dimText: string; radius: string; imgPlaceholderBg: string; badgeBg: string; badgeText: string;
    fontBody: string; fontHeading: string; fontMono: string; showUrgency?: boolean;
  }) => store.products.slice(0, 6).map((p, i) => {
    const safeTitle = escHtml(p.title);
    const originalPrice = (p.price_aud * 1.3).toFixed(2);
    const imgBlock = p.image_url
      ? `<img src="${escHtml(p.image_url)}" alt="${safeTitle}" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />`
      : `<div style="width:100%;aspect-ratio:1/1;background:${cfg.imgPlaceholderBg};display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;"><svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="${cfg.priceClr}" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span style="font-size:12px;color:${cfg.dimText};font-family:${cfg.fontBody};">Product Image</span></div>`;
    const badgeLabel = i === 0 ? 'BESTSELLER' : (i === 1 ? 'NEW' : '');
    const badge = badgeLabel ? `<div style="position:absolute;top:12px;left:12px;padding:4px 12px;background:${cfg.badgeBg};color:${cfg.badgeText};font-size:11px;font-weight:700;border-radius:4px;letter-spacing:0.05em;font-family:${cfg.fontBody};">${badgeLabel}</div>` : '';
    const freeShipBadge = `<div style="position:absolute;top:12px;right:12px;padding:4px 8px;background:rgba(34,197,94,0.9);color:#fff;font-size:10px;font-weight:700;border-radius:4px;letter-spacing:0.04em;font-family:${cfg.fontBody};">FREE SHIPPING</div>`;
    const urgencyEl = cfg.showUrgency ? `<div style="font-size:11px;color:#ef4444;font-weight:600;margin-bottom:8px;font-family:${cfg.fontBody};">Only ${Math.floor(Math.random() * 8) + 2} left - Selling fast!</div>` : '';
    return `
      <div class="product-card" itemscope itemtype="https://schema.org/Product">
        <meta itemprop="sku" content="MJK-${String(i + 1).padStart(3, '0')}" />
        <div style="position:relative;overflow:hidden;border-radius:${cfg.radius} ${cfg.radius} 0 0;">${imgBlock}${badge}${freeShipBadge}</div>
        <div style="padding:20px;">
          <div style="display:flex;align-items:center;gap:6px;"><span style="color:#facc15;font-size:14px;letter-spacing:1px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <span style="font-size:12px;color:${cfg.dimText};font-family:${cfg.fontMono};">4.8</span></div>
          <h3 itemprop="name" style="margin:8px 0 4px;font-family:${cfg.fontHeading};font-size:16px;font-weight:600;color:${cfg.textClr};line-height:1.3;">${safeTitle}</h3>
          ${urgencyEl}
          <div style="font-size:12px;color:${cfg.dimText};margin-bottom:12px;">Ships from AU warehouse</div>
          <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="priceCurrency" content="AUD" />
            <span style="font-family:${cfg.fontMono};font-size:14px;color:${cfg.dimText};text-decoration:line-through;margin-right:8px;">A$${originalPrice}</span>
            <span itemprop="price" content="${p.price_aud.toFixed(2)}" style="font-family:${cfg.fontMono};font-size:22px;color:${cfg.priceClr};font-weight:700;">A$${p.price_aud.toFixed(2)}</span>
            <link itemprop="availability" href="https://schema.org/InStock" />
          </div>
          <div style="font-size:12px;color:${cfg.dimText};margin:8px 0 12px;">or 4 x A$${(p.price_aud / 4).toFixed(2)} with <strong style="color:${cfg.textClr};">Afterpay</strong></div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;border:1px solid ${cfg.borderClr};border-radius:6px;overflow:hidden;">
              <button style="width:32px;height:32px;background:transparent;border:none;color:${cfg.dimText};cursor:pointer;font-size:16px;">-</button>
              <span style="width:32px;text-align:center;font-size:13px;font-family:${cfg.fontMono};color:${cfg.textClr};">1</span>
              <button style="width:32px;height:32px;background:transparent;border:none;color:${cfg.dimText};cursor:pointer;font-size:16px;">+</button>
            </div>
          </div>
          <button style="width:100%;padding:14px 20px;background:${cfg.btnBg};color:${cfg.btnText};font-family:${cfg.fontBody};font-weight:700;font-size:14px;border:none;border-radius:6px;cursor:pointer;transition:opacity 0.2s;letter-spacing:0.02em;">${cfg.showUrgency ? 'BUY NOW' : 'ADD TO CART'}</button>
        </div>
      </div>`;
  }).join('\n');

  switch (theme) {
    // ─────────────────────────────────────────────────────────────
    // DAWN — Clean & Minimal (white bg, black text, thin borders)
    // ─────────────────────────────────────────────────────────────
    case 'dawn': {
      const bg = '#ffffff'; const textClr = '#111111'; const dimText = '#666666'; const borderClr = '#e5e5e5';
      const accent = '#111111'; const cardBg = '#fafafa'; const surfaceBg = '#f5f5f5';
      const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />`;
      const fH = "'Inter', sans-serif"; const fB = "'Inter', sans-serif"; const fM = "'JetBrains Mono', monospace";

      const productCards = buildProductCardsEnhanced({ cardBg, borderClr, textClr, priceClr: accent, btnBg: accent, btnText: '#fff', dimText, radius: '4px', imgPlaceholderBg: '#f0f0f0', badgeBg: accent, badgeText: '#fff', fontBody: fB, fontHeading: fH, fontMono: fM });
      const testimonialCards = buildTestimonials({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, radius: '4px' });
      const faqHTML = buildFAQ({ borderClr, textClr, dimText, accentClr: accent });

      return `<!DOCTYPE html><html lang="en"><head>
  ${buildSEOHead(fontLink)}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: ${fB}; background: ${bg}; color: ${textClr}; -webkit-font-smoothing: antialiased; line-height: 1.6; overflow-x: hidden; }
    a { color: inherit; text-decoration: none; } img { max-width: 100%; height: auto; }
    .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .product-card { background: ${cardBg}; border: 1px solid ${borderClr}; border-radius: 4px; overflow: hidden; transition: transform 0.25s, box-shadow 0.25s; }
    .product-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
    .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    input[type="checkbox"]:checked ~ .faq-answer { max-height: 200px; }
    ${responsiveCSS(bg, borderClr)}
  </style></head><body>
  ${buildAnnouncementBar({ bg: accent, textClr: '#fff', fontBody: fB })}
  ${buildNav({ bg, borderClr, brandClr: textClr, linkClr: dimText, accentClr: accent, fontHeading: fH, hamburgerClr: textClr })}
  <section class="hero" id="about" style="text-align:center;padding:96px 24px 80px;background:${bg};">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:${surfaceBg};border:1px solid ${borderClr};border-radius:100px;font-size:12px;font-weight:600;color:${textClr};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:24px;">Australian Owned &amp; Shipped</div>
    <h1 style="font-family:${fH};font-size:clamp(36px,6vw,64px);font-weight:700;letter-spacing:-0.03em;margin-bottom:20px;color:${textClr};line-height:1.1;max-width:720px;margin-left:auto;margin-right:auto;">${safeTagline}</h1>
    <p style="font-size:clamp(16px,2vw,20px);color:${dimText};max-width:560px;margin:0 auto 40px;line-height:1.6;">Premium ${escHtml(nicheLabel)} for Australian shoppers. Curated for quality, backed by our 30-day guarantee.</p>
    <a href="#products" style="display:inline-block;padding:16px 40px;background:${accent};color:#fff;font-family:${fH};font-weight:600;font-size:16px;border-radius:4px;text-decoration:none;transition:opacity 0.2s;">Shop Now &#8594;</a>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:24px;margin-top:48px;padding-top:32px;border-top:1px solid ${borderClr};">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};">&#128666; Free AU Shipping</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};">&#128179; Afterpay Available</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};">&#128260; 30-Day Returns</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};">&#128274; Secure Checkout</div>
    </div>
  </section>
  ${buildSocialProofBanner({ bg: surfaceBg, borderClr, textClr, dimText, accentClr: accent, fontBody: fB })}
  <section class="products-section" id="products" style="max-width:1200px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Featured Products</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">Hand-selected and tested for the Australian market</p></div>
    <div class="products-grid">${productCards}</div>
  </section>
  <section class="social-proof" style="padding:80px 24px;background:${surfaceBg};border-top:1px solid ${borderClr};border-bottom:1px solid ${borderClr};">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Trusted by 2,400+ Australian Customers</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">See what our community has to say</p></div>
    <div class="testimonials-grid">${testimonialCards}</div>
  </section>
  ${buildFeatures({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, iconBg: surfaceBg, radius: '4px' })}
  <section class="faq-section" id="faq" style="max-width:720px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Frequently Asked Questions</h2></div>
    ${faqHTML}
  </section>
  ${buildEmailCapture({ bg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, fontBody: fB, btnBg: accent, btnText: '#fff', inputBg: surfaceBg })}
  ${buildFooter({ bg: surfaceBg, borderClr, brandClr: textClr, textClr, dimText, accentClr: accent, fontHeading: fH })}
  ${buildStickyCart({ bg: textClr, textClr: '#fff', btnBg: accent, btnText: '#fff', fontBody: fB, fontMono: fM })}
</body></html>`;
    }

    // ─────────────────────────────────────────────────────────────
    // CRAFT — Bold & Premium (dark bg, gold accents)
    // ─────────────────────────────────────────────────────────────
    case 'craft': {
      const bg = '#0a0a0a'; const textClr = '#ededed'; const dimText = 'rgba(245,245,245,0.4)'; const borderClr = '#1a1a1a';
      const accent = '#d4af37'; const cardBg = '#111111'; const surfaceBg = '#0d0d0d';
      const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />`;
      const fH = "'Syne', sans-serif"; const fB = "'DM Sans', sans-serif"; const fM = "'JetBrains Mono', monospace";

      const productCards = buildProductCardsEnhanced({ cardBg, borderClr, textClr, priceClr: accent, btnBg: accent, btnText: bg, dimText, radius: '8px', imgPlaceholderBg: `linear-gradient(135deg,${cardBg},rgba(212,175,55,0.08))`, badgeBg: accent, badgeText: bg, fontBody: fB, fontHeading: fH, fontMono: fM });
      const testimonialCards = buildTestimonials({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, radius: '8px' });
      const faqHTML = buildFAQ({ borderClr, textClr, dimText, accentClr: accent });

      return `<!DOCTYPE html><html lang="en"><head>
  ${buildSEOHead(fontLink)}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: ${fB}; background: ${bg}; color: ${textClr}; -webkit-font-smoothing: antialiased; line-height: 1.6; overflow-x: hidden; }
    a { color: inherit; text-decoration: none; } img { max-width: 100%; height: auto; }
    .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .product-card { background: ${cardBg}; border: 1px solid ${borderClr}; border-radius: 8px; overflow: hidden; transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s; }
    .product-card:hover { transform: translateY(-4px); border-color: ${accent}; box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.1); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
    .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    input[type="checkbox"]:checked ~ .faq-answer { max-height: 200px; }
    ${responsiveCSS(surfaceBg, borderClr)}
  </style></head><body>
  ${buildAnnouncementBar({ bg: accent, textClr: bg, fontBody: fB })}
  ${buildNav({ bg: surfaceBg, borderClr, brandClr: textClr, linkClr: 'rgba(245,245,245,0.55)', accentClr: accent, fontHeading: fH, hamburgerClr: textClr })}
  <section class="hero" id="about" style="text-align:center;padding:96px 24px 80px;background:linear-gradient(180deg,${surfaceBg} 0%,rgba(212,175,55,0.03) 50%,${bg} 100%);">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:100px;font-size:12px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:24px;">&#10022; Australian Owned &amp; Shipped</div>
    <h1 style="font-family:${fH};font-size:clamp(36px,6vw,64px);font-weight:800;letter-spacing:-0.03em;margin-bottom:20px;color:${textClr};line-height:1.1;max-width:720px;margin-left:auto;margin-right:auto;">${safeTagline}</h1>
    <p style="font-size:clamp(16px,2vw,20px);color:rgba(245,245,245,0.5);max-width:560px;margin:0 auto 40px;line-height:1.6;">Premium ${escHtml(nicheLabel)} for Australian shoppers. Curated for quality, backed by our 30-day guarantee.</p>
    <a href="#products" style="display:inline-block;padding:16px 40px;background:${accent};color:${bg};font-family:${fH};font-weight:700;font-size:16px;border-radius:8px;text-decoration:none;box-shadow:0 4px 24px rgba(212,175,55,0.3);transition:transform 0.2s;">Shop Now &#8594;</a>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:24px;margin-top:48px;padding-top:32px;border-top:1px solid ${borderClr};">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(245,245,245,0.45);">&#128666; Free AU Shipping</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(245,245,245,0.45);">&#128179; Afterpay Available</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(245,245,245,0.45);">&#128260; 30-Day Returns</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(245,245,245,0.45);">&#128274; Secure Checkout</div>
    </div>
  </section>
  ${buildSocialProofBanner({ bg: surfaceBg, borderClr, textClr, dimText, accentClr: accent, fontBody: fB })}
  <section class="products-section" id="products" style="max-width:1200px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Featured Products</h2><p style="font-size:16px;color:rgba(245,245,245,0.45);max-width:480px;margin:0 auto;">Hand-selected and tested for the Australian market</p></div>
    <div class="products-grid">${productCards}</div>
  </section>
  <section class="social-proof" style="padding:80px 24px;background:${surfaceBg};border-top:1px solid ${borderClr};border-bottom:1px solid ${borderClr};">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Trusted by 2,400+ Australian Customers</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">See what our community has to say</p></div>
    <div class="testimonials-grid">${testimonialCards}</div>
  </section>
  ${buildFeatures({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, iconBg: 'rgba(212,175,55,0.08)', radius: '8px' })}
  <section class="faq-section" id="faq" style="max-width:720px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Frequently Asked Questions</h2></div>
    ${faqHTML}
  </section>
  ${buildEmailCapture({ bg: surfaceBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, fontBody: fB, btnBg: accent, btnText: bg, inputBg: cardBg })}
  ${buildFooter({ bg: surfaceBg, borderClr, brandClr: textClr, textClr, dimText, accentClr: accent, fontHeading: fH })}
  ${buildStickyCart({ bg: '#111', textClr: '#ededed', btnBg: accent, btnText: bg, fontBody: fB, fontMono: fM })}
</body></html>`;
    }

    // ─────────────────────────────────────────────────────────────
    // REFRESH — Bright & Energetic (light bg, rounded, playful)
    // ─────────────────────────────────────────────────────────────
    case 'refresh': {
      const bg = '#f8fafc'; const textClr = '#1e293b'; const dimText = '#64748b'; const borderClr = '#e2e8f0';
      const accent = store.colorPalette[0] || '#22c55e'; const cardBg = '#ffffff'; const surfaceBg = '#f1f5f9';
      const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />`;
      const fH = "'Nunito', sans-serif"; const fB = "'Nunito', sans-serif"; const fM = "'JetBrains Mono', monospace";

      const productCards = buildProductCardsEnhanced({ cardBg, borderClr, textClr, priceClr: accent, btnBg: accent, btnText: '#fff', dimText, radius: '12px', imgPlaceholderBg: surfaceBg, badgeBg: accent, badgeText: '#fff', fontBody: fB, fontHeading: fH, fontMono: fM });
      const testimonialCards = buildTestimonials({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, radius: '12px' });
      const faqHTML = buildFAQ({ borderClr, textClr, dimText, accentClr: accent });

      return `<!DOCTYPE html><html lang="en"><head>
  ${buildSEOHead(fontLink)}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: ${fB}; background: ${bg}; color: ${textClr}; -webkit-font-smoothing: antialiased; line-height: 1.6; overflow-x: hidden; }
    a { color: inherit; text-decoration: none; } img { max-width: 100%; height: auto; }
    .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .product-card { background: ${cardBg}; border: 1px solid ${borderClr}; border-radius: 12px; overflow: hidden; transition: transform 0.25s, box-shadow 0.25s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
    .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    input[type="checkbox"]:checked ~ .faq-answer { max-height: 200px; }
    ${responsiveCSS(cardBg, borderClr)}
  </style></head><body>
  ${buildAnnouncementBar({ bg: accent, textClr: '#fff', fontBody: fB })}
  ${buildNav({ bg: cardBg, borderClr, brandClr: textClr, linkClr: dimText, accentClr: accent, fontHeading: fH, hamburgerClr: textClr })}
  <section class="hero" id="about" style="text-align:center;padding:96px 24px 80px;background:linear-gradient(180deg,${cardBg} 0%,${bg} 100%);">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:100px;font-size:12px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:24px;">Australian Owned &amp; Shipped</div>
    <h1 style="font-family:${fH};font-size:clamp(36px,6vw,60px);font-weight:800;letter-spacing:-0.02em;margin-bottom:20px;color:${textClr};line-height:1.15;max-width:720px;margin-left:auto;margin-right:auto;">${safeTagline}</h1>
    <p style="font-size:clamp(16px,2vw,20px);color:${dimText};max-width:560px;margin:0 auto 40px;line-height:1.6;">Premium ${escHtml(nicheLabel)} for Australian shoppers. Curated for quality, backed by our 30-day guarantee.</p>
    <a href="#products" style="display:inline-block;padding:16px 40px;background:${accent};color:#fff;font-family:${fH};font-weight:700;font-size:16px;border-radius:12px;text-decoration:none;box-shadow:0 4px 16px rgba(34,197,94,0.25);transition:transform 0.2s;">Shop Now &#8594;</a>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:24px;margin-top:48px;padding-top:32px;border-top:1px solid ${borderClr};">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};font-weight:600;">&#128666; Free AU Shipping</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};font-weight:600;">&#128179; Afterpay Available</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};font-weight:600;">&#128260; 30-Day Returns</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};font-weight:600;">&#128274; Secure Checkout</div>
    </div>
  </section>
  ${buildSocialProofBanner({ bg: surfaceBg, borderClr, textClr, dimText, accentClr: accent, fontBody: fB })}
  <section class="products-section" id="products" style="max-width:1200px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Featured Products</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">Hand-selected and tested for the Australian market</p></div>
    <div class="products-grid">${productCards}</div>
  </section>
  <section class="social-proof" style="padding:80px 24px;background:${surfaceBg};border-top:1px solid ${borderClr};border-bottom:1px solid ${borderClr};">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Trusted by 2,400+ Australian Customers</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">See what our community has to say</p></div>
    <div class="testimonials-grid">${testimonialCards}</div>
  </section>
  ${buildFeatures({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, iconBg: 'rgba(34,197,94,0.06)', radius: '12px' })}
  <section class="faq-section" id="faq" style="max-width:720px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Frequently Asked Questions</h2></div>
    ${faqHTML}
  </section>
  ${buildEmailCapture({ bg: cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, fontBody: fB, btnBg: accent, btnText: '#fff', inputBg: surfaceBg })}
  ${buildFooter({ bg: cardBg, borderClr, brandClr: textClr, textClr, dimText, accentClr: accent, fontHeading: fH })}
  ${buildStickyCart({ bg: textClr, textClr: '#fff', btnBg: accent, btnText: '#fff', fontBody: fB, fontMono: fM })}
</body></html>`;
    }

    // ─────────────────────────────────────────────────────────────
    // IMPULSE — Conversion-Optimised (urgency, sticky bar, bold CTA)
    // ─────────────────────────────────────────────────────────────
    case 'impulse': {
      const bg = '#ffffff'; const textClr = '#111111'; const dimText = '#555555'; const borderClr = '#e5e5e5';
      const accent = '#ef4444'; const cardBg = '#ffffff'; const surfaceBg = '#fafafa';
      const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />`;
      const fH = "'Inter', sans-serif"; const fB = "'Inter', sans-serif"; const fM = "'JetBrains Mono', monospace";

      const productCards = buildProductCardsEnhanced({ cardBg, borderClr, textClr, priceClr: accent, btnBg: accent, btnText: '#fff', dimText, radius: '8px', imgPlaceholderBg: '#f5f5f5', badgeBg: accent, badgeText: '#fff', fontBody: fB, fontHeading: fH, fontMono: fM, showUrgency: true });
      const testimonialCards = buildTestimonials({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, radius: '8px' });
      const faqHTML = buildFAQ({ borderClr, textClr, dimText, accentClr: accent });

      return `<!DOCTYPE html><html lang="en"><head>
  ${buildSEOHead(fontLink)}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: ${fB}; background: ${bg}; color: ${textClr}; -webkit-font-smoothing: antialiased; line-height: 1.6; overflow-x: hidden; }
    a { color: inherit; text-decoration: none; } img { max-width: 100%; height: auto; }
    .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .product-card { background: ${cardBg}; border: 2px solid ${borderClr}; border-radius: 8px; overflow: hidden; transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; }
    .product-card:hover { transform: translateY(-4px); border-color: ${accent}; box-shadow: 0 12px 32px rgba(239,68,68,0.1); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
    .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    input[type="checkbox"]:checked ~ .faq-answer { max-height: 200px; }
    .sticky-bar { position: fixed; bottom: 0; left: 0; right: 0; background: ${textClr}; color: #fff; padding: 12px 24px; display: flex; align-items: center; justify-content: center; gap: 16px; z-index: 200; font-size: 14px; font-weight: 600; box-shadow: 0 -4px 24px rgba(0,0,0,0.15); }
    .sticky-bar button { background: ${accent}; color: #fff; border: none; padding: 10px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
    .urgency-banner { background: ${accent}; color: #fff; text-align: center; padding: 10px; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; }
    ${responsiveCSS(bg, borderClr)}
  </style></head><body>
  <div class="urgency-banner">LIMITED TIME: Free express shipping on orders over A$75 - Ends midnight!</div>
  ${buildNav({ bg, borderClr, brandClr: textClr, linkClr: dimText, accentClr: accent, fontHeading: fH, hamburgerClr: textClr })}
  <section class="hero" id="about" style="text-align:center;padding:80px 24px 64px;background:${bg};">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:100px;font-size:12px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:24px;">Trending in Australia</div>
    <h1 style="font-family:${fH};font-size:clamp(36px,6vw,60px);font-weight:800;letter-spacing:-0.03em;margin-bottom:20px;color:${textClr};line-height:1.1;max-width:720px;margin-left:auto;margin-right:auto;">${safeTagline}</h1>
    <p style="font-size:clamp(16px,2vw,20px);color:${dimText};max-width:560px;margin:0 auto 32px;line-height:1.6;">Premium ${escHtml(nicheLabel)} for Australian shoppers. Join 2,400+ happy customers.</p>
    <a href="#products" style="display:inline-block;padding:18px 48px;background:${accent};color:#fff;font-family:${fH};font-weight:800;font-size:18px;border-radius:8px;text-decoration:none;box-shadow:0 4px 24px rgba(239,68,68,0.3);transition:transform 0.2s;">Shop Now - Free Shipping &#8594;</a>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:24px;margin-top:40px;padding-top:28px;border-top:1px solid ${borderClr};">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};font-weight:600;">&#128666; Free AU Shipping</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};font-weight:600;">&#128179; Afterpay Available</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};font-weight:600;">&#128260; 30-Day Returns</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};font-weight:600;">&#9733; 4.8/5 Rating</div>
    </div>
  </section>
  ${buildSocialProofBanner({ bg: surfaceBg, borderClr, textClr, dimText, accentClr: accent, fontBody: fB })}
  <section class="products-section" id="products" style="max-width:1200px;margin:0 auto;padding:64px 24px 100px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:800;color:${textClr};margin-bottom:12px;">Best Sellers</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">These products are flying off the shelves</p></div>
    <div class="products-grid">${productCards}</div>
  </section>
  <section class="social-proof" style="padding:80px 24px;background:${surfaceBg};border-top:1px solid ${borderClr};border-bottom:1px solid ${borderClr};">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:800;color:${textClr};margin-bottom:12px;">2,400+ Happy Customers</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">See why Australians love us</p></div>
    <div class="testimonials-grid">${testimonialCards}</div>
  </section>
  ${buildFeatures({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, iconBg: 'rgba(239,68,68,0.05)', radius: '8px' })}
  <section class="faq-section" id="faq" style="max-width:720px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:800;color:${textClr};margin-bottom:12px;">Frequently Asked Questions</h2></div>
    ${faqHTML}
  </section>
  ${buildEmailCapture({ bg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, fontBody: fB, btnBg: accent, btnText: '#fff', inputBg: surfaceBg })}
  ${buildFooter({ bg: surfaceBg, borderClr, brandClr: textClr, textClr, dimText, accentClr: accent, fontHeading: fH })}
  <div class="sticky-bar"><span>Limited stock available</span><button onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">Shop Now</button></div>
  ${buildStickyCart({ bg: textClr, textClr: '#fff', btnBg: accent, btnText: '#fff', fontBody: fB, fontMono: fM })}
</body></html>`;
    }

    // ─────────────────────────────────────────────────────────────
    // SENSE — Luxury & Editorial (serif, earth tones, full-bleed)
    // ─────────────────────────────────────────────────────────────
    case 'sense':
    default: {
      const bg = '#f5f0eb'; const textClr = '#2c2c2c'; const dimText = '#8b8178'; const borderClr = '#ddd5cb';
      const accent = '#8b7355'; const cardBg = '#ffffff'; const surfaceBg = '#ede7df';
      const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />`;
      const fH = "'Playfair Display', serif"; const fB = "'DM Sans', sans-serif"; const fM = "'JetBrains Mono', monospace";

      const productCards = buildProductCardsEnhanced({ cardBg, borderClr, textClr, priceClr: accent, btnBg: accent, btnText: '#fff', dimText, radius: '4px', imgPlaceholderBg: surfaceBg, badgeBg: accent, badgeText: '#fff', fontBody: fB, fontHeading: fH, fontMono: fM });
      const testimonialCards = buildTestimonials({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, radius: '4px' });
      const faqHTML = buildFAQ({ borderClr, textClr, dimText, accentClr: accent });

      return `<!DOCTYPE html><html lang="en"><head>
  ${buildSEOHead(fontLink)}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: ${fB}; background: ${bg}; color: ${textClr}; -webkit-font-smoothing: antialiased; line-height: 1.7; overflow-x: hidden; }
    a { color: inherit; text-decoration: none; } img { max-width: 100%; height: auto; }
    .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
    .product-card { background: ${cardBg}; border: 1px solid ${borderClr}; border-radius: 4px; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
    .product-card:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(44,44,44,0.08); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; max-width: 1200px; margin: 0 auto; }
    .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    input[type="checkbox"]:checked ~ .faq-answer { max-height: 200px; }
    ${responsiveCSS(cardBg, borderClr)}
  </style></head><body>
  ${buildAnnouncementBar({ bg: accent, textClr: '#fff', fontBody: fB })}
  ${buildNav({ bg: cardBg, borderClr, brandClr: textClr, linkClr: dimText, accentClr: accent, fontHeading: fH, hamburgerClr: textClr })}
  <section class="hero" id="about" style="text-align:center;padding:120px 24px 100px;background:${bg};">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 20px;border:1px solid ${borderClr};border-radius:100px;font-size:11px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:32px;">Australian Atelier</div>
    <h1 style="font-family:${fH};font-size:clamp(36px,6vw,64px);font-weight:700;letter-spacing:-0.02em;margin-bottom:24px;color:${textClr};line-height:1.1;max-width:760px;margin-left:auto;margin-right:auto;">${safeTagline}</h1>
    <p style="font-size:clamp(16px,2vw,20px);color:${dimText};max-width:520px;margin:0 auto 48px;line-height:1.7;font-family:${fB};">Premium ${escHtml(nicheLabel)} for Australian shoppers. Curated for quality, backed by our 30-day guarantee.</p>
    <a href="#products" style="display:inline-block;padding:16px 44px;background:${accent};color:#fff;font-family:${fB};font-weight:600;font-size:14px;border-radius:2px;text-decoration:none;letter-spacing:0.06em;text-transform:uppercase;transition:opacity 0.2s;">Discover the Collection</a>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:32px;margin-top:56px;padding-top:40px;border-top:1px solid ${borderClr};">
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:${dimText};letter-spacing:0.04em;">&#128666; Complimentary Shipping</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:${dimText};letter-spacing:0.04em;">&#128179; Afterpay Available</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:${dimText};letter-spacing:0.04em;">&#128260; 30-Day Returns</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:${dimText};letter-spacing:0.04em;">&#128274; Secure Checkout</div>
    </div>
  </section>
  ${buildSocialProofBanner({ bg: surfaceBg, borderClr, textClr, dimText, accentClr: accent, fontBody: fB })}
  <section class="products-section" id="products" style="max-width:1200px;margin:0 auto;padding:100px 24px;">
    <div style="text-align:center;margin-bottom:56px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,40px);font-weight:700;color:${textClr};margin-bottom:16px;">The Collection</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">Hand-selected pieces for the Australian connoisseur</p></div>
    <div class="products-grid">${productCards}</div>
  </section>
  <section class="social-proof" style="padding:100px 24px;background:${surfaceBg};border-top:1px solid ${borderClr};border-bottom:1px solid ${borderClr};">
    <div style="text-align:center;margin-bottom:56px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,40px);font-weight:700;color:${textClr};margin-bottom:16px;">What Our Clients Say</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">Trusted by discerning Australian shoppers</p></div>
    <div class="testimonials-grid">${testimonialCards}</div>
  </section>
  ${buildFeatures({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, iconBg: 'rgba(139,115,85,0.06)', radius: '4px' })}
  <section class="faq-section" id="faq" style="max-width:720px;margin:0 auto;padding:100px 24px;">
    <div style="text-align:center;margin-bottom:56px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,40px);font-weight:700;color:${textClr};margin-bottom:16px;">Frequently Asked Questions</h2></div>
    ${faqHTML}
  </section>
  ${buildEmailCapture({ bg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, fontBody: fB, btnBg: accent, btnText: '#fff', inputBg: cardBg })}
  ${buildFooter({ bg: surfaceBg, borderClr, brandClr: textClr, textClr, dimText, accentClr: accent, fontHeading: fH })}
  ${buildStickyCart({ bg: textClr, textClr: '#fff', btnBg: accent, btnText: '#fff', fontBody: fB, fontMono: fM })}
</body></html>`;
    }
  }
}

// ─── Store Preview Section ────────────────────────────────────
function StorePreviewSection({ store, niche, theme: initialTheme = 'craft' }: { store: GeneratedStore; niche?: string; theme?: StoreTheme }) {
  const [activeTheme, setActiveTheme] = useState<StoreTheme>(initialTheme);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const htmlContent = useMemo(() => generateStoreHTML(store, niche, activeTheme), [store, niche, activeTheme]);
  const iframeSrcDoc = htmlContent;
  const [publishing, setPublishing] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  const handleDownload = useCallback(() => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    a.href = url;
    a.download = `${safeName || 'store'}-complete-store.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Complete store HTML downloaded');
  }, [htmlContent, store.storeName]);

  const handleDownloadShopify = useCallback(() => {
    const liquidWrapped = `{% comment %}Generated by Majorka Store Builder{% endcomment %}
{{ content_for_header }}
${htmlContent}
{{ content_for_layout }}`;
    const blob = new Blob([liquidWrapped], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    a.href = url;
    a.download = `${safeName || 'store'}-shopify-theme.liquid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Shopify Liquid theme downloaded');
  }, [htmlContent, store.storeName]);

  const handleCopyText = useCallback(() => {
    const lines = [
      `Store Name: ${store.storeName}`,
      `Tagline: ${store.tagline}`,
      '',
      '--- Products ---',
      ...store.products.map((p, i) => `${i + 1}. ${p.title} - A$${p.price_aud.toFixed(2)}`),
      '',
      '--- Generated by Majorka Store Builder ---',
    ];
    void navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Store text copied to clipboard');
  }, [store]);

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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-1 rounded-md p-1" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <button
              onClick={() => setViewMode('desktop')}
              className="rounded px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
              style={{
                background: viewMode === 'desktop' ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: viewMode === 'desktop' ? GOLD : TEXT_DIM,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className="rounded px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
              style={{
                background: viewMode === 'mobile' ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: viewMode === 'mobile' ? GOLD : TEXT_DIM,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>
        </div>

        {/* Theme switcher — swap theme without regenerating */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {STORE_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTheme(t.id)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-all inline-flex items-center gap-2"
              style={{
                background: activeTheme === t.id ? 'rgba(212,175,55,0.1)' : SURFACE,
                border: `1px solid ${activeTheme === t.id ? GOLD : BORDER}`,
                color: activeTheme === t.id ? GOLD : TEXT_DIM,
                cursor: 'pointer',
              }}
            >
              <div className="flex gap-0.5">
                {t.swatch.map((c, ci) => (
                  <div key={ci} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              {t.name}
            </button>
          ))}
        </div>

        <div
          className="store-preview-iframe"
          style={{
            border: viewMode === 'mobile' ? `3px solid ${BORDER}` : `1px solid ${BORDER}`,
            borderRadius: viewMode === 'mobile' ? 24 : 8,
            overflow: 'hidden',
            width: viewMode === 'mobile' ? 375 : '100%',
            height: viewMode === 'mobile' ? 667 : 500,
            margin: viewMode === 'mobile' ? '0 auto' : undefined,
            boxShadow: viewMode === 'mobile' ? '0 8px 32px rgba(0,0,0,0.4)' : undefined,
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
            Download complete store
          </button>
          <button
            onClick={handleDownloadShopify}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: TEXT,
              border: `1px solid ${BORDER}`,
              fontFamily: DM_SANS,
              cursor: 'pointer',
            }}
          >
            <FileArchive size={16} />
            Download for Shopify
          </button>
          <button
            onClick={handleCopyText}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: TEXT,
              border: `1px solid ${BORDER}`,
              fontFamily: DM_SANS,
              cursor: 'pointer',
            }}
          >
            <Copy size={16} />
            Copy all text
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
  const [selectedTheme, setSelectedTheme] = useState<StoreTheme>('craft');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedStore | null>(null);
  const [customStoreName, setCustomStoreName] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [priceRange, setPriceRange] = useState('$20-$50');
  const [usp, setUsp] = useState('');
  const [includeAfterpay, setIncludeAfterpay] = useState(true);
  const [includeReviews, setIncludeReviews] = useState(true);

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
        productName: prefilledProduct?.title || niche,
        productDescription: prefilledProduct?.description || '',
        pricePoint: String(prefilledProduct?.price ?? ''),
        storeName: customStoreName || undefined,
        targetCustomer: targetCustomer || undefined,
        priceRange,
        usp: usp || undefined,
        includeAfterpay,
        includeReviews,
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
  }, [niche, market, vibe, customStoreName, targetCustomer, priceRange, usp, includeAfterpay, includeReviews]);

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
          <FieldLabel>Store Name <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(optional — AI generates if blank)</span></FieldLabel>
          <input
            value={customStoreName}
            onChange={(e) => setCustomStoreName(e.target.value)}
            placeholder="e.g. KitchenCraft AU"
            style={inputStyle}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
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
          <div>
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
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <FieldLabel>Target Customer</FieldLabel>
            <select
              value={targetCustomer}
              onChange={(e) => setTargetCustomer(e.target.value)}
              style={inputStyle}
            >
              <option value="">General</option>
              <option value="Budget shoppers">Budget shoppers</option>
              <option value="Premium buyers">Premium buyers</option>
              <option value="Gift shoppers">Gift shoppers</option>
              <option value="Impulse buyers">Impulse buyers</option>
              <option value="Health-conscious">Health-conscious</option>
            </select>
          </div>
          <div>
            <FieldLabel>Price Range</FieldLabel>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              style={inputStyle}
            >
              <option value="Under $20">Under $20</option>
              <option value="$20-$50">$20-$50</option>
              <option value="$50-$100">$50-$100</option>
              <option value="$100+">$100+</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <FieldLabel>Unique Selling Point <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(what makes your store different?)</span></FieldLabel>
          <textarea
            value={usp}
            onChange={(e) => setUsp(e.target.value)}
            placeholder="e.g. Every product is tested by real Australian families before we list it"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
        </div>
        <div className="flex gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13, color: TEXT }}>
            <input
              type="checkbox"
              checked={includeAfterpay}
              onChange={(e) => setIncludeAfterpay(e.target.checked)}
              style={{ accentColor: GOLD }}
            />
            Include Afterpay
          </label>
          <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13, color: TEXT }}>
            <input
              type="checkbox"
              checked={includeReviews}
              onChange={(e) => setIncludeReviews(e.target.checked)}
              style={{ accentColor: GOLD }}
            />
            Include reviews
          </label>
        </div>
        <div className="mb-6">
          <FieldLabel>Store Theme</FieldLabel>
          <div className="flex flex-col gap-2">
            {STORE_THEMES.map((t) => {
              const active = selectedTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTheme(t.id)}
                  className="text-left rounded-md p-3 transition-all duration-200"
                  style={{
                    background: active ? 'rgba(212,175,55,0.06)' : SURFACE,
                    border: `1.5px solid ${active ? GOLD : BORDER}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 flex-shrink-0">
                      {t.swatch.map((c, ci) => (
                        <div
                          key={ci}
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            background: c,
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </div>
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: active ? GOLD : TEXT, fontFamily: SYNE }}
                      >
                        {t.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: TEXT_DIM }}
                      >
                        Best for: {t.bestFor}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
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

      {preview && <StorePreviewSection store={preview} niche={niche} theme={selectedTheme} />}
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
