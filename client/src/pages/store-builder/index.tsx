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
  Upload,
  ChevronDown,
  ChevronUp,
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

type ThemeCategory = 'minimal' | 'bold' | 'luxury' | 'playful' | 'conversion';

interface ThemeConfig {
  id: string;
  name: string;
  category: ThemeCategory;
  bestFor: string;
  preview: { bg: string; accent: string; text: string };
  fonts: { heading: string; body: string };
  colors: { bg: string; surface: string; accent: string; text: string; muted: string };
  radius: string;
  features: string[];
}

const THEME_CONFIGS: ThemeConfig[] = [
  // ── EXISTING 5 ──────────────────────────────────────────────
  {
    id: 'dawn', name: 'Dawn', category: 'minimal',
    bestFor: 'Beauty, fashion, lifestyle',
    preview: { bg: '#ffffff', accent: '#111111', text: '#e5e5e5' },
    fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    colors: { bg: '#ffffff', surface: '#f5f5f5', accent: '#111111', text: '#111111', muted: '#666666' },
    radius: '4px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  {
    id: 'craft', name: 'Craft', category: 'bold',
    bestFor: 'Tech, gadgets, premium goods',
    preview: { bg: '#0a0a0a', accent: '#d4af37', text: '#ededed' },
    fonts: { heading: "'Syne', sans-serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#0a0a0a', surface: '#0d0d0d', accent: '#d4af37', text: '#ededed', muted: 'rgba(245,245,245,0.4)' },
    radius: '8px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  {
    id: 'refresh', name: 'Refresh', category: 'playful',
    bestFor: 'Pet, kids, health, kitchen',
    preview: { bg: '#f8fafc', accent: '#22c55e', text: '#fbbf24' },
    fonts: { heading: "'Nunito', sans-serif", body: "'Nunito', sans-serif" },
    colors: { bg: '#f8fafc', surface: '#f1f5f9', accent: '#22c55e', text: '#1e293b', muted: '#64748b' },
    radius: '12px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  {
    id: 'impulse', name: 'Impulse', category: 'conversion',
    bestFor: 'Impulse buys, viral products',
    preview: { bg: '#ffffff', accent: '#ef4444', text: '#111111' },
    fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    colors: { bg: '#ffffff', surface: '#fafafa', accent: '#ef4444', text: '#111111', muted: '#555555' },
    radius: '8px',
    features: ['urgency_banner', 'social_proof', 'email_capture', 'sticky_cart', 'countdown', 'sticky_bar'],
  },
  {
    id: 'sense', name: 'Sense', category: 'luxury',
    bestFor: 'Jewellery, watches, premium fashion',
    preview: { bg: '#f5f0eb', accent: '#8b7355', text: '#2c2c2c' },
    fonts: { heading: "'Playfair Display', serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#f5f0eb', surface: '#ede7df', accent: '#8b7355', text: '#2c2c2c', muted: '#8b8178' },
    radius: '4px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  // ── NEW MINIMALIST (6-8) ────────────────────────────────────
  {
    id: 'origin', name: 'Origin', category: 'minimal',
    bestFor: 'Single-product stores',
    preview: { bg: '#fafafa', accent: '#222222', text: '#e0e0e0' },
    fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    colors: { bg: '#fafafa', surface: '#f0f0f0', accent: '#222222', text: '#1a1a1a', muted: '#888888' },
    radius: '0',
    features: ['email_capture', 'sticky_cart'],
  },
  {
    id: 'palo', name: 'Palo', category: 'minimal',
    bestFor: 'Home decor, candles, stationery',
    preview: { bg: '#f7f5f2', accent: '#a39382', text: '#d6d0c8' },
    fonts: { heading: "'DM Sans', sans-serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#f7f5f2', surface: '#eee9e3', accent: '#a39382', text: '#3d3830', muted: '#9e9588' },
    radius: '4px',
    features: ['announcement_bar', 'email_capture', 'sticky_cart'],
  },
  {
    id: 'crave', name: 'Crave', category: 'minimal',
    bestFor: 'Food, coffee, supplements',
    preview: { bg: '#121212', accent: '#e0e0e0', text: '#333333' },
    fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    colors: { bg: '#121212', surface: '#1a1a1a', accent: '#e0e0e0', text: '#e8e8e8', muted: 'rgba(255,255,255,0.4)' },
    radius: '4px',
    features: ['social_proof', 'email_capture', 'sticky_cart'],
  },
  // ── NEW BOLD/MODERN (9-11) ──────────────────────────────────
  {
    id: 'neon', name: 'Neon', category: 'bold',
    bestFor: 'Tech accessories, gaming, streetwear',
    preview: { bg: '#0a0a0f', accent: '#e91e8c', text: '#00e5ff' },
    fonts: { heading: "'Syne', sans-serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#0a0a0f', surface: '#12121a', accent: '#e91e8c', text: '#f0f0f5', muted: 'rgba(240,240,245,0.4)' },
    radius: '8px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  {
    id: 'blaze', name: 'Blaze', category: 'bold',
    bestFor: 'Fitness, energy drinks, sports gear',
    preview: { bg: '#1a1008', accent: '#f97316', text: '#fee2cc' },
    fonts: { heading: "'Syne', sans-serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#1a1008', surface: '#231808', accent: '#f97316', text: '#fef3e8', muted: 'rgba(254,243,232,0.4)' },
    radius: '8px',
    features: ['urgency_banner', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  {
    id: 'metro', name: 'Metro', category: 'bold',
    bestFor: 'B2B products, office supplies, tools',
    preview: { bg: '#f8fafc', accent: '#2563eb', text: '#1e293b' },
    fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    colors: { bg: '#f8fafc', surface: '#f1f5f9', accent: '#2563eb', text: '#1e293b', muted: '#64748b' },
    radius: '4px',
    features: ['announcement_bar', 'social_proof', 'email_capture'],
  },
  // ── NEW LUXURY (12-14) ──────────────────────────────────────
  {
    id: 'prestige', name: 'Prestige', category: 'luxury',
    bestFor: 'Watches, premium fashion, beauty',
    preview: { bg: '#090909', accent: '#c9a84c', text: '#f5f0e8' },
    fonts: { heading: "'Playfair Display', serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#090909', surface: '#0f0f0f', accent: '#c9a84c', text: '#f5f0e8', muted: 'rgba(245,240,232,0.35)' },
    radius: '0',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart', 'marquee'],
  },
  {
    id: 'atelier', name: 'Atelier', category: 'luxury',
    bestFor: 'Handmade goods, ceramics, art',
    preview: { bg: '#faf8f4', accent: '#8b6f47', text: '#d4c5b0' },
    fonts: { heading: "'Playfair Display', serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#faf8f4', surface: '#f2ede5', accent: '#8b6f47', text: '#3a3228', muted: '#9c8e7d' },
    radius: '4px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  {
    id: 'maison', name: 'Maison', category: 'luxury',
    bestFor: 'Fashion brands, perfume',
    preview: { bg: '#0c1020', accent: '#d4b896', text: '#e8e0d4' },
    fonts: { heading: "'Playfair Display', serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#0c1020', surface: '#141830', accent: '#d4b896', text: '#eae4dc', muted: 'rgba(234,228,220,0.35)' },
    radius: '0',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  // ── NEW PLAYFUL/BRIGHT (15-17) ──────────────────────────────
  {
    id: 'bounce', name: 'Bounce', category: 'playful',
    bestFor: 'Kids products, pet accessories',
    preview: { bg: '#fef7ff', accent: '#a855f7', text: '#fde68a' },
    fonts: { heading: "'Nunito', sans-serif", body: "'Nunito', sans-serif" },
    colors: { bg: '#fef7ff', surface: '#faf0ff', accent: '#a855f7', text: '#3b1f5e', muted: '#9678b5' },
    radius: '24px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  {
    id: 'zest', name: 'Zest', category: 'playful',
    bestFor: 'Health supplements, organic products',
    preview: { bg: '#f7fff4', accent: '#65a30d', text: '#d4f0c0' },
    fonts: { heading: "'Nunito', sans-serif", body: "'Nunito', sans-serif" },
    colors: { bg: '#f7fff4', surface: '#eef9e6', accent: '#65a30d', text: '#1a3a08', muted: '#5c7a42' },
    radius: '12px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart', 'trust_badges'],
  },
  {
    id: 'pop', name: 'Pop', category: 'playful',
    bestFor: 'Phone cases, stickers, trendy accessories',
    preview: { bg: '#fffbeb', accent: '#f43f5e', text: '#3b82f6' },
    fonts: { heading: "'Syne', sans-serif", body: "'DM Sans', sans-serif" },
    colors: { bg: '#fffbeb', surface: '#fff5cc', accent: '#f43f5e', text: '#1e1b4b', muted: '#6b6894' },
    radius: '12px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart'],
  },
  // ── NEW CONVERSION-OPTIMIZED (18-20) ────────────────────────
  {
    id: 'turbo', name: 'Turbo', category: 'conversion',
    bestFor: 'High-volume dropshipping, testing',
    preview: { bg: '#ffffff', accent: '#111111', text: '#888888' },
    fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    colors: { bg: '#ffffff', surface: '#f9f9f9', accent: '#111111', text: '#111111', muted: '#777777' },
    radius: '4px',
    features: ['social_proof', 'sticky_cart'],
  },
  {
    id: 'sale', name: 'Sale', category: 'conversion',
    bestFor: 'Flash sales, seasonal promotions',
    preview: { bg: '#fffbeb', accent: '#dc2626', text: '#fbbf24' },
    fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    colors: { bg: '#fffbeb', surface: '#fef3c7', accent: '#dc2626', text: '#1c1917', muted: '#78716c' },
    radius: '8px',
    features: ['urgency_banner', 'social_proof', 'email_capture', 'sticky_cart', 'countdown', 'sticky_bar'],
  },
  {
    id: 'trust', name: 'Trust', category: 'conversion',
    bestFor: 'Skeptical audiences, high-ticket items',
    preview: { bg: '#f8fafc', accent: '#0d9488', text: '#1e293b' },
    fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    colors: { bg: '#f8fafc', surface: '#f0fdfa', accent: '#0d9488', text: '#1e293b', muted: '#64748b' },
    radius: '8px',
    features: ['announcement_bar', 'social_proof', 'email_capture', 'sticky_cart', 'trust_badges', 'comparison_table'],
  },
];

type StoreTheme = string;

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
      className="inline-flex items-center gap-1 p-1 rounded-md w-full sm:w-auto"
      style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
    >
      {TABS.map((t) => {
        const active = mode === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            data-tab={t.id}
            onClick={() => onChange(t.id)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-md px-5 py-2.5 transition-all duration-200"
            style={{
              background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
              border: 'none',
              color: active ? GOLD : TEXT_DIM,
              fontFamily: DM_SANS,
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Icon size={15} />
            <span>{t.label}</span>
            {active && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 2,
                background: GOLD,
                borderRadius: 1,
              }} />
            )}
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
      className="uppercase mb-2"
      style={{ color: TEXT_DIM, fontFamily: MONO, letterSpacing: '0.1em', fontSize: 10 }}
    >
      {children}
    </div>
  );
}

const INPUT_BG = '#050505';

const inputStyle: React.CSSProperties = {
  background: INPUT_BG,
  border: `1px solid ${BORDER}`,
  color: TEXT,
  fontFamily: DM_SANS,
  padding: '10px 14px',
  borderRadius: 6,
  width: '100%',
  fontSize: 16,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = GOLD;
};
const inputBlurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = BORDER;
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

// ─── Helpers: resolve theme config from ID ────────────────────
function getThemeConfig(themeId: string): ThemeConfig {
  return THEME_CONFIGS.find(t => t.id === themeId) ?? THEME_CONFIGS[1]; // default to craft
}

// Google Fonts link for a theme config
function buildFontLink(tc: ThemeConfig): string {
  const families = new Set<string>();
  const extractFamily = (f: string) => {
    const m = f.match(/'([^']+)'/);
    return m ? m[1] : null;
  };
  const h = extractFamily(tc.fonts.heading);
  const b = extractFamily(tc.fonts.body);
  if (h) families.add(h);
  if (b) families.add(b);
  families.add('JetBrains Mono');
  const params = Array.from(families).map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&');
  return `<link href="https://fonts.googleapis.com/css2?${params}&display=swap" rel="stylesheet" />`;
}

// ─── Generate premium Shopify-quality storefront HTML ──────────
function generateStoreHTML(store: GeneratedStore, niche?: string, theme: StoreTheme = 'craft'): string {
  const tc = getThemeConfig(theme);
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

  // ── Derive all values from ThemeConfig ───────────────────────
  const bgColor = tc.colors.bg;
  const textClr = tc.colors.text;
  const dimText = tc.colors.muted;
  const accent = tc.colors.accent;
  const surfaceBg = tc.colors.surface;
  const fH = tc.fonts.heading;
  const fB = tc.fonts.body;
  const fM = "'JetBrains Mono', monospace";
  const fontLink = buildFontLink(tc);
  const rad = tc.radius;
  const feats = tc.features;
  const hasFeature = (f: string) => feats.includes(f);

  // Derive card bg and border from theme brightness
  const isDark = bgColor.startsWith('#0') || bgColor.startsWith('#1') || bgColor === '#000000';
  const cardBg = isDark ? surfaceBg : '#ffffff';
  const borderClr = isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5';
  const imgPlaceholderBg = isDark ? `linear-gradient(135deg,${cardBg},rgba(255,255,255,0.03))` : surfaceBg;
  const announceBg = accent;
  const announceTxt = isDark ? bgColor : '#ffffff';
  const btnText = isDark ? bgColor : '#ffffff';
  const pillBg = isDark ? `rgba(255,255,255,0.06)` : `${accent}11`;
  const pillBorder = isDark ? `rgba(255,255,255,0.12)` : `${accent}33`;
  const iconBg = isDark ? `rgba(255,255,255,0.04)` : `${accent}0d`;
  const showUrgency = hasFeature('countdown') || hasFeature('sticky_bar');

  const productCards = buildProductCardsEnhanced({
    cardBg, borderClr, textClr, priceClr: accent, btnBg: accent, btnText,
    dimText, radius: rad, imgPlaceholderBg, badgeBg: accent, badgeText: btnText,
    fontBody: fB, fontHeading: fH, fontMono: fM, showUrgency,
  });
  const testimonialCards = buildTestimonials({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, radius: rad });
  const faqHTML = buildFAQ({ borderClr, textClr, dimText, accentClr: accent });

  // Urgency CSS (only for conversion themes)
  const urgencyCSS = hasFeature('sticky_bar') ? `
    .sticky-bar { position: fixed; bottom: 0; left: 0; right: 0; background: ${textClr}; color: #fff; padding: 12px 24px; display: flex; align-items: center; justify-content: center; gap: 16px; z-index: 200; font-size: 14px; font-weight: 600; box-shadow: 0 -4px 24px rgba(0,0,0,0.15); }
    .sticky-bar button { background: ${accent}; color: ${btnText}; border: none; padding: 10px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 ${accent}66; } 50% { box-shadow: 0 0 0 8px ${accent}00; } }
    .urgency-banner { background: ${accent}; color: ${btnText}; text-align: center; padding: 10px; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; }
  ` : '';

  // Trust badges section (for trust-focused themes)
  const trustBadgesHTML = hasFeature('trust_badges') ? `
  <section style="padding:40px 24px;background:${surfaceBg};border-top:1px solid ${borderClr};border-bottom:1px solid ${borderClr};">
    <div style="max-width:1200px;margin:0 auto;display:flex;justify-content:center;flex-wrap:wrap;gap:32px;text-align:center;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="font-size:28px;">&#128274;</div>
        <div style="font-size:12px;font-weight:700;color:${textClr};font-family:${fH};">SSL Secured</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="font-size:28px;">&#9989;</div>
        <div style="font-size:12px;font-weight:700;color:${textClr};font-family:${fH};">Verified Business</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="font-size:28px;">&#128176;</div>
        <div style="font-size:12px;font-weight:700;color:${textClr};font-family:${fH};">Money-Back Guarantee</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="font-size:28px;">&#127462;&#127482;</div>
        <div style="font-size:12px;font-weight:700;color:${textClr};font-family:${fH};">Australian Owned</div>
      </div>
    </div>
  </section>` : '';

  // Marquee section (for prestige-type themes)
  const marqueeHTML = hasFeature('marquee') ? `
  <section style="overflow:hidden;padding:16px 0;background:${surfaceBg};border-top:1px solid ${borderClr};border-bottom:1px solid ${borderClr};">
    <div style="display:flex;animation:marquee 20s linear infinite;white-space:nowrap;">
      ${Array(6).fill(`<span style="font-family:${fH};font-size:14px;font-weight:600;color:${dimText};letter-spacing:0.12em;text-transform:uppercase;padding:0 48px;">PREMIUM QUALITY &bull; FREE SHIPPING &bull; AFTERPAY AVAILABLE &bull; 30-DAY RETURNS</span>`).join('')}
    </div>
    <style>@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }</style>
  </section>` : '';

  return `<!DOCTYPE html><html lang="en"><head>
  ${buildSEOHead(fontLink)}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: ${fB}; background: ${bgColor}; color: ${textClr}; -webkit-font-smoothing: antialiased; line-height: 1.6; overflow-x: hidden; }
    a { color: inherit; text-decoration: none; } img { max-width: 100%; height: auto; }
    .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .product-card { background: ${cardBg}; border: 1px solid ${borderClr}; border-radius: ${rad}; overflow: hidden; transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; }
    .product-card:hover { transform: translateY(-4px); border-color: ${accent}; box-shadow: 0 12px 32px rgba(0,0,0,${isDark ? '0.4' : '0.08'}); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
    .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    input[type="checkbox"]:checked ~ .faq-answer { max-height: 200px; }
    ${urgencyCSS}
    ${responsiveCSS(surfaceBg, borderClr)}
  </style></head><body>
  ${hasFeature('urgency_banner') ? `<div class="urgency-banner" style="background:${accent};color:${btnText};text-align:center;padding:10px;font-size:13px;font-weight:700;letter-spacing:0.02em;font-family:${fB};">LIMITED TIME: Free express shipping on orders over A$75 - Ends midnight!</div>` : ''}
  ${hasFeature('announcement_bar') ? buildAnnouncementBar({ bg: announceBg, textClr: announceTxt, fontBody: fB }) : ''}
  ${buildNav({ bg: isDark ? surfaceBg : bgColor, borderClr, brandClr: textClr, linkClr: dimText, accentClr: accent, fontHeading: fH, hamburgerClr: textClr })}
  ${marqueeHTML}
  <section class="hero" id="about" style="text-align:center;padding:${tc.category === 'luxury' ? '120px 24px 100px' : '96px 24px 80px'};background:${isDark ? `linear-gradient(180deg,${surfaceBg} 0%,${accent}08 50%,${bgColor} 100%)` : bgColor};">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:${pillBg};border:1px solid ${pillBorder};border-radius:100px;font-size:12px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:24px;">${tc.category === 'luxury' ? '&#10022; ' : ''}Australian Owned &amp; Shipped</div>
    <h1 style="font-family:${fH};font-size:clamp(36px,6vw,64px);font-weight:${tc.category === 'minimal' ? '700' : '800'};letter-spacing:-0.03em;margin-bottom:20px;color:${textClr};line-height:1.1;max-width:720px;margin-left:auto;margin-right:auto;">${safeTagline}</h1>
    <p style="font-size:clamp(16px,2vw,20px);color:${dimText};max-width:560px;margin:0 auto 40px;line-height:1.6;">Premium ${escHtml(nicheLabel)} for Australian shoppers. Curated for quality, backed by our 30-day guarantee.</p>
    <a href="#products" style="display:inline-block;padding:16px 40px;background:${accent};color:${btnText};font-family:${fH};font-weight:700;font-size:16px;border-radius:${rad};text-decoration:none;box-shadow:0 4px 24px ${accent}4d;transition:transform 0.2s;">${tc.category === 'luxury' ? 'Discover the Collection' : (showUrgency ? 'Shop Now - Free Shipping &#8594;' : 'Shop Now &#8594;')}</a>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:24px;margin-top:48px;padding-top:32px;border-top:1px solid ${borderClr};">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};">&#128666; Free AU Shipping</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};">&#128179; Afterpay Available</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};">&#128260; 30-Day Returns</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${dimText};">&#128274; Secure Checkout</div>
    </div>
  </section>
  ${hasFeature('social_proof') ? buildSocialProofBanner({ bg: surfaceBg, borderClr, textClr, dimText, accentClr: accent, fontBody: fB }) : ''}
  ${trustBadgesHTML}
  <section class="products-section" id="products" style="max-width:1200px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">${tc.category === 'luxury' ? 'The Collection' : (showUrgency ? 'Best Sellers' : 'Featured Products')}</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">${tc.category === 'luxury' ? 'Hand-selected pieces for the Australian connoisseur' : 'Hand-selected and tested for the Australian market'}</p></div>
    <div class="products-grid">${productCards}</div>
  </section>
  <section class="social-proof" style="padding:80px 24px;background:${surfaceBg};border-top:1px solid ${borderClr};border-bottom:1px solid ${borderClr};">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">${tc.category === 'luxury' ? 'What Our Clients Say' : 'Trusted by 2,400+ Australian Customers'}</h2><p style="font-size:16px;color:${dimText};max-width:480px;margin:0 auto;">See what our community has to say</p></div>
    <div class="testimonials-grid">${testimonialCards}</div>
  </section>
  ${buildFeatures({ cardBg, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, iconBg, radius: rad })}
  <section class="faq-section" id="faq" style="max-width:720px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;margin-bottom:48px;"><h2 style="font-family:${fH};font-size:clamp(24px,3.5vw,36px);font-weight:700;color:${textClr};margin-bottom:12px;">Frequently Asked Questions</h2></div>
    ${faqHTML}
  </section>
  ${hasFeature('email_capture') ? buildEmailCapture({ bg: isDark ? surfaceBg : bgColor, borderClr, textClr, dimText, accentClr: accent, fontHeading: fH, fontBody: fB, btnBg: accent, btnText, inputBg: isDark ? cardBg : surfaceBg }) : ''}
  ${buildFooter({ bg: surfaceBg, borderClr, brandClr: textClr, textClr, dimText, accentClr: accent, fontHeading: fH })}
  ${hasFeature('sticky_bar') ? `<div class="sticky-bar"><span>Limited stock available</span><button onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">Shop Now</button></div>` : ''}
  ${hasFeature('sticky_cart') ? buildStickyCart({ bg: isDark ? '#111' : textClr, textClr: isDark ? '#ededed' : '#fff', btnBg: accent, btnText, fontBody: fB, fontMono: fM }) : ''}
</body></html>`;
}

// ─── Store Preview Section ────────────────────────────────────
function StorePreviewSection({ store, niche, theme: initialTheme = 'craft' }: { store: GeneratedStore; niche?: string; theme?: StoreTheme }) {
  const [activeTheme, setActiveTheme] = useState<string>(initialTheme);
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

        {/* Theme switcher — compact grid with swatches */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {THEME_CONFIGS.map((t) => (
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
                {[t.preview.bg, t.preview.accent, t.preview.text].map((c, ci) => (
                  <div key={ci} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              {t.name}
            </button>
          ))}
        </div>

        {/* Browser chrome frame */}
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            overflow: 'hidden',
            width: viewMode === 'mobile' ? 375 : '100%',
            margin: viewMode === 'mobile' ? '0 auto' : undefined,
            boxShadow: viewMode === 'mobile' ? '0 8px 32px rgba(0,0,0,0.4)' : undefined,
            transition: 'box-shadow 0.3s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 32px rgba(212,175,55,0.08)`; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = viewMode === 'mobile' ? '0 8px 32px rgba(0,0,0,0.4)' : 'none'; }}
        >
          {/* Chrome bar */}
          <div
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ background: '#111111', borderBottom: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <div
              className="flex-1 rounded px-3 py-1 text-center"
              style={{
                background: '#0a0a0a',
                border: `1px solid ${BORDER}`,
                fontSize: 11,
                color: TEXT_DIM,
                fontFamily: MONO,
              }}
            >
              yourstore.majorka.io
            </div>
          </div>
          <div
            className="store-preview-iframe"
            style={{
              overflow: 'hidden',
              width: '100%',
              height: viewMode === 'mobile' ? 667 : 500,
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
        </div>

        {/* Action buttons with clear hierarchy */}
        <div className="flex flex-wrap gap-3 mt-5">
          {/* Primary: Publish */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-md px-6 py-2.5 text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: publishing ? 'rgba(212,175,55,0.3)' : GOLD,
              color: '#080808',
              border: 'none',
              fontFamily: DM_SANS,
              cursor: publishing ? 'not-allowed' : 'pointer',
              opacity: publishing ? 0.7 : 1,
              boxShadow: publishing ? 'none' : '0 0 24px rgba(212,175,55,0.35)',
            }}
          >
            <Upload size={16} />
            {publishing ? 'Publishing...' : 'Publish to Majorka'}
          </button>
          {/* Secondary: Download */}
          <button
            onClick={handleDownload}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: CTA_BLUE,
              border: `1px solid ${CTA_BLUE}`,
              fontFamily: DM_SANS,
              cursor: 'pointer',
            }}
          >
            <Download size={16} />
            Download HTML
          </button>
          {/* Tertiary: Copy */}
          <button
            onClick={handleCopyText}
            className="rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: TEXT_DIM,
              border: 'none',
              fontFamily: DM_SANS,
              cursor: 'pointer',
            }}
          >
            <Copy size={16} />
            Copy all text
          </button>
          {/* Extra: Shopify download + preview */}
          <button
            onClick={handleDownloadShopify}
            className="rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: TEXT_DIM,
              border: 'none',
              fontFamily: DM_SANS,
              cursor: 'pointer',
            }}
          >
            <FileArchive size={16} />
            Shopify Liquid
          </button>
          <button
            onClick={handlePreviewTab}
            className="rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: TEXT_DIM,
              border: 'none',
              fontFamily: DM_SANS,
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={16} />
            Preview in tab
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
  const [selectedTheme, setSelectedTheme] = useState<string>('craft');
  const [themeFilter, setThemeFilter] = useState<ThemeCategory | 'all'>('all');
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

  const [themesExpanded, setThemesExpanded] = useState(true);

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }} className="flex-col lg:flex-row">
      {/* Form panel — fixed 400px on desktop, full width on mobile */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          flexShrink: 0,
          background: SURFACE,
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
          padding: 20,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 120px)',
        }}
        className="lg:sticky lg:top-[80px] w-full lg:w-[400px]"
      >
        <div
          className="text-lg mb-5"
          style={{ fontFamily: SYNE, color: TEXT }}
        >
          Store Brief
        </div>
        {prefilledProduct && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.25)`, borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6, fontFamily: MONO }}>
              Product imported from database
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {prefilledProduct.image && (
                <img src={prefilledProduct.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: `1px solid ${BORDER}` }} />
              )}
              <div>
                <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{prefilledProduct.title?.slice(0, 50)}</div>
                <div style={{ fontSize: 11, color: TEXT_DIM, fontFamily: MONO }}>
                  {prefilledProduct.price ? `A$${prefilledProduct.price}` : ''} · Score {prefilledProduct.score ?? '---'}
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
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
            placeholder="e.g. minimalist kitchen tools"
            style={inputStyle}
          />
        </div>
        <div className="mb-4">
          <FieldLabel>Store Name <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(optional)</span></FieldLabel>
          <input
            value={customStoreName}
            onChange={(e) => setCustomStoreName(e.target.value)}
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
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
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
              style={{ ...inputStyle, appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
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
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
              style={{ ...inputStyle, appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
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
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
              style={{ ...inputStyle, appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
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
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
              style={{ ...inputStyle, appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="Under $20">Under $20</option>
              <option value="$20-$50">$20-$50</option>
              <option value="$50-$100">$50-$100</option>
              <option value="$100+">$100+</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <FieldLabel>Unique Selling Point <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(optional)</span></FieldLabel>
          <textarea
            value={usp}
            onChange={(e) => setUsp(e.target.value)}
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
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
        {/* Collapsible theme section */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setThemesExpanded(!themesExpanded)}
            className="flex items-center justify-between w-full mb-3"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <FieldLabel>Choose Theme ({THEME_CONFIGS.length} templates)</FieldLabel>
            {themesExpanded ? <ChevronUp size={14} style={{ color: TEXT_DIM }} /> : <ChevronDown size={14} style={{ color: TEXT_DIM }} />}
          </button>
          {themesExpanded && (
            <>
              {/* Category filter tabs */}
              <div className="flex gap-1 mb-3 flex-wrap">
                {(['all', 'minimal', 'bold', 'luxury', 'playful', 'conversion'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setThemeFilter(cat)}
                    className="rounded px-2.5 py-1 text-xs font-medium transition-all"
                    style={{
                      background: themeFilter === cat ? 'rgba(212,175,55,0.12)' : 'transparent',
                      border: `1px solid ${themeFilter === cat ? GOLD : BORDER}`,
                      color: themeFilter === cat ? GOLD : TEXT_DIM,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
              {/* Theme grid — 4 columns on desktop (inside 400px panel = compact), 2 on mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {THEME_CONFIGS
                  .filter((t) => themeFilter === 'all' || t.category === themeFilter)
                  .map((t) => {
                    const active = selectedTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id)}
                        className="text-left rounded-md p-2.5 transition-all duration-200"
                        style={{
                          background: active ? 'rgba(212,175,55,0.06)' : INPUT_BG,
                          border: `1.5px solid ${active ? GOLD : BORDER}`,
                          cursor: 'pointer',
                          transform: active ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        {/* 3-color swatch strip */}
                        <div className="flex gap-0 mb-1.5" style={{ borderRadius: 3, overflow: 'hidden', height: 6 }}>
                          {[t.preview.bg, t.preview.accent, t.preview.text].map((c, ci) => (
                            <div key={ci} style={{ flex: 1, background: c }} />
                          ))}
                        </div>
                        <div
                          className="text-xs font-semibold truncate"
                          style={{ color: active ? GOLD : TEXT, fontFamily: SYNE, fontSize: 11 }}
                        >
                          {t.name}
                        </div>
                        <div
                          className="truncate"
                          style={{ color: TEXT_DIM, fontSize: 9 }}
                        >
                          {t.bestFor}
                        </div>
                        <div
                          className="mt-1 rounded px-1.5 py-0.5 inline-block"
                          style={{
                            fontSize: 8,
                            fontWeight: 600,
                            color: TEXT_DIM,
                            background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${BORDER}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontFamily: MONO,
                          }}
                        >
                          {t.category}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </>
          )}
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
      </div>

      {/* Preview panel — fills remaining space */}
      <div style={{ flex: 1, minWidth: 0, background: BG, borderRadius: 8 }}>
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
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 4, height: 20, background: GOLD, borderRadius: 2 }} />
                <div className="text-base font-bold" style={{ fontFamily: SYNE, color: TEXT }}>
                  Turn this into a real store
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  'Create a Shopify store at shopify.com (14-day free trial)',
                  'Come back here and connect it via the Shopify Sync tab',
                  'Push your products and brand settings directly to Shopify',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${GOLD}, #b8972e)`,
                        color: '#080808',
                        fontFamily: MONO,
                        fontSize: 12,
                      }}
                    >{i + 1}</div>
                    <span className="text-sm leading-relaxed" style={{ color: TEXT_DIM, fontFamily: DM_SANS }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://www.shopify.com/free-trial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white"
                  style={{ background: CTA_BLUE, textDecoration: 'none', fontFamily: DM_SANS, boxShadow: '0 0 16px rgba(59,130,246,0.3)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 22h10a2 2 0 002-2V6l-3-4H7a2 2 0 00-2 2v16a2 2 0 002 2z"/></svg>
                  Create Shopify store
                  <span style={{ fontSize: 16 }}>&rarr;</span>
                </a>
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
    </div>
  );
}

// ─── Mode 2: Shopify Sync ──────────────────────────────────────
function ShopifySyncMode() {
  const [url, setUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connected, setConnected] = useState<ShopifyValidation | null>(null);
  const [report, setReport] = useState<ShopifySyncReport | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Helper to get the current Supabase session token
  const getAuthToken = useCallback(async (): Promise<string> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  }, []);

  // Check existing connection on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await supabase.auth.getSession().then(r => r.data.session?.access_token ?? '');
      if (!token) return;
      const res = await safeFetch<{ connected: boolean; shop: string | null }>('/api/shopify/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cancelled) return;
      if (res.ok && res.data?.connected && res.data.shop) {
        setConnected({ storeName: res.data.shop, productCount: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleConnect = useCallback(async () => {
    if (!url.trim() || !accessToken.trim()) {
      toast.error('Enter your store URL and access token');
      return;
    }
    setConnecting(true);
    const token = await getAuthToken();
    if (!token) {
      toast.error('Please sign in first');
      setConnecting(false);
      return;
    }
    const res = await safeFetch<{ success: boolean; shopName: string; productCount: number }>('/api/shopify/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shopUrl: url, accessToken }),
    });
    setConnecting(false);
    if (res.ok && res.data?.success) {
      setConnected({ storeName: res.data.shopName, productCount: res.data.productCount });
      toast.success(`Connected to ${res.data.shopName}`);
      return;
    }
    toast.error(res.error ?? 'Connection failed — check your store URL and access token');
  }, [url, accessToken, getAuthToken]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    const token = await getAuthToken();
    const res = await safeFetch<{ synced: number; products: unknown[] }>('/api/shopify/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    const token = await getAuthToken();
    const res = await safeFetch<{ success: boolean }>('/api/shopify/disconnect', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDisconnecting(false);
    if (res.ok) {
      setConnected(null);
      setReport(null);
      setUrl('');
      setAccessToken('');
      toast.success('Store disconnected');
      return;
    }
    toast.error(res.error ?? 'Failed to disconnect');
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

        {!isConnected && (
          <>
            <div className="mb-4">
              <FieldLabel>Shopify Store URL</FieldLabel>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                placeholder="my-store.myshopify.com"
                style={inputStyle}
              />
            </div>
            <div className="mb-5">
              <FieldLabel>Admin API Access Token</FieldLabel>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                placeholder="shpat_..."
                style={inputStyle}
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          {!isConnected ? (
            <PrimaryButton onClick={handleConnect} disabled={connecting}>
              <span className="inline-flex items-center gap-2">
                <Link2 size={16} />
                {connecting ? 'Connecting...' : 'Connect'}
              </span>
            </PrimaryButton>
          ) : (
            <>
              <PrimaryButton onClick={handleSync} disabled={syncing}>
                <span className="inline-flex items-center gap-2">
                  <Zap size={16} />
                  {syncing ? 'Syncing...' : 'Sync Products'}
                </span>
              </PrimaryButton>
              <GhostButton onClick={handleDisconnect} disabled={disconnecting}>
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </GhostButton>
            </>
          )}
        </div>

        {/* First-time setup guide */}
        {!isConnected && (
          <div className="mt-5">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-2 text-xs w-full"
              style={{ color: GOLD, fontFamily: DM_SANS, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              How to get your access token
            </button>
            {showGuide && (
              <ol
                className="mt-3 space-y-2 text-xs list-decimal list-inside"
                style={{ color: TEXT_DIM, fontFamily: DM_SANS, lineHeight: '1.6' }}
              >
                <li>Go to your Shopify Admin &rarr; <strong style={{ color: TEXT }}>Settings</strong> &rarr; <strong style={{ color: TEXT }}>Apps and sales channels</strong></li>
                <li>Click <strong style={{ color: TEXT }}>Develop apps</strong> (top right) &rarr; <strong style={{ color: TEXT }}>Create an app</strong></li>
                <li>Name it <strong style={{ color: TEXT }}>Majorka</strong>, then open <strong style={{ color: TEXT }}>Configure Admin API scopes</strong></li>
                <li>Enable: <span style={{ fontFamily: MONO, color: GOLD }}>write_products</span>, <span style={{ fontFamily: MONO, color: GOLD }}>read_products</span>, <span style={{ fontFamily: MONO, color: GOLD }}>read_orders</span></li>
                <li>Click <strong style={{ color: TEXT }}>Install app</strong>, then copy the <strong style={{ color: TEXT }}>Admin API access token</strong> (starts with <span style={{ fontFamily: MONO }}>shpat_</span>)</li>
                <li>Paste it above along with your store URL</li>
              </ol>
            )}
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
                  Sync Report
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs" style={{ color: TEXT_DIM }}>Synced</div>
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
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? '';
    const res = await safeFetch<SavedStore[]>('/api/store-builder/list', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
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
    const friendlyMsg = (res.error ?? '').includes('does not exist') || (res.error ?? '').includes('relation')
      ? 'The stores table has not been created yet. Run the database migration to enable the Marketplace.'
      : (res.error ?? 'Failed to load stores');
    setPending(friendlyMsg);
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const handlePublish = useCallback(
    async (id: string) => {
      setPublishing(id);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? '';
      const res = await safeFetch<{ isPublished: boolean }>(
        '/api/store-builder/toggle-publish',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ storeId: id }),
        },
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
      toast.error(res.error ?? 'Publish toggle failed');
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
              className="text-3xl sm:text-4xl mb-1"
              style={{ fontFamily: SYNE, color: TEXT, letterSpacing: '-0.02em', fontWeight: 700 }}
            >
              Store Builder
            </div>
            <div style={{
              width: 48,
              height: 2,
              background: `linear-gradient(90deg, ${GOLD}, rgba(212,175,55,0.2))`,
              borderRadius: 1,
              marginBottom: 10,
            }} />
            <div className="text-sm mb-2" style={{ color: TEXT_DIM, fontFamily: DM_SANS }}>
              Generate, preview, and publish professional stores in seconds
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: MONO, letterSpacing: '0.04em' }}>
              {THEME_CONFIGS.length} themes available &middot; AI-powered
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
