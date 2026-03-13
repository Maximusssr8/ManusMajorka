import { Award, DollarSign, ExternalLink, Flame, Loader2, Package, Search, Shield, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

// ── Types ────────────────────────────────────────────────────────────────────

interface WinningProduct {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  trendReason: string;
  platform: string;
  marginEstimate: string;
  competition: 'Low' | 'Medium' | 'High';
  trendScore: number;
  category: string;
}

// ── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  pageBg: '#080a0e',
  cardBg: 'rgba(255,255,255,0.03)',
  gold: '#d4af37',
  goldHover: '#e5c24a',
  textPrimary: '#f5f5f5',
  textSecondary: '#a1a1aa',
  textMuted: '#52525b',
  border: 'rgba(255,255,255,0.07)',
  borderHover: '#d4af37',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

const CATEGORY_CHIPS = [
  'All',
  'Health & Wellness',
  'Fitness',
  'Home',
  'Beauty',
  'Pets',
  'Tech',
  'Kitchen',
  'Outdoor',
];

const SORT_OPTIONS = ['Trend Score', 'Margin', 'Competition'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function competitionColor(level: string) {
  if (level === 'Low') return C.green;
  if (level === 'Medium') return C.yellow;
  return C.red;
}

/** Parse "40-60%" or "~55%" → 55 (midpoint) */
function parseMidMargin(s: string): number {
  const nums = s.replace(/[^0-9–-]/g, ' ').trim().split(/[\s–-]+/).map(Number).filter((n) => !isNaN(n) && n > 0);
  if (nums.length === 0) return 50;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

/** Parse "$20-$40" → midpoint 30 */
function parseMidPrice(s: string): number {
  const nums = s.replace(/[^0-9–-]/g, ' ').trim().split(/[\s–-]+/).map(Number).filter((n) => !isNaN(n) && n > 0);
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

function estimatedCOGS(product: WinningProduct): string {
  const price = parseMidPrice(product.priceRange);
  const margin = parseMidMargin(product.marginEstimate) / 100;
  const cogs = Math.round(price * (1 - margin));
  return cogs > 0 ? `$${cogs} AUD` : '—';
}

// ── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.4 }}
      style={{
        background: C.cardBg,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <style>{`@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:.2}}`}</style>
      {[['60%', 20], ['90%', 14], ['75%', 14], ['40%', 26], ['100%', 8], ['100%', 38]].map(
        ([w, h], i) => (
          <div
            key={i}
            style={{
              height: h,
              width: w,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              animation: `shimmer 1.8s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        )
      )}
    </motion.div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  index,
}: {
  product: WinningProduct;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const compColor = competitionColor(product.competition);
  const cogs = estimatedCOGS(product);
  const marginNum = parseMidMargin(product.marginEstimate);

  const prefillAndNavigate = (dest: string, param: string) => {
    localStorage.setItem(param, product.name);
    window.location.href = dest;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${hovered ? C.gold : C.border}`,
        borderRadius: 20,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        boxShadow: hovered
          ? `0 0 32px rgba(212,175,55,0.1), 0 8px 32px rgba(0,0,0,0.4)`
          : '0 4px 16px rgba(0,0,0,0.2)',
        cursor: 'default',
      }}
    >
      {/* Title + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <h3
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 18,
            fontWeight: 800,
            color: C.textPrimary,
            margin: 0,
            lineHeight: 1.25,
            flex: 1,
          }}
        >
          {product.name}
        </h3>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: C.gold,
            whiteSpace: 'nowrap',
          }}
        >
          {product.priceRange}
        </span>
      </div>

      {/* Why it's winning */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 12px',
          background: 'rgba(212,175,55,0.05)',
          borderRadius: 12,
          border: '1px solid rgba(212,175,55,0.1)',
        }}
      >
        <Zap size={13} style={{ color: C.gold, marginTop: 1, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            color: 'rgba(245,245,245,0.75)',
            lineHeight: 1.55,
          }}
        >
          {product.trendReason}
        </span>
      </div>

      {/* 4 Metric Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {/* Trend Score */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'Syne, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: C.gold,
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.2)',
            padding: '5px 10px',
            borderRadius: 20,
          }}
        >
          <Flame size={11} />
          Trend Score: {product.trendScore}
        </span>

        {/* Margin */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'Syne, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: C.green,
            background: `${C.green}14`,
            border: `1px solid ${C.green}30`,
            padding: '5px 10px',
            borderRadius: 20,
          }}
        >
          <DollarSign size={11} />
          Margin: {marginNum}%
        </span>

        {/* Competition */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'Syne, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: compColor,
            background: `${compColor}14`,
            border: `1px solid ${compColor}30`,
            padding: '5px 10px',
            borderRadius: 20,
          }}
        >
          <Award size={11} />
          Competition: {product.competition}
        </span>

        {/* Avg COGS */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'Syne, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: C.textSecondary,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '5px 10px',
            borderRadius: 20,
          }}
        >
          <Package size={11} />
          Avg COGS: {cogs}
        </span>
      </div>

      {/* Trend Score Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              color: C.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Trend Score
          </span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.gold }}>
            {product.trendScore}/100
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${product.trendScore}%` }}
            transition={{ delay: index * 0.08 + 0.3, duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${C.gold}, ${C.goldHover})`,
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* AU Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'rgba(34,197,94,0.04)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: 10,
        }}
      >
        <Shield size={12} style={{ color: C.green, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 11,
            color: 'rgba(34,197,94,0.85)',
            fontWeight: 500,
          }}
        >
          🇦🇺 AU-specific · Low saturation · Afterpay eligible
        </span>
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => prefillAndNavigate('/app/profit-calculator', 'majorka_profit_prefill')}
          style={{
            flex: 1,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: '#000',
            background: C.gold,
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.goldHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}
        >
          Validate This
          <ExternalLink size={11} />
        </button>
        <button
          onClick={() => prefillAndNavigate('/app/product-discovery', 'majorka_discover_prefill')}
          style={{
            flex: 1,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: C.gold,
            background: 'transparent',
            border: `1px solid ${C.gold}`,
            borderRadius: 10,
            padding: '10px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(212,175,55,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Find Suppliers
          <ExternalLink size={11} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function WinningProducts() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200);
  const [sortBy, setSortBy] = useState('Trend Score');

  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const didMount = useRef(false);

  // ── Derived price range label ─────────────────────────────────────────
  const priceRangeLabel =
    maxPrice <= 30
      ? 'Under $30'
      : maxPrice <= 60
        ? '$30-$60'
        : maxPrice <= 100
          ? '$60-$100'
          : '$100+';

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchProducts = async (overrideCategory?: string) => {
    const cat = overrideCategory ?? category;
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/tools/winning-products', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: cat === 'All' ? undefined : cat,
          priceRange: priceRangeLabel === '$100+' ? undefined : priceRangeLabel,
          sortBy,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch winning products');
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
      setProducts([]);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      fetchProducts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.pageBg,
        fontFamily: 'DM Sans, sans-serif',
        color: C.textPrimary,
      }}
    >
      <style>{`
        @keyframes scanPulse {
          0%,100% { opacity:.6 }
          50% { opacity:1 }
        }
        @keyframes shimmer {
          0%,100% { opacity:.5 }
          50% { opacity:.2 }
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance:none; width:18px; height:18px;
          border-radius:50%; background:#d4af37; cursor:pointer;
          border:2px solid #080a0e; box-shadow:0 0 8px rgba(212,175,55,.4);
        }
        .range-slider::-moz-range-thumb {
          width:18px; height:18px; border-radius:50%;
          background:#d4af37; cursor:pointer;
          border:2px solid #080a0e; box-shadow:0 0 8px rgba(212,175,55,.4);
        }
        .range-slider {
          -webkit-appearance:none; appearance:none;
          background:#1e1e24; border-radius:4px; height:6px;
          outline:none; width:100%; accent-color:#d4af37;
        }
      `}</style>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 30,
                fontWeight: 800,
                color: C.textPrimary,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Winning Products
            </h1>
            <span
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 10,
                fontWeight: 800,
                color: '#fff',
                background: C.red,
                padding: '3px 10px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Flame size={10} />
              LIVE
            </span>
          </div>
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: C.textSecondary,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            AU-specific opportunities with low competition and margins above 40% — not Amazon
            bestsellers.
          </p>

          {/* AI scanning subtext */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 12,
                  padding: '7px 14px',
                  background: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.15)',
                  borderRadius: 20,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: C.gold,
                    animation: 'scanPulse 1.2s ease-in-out infinite',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 12,
                    color: C.gold,
                    animation: 'scanPulse 1.2s ease-in-out infinite',
                  }}
                >
                  AI is scanning 50+ AU data sources…
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Filter Panel ───────────────────────────────────────────── */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: '20px 24px',
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Category Chips */}
          <div>
            <div
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 11,
                fontWeight: 600,
                color: C.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 12,
              }}
            >
              Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_CHIPS.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      fetchProducts(cat);
                    }}
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#000' : C.textSecondary,
                      background: active ? C.gold : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? C.gold : C.border}`,
                      borderRadius: 20,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = C.gold;
                        e.currentTarget.style.color = C.gold;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.color = C.textSecondary;
                      }
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider + Sort */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
            {/* Price Range */}
            <div style={{ flex: '1 1 240px', minWidth: 200 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Max Price (AUD)
                </span>
                <span
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.gold,
                  }}
                >
                  ${maxPrice === 200 ? '200+' : maxPrice}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="range-slider"
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 11,
                  color: C.textMuted,
                }}
              >
                <span>$10</span>
                <span>$50</span>
                <span>$100</span>
                <span>$200+</span>
              </div>
            </div>

            {/* Sort + Find */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  Sort by
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSortBy(opt)}
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 12,
                        fontWeight: sortBy === opt ? 700 : 500,
                        color: sortBy === opt ? '#000' : C.textSecondary,
                        background: sortBy === opt ? C.gold : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${sortBy === opt ? C.gold : C.border}`,
                        borderRadius: 8,
                        padding: '7px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => fetchProducts()}
                disabled={loading}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#000',
                  background: loading ? 'rgba(212,175,55,0.5)' : C.gold,
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                  marginTop: 22,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = C.goldHover;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = C.gold;
                }}
              >
                {loading ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Search size={14} />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── Positioning Banner (shows when results are loaded) ─────── */}
        <AnimatePresence>
          {hasLoaded && !loading && products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                background: 'rgba(212,175,55,0.05)',
                border: '1px solid rgba(212,175,55,0.18)',
                borderRadius: 14,
                marginBottom: 24,
              }}
            >
              <TrendingUp size={16} style={{ color: C.gold, flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  color: 'rgba(245,245,245,0.85)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: C.gold, fontFamily: 'Syne, sans-serif' }}>
                  Not Amazon bestsellers.
                </strong>{' '}
                These are AU-specific opportunities with low competition and margins above 40%.
                Most aren't on Shopify yet.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Product Grid ────────────────────────────────────────────── */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: 20,
            }}
            className="product-grid"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: 20,
            }}
            className="product-grid"
          >
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : hasLoaded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '72px 24px',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              textAlign: 'center',
            }}
          >
            <Search size={40} style={{ color: C.textMuted, marginBottom: 16, opacity: 0.5 }} />
            <h3
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: C.textPrimary,
                margin: '0 0 8px',
              }}
            >
              No products found
            </h3>
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                color: C.textSecondary,
                margin: '0 0 24px',
                maxWidth: 360,
                lineHeight: 1.5,
              }}
            >
              Try a different category or adjust your price range to discover more opportunities.
            </p>
            <button
              onClick={() => {
                setCategory('All');
                setMaxPrice(200);
                fetchProducts('All');
              }}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#000',
                background: C.gold,
                border: 'none',
                borderRadius: 10,
                padding: '10px 24px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.goldHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}
            >
              Show All Products
            </button>
          </motion.div>
        ) : null}
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @media (max-width: 520px) {
          .product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
