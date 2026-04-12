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
function normalizeStoreResponse(raw: any): GeneratedStore {
  // Handle both the server's real shape and the flat shape (for future-proofing)
  if (raw?.storeName && raw?.tagline) return raw as GeneratedStore;
  const brief = raw?.brief || {};
  const storeName = raw?.storeNameOptions?.[0] || brief.brandName || brief.storeName || 'My Store';
  const tagline = brief.tagline || brief.description || `Premium ${brief.niche || 'products'} for discerning buyers`;
  const palette = brief.colorPalette || brief.colors || ['#d4af37', '#080808', '#ededed'];
  const font = brief.font || raw?.themeRecommendation?.name || 'Modern';
  const rationale = brief.rationale || raw?.themeRecommendation?.reason || '';
  const products: GeneratedProduct[] = (brief.products || []).map((p: any) => ({
    title: p.title || p.product_title || 'Product',
    price_aud: p.price_aud || p.price || 0,
    image_url: p.image_url || p.image || '',
  }));
  // If server returned no products, synthesize a placeholder from the imported product
  if (products.length === 0) {
    const imported = (() => { try { return JSON.parse(sessionStorage.getItem('_last_import') || 'null'); } catch { return null; } })();
    if (imported?.title) products.push({ title: imported.title, price_aud: imported.price || 0, image_url: imported.image || '' });
  }
  return { storeName, tagline, colorPalette: Array.isArray(palette) ? palette : [palette], font, rationale, products };
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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

// ─── Generate complete storefront HTML ─────────────────────────
function generateStoreHTML(store: GeneratedStore): string {
  const primary = store.colorPalette[0] || '#d4af37';
  const bg = store.colorPalette[1] || '#080808';
  const light = store.colorPalette[2] || '#ededed';
  const surfaceBg = '#0d0d0d';
  const cardBg = '#111111';
  const borderClr = '#1a1a1a';
  const year = new Date().getFullYear();

  const productCards = store.products.slice(0, 3).map((p, i) => {
    const imgBlock = p.image_url
      ? `<img src="${p.image_url}" alt="${p.title}" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />`
      : `<div style="width:100%;aspect-ratio:1/1;background:${cardBg};display:flex;align-items:center;justify-content:center;color:${primary};font-size:14px;">No image</div>`;

    return `
      <div class="product-card" itemscope itemtype="https://schema.org/Product">
        <meta itemprop="sku" content="MJK-${String(i + 1).padStart(3, '0')}" />
        <div style="overflow:hidden;border-radius:8px 8px 0 0;">${imgBlock}</div>
        <div style="padding:16px;">
          <h3 itemprop="name" style="margin:0 0 8px;font-family:'Syne',sans-serif;font-size:15px;color:${light};">${p.title}</h3>
          <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="priceCurrency" content="AUD" />
            <span itemprop="price" content="${p.price_aud.toFixed(2)}" style="font-family:'JetBrains Mono',monospace;font-size:18px;color:${primary};font-weight:700;">A$${p.price_aud.toFixed(2)}</span>
            <link itemprop="availability" href="https://schema.org/InStock" />
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
            <button class="add-to-cart-btn">Add to Cart</button>
            <span class="afterpay-badge">or 4 x A$${(p.price_aud / 4).toFixed(2)} with Afterpay</span>
          </div>
        </div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${store.storeName}</title>
  <meta name="description" content="${store.tagline}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: ${bg};
      color: ${light};
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }
    a { color: inherit; text-decoration: none; }

    /* ── Nav ── */
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid ${borderClr};
      background: ${surfaceBg};
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .nav-brand {
      font-family: 'Syne', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: ${light};
      letter-spacing: -0.01em;
    }
    .nav-links { display: flex; gap: 28px; }
    .nav-links a {
      font-size: 14px;
      color: rgba(245,245,245,0.6);
      transition: color 0.2s;
    }
    .nav-links a:hover { color: ${primary}; }

    /* ── Hero ── */
    .hero {
      text-align: center;
      padding: 80px 24px 64px;
      background: linear-gradient(180deg, ${surfaceBg} 0%, ${bg} 100%);
    }
    .hero h1 {
      font-family: 'Syne', sans-serif;
      font-size: clamp(32px, 5vw, 56px);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 16px;
      color: ${light};
    }
    .hero p {
      font-size: 18px;
      color: rgba(245,245,245,0.55);
      max-width: 540px;
      margin: 0 auto 32px;
    }
    .hero-cta {
      display: inline-block;
      padding: 14px 36px;
      background: ${primary};
      color: ${bg};
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 15px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
    }
    .hero-cta:hover { opacity: 0.9; transform: translateY(-1px); }

    /* ── Products ── */
    .products-section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 64px 24px;
    }
    .products-section h2 {
      font-family: 'Syne', sans-serif;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 32px;
      text-align: center;
      color: ${light};
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }
    .product-card {
      background: ${cardBg};
      border: 1px solid ${borderClr};
      border-radius: 8px;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .product-card:hover {
      border-color: ${primary};
      box-shadow: 0 0 24px rgba(212,175,55,0.15);
    }
    .add-to-cart-btn {
      padding: 10px 20px;
      background: ${primary};
      color: ${bg};
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      font-size: 13px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .add-to-cart-btn:hover { opacity: 0.85; }
    .afterpay-badge {
      font-size: 11px;
      color: rgba(245,245,245,0.4);
    }

    /* ── Trust bar ── */
    .trust-bar {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 32px;
      padding: 40px 24px;
      border-top: 1px solid ${borderClr};
      border-bottom: 1px solid ${borderClr};
      background: ${surfaceBg};
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: rgba(245,245,245,0.6);
    }
    .trust-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(212,175,55,0.08);
      border: 1px solid rgba(212,175,55,0.2);
      font-size: 16px;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      padding: 40px 24px;
      border-top: 1px solid ${borderClr};
    }
    .footer-brand {
      font-family: 'Syne', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: ${light};
      margin-bottom: 8px;
    }
    .footer-copy {
      font-size: 12px;
      color: rgba(245,245,245,0.3);
    }
    .footer-powered {
      font-size: 11px;
      color: rgba(245,245,245,0.2);
      margin-top: 16px;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .nav { padding: 12px 16px; }
      .nav-links { gap: 16px; }
      .nav-links a { font-size: 13px; }
      .hero { padding: 48px 16px 40px; }
      .hero p { font-size: 16px; }
      .products-section { padding: 40px 16px; }
      .trust-bar { gap: 20px; padding: 28px 16px; }
    }
  </style>
</head>
<body>
  <!-- Nav -->
  <nav class="nav">
    <div class="nav-brand">${store.storeName}</div>
    <div class="nav-links">
      <a href="#products">Shop</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="hero" id="about">
    <h1>${store.storeName}</h1>
    <p>${store.tagline}</p>
    <a href="#products" class="hero-cta">Shop Now</a>
  </section>

  <!-- Products -->
  <section class="products-section" id="products">
    <h2>Featured Products</h2>
    <div class="products-grid">
      ${productCards}
    </div>
  </section>

  <!-- Trust Bar -->
  <section class="trust-bar">
    <div class="trust-item">
      <div class="trust-icon">&#x1F69A;</div>
      <span>Free AU Shipping</span>
    </div>
    <div class="trust-item">
      <div class="trust-icon">&#x1F4B3;</div>
      <span>Afterpay Available</span>
    </div>
    <div class="trust-item">
      <div class="trust-icon">&#x1F504;</div>
      <span>30-Day Returns</span>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer" id="contact">
    <div class="footer-brand">${store.storeName}</div>
    <div class="footer-copy">&copy; ${year} ${store.storeName}. All rights reserved.</div>
    <div class="footer-powered">Powered by Majorka</div>
  </footer>
</body>
</html>`;
}

// ─── Store Preview Section ────────────────────────────────────
function StorePreviewSection({ store }: { store: GeneratedStore }) {
  const htmlContent = useMemo(() => generateStoreHTML(store), [store]);
  const iframeSrc = useMemo(() => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [htmlContent]);

  useEffect(() => {
    return () => { URL.revokeObjectURL(iframeSrc); };
  }, [iframeSrc]);

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
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [htmlContent]);

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
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            overflow: 'hidden',
            width: '100%',
            height: 500,
          }}
        >
          <iframe
            src={iframeSrc}
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
            onClick={() => {
              const el = document.querySelector('[data-tab="shopify"]');
              if (el instanceof HTMLElement) el.click();
            }}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: GOLD,
              color: '#080808',
              border: 'none',
              fontFamily: DM_SANS,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Rocket size={16} />
            Push to Shopify
          </button>
        </div>
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
    // Persist prefilled product so normalizeStoreResponse fallback can read it
    if (prefilledProduct) {
      sessionStorage.setItem('_last_import', JSON.stringify({
        title: prefilledProduct.title,
        price: prefilledProduct.price,
        image: prefilledProduct.image,
      }));
    }
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
      const store = normalizeStoreResponse(res.data);
      // If still no products after normalization, inject the prefilled product
      if (store.products.length === 0 && prefilledProduct?.title) {
        store.products.push({
          title: prefilledProduct.title,
          price_aud: prefilledProduct.price || 0,
          image_url: prefilledProduct.image || '',
        });
      }
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

      {preview && <StorePreviewSection store={preview} />}
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

  const handleConnect = useCallback(async () => {
    if (!url.trim() || !apiKey.trim()) {
      toast.error('Enter URL and API key');
      return;
    }
    setConnecting(true);
    setPending(null);
    const res = await safeFetch<ShopifyValidation>('/api/shopify/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, apiKey }),
    });
    setConnecting(false);
    if (res.ok && res.data) {
      setConnected(res.data);
      toast.success(`Connected to ${res.data.storeName}`);
      return;
    }
    if (res.pending) {
      setPending('Shopify validate endpoint pending — wire in server/routes/store.ts');
      return;
    }
    toast.error(res.error ?? 'Connection failed');
  }, [url, apiKey]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    const res = await safeFetch<ShopifySyncReport>('/api/shopify/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, apiKey }),
    });
    setSyncing(false);
    if (res.ok && res.data) {
      setReport(res.data);
      toast.success('Sync complete');
      return;
    }
    if (res.pending) {
      setPending('Shopify sync endpoint pending — wire in server/routes/store.ts');
      return;
    }
    toast.error(res.error ?? 'Sync failed');
  }, [url, apiKey]);

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
