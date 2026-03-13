/**
 * WinningProducts.tsx — Live AU product intelligence dashboard.
 * Real-time Supabase feed · Streaming AI analysis · Detail drawer · Watchlist
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BarChart2,
  BookmarkCheck,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Crown,
  ExternalLink,
  Filter,
  Flame,
  Grid3X3,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Store,
  Table2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

type Trend = 'exploding' | 'growing' | 'stable' | 'declining';
type Competition = 'low' | 'medium' | 'high';

interface WinningProduct {
  id: string;
  product_title: string;
  image_url: string | null;
  tiktok_product_url: string | null;
  shop_name: string | null;
  category: string | null;
  platform: string;
  price_aud: number | null;
  sold_count: number | null;
  rating: number | null;
  review_count: number | null;
  winning_score: number;
  trend: Trend | null;
  competition_level: Competition | null;
  au_relevance: number;
  est_daily_revenue_aud: number | null;
  units_per_day: number | null;
  why_winning: string | null;
  ad_angle: string | null;
  source: string | null;
  scraped_at: string;
  scored_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#080a0e',
  card: 'rgba(255,255,255,0.03)',
  cardHover: 'rgba(255,255,255,0.06)',
  gold: '#d4af37',
  goldHover: '#e5c24a',
  goldBg: 'rgba(212,175,55,0.08)',
  goldBorder: 'rgba(212,175,55,0.2)',
  text: '#f5f5f5',
  sub: '#a1a1aa',
  muted: '#52525b',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.15)',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.1)',
} as const;

// ── Constants ────────────────────────────────────────────────────────────────

const TREND_MAP: Record<Trend, { emoji: string; label: string; color: string }> = {
  exploding: { emoji: '🔥', label: 'Exploding', color: '#ef4444' },
  growing:   { emoji: '📈', label: 'Growing',   color: '#22c55e' },
  stable:    { emoji: '➡️', label: 'Stable',    color: '#a1a1aa' },
  declining: { emoji: '📉', label: 'Declining', color: '#f59e0b' },
};

const COMPETITION_MAP: Record<Competition, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#22c55e' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high:   { label: 'High',   color: '#ef4444' },
};

const PAGE_SIZE = 20;
const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 80) return C.gold;
  if (s >= 60) return C.green;
  if (s >= 40) return C.amber;
  return C.red;
}

function scoreBg(s: number): string {
  const c = scoreColor(s);
  return `${c}20`;
}

function getNextRefreshTime(): Date {
  const nowMs = Date.now();
  const aestMs = nowMs + AEST_OFFSET_MS;
  const aestDate = new Date(aestMs);
  const h = aestDate.getUTCHours();
  const mins = aestDate.getUTCMinutes();
  const secs = aestDate.getUTCSeconds();
  const boundaries = [0, 6, 12, 18, 24];
  const next = boundaries.find((b) => b > h) ?? 24;
  const totalSecsUntil = (next - h) * 3600 - mins * 60 - secs;
  return new Date(nowMs + totalSecsUntil * 1000);
}

function fmtCountdown(target: Date): string {
  const diff = Math.max(0, target.getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtLastUpdated(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

/** Seeded LCG random — deterministic per product id */
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateRevData(base: number, id: string): { day: number; rev: number }[] {
  const seedNum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRand(seedNum);
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    rev: Math.round(Math.max(0, base * (0.55 + rand() * 0.9))),
  }));
}

function fmtAUD(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return `$${n.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 20,
        fontFamily: 'Syne, sans-serif',
        fontSize: 12,
        fontWeight: 700,
        color: scoreColor(score),
        background: scoreBg(score),
        border: `1px solid ${scoreColor(score)}40`,
        whiteSpace: 'nowrap',
      }}
    >
      <Flame size={10} />
      {score}
    </span>
  );
}

function TrendBadge({ trend }: { trend: Trend | null }) {
  if (!trend) return null;
  const t = TREND_MAP[trend];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        color: t.color,
        background: `${t.color}18`,
        border: `1px solid ${t.color}35`,
        whiteSpace: 'nowrap',
      }}
    >
      {t.emoji} {t.label}
    </span>
  );
}

function CompetitionDot({ level }: { level: Competition | null }) {
  if (!level) return null;
  const m = COMPETITION_MAP[level];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        color: m.color,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: m.color,
          boxShadow: `0 0 6px ${m.color}80`,
          display: 'inline-block',
        }}
      />
      {m.label}
    </span>
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      {[48, 200, 80, 80, 80, 80, 80, 80, 120].map((w, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div
            style={{
              height: 14,
              width: w,
              maxWidth: '100%',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 6,
              animation: 'shimmer 1.8s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        </td>
      ))}
    </motion.tr>
  );
}

// ── Revenue Chart ────────────────────────────────────────────────────────────

function RevenueChart({ product }: { product: WinningProduct }) {
  const data = useMemo(
    () => generateRevData(product.est_daily_revenue_aud ?? 500, product.id),
    [product.id, product.est_daily_revenue_aud],
  );
  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.gold} stopOpacity={0.35} />
              <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} label={{ value: 'Day', position: 'insideBottom', offset: -2, fill: C.muted, fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} width={44} />
          <Tooltip
            contentStyle={{ background: '#0f1117', border: `1px solid ${C.goldBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: C.sub }}
            formatter={(v: number) => [`$${v} AUD`, 'Est. Revenue']}
          />
          <Area type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={1.5} fill="url(#revGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  product,
  onClose,
  watchlistIds,
  onToggleWatchlist,
  token,
}: {
  product: WinningProduct | null;
  onClose: () => void;
  watchlistIds: Set<string>;
  onToggleWatchlist: (p: WinningProduct) => void;
  token: string | undefined;
}) {
  const [analysis, setAnalysis] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnalysis('');
    setAnalysing(false);
    setAnalysisOpen(false);
  }, [product?.id]);

  const runAnalysis = async () => {
    if (!product) return;
    setAnalysisOpen(true);
    setAnalysing(true);
    setAnalysis('');

    const prompt = `Analyse this product for an Australian dropshipper:

Product: ${product.product_title}
Category: ${product.category ?? 'Unknown'}
Est Daily Revenue: $${product.est_daily_revenue_aud ?? 0} AUD
Units/Day: ${product.units_per_day ?? 0}
Competition: ${product.competition_level ?? 'unknown'}
Platform: ${product.platform}
Why Winning: ${product.why_winning ?? ''}

Cover:
1. Demand signals in Australia
2. Profit margin estimate (sourcing cost, selling price, net margin)
3. Target demographics (age, gender, interests, AU-specific)
4. Top 3 ad angles for Meta + TikTok AU (with example hooks)
5. Recommended suppliers: AliExpress, CJDropshipping, any AU-local
6. Go / No-Go recommendation with confidence score

Be specific, opinionated, use AUD figures.`;

    try {
      const res = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt:
            'You are an expert Australian ecommerce analyst specialising in dropshipping. Respond in clean markdown with headers, bullet points, and AUD figures.',
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`Server ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6);
            if (raw === '[DONE]') break;
            try {
              const payload = JSON.parse(raw) as { text?: string };
              if (payload.text) {
                setAnalysis((p) => p + payload.text);
                if (analysisRef.current) {
                  analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
                }
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setAnalysis(`Error: ${err.message}`);
    } finally {
      setAnalysing(false);
    }
  };

  const inWatchlist = product ? watchlistIds.has(product.id) : false;
  const aliUrl = product
    ? `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product.product_title)}`
    : '#';
  const cjUrl = product
    ? `https://cjdropshipping.com/search?q=${encodeURIComponent(product.product_title)}`
    : '#';

  return (
    <AnimatePresence>
      {product && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', zIndex: 998,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 'min(480px, 100vw)',
              background: '#0d1017',
              borderLeft: `1px solid ${C.glassBorder}`,
              zIndex: 999,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Product image */}
            {product.image_url && (
              <div style={{ position: 'relative', flexShrink: 0, height: 200, overflow: 'hidden' }}>
                <img
                  src={product.image_url}
                  alt={product.product_title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 40%, #0d1017 100%)',
                }} />
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: `1px solid ${C.glassBorder}`,
                    color: C.text, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Scrollable content */}
            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Close btn when no image */}
              {!product.image_url && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={onClose}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: C.glass, border: `1px solid ${C.glassBorder}`,
                      color: C.text, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Title + platform */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, color: C.gold,
                      background: C.goldBg, border: `1px solid ${C.goldBorder}`,
                      padding: '3px 8px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                  >
                    {product.platform}
                  </span>
                  {product.category && (
                    <span style={{ fontSize: 11, color: C.sub, background: C.glass, padding: '3px 8px', borderRadius: 20, border: `1px solid ${C.border}` }}>
                      {product.category}
                    </span>
                  )}
                </div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1.25 }}>
                  {product.product_title}
                </h2>
              </div>

              {/* Metric row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Score', value: <ScoreBadge score={product.winning_score} /> },
                  { label: 'Rev/Day', value: fmtAUD(product.est_daily_revenue_aud) },
                  { label: 'Units/Day', value: product.units_per_day?.toFixed(0) ?? '—' },
                  { label: 'Price AUD', value: fmtAUD(product.price_aud) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.text }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Trend / Competition / AU Fit */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <TrendBadge trend={product.trend} />
                <CompetitionDot level={product.competition_level} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.green, fontWeight: 600 }}>
                  🇦🇺 AU Fit: {product.au_relevance}%
                </span>
              </div>

              {/* Why Winning */}
              {product.why_winning && (
                <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Why It's Winning
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(245,245,245,0.85)', lineHeight: 1.55 }}>
                    {product.why_winning}
                  </p>
                </div>
              )}

              {/* Ad Angle */}
              {product.ad_angle && (
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: C.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Best Ad Angle
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(245,245,245,0.85)', lineHeight: 1.55, fontStyle: 'italic' }}>
                    "{product.ad_angle}"
                  </p>
                </div>
              )}

              {/* Revenue chart */}
              <div>
                <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  30-Day Revenue Trend (Estimated AUD)
                </div>
                <RevenueChart product={product} />
              </div>

              {/* AI Analysis panel */}
              <div style={{ border: `1px solid ${C.glassBorder}`, borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={analysisOpen ? undefined : runAnalysis}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: analysisOpen ? C.glass : C.goldBg,
                    border: 'none', cursor: analysing ? 'wait' : 'pointer',
                    color: C.text,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} style={{ color: C.gold }} />
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700 }}>
                      AI AU Analysis
                    </span>
                    {analysing && <Loader2 size={12} style={{ color: C.gold, animation: 'spin 1s linear infinite' }} />}
                  </div>
                  {!analysisOpen && (
                    <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>Run Analysis →</span>
                  )}
                </button>

                <AnimatePresence>
                  {analysisOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        ref={analysisRef}
                        style={{
                          maxHeight: 320, overflowY: 'auto',
                          padding: '14px 16px',
                          fontSize: 12, lineHeight: 1.7,
                          color: 'rgba(245,245,245,0.85)',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {analysis || (analysing ? '' : 'Click "Run Analysis" to get AI insights.')}
                        {analysing && (
                          <span
                            style={{
                              display: 'inline-block', width: 8, height: 14,
                              background: C.gold, marginLeft: 2,
                              animation: 'blink 0.8s step-end infinite',
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Supplier links */}
              <div>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Find Suppliers
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: 'AliExpress', url: aliUrl, color: '#ff6a00' },
                    { label: 'CJ Dropshipping', url: cjUrl, color: '#0ea5e9' },
                  ].map(({ label, url, color }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px 12px', borderRadius: 10,
                        background: `${color}14`, border: `1px solid ${color}40`,
                        color, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        transition: 'background 0.2s',
                      }}
                    >
                      <ExternalLink size={11} />
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* TikTok link */}
              {product.tiktok_product_url && (
                <a
                  href={product.tiktok_product_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 10,
                    background: 'rgba(255,0,80,0.08)', border: '1px solid rgba(255,0,80,0.25)',
                    color: '#ff0050', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={11} />
                  View on TikTok Shop
                </a>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => onToggleWatchlist(product)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '12px 16px', borderRadius: 12,
                    background: inWatchlist ? 'rgba(34,197,94,0.12)' : C.glass,
                    border: `1px solid ${inWatchlist ? 'rgba(34,197,94,0.35)' : C.border}`,
                    color: inWatchlist ? C.green : C.sub,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {inWatchlist ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                  {inWatchlist ? '✓ Saved' : 'Save to Watchlist'}
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('majorka_website_prefill', product.product_title);
                    window.location.href = `/app/website-generator?product=${encodeURIComponent(product.product_title)}`;
                  }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '12px 16px', borderRadius: 12,
                    background: C.gold, border: 'none',
                    color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  <Store size={14} />
                  Build Store
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Top 3 Banner ─────────────────────────────────────────────────────────────

function Top3Banner({
  products,
  onSelect,
}: {
  products: WinningProduct[];
  onSelect: (p: WinningProduct) => void;
}) {
  if (products.length === 0) return null;
  const crowns = ['👑', '🥈', '🥉'];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Crown size={14} style={{ color: C.gold }} />
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Today's Top 3
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>last 24h · highest scores</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {products.slice(0, 3).map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            onClick={() => onSelect(p)}
            style={{
              background: i === 0
                ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.03) 100%)'
                : C.glass,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${i === 0 ? C.goldBorder : C.glassBorder}`,
              borderRadius: 18,
              padding: 20,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Rank badge */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              fontFamily: 'Syne, sans-serif', fontSize: 22,
              userSelect: 'none',
            }}>
              {crowns[i]}
            </div>

            {/* Image */}
            {p.image_url && (
              <img
                src={p.image_url}
                alt={p.product_title}
                style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', marginBottom: 12 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}

            {/* Name */}
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8, lineHeight: 1.25, paddingRight: 36 }}>
              {p.product_title}
            </div>

            {/* Score + trend */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              <ScoreBadge score={p.winning_score} />
              <TrendBadge trend={p.trend} />
            </div>

            {/* Ad angle */}
            {p.ad_angle && (
              <div style={{ fontSize: 11, color: 'rgba(245,245,245,0.65)', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{p.ad_angle}"
              </div>
            )}

            {/* Analyse CTA */}
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(p); }}
              style={{
                marginTop: 14, width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 12px', borderRadius: 10,
                background: i === 0 ? C.gold : C.glass,
                border: `1px solid ${i === 0 ? C.gold : C.border}`,
                color: i === 0 ? '#000' : C.gold,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Sparkles size={11} />
              Analyse
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────

function TableView({
  products,
  loading,
  onSelect,
  onToggleWatchlist,
  watchlistIds,
  page,
  setPage,
  total,
}: {
  products: WinningProduct[];
  loading: boolean;
  onSelect: (p: WinningProduct) => void;
  onToggleWatchlist: (p: WinningProduct) => void;
  watchlistIds: Set<string>;
  page: number;
  setPage: (n: number) => void;
  total: number;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const th = { padding: '10px 12px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '0.06em', textAlign: 'left' as const, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ overflowX: 'auto', borderRadius: 16, border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.glass }}>
              <th style={{ ...th, width: 40 }}>#</th>
              <th style={th}>Product</th>
              <th style={th}>Score</th>
              <th style={th}>Rev AUD/Day</th>
              <th style={th}>Units/Day</th>
              <th style={th}>Trend</th>
              <th style={th}>Competition</th>
              <th style={th}>AU Fit</th>
              <th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} index={i} />)
              : products.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => onSelect(p)}
                    style={{ cursor: 'pointer', borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = C.cardHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    {/* Rank */}
                    <td style={{ padding: '12px', fontSize: 12, color: C.muted, fontWeight: 700, width: 40 }}>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>

                    {/* Product */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180, maxWidth: 280 }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: C.glass, border: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BarChart2 size={16} style={{ color: C.muted }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
                            {p.product_title}
                          </div>
                          {p.price_aud && (
                            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>{fmtAUD(p.price_aud)}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td style={{ padding: '12px' }}><ScoreBadge score={p.winning_score} /></td>

                    {/* Rev */}
                    <td style={{ padding: '12px', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.green, whiteSpace: 'nowrap' }}>
                      {fmtAUD(p.est_daily_revenue_aud)}
                    </td>

                    {/* Units */}
                    <td style={{ padding: '12px', fontSize: 12, color: C.sub, fontWeight: 600 }}>
                      {p.units_per_day?.toFixed(0) ?? '—'}
                    </td>

                    {/* Trend */}
                    <td style={{ padding: '12px' }}><TrendBadge trend={p.trend} /></td>

                    {/* Competition */}
                    <td style={{ padding: '12px' }}><CompetitionDot level={p.competition_level} /></td>

                    {/* AU Fit */}
                    <td style={{ padding: '12px', fontSize: 12, fontWeight: 600, color: p.au_relevance >= 90 ? C.green : p.au_relevance >= 70 ? C.amber : C.sub }}>
                      {p.au_relevance}%
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <ActionBtn icon={<Sparkles size={11} />} label="Analyse" onClick={() => onSelect(p)} />
                        <ActionBtn
                          icon={watchlistIds.has(p.id) ? <BookmarkCheck size={11} /> : <BookmarkPlus size={11} />}
                          label="Save"
                          onClick={() => onToggleWatchlist(p)}
                          active={watchlistIds.has(p.id)}
                        />
                        <ActionBtn
                          icon={<ExternalLink size={11} />}
                          label="Supplier"
                          onClick={() => window.open(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(p.product_title)}`, '_blank')}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{ ...paginationBtn, opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: C.sub }}>
            Page {page} of {totalPages} · {total} products
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{ ...paginationBtn, opacity: page === totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const paginationBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: C.glass, border: `1px solid ${C.border}`,
  color: C.text, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function ActionBtn({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 8px', borderRadius: 7,
        background: active ? 'rgba(34,197,94,0.1)' : C.glass,
        border: `1px solid ${active ? 'rgba(34,197,94,0.3)' : C.border}`,
        color: active ? C.green : C.sub,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Card Grid ─────────────────────────────────────────────────────────────────

function CardGrid({
  products,
  loading,
  onSelect,
  onToggleWatchlist,
  watchlistIds,
  page,
  setPage,
  total,
}: {
  products: WinningProduct[];
  loading: boolean;
  onSelect: (p: WinningProduct) => void;
  onToggleWatchlist: (p: WinningProduct) => void;
  watchlistIds: Set<string>;
  page: number;
  setPage: (n: number) => void;
  total: number;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: C.glass, border: `1px solid ${C.border}`, borderRadius: 18,
                  height: 320, animation: 'shimmer 1.8s ease-in-out infinite',
                }}
              />
            ))
          : products.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelect(p)}
                style={{
                  background: C.glass,
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${C.glassBorder}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = C.goldBorder;
                  el.style.boxShadow = `0 0 24px rgba(212,175,55,0.08)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = C.glassBorder;
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Image + score overlay */}
                <div style={{ position: 'relative', height: 160, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart2 size={32} style={{ color: C.muted, opacity: 0.5 }} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <ScoreBadge score={p.winning_score} />
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.25, marginBottom: 4 }}>
                      {p.product_title}
                    </div>
                    {p.price_aud && (
                      <div style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>{fmtAUD(p.price_aud)}</div>
                    )}
                  </div>

                  {p.why_winning && (
                    <p style={{ margin: 0, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
                      {p.why_winning}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <TrendBadge trend={p.trend} />
                    <CompetitionDot level={p.competition_level} />
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelect(p)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '9px 12px', borderRadius: 10,
                        background: C.gold, border: 'none',
                        color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={11} /> Analyse
                    </button>
                    <button
                      onClick={() => onToggleWatchlist(p)}
                      style={{
                        width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 10,
                        background: watchlistIds.has(p.id) ? 'rgba(34,197,94,0.12)' : C.glass,
                        border: `1px solid ${watchlistIds.has(p.id) ? 'rgba(34,197,94,0.35)' : C.border}`,
                        color: watchlistIds.has(p.id) ? C.green : C.sub,
                        cursor: 'pointer',
                      }}
                    >
                      {watchlistIds.has(p.id) ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{ ...paginationBtn, opacity: page === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: C.sub }}>Page {page} of {totalPages} · {total} products</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ ...paginationBtn, opacity: page === totalPages ? 0.4 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WinningProducts() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  // ── Tab ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');

  // ── View toggle ───────────────────────────────────────────────────────
  const [view, setView] = useState<'table' | 'cards'>('table');

  // ── Products ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedISO, setLastUpdatedISO] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [top3, setTop3] = useState<WinningProduct[]>([]);

  // ── Watchlist ─────────────────────────────────────────────────────────
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [watchlistProducts, setWatchlistProducts] = useState<WinningProduct[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory]         = useState('All');
  const [trend, setTrend]               = useState('All');
  const [competition, setCompetition]   = useState('All');
  const [sort, setSort]                 = useState('Score');
  const [page, setPage]                 = useState(1);
  const [filtersOpen, setFiltersOpen]   = useState(false);

  // ── Detail drawer ─────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<WinningProduct | null>(null);

  // ── Refresh ───────────────────────────────────────────────────────────
  const [refreshing, setRefreshing]       = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(getNextRefreshTime);
  const [countdown, setCountdown]         = useState(() => fmtCountdown(getNextRefreshTime()));

  // ── Debounce search ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Countdown ticker ──────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= nextRefreshTime.getTime()) {
        const next = getNextRefreshTime();
        setNextRefreshTime(next);
        setCountdown(fmtCountdown(next));
      } else {
        setCountdown(fmtCountdown(nextRefreshTime));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRefreshTime]);

  // ── Supabase Realtime ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('winning_products_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'winning_products' },
        () => {
          toast('🔥 New products just dropped!', {
            action: { label: 'Refresh', onClick: () => fetchProducts() },
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load categories ───────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('winning_products')
      .select('category')
      .not('category', 'is', null)
      .then(({ data }) => {
        if (data) {
          const cats = [...new Set(data.map((r: { category: string | null }) => r.category).filter(Boolean))] as string[];
          setCategories(['All', ...cats.sort()]);
        }
      });
  }, []);

  // ── Load last-updated + top 3 ─────────────────────────────────────────
  const loadMeta = async () => {
    const { data } = await supabase
      .from('winning_products')
      .select('scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1);
    if (data?.[0]) setLastUpdatedISO(data[0].scraped_at as string);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: top } = await supabase
      .from('winning_products')
      .select('*')
      .gte('scraped_at', cutoff)
      .order('winning_score', { ascending: false })
      .limit(3);
    setTop3((top as WinningProduct[] | null) ?? []);
  };

  useEffect(() => { loadMeta(); }, []);

  // ── Load watchlist ids ────────────────────────────────────────────────
  const loadWatchlistIds = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('user_watchlist')
      .select('product_id')
      .eq('user_id', userId);
    if (data) {
      setWatchlistIds(new Set(data.map((r: { product_id: string }) => r.product_id)));
    }
  };

  useEffect(() => { loadWatchlistIds(); }, [userId]);

  // ── Load watchlist products ───────────────────────────────────────────
  const loadWatchlistProducts = async () => {
    if (!userId) return;
    setWatchlistLoading(true);
    const { data } = await supabase
      .from('user_watchlist')
      .select('product_id, winning_products(*)')
      .eq('user_id', userId);
    if (data) {
      const prods = data
        .map((r: { product_id: string; winning_products: WinningProduct | WinningProduct[] }) => {
          const wp = r.winning_products;
          return Array.isArray(wp) ? wp[0] : wp;
        })
        .filter(Boolean) as WinningProduct[];
      setWatchlistProducts(prods);
    }
    setWatchlistLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'watchlist') loadWatchlistProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId]);

  // ── Fetch products ────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('winning_products')
        .select('*', { count: 'exact' });

      if (debouncedSearch) query = query.ilike('product_title', `%${debouncedSearch}%`);
      if (category !== 'All') query = query.eq('category', category);
      if (trend !== 'All') query = query.eq('trend', trend.toLowerCase());
      if (competition !== 'All') query = query.eq('competition_level', competition.toLowerCase());

      switch (sort) {
        case 'Score':   query = query.order('winning_score', { ascending: false }); break;
        case 'Revenue': query = query.order('est_daily_revenue_aud', { ascending: false }); break;
        case 'Units':   query = query.order('units_per_day', { ascending: false }); break;
        case 'Newest':  query = query.order('scraped_at', { ascending: false }); break;
      }

      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, error, count } = await query;

      // If table doesn't exist yet, fall back to Tavily API
      if (error) {
        if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.code === '42P01') {
          // Table not yet created — fall back to server-side Tavily fetch
          const res = await fetch('/api/tools/winning-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: category !== 'All' ? category : undefined }),
          });
          if (res.ok) {
            const fallback = await res.json();
            const mapped: WinningProduct[] = (fallback.products ?? []).map((p: any, i: number) => ({
              id: `fallback-${i}`,
              product_title: p.name || p.productTitle || 'Trending Product',
              image_url: p.imageUrl || '',
              tiktok_product_url: '',
              category: p.category || 'Other',
              platform: 'TikTok Shop',
              price_aud: parseFloat(String(p.estimatedPriceAUD || '29').replace(/[^0-9.]/g, '')) || 29,
              sold_count: p.soldCount || 0,
              rating: 4.5,
              review_count: 0,
              shop_name: '',
              winning_score: p.trendScore || 75,
              trend: (p.trend || 'growing').toLowerCase(),
              competition_level: (p.competitionLevel || 'medium').toLowerCase(),
              au_relevance: p.auRelevance || 80,
              est_daily_revenue_aud: p.estDailyRevenueAud || 500,
              units_per_day: p.unitsPerDay || 8,
              why_winning: p.trendReason || p.whyWinning || '',
              ad_angle: p.adAngle || '',
              scraped_at: new Date().toISOString(),
            }));
            setProducts(mapped);
            setTotal(mapped.length);
          }
        } else {
          throw error;
        }
      } else {
        setProducts((data as WinningProduct[] | null) ?? []);
        setTotal(count ?? 0);
      }
    } catch (err: any) {
      console.error('[WinningProducts] fetch error:', err);
      toast.error('Could not load products — try refreshing');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, category, trend, competition, sort]);
  useEffect(() => { if (activeTab === 'all') fetchProducts(); }, [debouncedSearch, category, trend, competition, sort, page, activeTab]);

  // ── Toggle watchlist ──────────────────────────────────────────────────
  const toggleWatchlist = async (p: WinningProduct) => {
    if (!userId) { toast.error('Sign in to save products'); return; }
    const inWl = watchlistIds.has(p.id);
    if (inWl) {
      await supabase.from('user_watchlist').delete().eq('user_id', userId).eq('product_id', p.id);
      setWatchlistIds((prev) => { const n = new Set(prev); n.delete(p.id); return n; });
      toast('Removed from watchlist');
    } else {
      await supabase.from('user_watchlist').upsert({ user_id: userId, product_id: p.id });
      setWatchlistIds((prev) => new Set([...prev, p.id]));
      toast('💾 Saved to watchlist!');
    }
    if (activeTab === 'watchlist') loadWatchlistProducts();
  };

  // ── Manual refresh ────────────────────────────────────────────────────
  const handleRefresh = async () => {
    if (!token) { toast.error('Sign in to trigger refresh'); return; }
    setRefreshing(true);
    try {
      const res = await fetch('/api/products/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const json = await res.json() as { triggered?: boolean; message?: string; error?: string; nextAllowedAt?: string };
      if (res.status === 429) {
        toast.error(`Rate limited — try again later`);
      } else if (res.ok) {
        toast.success('⚡ Refresh triggered!');
        // Re-fetch products after a short delay
        setTimeout(() => { fetchProducts(); loadMeta(); }, 2000);
      } else {
        toast.error(json.error ?? 'Refresh failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // ── Active filter count ───────────────────────────────────────────────
  const activeFilters = [
    debouncedSearch !== '',
    category !== 'All',
    trend !== 'All',
    competition !== 'All',
  ].filter(Boolean).length;

  // ── Empty state ───────────────────────────────────────────────────────
  const showEmpty = !loading && products.length === 0 && activeFilters === 0 && activeTab === 'all';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'DM Sans, sans-serif', color: C.text }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:.2} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(0.9)} }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
                  Winning Products
                </h1>
                {/* Live dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
                AU-specific opportunities · Low competition · Margins above 40% · Not Amazon bestsellers
              </p>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', borderRadius: 12,
                background: C.goldBg, border: `1px solid ${C.goldBorder}`,
                color: C.gold, fontSize: 13, fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer',
                flexShrink: 0,
              }}
            >
              {refreshing
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Zap size={13} />
              }
              ⚡ Refresh Now
            </button>
          </div>

          {/* Status bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.sub }}>
              <TrendingUp size={12} />
              Last updated: <span style={{ color: C.text, fontWeight: 600 }}>{fmtLastUpdated(lastUpdatedISO)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.sub }}>
              <RefreshCw size={12} />
              Next refresh: <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: C.gold }}>{countdown}</span>
              <span style={{ color: C.muted }}>(AEST)</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: C.glass, border: `1px solid ${C.border}`, borderRadius: 14, padding: 4, width: 'fit-content' }}>
          {[
            { id: 'all',       label: 'All Products', icon: <Layers size={13} /> },
            { id: 'watchlist', label: 'My Watchlist',  icon: <BookmarkCheck size={13} />, count: watchlistIds.size },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'all' | 'watchlist')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 11,
                background: activeTab === tab.id ? C.gold : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? '#000' : C.sub,
                fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : C.goldBg,
                  color: activeTab === tab.id ? '#000' : C.gold,
                  padding: '1px 6px', borderRadius: 20,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Top 3 Banner (all tab only) ────────────────────────────────── */}
        {activeTab === 'all' && top3.length > 0 && (
          <Top3Banner products={top3} onSelect={setSelectedProduct} />
        )}

        {/* ── Filter Panel ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          {/* Filter header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 10,
                background: filtersOpen ? C.goldBg : C.glass,
                border: `1px solid ${filtersOpen ? C.goldBorder : C.border}`,
                color: filtersOpen ? C.gold : C.sub,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Filter size={12} />
              Filters
              {activeFilters > 0 && (
                <span style={{ background: C.gold, color: '#000', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 20 }}>
                  {activeFilters}
                </span>
              )}
            </button>

            {/* View toggle + search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  style={{
                    padding: '8px 12px 8px 30px', borderRadius: 10,
                    background: C.glass, border: `1px solid ${C.border}`,
                    color: C.text, fontSize: 12, outline: 'none', width: 200,
                  }}
                />
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', background: C.glass, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                {[
                  { v: 'table', icon: <Table2 size={14} /> },
                  { v: 'cards', icon: <Grid3X3 size={14} /> },
                ].map(({ v, icon }) => (
                  <button
                    key={v}
                    onClick={() => setView(v as 'table' | 'cards')}
                    style={{
                      width: 36, height: 34,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: view === v ? C.goldBg : 'transparent',
                      border: 'none',
                      color: view === v ? C.gold : C.sub,
                      cursor: 'pointer',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 16, padding: '20px 20px', display: 'flex', flexWrap: 'wrap', gap: 20 }}>

                  {/* Category */}
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={filterLabel}>Category</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {categories.map((c) => (
                        <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
                      ))}
                    </div>
                  </div>

                  {/* Trend */}
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={filterLabel}>Trend</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['All', 'Exploding', 'Growing', 'Stable', 'Declining'].map((t) => {
                        const meta = t !== 'All' ? TREND_MAP[t.toLowerCase() as Trend] : null;
                        return (
                          <Chip key={t} active={trend === t} onClick={() => setTrend(t)}>
                            {meta ? `${meta.emoji} ${t}` : t}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  {/* Competition */}
                  <div style={{ flex: '1 1 140px' }}>
                    <div style={filterLabel}>Competition</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['All', 'Low', 'Medium', 'High'].map((c) => {
                        const meta = c !== 'All' ? COMPETITION_MAP[c.toLowerCase() as Competition] : null;
                        return (
                          <Chip key={c} active={competition === c} onClick={() => setCompetition(c)}>
                            {meta ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                                {c}
                              </span>
                            ) : c}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort */}
                  <div style={{ flex: '1 1 140px' }}>
                    <div style={filterLabel}>Sort by</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['Score', 'Revenue', 'Units', 'Newest'].map((s) => (
                        <Chip key={s} active={sort === s} onClick={() => setSort(s)}>{s}</Chip>
                      ))}
                    </div>
                  </div>

                  {/* Clear all */}
                  {activeFilters > 0 && (
                    <button
                      onClick={() => { setCategory('All'); setTrend('All'); setCompetition('All'); setSearch(''); setSort('Score'); }}
                      style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <X size={11} /> Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {showEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '72px 24px', background: C.glass, border: `1px solid ${C.border}`, borderRadius: 20 }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
              First data drop in {countdown}
            </h3>
            <p style={{ fontSize: 13, color: C.sub, margin: '0 0 24px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              The n8n workflow runs every 6 hours AEST. Products will appear automatically — or hit ⚡ Refresh Now to trigger it.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: C.muted }}>
              <Award size={12} />
              Powered by TikTok Shop Apify scraper + Claude AI scoring
            </div>
          </motion.div>
        )}

        {/* ── All Products tab ────────────────────────────────────────────── */}
        {activeTab === 'all' && !showEmpty && (
          view === 'table'
            ? <TableView products={products} loading={loading} onSelect={setSelectedProduct} onToggleWatchlist={toggleWatchlist} watchlistIds={watchlistIds} page={page} setPage={setPage} total={total} />
            : <CardGrid products={products} loading={loading} onSelect={setSelectedProduct} onToggleWatchlist={toggleWatchlist} watchlistIds={watchlistIds} page={page} setPage={setPage} total={total} />
        )}

        {/* ── Watchlist tab ───────────────────────────────────────────────── */}
        {activeTab === 'watchlist' && (
          watchlistProducts.length === 0 && !watchlistLoading
            ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '72px 24px', background: C.glass, border: `1px solid ${C.border}`, borderRadius: 20 }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>💾</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
                  No saved products yet
                </h3>
                <p style={{ fontSize: 13, color: C.sub, margin: '0 0 20px' }}>
                  Hit 💾 on any product to save it to your watchlist
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  style={{ padding: '10px 24px', borderRadius: 10, background: C.gold, border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Browse Products
                </button>
              </motion.div>
            )
            : (
              view === 'table'
                ? <TableView products={watchlistProducts} loading={watchlistLoading} onSelect={setSelectedProduct} onToggleWatchlist={toggleWatchlist} watchlistIds={watchlistIds} page={1} setPage={() => {}} total={watchlistProducts.length} />
                : <CardGrid products={watchlistProducts} loading={watchlistLoading} onSelect={setSelectedProduct} onToggleWatchlist={toggleWatchlist} watchlistIds={watchlistIds} page={1} setPage={() => {}} total={watchlistProducts.length} />
            )
        )}
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      <DetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        watchlistIds={watchlistIds}
        onToggleWatchlist={toggleWatchlist}
        token={token}
      />
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

const filterLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
};

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 20,
        background: active ? C.gold : C.glass,
        border: `1px solid ${active ? C.gold : C.border}`,
        color: active ? '#000' : C.sub,
        fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
