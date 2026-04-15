/**
 * ProductCard — dense dropshipper-grade card for the Products page grid.
 *
 * Renders image, title, price, orders (mono), score chip, market flags,
 * and a trend badge. Clicking opens the detail drawer via `onOpen`.
 * Memoised — re-renders only when the row data reference changes.
 */
import { memo, useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Bookmark, Megaphone, Store } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/hooks/useProducts';
import { ProductImage } from '@/components/ProductImage';
import { MarketFlags } from './MarketFlags';
import { TrendBadge } from './TrendBadge';
import { proxyImage } from '@/lib/imageProxy';

interface ProductCardProps {
  product: Product;
  onOpen: (product: Product) => void;
}

function fmtOrders(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (v <= 0) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

function fmtPriceAUD(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (v <= 0) return '—';
  return `$${v.toFixed(2)}`;
}

function velocityPercent(p: Product): number | null {
  const now = Number(p.sold_count ?? 0);
  const prev = Number(p.sold_count_7d_ago ?? 0);
  if (prev <= 0 || now <= 0) return null;
  return ((now - prev) / prev) * 100;
}

function scoreColor(score: number): { fg: string; bg: string; border: string } {
  if (score >= 90) return { fg: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)' };
  if (score >= 75) return { fg: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' };
  if (score >= 60) return { fg: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.25)' };
  return { fg: '#a3a3a3', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' };
}

function ProductCardImpl({ product, onOpen }: ProductCardProps) {
  const [hover, setHover] = useState(false);
  const score = Math.round(Number(product.winning_score ?? 0));
  const sc = scoreColor(score);
  const pct = velocityPercent(product);
  const proxied = proxyImage(product.image_url) ?? product.image_url ?? undefined;

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        background: '#111111',
        border: `1px solid ${hover ? 'rgba(212,175,55,0.35)' : '#1a1a1a'}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        color: 'inherit',
        transition: 'border 160ms ease, box-shadow 220ms cubic-bezier(0.16,1,0.3,1), transform 160ms ease',
        boxShadow: hover
          ? '0 0 0 1px rgba(212,175,55,0.12), 0 14px 40px -12px rgba(212,175,55,0.35)'
          : '0 1px 0 rgba(255,255,255,0.02) inset',
        transform: hover ? 'translateY(-1px)' : 'none',
        minHeight: 280,
      }}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: '#080808',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <ProductImage
          src={proxied}
          alt={product.product_title}
          size={0}
          borderRadius={0}
          style={{ width: '100%', height: '100%' }}
        />
        {/* Score chip top-left */}
        <div
          className="mj-num"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: sc.fg,
            background: sc.bg,
            border: `1px solid ${sc.border}`,
            borderRadius: 6,
            backdropFilter: 'blur(6px)',
          }}
        >
          {score > 0 ? score : '—'}
        </div>
        {/* AU Warehouse pill — sits just below the score chip */}
        {product.au_warehouse_available ? (
          <div
            aria-label="Stocked in an Australian warehouse"
            style={{
              position: 'absolute',
              top: 36,
              left: 8,
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#0a0a0a',
              background: '#d4af37',
              border: '1px solid #b8941f',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(212,175,55,0.35)',
            }}
          >
            AU WAREHOUSE
          </div>
        ) : null}
        {/* Market flags top-right */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <MarketFlags product={product} />
        </div>
        {/* Hover quick actions bottom-right */}
        <QuickActions product={product} hover={hover} />
      </div>

      {/* Body */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3
          title={product.product_title}
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: '#e5e5e5',
            lineHeight: 1.35,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 38,
          }}
        >
          {product.product_title}
        </h3>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            className="mj-num"
            style={{ fontSize: 15, fontWeight: 700, color: '#f5f5f5' }}
            title="Landed cost (AUD)"
          >
            {fmtPriceAUD(product.price_aud)}
          </span>
          <span
            className="mj-num"
            style={{ fontSize: 12, color: '#a3a3a3' }}
            title="Total lifetime orders"
          >
            {fmtOrders(product.sold_count)} sold
          </span>
        </div>

        {/* Trend row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
          <TrendBadge percent={pct} />
          {product.category ? (
            <span
              style={{
                fontSize: 10,
                color: '#737373',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 110,
              }}
            >
              {product.category}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

// ── QuickActions ────────────────────────────────────────────────────────
// Three icon-only buttons (Save / Create Ad / Add to Store) overlaid on
// the card image corner. Desktop: reveal on hover. Touch devices: always
// visible so the gestures still work without a hover state. 44px tap
// targets, aria-labels, Escape dismisses the hover state.

const TRACKED_KEY = 'majorka_tracked_v1';

function readTrackedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(TRACKED_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((v) => String(v)));
  } catch {
    return new Set();
  }
}

function writeTrackedSet(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TRACKED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* quota — ignore */
  }
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none)').matches;
}

interface QuickActionsProps {
  product: Product;
  hover: boolean;
}

function QuickActions({ product, hover }: QuickActionsProps) {
  const [, setLocation] = useLocation();
  const [touch, setTouch] = useState<boolean>(false);
  const [tracked, setTracked] = useState<boolean>(false);

  useEffect(() => {
    setTouch(isTouchDevice());
    setTracked(readTrackedSet().has(String(product.id)));
  }, [product.id]);

  const visible = hover || touch;

  const stop = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
  }, []);

  const onSave = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    const id = String(product.id);
    const set = readTrackedSet();
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
      writeTrackedSet(next);
      setTracked(false);
      toast('Removed from tracked');
    } else {
      next.add(id);
      writeTrackedSet(next);
      setTracked(true);
      toast.success('Saved to tracked');
    }
  }, [product.id]);

  const onCreateAd = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    try {
      const payload = {
        id: product.id,
        title: product.product_title,
        price_aud: product.price_aud,
        image_url: product.image_url,
        category: product.category,
      };
      sessionStorage.setItem('majorka_ad_product', JSON.stringify(payload));
      toast.success('Opening Ads Studio');
      setLocation('/app/ads-studio');
    } catch {
      toast.error('Could not hand off product');
    }
  }, [product, setLocation]);

  const onAddToStore = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    try {
      const payload = {
        id: product.id,
        title: product.product_title,
        price_aud: product.price_aud,
        image_url: product.image_url,
        category: product.category,
        product_url: product.product_url,
      };
      sessionStorage.setItem('majorka_import_product', JSON.stringify(payload));
      toast.success('Added to Store Builder');
      setLocation('/app/store-builder');
    } catch {
      toast.error('Could not hand off product');
    }
  }, [product, setLocation]);

  return (
    <div
      role="group"
      aria-label="Quick actions"
      onClick={stop}
      style={{
        position: 'absolute',
        right: 8,
        bottom: 8,
        display: 'flex',
        gap: 6,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 160ms ease, transform 160ms ease',
      }}
    >
      <QuickButton
        ariaLabel={tracked ? 'Unsave product' : 'Save product'}
        onClick={onSave}
        active={tracked}
      >
        <Bookmark size={16} fill={tracked ? '#d4af37' : 'none'} />
      </QuickButton>
      <QuickButton ariaLabel="Create ad for this product" onClick={onCreateAd}>
        <Megaphone size={16} />
      </QuickButton>
      <QuickButton ariaLabel="Add product to store" onClick={onAddToStore}>
        <Store size={16} />
      </QuickButton>
    </div>
  );
}

interface QuickButtonProps {
  ariaLabel: string;
  onClick: (e: ReactMouseEvent) => void;
  active?: boolean;
  children: ReactNode;
}

function QuickButton({ ariaLabel, onClick, active, children }: QuickButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') (e.currentTarget as HTMLButtonElement).blur();
      }}
      style={{
        width: 44,
        height: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'rgba(212,175,55,0.18)' : 'rgba(0,0,0,0.72)',
        border: `1px solid ${active ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 10,
        color: active ? '#d4af37' : '#f5f5f5',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'background 140ms ease, border 140ms ease, color 140ms ease, transform 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = active ? 'rgba(212,175,55,0.26)' : 'rgba(0,0,0,0.88)';
        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? 'rgba(212,175,55,0.18)' : 'rgba(0,0,0,0.72)';
        e.currentTarget.style.borderColor = active ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.12)';
      }}
    >
      {children}
    </button>
  );
}

export const ProductCard = memo(ProductCardImpl);
export default ProductCard;
