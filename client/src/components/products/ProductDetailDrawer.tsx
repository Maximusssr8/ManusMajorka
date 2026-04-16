/**
 * ProductDetailDrawer — slide-in right panel with hero image, stat cards,
 * sparkline, AI Brief (cached 24h in localStorage), and bottom action bar
 * (Add to Store / Create Ad). Closes on Escape, overlay click or the X.
 *
 * Lazy-loaded — only imported when the user opens a product.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import {
  X, Sparkles, Store, Megaphone, ExternalLink, Loader2, AlertTriangle,
} from 'lucide-react';
import type { Product } from '@/hooks/useProducts';
import { proxyImage } from '@/lib/imageProxy';
import { ProductImage } from '@/components/ProductImage';
import { MarketFlags } from './MarketFlags';
import { TrendBadge } from './TrendBadge';
import { Sparkline } from './Sparkline';
import { Markdown } from '@/components/Markdown';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  AlertBell,
  AuWarehouseBadge,
  AuShippingEstimate,
  MarginCalculator,
  BNPLScore,
} from './AuMoatPanels';

interface ProductDetailDrawerProps {
  product: Product | null;
  onClose: () => void;
}

interface BriefCacheEntry {
  text: string;
  ts: number;
}

const BRIEF_CACHE_PREFIX = 'majorka_brief_v1:';
const BRIEF_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readBriefCache(productId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${BRIEF_CACHE_PREFIX}${productId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BriefCacheEntry;
    if (!parsed || typeof parsed.text !== 'string' || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > BRIEF_CACHE_TTL_MS) return null;
    return parsed.text;
  } catch {
    return null;
  }
}

function writeBriefCache(productId: string, text: string): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: BriefCacheEntry = { text, ts: Date.now() };
    window.localStorage.setItem(`${BRIEF_CACHE_PREFIX}${productId}`, JSON.stringify(entry));
  } catch {
    /* quota — ignore */
  }
}

function fmtAUD(n: number | null | undefined, digits = 2): string {
  const v = Number(n ?? 0);
  if (v <= 0) return '—';
  return `$${v.toFixed(digits)}`;
}

function fmtCompact(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (v <= 0) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

function velocityPercent(p: Product): number | null {
  const now = Number(p.sold_count ?? 0);
  const prev = Number(p.sold_count_7d_ago ?? 0);
  if (prev <= 0 || now <= 0) return null;
  return ((now - prev) / prev) * 100;
}

/**
 * Synthesise a 7-point sparkline series from whatever historical fields
 * the DB exposes. Today we have `sold_count` (now) and `sold_count_7d_ago`
 * so we interpolate linearly between them — good enough to show momentum.
 * When either endpoint is missing we return [] so Sparkline shows its
 * "Insufficient historical data" state.
 */
function buildSeries(p: Product): number[] {
  const now = Number(p.sold_count ?? 0);
  const prev = Number(p.sold_count_7d_ago ?? 0);
  if (now <= 0 || prev <= 0) return [];
  const steps = 7;
  const out: number[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    out.push(prev + (now - prev) * t);
  }
  return out;
}

/**
 * Estimated monthly revenue fallback — matches CLAUDE.md rule:
 *   (sold_count / 365) × price × 30
 */
function estMonthlyRevenue(p: Product): number {
  const daily = Number(p.est_daily_revenue_aud ?? 0);
  if (daily > 0) return daily * 30;
  const orders = Number(p.sold_count ?? 0);
  const price = Number(p.price_aud ?? 0);
  if (orders <= 0 || price <= 0) return 0;
  return Math.round((orders / 365) * price * 30);
}

export default function ProductDetailDrawer({ product, onClose }: ProductDetailDrawerProps) {
  const [, setLocation] = useLocation();
  const [brief, setBrief] = useState<string>('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefAttempt, setBriefAttempt] = useState(0);

  const open = product !== null;
  const productId = product ? String(product.id) : '';

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Track view — fire-and-forget POST to /api/user/view so the "since
  // you last logged in" deltas stay accurate. Silent on 401/500 so an
  // anonymous operator browsing the drawer never sees a loading spinner
  // or an error toast for telemetry.
  useEffect(() => {
    if (!product) return;
    const id = String(product.id);
    const controller = new AbortController();
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        if (!token) return; // anonymous — skip silently
        await fetch('/api/user/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: id }),
          signal: controller.signal,
        }).catch(() => {
          /* fire-and-forget */
        });
      } catch {
        /* silent */
      }
    })();
    return () => {
      controller.abort();
    };
  }, [product, productId]);

  // Load AI Brief — cache-first, then fetch
  useEffect(() => {
    if (!product) return;
    const cached = readBriefCache(productId);
    if (cached) {
      setBrief(cached);
      setBriefLoading(false);
      setBriefError(null);
      return;
    }
    let cancelled = false;
    setBrief('');
    setBriefError(null);
    setBriefLoading(true);
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token ?? '';
        const price = Number(product.price_aud ?? 0);
        const orders = Number(product.sold_count ?? 0);
        const score = Number(product.winning_score ?? 0);
        const system =
          'You are Maya, a dropshipping analyst. Output a concise product brief in markdown with these sections: **Why it wins**, **Target audience**, **Ad angle**, **Risks**. Max 180 words total. Use plain language, no marketing fluff.';
        const prompt =
          `Product: ${product.product_title}\n` +
          `Category: ${product.category ?? 'uncategorised'}\n` +
          `Landed cost: A$${price.toFixed(2)}\n` +
          `Lifetime orders: ${orders}\n` +
          `AI winning score: ${Math.round(score)}/100`;
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            system,
            prompt,
            model: 'claude-haiku-4-5',
            max_tokens: 700,
          }),
        });
        const data = await res.json();
        // Server now returns { ok: false, error, message } for soft failures
        // instead of leaking raw Anthropic API errors. Treat that as a
        // user-facing retryable state rather than a hard exception.
        if (data && data.ok === false) {
          if (cancelled) return;
          setBriefError(typeof data.message === 'string' ? data.message : 'Brief generation failed. Try again.');
          return;
        }
        const text: string = data?.text ?? data?.output ?? data?.content ?? data?.result ?? '';
        if (!res.ok || !text) {
          throw new Error(data?.error || 'AI endpoint returned no content');
        }
        if (cancelled) return;
        setBrief(text);
        writeBriefCache(productId, text);
      } catch (e: unknown) {
        if (cancelled) return;
        setBriefError(e instanceof Error ? e.message : 'Failed to generate brief');
      } finally {
        if (!cancelled) setBriefLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [product, productId, briefAttempt]);

  const retryBrief = useCallback(() => {
    if (!productId) return;
    try {
      window.localStorage.removeItem(`${BRIEF_CACHE_PREFIX}${productId}`);
    } catch {
      /* ignore */
    }
    setBrief('');
    setBriefError(null);
    setBriefAttempt((n) => n + 1);
  }, [productId]);

  const onAddToStore = useCallback(() => {
    if (!product) return;
    try {
      const payload = {
        id: product.id,
        title: product.product_title,
        price: product.price_aud,
        image: product.image_url,
        category: product.category,
        product_url: product.product_url,
        // Legacy keys for backward compat
        price_aud: product.price_aud,
        image_url: product.image_url,
      };
      sessionStorage.setItem('majorka_import_product', JSON.stringify(payload));
      toast.success('Added to Store Builder');
      setLocation('/app/store-builder');
    } catch (e) {
      toast.error('Could not hand off product');
    }
  }, [product, setLocation]);

  const onCreateAd = useCallback(() => {
    if (!product) return;
    try {
      const payload = {
        id: product.id,
        title: product.product_title,
        price: product.price_aud,
        image: product.image_url,
        category: product.category,
        // Legacy keys for backward compat
        price_aud: product.price_aud,
        image_url: product.image_url,
      };
      sessionStorage.setItem('majorka_ad_product', JSON.stringify(payload));
      toast.success('Opening Ads Studio');
      setLocation('/app/ads-studio');
    } catch (e) {
      toast.error('Could not hand off product');
    }
  }, [product, setLocation]);

  const sparkSeries = useMemo(() => (product ? buildSeries(product) : []), [product]);

  if (!open || !product) return null;

  const pct = velocityPercent(product);
  const monthly = estMonthlyRevenue(product);

  const drawer = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product detail"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close product"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          border: 'none',
          cursor: 'pointer',
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          maxWidth: 560,
          background: '#0b0b0b',
          borderLeft: '1px solid #161b22',
          display: 'flex',
          flexDirection: 'column',
          animation: 'mj-drawer-in 260ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #161b22',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: "'Syne', system-ui, sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: '#f5f5f5',
                letterSpacing: '-0.01em',
              }}
            >
              Product detail
            </span>
            <MarketFlags size="md" product={product} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* AU Moat: alert bell sits next to the (Engagement-owned) save
                button. When the save button doesn't exist yet, the bell
                stands alone. Either way it stays put — additive, not
                restructured. */}
            <AlertBell product={product} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                minWidth: 44,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 10,
                color: '#a3a3a3',
                cursor: 'pointer',
                transition: 'background 160ms ease, border 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = '#161b22';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scroll body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              maxHeight: 360,
              borderRadius: 14,
              overflow: 'hidden',
              background: '#04060f',
              border: '1px solid #161b22',
            }}
          >
            <ProductImage
              src={proxyImage(product.image_url) ?? product.image_url ?? undefined}
              alt={product.product_title}
              size={0}
              borderRadius={0}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Title */}
          <h2
            style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontSize: 19,
              fontWeight: 700,
              color: '#f5f5f5',
              lineHeight: 1.3,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {product.product_title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <TrendBadge percent={pct} size="md" />
            {product.category ? (
              <span
                style={{
                  fontSize: 11,
                  color: '#a3a3a3',
                  padding: '3px 8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #161b22',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {product.category}
              </span>
            ) : null}
            {product.product_url ? (
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  color: '#4f8ef7',
                  textDecoration: 'none',
                }}
              >
                AliExpress <ExternalLink size={12} />
              </a>
            ) : null}
          </div>

          {/* AU Warehouse badge — visible only when stocked in AU. */}
          <AuWarehouseBadge product={product} />

          {/* Stat grid — stat rows hide when their underlying source data is
              null/zero rather than rendering "—" (cleaner than empty cells). */}
          {(() => {
            const hasVelocity = Number(product.velocity_7d ?? 0) > 0 || pct !== null;
            const hasDailyRev = Number(product.est_daily_revenue_aud ?? 0) > 0;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <StatCard label="Winning score" value={`${Math.round(Number(product.winning_score ?? 0)) || 0}`} suffix="/100" />
                <StatCard label="Lifetime orders" value={fmtCompact(product.sold_count)} />
                {hasVelocity ? (
                  <StatCard
                    label="7d velocity"
                    value={
                      Number(product.velocity_7d ?? 0) > 0
                        ? `+${fmtCompact(product.velocity_7d)}`
                        : `${pct! > 0 ? '+' : ''}${pct!.toFixed(1)}%`
                    }
                  />
                ) : null}
                <StatCard label="Est monthly rev." value={monthly > 0 ? fmtAUD(monthly, 0) : '—'} />
                <StatCard label="Landed cost" value={fmtAUD(product.price_aud)} />
                {hasDailyRev ? (
                  <StatCard label="Est daily rev." value={fmtAUD(product.est_daily_revenue_aud)} />
                ) : null}
              </div>
            );
          })()}

          {/* Sparkline — hide entire section when we have fewer than 7 data
              points to avoid "Insufficient historical data" appearing next to
              a product showing huge lifetime orders. */}
          {sparkSeries.length >= 7 ? (
            <section
              style={{
                padding: 14,
                background: '#0d1117',
                border: '1px solid #161b22',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: "'Syne', system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#f5f5f5',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Order momentum
                </span>
                <span style={{ fontSize: 10, color: '#737373', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Last 7 days
                </span>
              </div>
              <Sparkline
                data={sparkSeries}
                productId={product.id}
                range={30}
                width={500}
                height={72}
              />
            </section>
          ) : null}

          {/* AI Brief */}
          <section
            style={{
              padding: 14,
              background: '#0d1117',
              border: '1px solid #161b22',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: '#4f8ef7' }} />
              <span
                style={{
                  fontFamily: "'Syne', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#f5f5f5',
                  letterSpacing: '-0.01em',
                }}
              >
                AI Brief
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#737373' }}>Cached 24h</span>
            </div>
            {briefLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a3a3a3', fontSize: 13 }}>
                <Loader2 size={14} className="animate-spin" />
                Generating brief…
              </div>
            ) : briefError ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#fca5a5',
                  fontSize: 13,
                  padding: 10,
                  border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.06)',
                  borderRadius: 8,
                  flexWrap: 'wrap',
                }}
              >
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 160 }}>{briefError}</span>
                <button
                  type="button"
                  onClick={retryBrief}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#fca5a5',
                    background: 'transparent',
                    border: '1px solid rgba(252,165,165,0.4)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : brief ? (
              <div style={{ fontSize: 13, lineHeight: 1.65, color: '#d4d4d4' }}>
                <Markdown>{brief}</Markdown>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#737373' }}>No brief yet.</div>
            )}
          </section>

          {/* AU Moat — Margin / Shipping / BNPL */}
          <MarginCalculator product={product} />
          <AuShippingEstimate product={product} />
          <BNPLScore product={product} />

          <div style={{ height: 16 }} />
        </div>

        {/* Bottom action bar */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: 12,
            paddingBottom: `calc(12px + env(safe-area-inset-bottom))`,
            borderTop: '1px solid #161b22',
            background: '#0b0b0b',
          }}
        >
          <button
            type="button"
            onClick={onAddToStore}
            style={{
              flex: 1,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '0 16px',
              fontSize: 14,
              fontWeight: 600,
              color: '#0a0a0a',
              background: '#4f8ef7',
              border: '1px solid #3B82F6',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: 'background 160ms ease, transform 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#6ba3ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#4f8ef7'; }}
          >
            <Store size={16} />
            Add to Store
          </button>
          <button
            type="button"
            onClick={onCreateAd}
            style={{
              flex: 1,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '0 16px',
              fontSize: 14,
              fontWeight: 600,
              color: '#f5f5f5',
              background: '#3B82F6',
              border: '1px solid #2563eb',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: 'background 160ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#3B82F6'; }}
          >
            <Megaphone size={16} />
            Create Ad
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes mj-drawer-in {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return drawer;
  return createPortal(drawer, document.body);
}

interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
}

function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: '#0d1117',
        border: '1px solid #161b22',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: '#737373',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {label}
      </span>
      <span className="mj-num" style={{ fontSize: 18, fontWeight: 700, color: '#f5f5f5' }}>
        {value}
        {suffix ? <span style={{ fontSize: 12, color: '#737373', marginLeft: 2 }}>{suffix}</span> : null}
      </span>
    </div>
  );
}
