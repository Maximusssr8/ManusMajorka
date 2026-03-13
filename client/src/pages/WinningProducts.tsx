/**
 * WinningProducts.tsx — KaloData-level AU market intelligence dashboard V2.
 * Hero stats · Score rings · Podium · Detail drawer · 7-day charts · Watchlist (localStorage)
 */

import CountUp from 'react-countup';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BarChart2,
  BookmarkCheck,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Crown,
  ExternalLink,
  Filter,
  Flame,
  Grid3X3,
  Heart,
  Layers,
  Loader2,
  Play,
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
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
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
  shop_name?: string | null;
  category: string | null;
  platform: string;
  price_aud: number | null;
  sold_count: number | null;
  rating?: number | null;
  review_count?: number | null;
  winning_score: number;
  trend: Trend | null;
  competition_level: Competition | null;
  au_relevance: number;
  est_daily_revenue_aud: number | null;
  units_per_day: number | null;
  why_winning: string | null;
  ad_angle: string | null;
  source?: string | null;
  scraped_at: string;
  scored_at?: string | null;
  created_at?: string;
  updated_at: string;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

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
  silver: '#c0c0c0',
  bronze: '#cd7f32',
} as const;

// ── Constants ─────────────────────────────────────────────────────────────────

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
const WATCHLIST_KEY = 'majorka_watchlist_v2';

// ── Seeded fallback products ──────────────────────────────────────────────────

const SEEDED_PRODUCTS: WinningProduct[] = [
  { id: 's1', product_title: 'LED Therapy Face Mask', category: 'Health & Beauty', platform: 'TikTok Shop', price_aud: 89, sold_count: 3240, winning_score: 94, trend: 'exploding', competition_level: 'low', au_relevance: 92, est_daily_revenue_aud: 2800, units_per_day: 31, why_winning: 'Viral TikTok skincare trend — AU women 25–44 spending big on at-home spa tech.', ad_angle: 'Ditch the dermatologist waitlist. Get clinic-grade skin in 10 minutes from your couch.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's2', product_title: 'Posture Corrector Pro', category: 'Health & Beauty', platform: 'TikTok Shop', price_aud: 49, sold_count: 5100, winning_score: 88, trend: 'exploding', competition_level: 'low', au_relevance: 88, est_daily_revenue_aud: 1960, units_per_day: 40, why_winning: 'WFH culture driving neck/back pain in AU. Solves real problem with instant relief angle.', ad_angle: '8 hours at a desk destroyed my posture. This fixed it in 2 weeks.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's3', product_title: 'Portable Neck Fan', category: 'Tech', platform: 'TikTok Shop', price_aud: 39, sold_count: 7800, winning_score: 85, trend: 'growing', competition_level: 'medium', au_relevance: 96, est_daily_revenue_aud: 1560, units_per_day: 40, why_winning: 'Summers getting hotter in AU. Seasonal product with strong repeat buyer potential.', ad_angle: 'Queensland summer hits different when you stop sweating through your work shirt.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's4', product_title: 'Pet Self-Cleaning Slicker Brush', category: 'Pet', platform: 'TikTok Shop', price_aud: 34, sold_count: 9200, winning_score: 82, trend: 'growing', competition_level: 'low', au_relevance: 90, est_daily_revenue_aud: 1190, units_per_day: 35, why_winning: 'AU has one of the highest pet ownership rates. Solves universal pain: dog hair everywhere.', ad_angle: 'My golden retriever was destroying my furniture. This self-cleaning brush changed everything.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's5', product_title: 'Resistance Bands Set (11pc)', category: 'Fitness', platform: 'TikTok Shop', price_aud: 45, sold_count: 6700, winning_score: 79, trend: 'growing', competition_level: 'medium', au_relevance: 85, est_daily_revenue_aud: 1350, units_per_day: 30, why_winning: 'Home gym trend still strong. Low ticket, high volume. Gym minimalists love this.', ad_angle: 'Cancel your $60/month gym membership. This $45 kit does everything you need.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's6', product_title: 'Fridge Organiser Bins Set', category: 'Home & Kitchen', platform: 'TikTok Shop', price_aud: 38, sold_count: 12100, winning_score: 76, trend: 'stable', competition_level: 'medium', au_relevance: 82, est_daily_revenue_aud: 1140, units_per_day: 30, why_winning: 'Evergreen product. Strong "satisfying clean fridge" video content potential.', ad_angle: 'Spent 15 mins organising my fridge. Saved $200 in food waste this month.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's7', product_title: 'UV Phone Sanitiser Box', category: 'Tech', platform: 'TikTok Shop', price_aud: 59, sold_count: 4300, winning_score: 74, trend: 'growing', competition_level: 'low', au_relevance: 87, est_daily_revenue_aud: 1180, units_per_day: 20, why_winning: 'Health-conscious AU market. Great gift product. Dual use as wireless charger.', ad_angle: 'Your phone has more bacteria than a toilet seat. This kills 99.9% in 5 minutes.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's8', product_title: 'Anti-Gravity Wall Planter', category: 'Home & Kitchen', platform: 'TikTok Shop', price_aud: 29, sold_count: 8900, winning_score: 71, trend: 'stable', competition_level: 'low', au_relevance: 80, est_daily_revenue_aud: 870, units_per_day: 30, why_winning: 'Plant parent culture massive in AU. Tiny apartments need space-saving solutions.', ad_angle: 'Turn your blank wall into a garden. Perfect for renters — no drilling needed.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's9', product_title: 'Compression Knee Brace (Pair)', category: 'Health & Beauty', platform: 'TikTok Shop', price_aud: 44, sold_count: 5600, winning_score: 69, trend: 'stable', competition_level: 'medium', au_relevance: 83, est_daily_revenue_aud: 880, units_per_day: 20, why_winning: 'Ageing AU population. Runners and gym-goers. Strong pain-point angle.', ad_angle: 'Finished a half marathon with zero knee pain. Finally found something that actually works.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's10', product_title: 'Waterproof Dog Raincoat', category: 'Pet', platform: 'TikTok Shop', price_aud: 29, sold_count: 7200, winning_score: 67, trend: 'growing', competition_level: 'low', au_relevance: 88, est_daily_revenue_aud: 870, units_per_day: 30, why_winning: 'Strong gifting category. Cute product = viral UGC. Low competition from AU retailers.', ad_angle: 'My dog refused to walk in rain. Now she sprints to the door when she sees her raincoat.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's11', product_title: 'Electric Scalp Massager', category: 'Health & Beauty', platform: 'TikTok Shop', price_aud: 39, sold_count: 4100, winning_score: 65, trend: 'growing', competition_level: 'low', au_relevance: 78, est_daily_revenue_aud: 780, units_per_day: 20, why_winning: 'Stress relief and hair growth niche growing fast. Strong before/after content angle.', ad_angle: 'Used this for 30 days. My hairdresser asked what changed. Stress-relief bonus too.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's12', product_title: 'Stainless Meal Prep Containers (5pk)', category: 'Home & Kitchen', platform: 'TikTok Shop', price_aud: 52, sold_count: 6300, winning_score: 63, trend: 'stable', competition_level: 'medium', au_relevance: 79, est_daily_revenue_aud: 624, units_per_day: 12, why_winning: 'Meal prep trend huge with AU health-conscious millennials. Eco angle plays well.', ad_angle: 'Ditch plastic. Meal prepped Sunday, ate healthy all week, saved $90 on takeaway.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's13', product_title: 'Portable Jump Rope Counter', category: 'Fitness', platform: 'TikTok Shop', price_aud: 24, sold_count: 9800, winning_score: 61, trend: 'growing', competition_level: 'low', au_relevance: 77, est_daily_revenue_aud: 720, units_per_day: 30, why_winning: 'Cardio at home. Low price point = impulse buy. Auto-counter solves real pain.', ad_angle: 'Track your jumps automatically. No math, no excuses, just burn.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's14', product_title: 'Blue Light Blocking Glasses', category: 'Tech', platform: 'TikTok Shop', price_aud: 34, sold_count: 11200, winning_score: 58, trend: 'stable', competition_level: 'high', au_relevance: 76, est_daily_revenue_aud: 680, units_per_day: 20, why_winning: 'Screen fatigue growing. Low cost gift item. But high competition — needs strong angle.', ad_angle: 'My headaches disappeared after 3 days. My boss thought I got better sleep. I did.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's15', product_title: 'Bamboo Charging Organiser Dock', category: 'Tech', platform: 'TikTok Shop', price_aud: 65, sold_count: 3800, winning_score: 56, trend: 'stable', competition_level: 'medium', au_relevance: 74, est_daily_revenue_aud: 650, units_per_day: 10, why_winning: 'Eco-conscious AU buyers. Desk setups content is huge. Great gift for Christmas.', ad_angle: 'Cleared my bedside table chaos with one purchase. Charges 4 devices overnight.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 80) return C.gold;
  if (s >= 60) return C.green;
  if (s >= 40) return C.amber;
  return C.red;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateWeekData(base: number, id: string): { day: string; rev: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const seedNum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRand(seedNum);
  return days.map((day, i) => ({
    day,
    rev: Math.round(Math.max(0, base * (0.65 + i * 0.055 + rand() * 0.2))),
  }));
}

function generateMonthData(base: number, id: string): { day: number; rev: number }[] {
  const seedNum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRand(seedNum);
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    rev: Math.round(Math.max(0, base * (0.55 + rand() * 0.9))),
  }));
}

function fmtAUD(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `$${n.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
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

function getAdAngles(p: WinningProduct): string[] {
  const base = p.ad_angle ?? `${p.product_title} — the product Australians can't stop buying.`;
  return [
    base,
    `I've been using ${p.product_title} for 30 days. Here's what nobody tells you...`,
    `POV: You just discovered why every AU dropshipper is selling ${p.category?.toLowerCase() ?? 'this'} right now.`,
  ];
}

// ── Watchlist localStorage helpers ────────────────────────────────────────────

function loadWatchlistFromStorage(): WinningProduct[] {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]') as WinningProduct[];
  } catch {
    return [];
  }
}

function saveWatchlistToStorage(products: WinningProduct[]): void {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(products));
}

// ── SVG Score Ring ────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={5}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ - dash}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Syne, sans-serif',
          fontSize: size > 50 ? 14 : 11,
          fontWeight: 800,
          color,
        }}
      >
        {score}
      </div>
    </div>
  );
}

// ── AU Relevance Bar ──────────────────────────────────────────────────────────

function AURelevanceBar({ value }: { value: number }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: C.muted,
          marginBottom: 4,
        }}
      >
        <span>🇦🇺 AU Relevance</span>
        <span style={{ fontWeight: 700, color: C.gold }}>{value}%</span>
      </div>
      <div
        style={{
          height: 4,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${C.gold}, #e5c24a)`,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}

// ── Trend Badge ───────────────────────────────────────────────────────────────

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

// ── Competition Badge ─────────────────────────────────────────────────────────

function CompetitionDot({ level }: { level: Competition | null }) {
  if (!level) return null;
  const m = COMPETITION_MAP[level];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        color: m.color,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: m.color,
          boxShadow: `0 0 6px ${m.color}80`,
          display: 'inline-block',
        }}
      />
      {m.label} Competition
    </span>
  );
}

// ── Hero Stats Bar ────────────────────────────────────────────────────────────

interface HeroStat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: React.ReactNode;
}

function HeroStatsBar({ products, total }: { products: WinningProduct[]; total: number }) {
  const avgScore = useMemo(() => {
    if (!products.length) return 0;
    return Math.round(products.reduce((a, p) => a + p.winning_score, 0) / products.length);
  }, [products]);

  const explodingCount = useMemo(
    () => products.filter((p) => p.trend === 'exploding').length,
    [products],
  );

  const avgAU = useMemo(() => {
    if (!products.length) return 0;
    return Math.round(products.reduce((a, p) => a + p.au_relevance, 0) / products.length);
  }, [products]);

  const stats: HeroStat[] = [
    { label: 'Products Tracked', value: total || products.length, icon: <BarChart2 size={16} />, suffix: '' },
    { label: 'Avg Winning Score', value: avgScore, icon: <Flame size={16} />, suffix: '/100' },
    { label: 'Exploding Trends', value: explodingCount, icon: <Zap size={16} />, suffix: '' },
    { label: 'AU Relevance Avg', value: avgAU, icon: <TrendingUp size={16} />, suffix: '%' },
  ];

  const maxValue = Math.max(...stats.map((s) => s.value));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}
    >
      {stats.map((s, i) => {
        const isHighest = s.value === maxValue;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{
              background: isHighest
                ? 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.04) 100%)'
                : C.glass,
              border: `1px solid ${isHighest ? C.goldBorder : C.border}`,
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: isHighest ? `0 0 24px rgba(212,175,55,0.12)` : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: isHighest ? C.gold : C.sub }}>
              {s.icon}
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 28,
                fontWeight: 800,
                color: isHighest ? C.gold : C.text,
                lineHeight: 1,
              }}
            >
              <CountUp
                end={s.value}
                duration={1.4}
                delay={i * 0.1}
                separator=","
              />
              {s.suffix && (
                <span style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginLeft: 2 }}>
                  {s.suffix}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Top 3 Podium ──────────────────────────────────────────────────────────────

const RANK_META = [
  { crown: '👑', color: C.gold, height: 120, label: '#1' },
  { crown: '🥈', color: C.silver, height: 90, label: '#2' },
  { crown: '🥉', color: C.bronze, height: 70, label: '#3' },
];

function Top3Podium({
  products,
  onSelect,
}: {
  products: WinningProduct[];
  onSelect: (p: WinningProduct) => void;
}) {
  if (products.length < 1) return null;

  // Podium order: 2nd, 1st, 3rd
  const order = [products[1], products[0], products[2]].filter(Boolean);
  const rankMap: Record<string, number> = {};
  products.forEach((p, i) => (rankMap[p.id] = i));

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Crown size={14} style={{ color: C.gold }} />
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: C.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Top 3 Podium
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>by winning score</span>
      </div>

      {/* Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {products.slice(0, 3).map((p, i) => {
          const meta = RANK_META[i];
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.45 }}
              onClick={() => onSelect(p)}
              style={{
                background:
                  i === 0
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.04) 100%)'
                    : C.glass,
                border: `1px solid ${i === 0 ? C.goldBorder : C.glassBorder}`,
                borderRadius: 18,
                padding: '20px 20px 16px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
              }}
              whileHover={{ boxShadow: `0 0 28px ${meta.color}22` }}
            >
              {/* Rank badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  fontSize: 24,
                  userSelect: 'none',
                }}
              >
                {meta.crown}
              </div>

              {/* Podium bar visualization */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: meta.height,
                  background: `linear-gradient(to top, ${meta.color}08, transparent)`,
                  pointerEvents: 'none',
                }}
              />

              {/* Rank label */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  color: meta.color,
                  background: `${meta.color}18`,
                  border: `1px solid ${meta.color}35`,
                  marginBottom: 12,
                  letterSpacing: '0.04em',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {meta.label}
              </div>

              {/* Image */}
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.product_title}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    objectFit: 'cover',
                    marginBottom: 12,
                    display: 'block',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              {/* Title */}
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  fontWeight: 800,
                  color: C.text,
                  lineHeight: 1.25,
                  marginBottom: 10,
                  paddingRight: 32,
                }}
              >
                {p.product_title}
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <ScoreRing score={p.winning_score} size={44} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                  <TrendBadge trend={p.trend} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>
                    {fmtAUD(p.est_daily_revenue_aud)}/day
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(p);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: i === 0 ? C.gold : C.glass,
                  border: `1px solid ${i === 0 ? C.gold : C.border}`,
                  color: i === 0 ? '#000' : C.gold,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                <Sparkles size={11} />
                View Details
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

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
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnalysis('');
    setAnalysing(false);
    setAnalysisOpen(false);
    setCopiedIdx(null);
  }, [product?.id]);

  const weekData = useMemo(
    () => (product ? generateWeekData(product.est_daily_revenue_aud ?? 500, product.id) : []),
    [product?.id, product?.est_daily_revenue_aud],
  );

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
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setAnalysis(`Error: ${msg}`);
    } finally {
      setAnalysing(false);
    }
  };

  const copyAngle = (angle: string, idx: number) => {
    void navigator.clipboard.writeText(angle);
    setCopiedIdx(idx);
    toast('📋 Ad angle copied!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const inWatchlist = product ? watchlistIds.has(product.id) : false;
  const adAngles = product ? getAdAngles(product) : [];
  const weeklyRev = product?.est_daily_revenue_aud ? product.est_daily_revenue_aud * 7 : null;
  const monthlyRev = product?.est_daily_revenue_aud ? product.est_daily_revenue_aud * 30 : null;

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 998,
            }}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(480px, 100vw)',
              background: '#0d1017',
              borderLeft: `1px solid ${C.glassBorder}`,
              zIndex: 999,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Image header */}
            {product.image_url && (
              <div
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  height: 200,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={product.image_url}
                  alt={product.product_title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, #0d1017 100%)',
                  }}
                />
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    border: `1px solid ${C.glassBorder}`,
                    color: C.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div
              style={{
                padding: 24,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* Close (no image) */}
              {!product.image_url && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={onClose}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: C.glass,
                      border: `1px solid ${C.glassBorder}`,
                      color: C.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Title */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.gold,
                      background: C.goldBg,
                      border: `1px solid ${C.goldBorder}`,
                      padding: '3px 8px',
                      borderRadius: 20,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {product.platform}
                  </span>
                  {product.category && (
                    <span
                      style={{
                        fontSize: 11,
                        color: C.sub,
                        background: C.glass,
                        padding: '3px 8px',
                        borderRadius: 20,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      {product.category}
                    </span>
                  )}
                </div>
                <h2
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.text,
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {product.product_title}
                </h2>
              </div>

              {/* Metric row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                }}
              >
                {(
                  [
                    { label: 'Score', value: product.winning_score },
                    { label: 'Rev/Day', value: fmtAUD(product.est_daily_revenue_aud) },
                    { label: 'Units/Day', value: product.units_per_day?.toFixed(0) ?? '—' },
                    { label: 'Price', value: fmtAUD(product.price_aud) },
                  ] as { label: string; value: React.ReactNode }[]
                ).map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: C.glass,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: '12px 10px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: C.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 4,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.text,
                      }}
                    >
                      {label === 'Score' ? (
                        <span style={{ color: scoreColor(product.winning_score) }}>
                          {product.winning_score}
                        </span>
                      ) : (
                        value
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue projections */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    background: 'rgba(34,197,94,0.07)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Weekly Proj.
                  </div>
                  <div
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 18,
                      fontWeight: 800,
                      color: C.green,
                    }}
                  >
                    {fmtAUD(weeklyRev)}
                  </div>
                </div>
                <div
                  style={{
                    background: C.goldBg,
                    border: `1px solid ${C.goldBorder}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Monthly Proj.
                  </div>
                  <div
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 18,
                      fontWeight: 800,
                      color: C.gold,
                    }}
                  >
                    {fmtAUD(monthlyRev)}
                  </div>
                </div>
              </div>

              {/* 7-day trend chart */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  7-Day Revenue Trend (Est. AUD)
                </div>
                <div style={{ width: '100%', height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weekData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: C.muted }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: C.muted }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `$${v}`}
                        width={44}
                      />
                      <RechartTooltip
                        contentStyle={{
                          background: '#0f1117',
                          border: `1px solid ${C.goldBorder}`,
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: C.sub }}
                        formatter={(v: number) => [`$${v} AUD`, 'Est. Rev']}
                      />
                      <Line
                        type="monotone"
                        dataKey="rev"
                        stroke={C.gold}
                        strokeWidth={2}
                        dot={{ fill: C.gold, r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: C.gold }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend + Competition + AU */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <TrendBadge trend={product.trend} />
                <CompetitionDot level={product.competition_level} />
                <AURelevanceBar value={product.au_relevance} />
              </div>

              {/* Why Winning */}
              {product.why_winning && (
                <div
                  style={{
                    background: C.goldBg,
                    border: `1px solid ${C.goldBorder}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: C.gold,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 6,
                    }}
                  >
                    Why It's Winning
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'rgba(245,245,245,0.85)',
                      lineHeight: 1.55,
                    }}
                  >
                    {product.why_winning}
                  </p>
                </div>
              )}

              {/* 3 Ad Angles */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  Ad Angles (3 Variations)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {adAngles.map((angle, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(34,197,94,0.05)',
                        border: '1px solid rgba(34,197,94,0.18)',
                        borderRadius: 12,
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 10,
                            color: C.green,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: 4,
                          }}
                        >
                          Angle {idx + 1}
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: 'rgba(245,245,245,0.85)',
                            lineHeight: 1.5,
                            fontStyle: 'italic',
                          }}
                        >
                          "{angle}"
                        </p>
                      </div>
                      <button
                        onClick={() => copyAngle(angle, idx)}
                        title="Copy ad angle"
                        style={{
                          flexShrink: 0,
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: copiedIdx === idx ? 'rgba(34,197,94,0.2)' : C.glass,
                          border: `1px solid ${copiedIdx === idx ? 'rgba(34,197,94,0.4)' : C.border}`,
                          color: copiedIdx === idx ? C.green : C.sub,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ClipboardCopy size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              <div
                style={{
                  border: `1px solid ${C.glassBorder}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={analysisOpen ? undefined : runAnalysis}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: analysisOpen ? C.glass : C.goldBg,
                    border: 'none',
                    cursor: analysing ? 'wait' : 'pointer',
                    color: C.text,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} style={{ color: C.gold }} />
                    <span
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      AI AU Analysis
                    </span>
                    {analysing && (
                      <Loader2
                        size={12}
                        style={{
                          color: C.gold,
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                    )}
                  </div>
                  {!analysisOpen && (
                    <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>
                      Run Analysis →
                    </span>
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
                          maxHeight: 320,
                          overflowY: 'auto',
                          padding: '14px 16px',
                          fontSize: 12,
                          lineHeight: 1.7,
                          color: 'rgba(245,245,245,0.85)',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {analysis || (analysing ? '' : 'Click "Run Analysis" to get AI insights.')}
                        {analysing && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 14,
                              background: C.gold,
                              marginLeft: 2,
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
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  Find Suppliers
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    {
                      label: 'AliExpress',
                      url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product.product_title)}`,
                      color: '#ff6a00',
                    },
                    {
                      label: 'CJ Dropshipping',
                      url: `https://cjdropshipping.com/search?q=${encodeURIComponent(product.product_title)}`,
                      color: '#0ea5e9',
                    },
                  ].map(({ label, url, color }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: `${color}14`,
                        border: `1px solid ${color}40`,
                        color,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: 'rgba(255,0,80,0.08)',
                    border: '1px solid rgba(255,0,80,0.25)',
                    color: '#ff0050',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
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
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: inWatchlist ? 'rgba(34,197,94,0.12)' : C.glass,
                    border: `1px solid ${inWatchlist ? 'rgba(34,197,94,0.35)' : C.border}`,
                    color: inWatchlist ? C.green : C.sub,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Heart size={14} fill={inWatchlist ? C.green : 'none'} />
                  {inWatchlist ? '♥ Saved' : 'Watchlist'}
                </button>
                <a
                  href="/app/meta-ads"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    color: '#60a5fa',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Play size={14} />
                  Run Ads
                </a>
                <button
                  onClick={() => {
                    localStorage.setItem('majorka_website_prefill', product.product_title);
                    window.location.href = `/app/website-generator?product=${encodeURIComponent(product.product_title)}`;
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: C.gold,
                    border: 'none',
                    color: '#000',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        background: C.glass,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        height: 360,
        animation: 'shimmer 1.8s ease-in-out infinite',
      }}
    />
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  rank,
  onSelect,
  onToggleWatchlist,
  inWatchlist,
}: {
  product: WinningProduct;
  rank: number;
  onSelect: (p: WinningProduct) => void;
  onToggleWatchlist: (p: WinningProduct) => void;
  inWatchlist: boolean;
}) {
  const rankMeta =
    rank === 1
      ? { color: C.gold, label: '#1' }
      : rank === 2
        ? { color: C.silver, label: '#2' }
        : rank === 3
          ? { color: C.bronze, label: '#3' }
          : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(product)}
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
      whileHover={{
        borderColor: C.goldBorder,
        boxShadow: `0 0 24px rgba(212,175,55,0.08)`,
      }}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          height: 160,
          background: 'rgba(255,255,255,0.03)',
          overflow: 'hidden',
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart2 size={32} style={{ color: C.muted, opacity: 0.5 }} />
          </div>
        )}

        {/* Score ring overlay */}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <ScoreRing score={product.winning_score} size={48} />
        </div>

        {/* Rank badge */}
        {rankMeta && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              color: rankMeta.color,
              background: `${rankMeta.color}22`,
              border: `1px solid ${rankMeta.color}50`,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            {rankMeta.label}
          </div>
        )}

        {/* Trend badge */}
        <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <TrendBadge trend={product.trend} />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: 16,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 15,
              fontWeight: 800,
              color: C.text,
              lineHeight: 1.25,
              marginBottom: 4,
            }}
          >
            {product.product_title}
          </div>
          {product.price_aud != null && (
            <div style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>
              {fmtAUD(product.price_aud)}
            </div>
          )}
        </div>

        {/* Revenue + units */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)',
              borderRadius: 10,
              padding: '8px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Daily Rev</div>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 14,
                fontWeight: 800,
                color: C.green,
              }}
            >
              {fmtAUD(product.est_daily_revenue_aud)}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: C.goldBg,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 10,
              padding: '8px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Units/Day</div>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 14,
                fontWeight: 800,
                color: C.gold,
              }}
            >
              {product.units_per_day?.toFixed(0) ?? '—'}
            </div>
          </div>
        </div>

        {/* Competition */}
        <CompetitionDot level={product.competition_level} />

        {/* Why winning */}
        {product.why_winning && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: C.sub,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.why_winning}
          </p>
        )}

        {/* AU Relevance bar */}
        <AURelevanceBar value={product.au_relevance} />

        {/* Action buttons */}
        <div
          style={{ display: 'flex', gap: 8, marginTop: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onSelect(product)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 12px',
              borderRadius: 10,
              background: C.gold,
              border: 'none',
              color: '#000',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={11} /> Analyse
          </button>
          <button
            onClick={() => onToggleWatchlist(product)}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            style={{
              width: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: inWatchlist ? 'rgba(239,68,68,0.12)' : C.glass,
              border: `1px solid ${inWatchlist ? 'rgba(239,68,68,0.35)' : C.border}`,
              color: inWatchlist ? C.red : C.sub,
              cursor: 'pointer',
            }}
          >
            <Heart size={14} fill={inWatchlist ? C.red : 'none'} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────

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
        padding: '6px 12px',
        borderRadius: 20,
        background: active ? C.gold : C.glass,
        border: `1px solid ${active ? C.gold : C.border}`,
        color: active ? '#000' : C.sub,
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
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
  const th: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 10,
    fontWeight: 700,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'left',
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      <div style={{ overflowX: 'auto', borderRadius: 16, border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.glass }}>
              <th style={{ ...th, width: 40 }}>#</th>
              <th style={th}>Product</th>
              <th style={th}>Score</th>
              <th style={th}>Rev/Day</th>
              <th style={th}>Units/Day</th>
              <th style={th}>Trend</th>
              <th style={th}>Competition</th>
              <th style={th}>AU Fit</th>
              <th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[40, 200, 80, 80, 80, 80, 80, 60, 100].map((w, j) => (
                      <td key={j} style={{ padding: '14px 12px' }}>
                        <div
                          style={{
                            height: 14,
                            width: w,
                            maxWidth: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 6,
                            animation: 'shimmer 1.8s ease-in-out infinite',
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : products.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => onSelect(p)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: `1px solid ${C.border}`,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = C.cardHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '12px', fontSize: 12, color: C.muted, fontWeight: 700, width: 40 }}>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          minWidth: 180,
                          maxWidth: 280,
                        }}
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: C.glass,
                              border: `1px solid ${C.border}`,
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <BarChart2 size={16} style={{ color: C.muted }} />
                          </div>
                        )}
                        <div>
                          <div
                            style={{
                              fontFamily: 'Syne, sans-serif',
                              fontSize: 13,
                              fontWeight: 700,
                              color: C.text,
                              lineHeight: 1.3,
                            }}
                          >
                            {p.product_title}
                          </div>
                          {p.price_aud != null && (
                            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>
                              {fmtAUD(p.price_aud)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ScoreRing score={p.winning_score} size={38} />
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.green,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtAUD(p.est_daily_revenue_aud)}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: 12,
                        color: C.sub,
                        fontWeight: 600,
                      }}
                    >
                      {p.units_per_day?.toFixed(0) ?? '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <TrendBadge trend={p.trend} />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <CompetitionDot level={p.competition_level} />
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          p.au_relevance >= 90
                            ? C.green
                            : p.au_relevance >= 70
                              ? C.amber
                              : C.sub,
                      }}
                    >
                      {p.au_relevance}%
                    </td>
                    <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onSelect(p)}
                          title="Analyse"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 8px',
                            borderRadius: 7,
                            background: C.glass,
                            border: `1px solid ${C.border}`,
                            color: C.sub,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Sparkles size={11} /> Analyse
                        </button>
                        <button
                          onClick={() => onToggleWatchlist(p)}
                          title={watchlistIds.has(p.id) ? 'Remove' : 'Save'}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 8px',
                            borderRadius: 7,
                            background: watchlistIds.has(p.id)
                              ? 'rgba(239,68,68,0.1)'
                              : C.glass,
                            border: `1px solid ${watchlistIds.has(p.id) ? 'rgba(239,68,68,0.3)' : C.border}`,
                            color: watchlistIds.has(p.id) ? C.red : C.sub,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Heart size={11} fill={watchlistIds.has(p.id) ? C.red : 'none'} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 20,
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.glass,
              border: `1px solid ${C.border}`,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: C.sub }}>
            Page {page} of {totalPages} · {total} products
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.glass,
              border: `1px solid ${C.border}`,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
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
  pageOffset,
}: {
  products: WinningProduct[];
  loading: boolean;
  onSelect: (p: WinningProduct) => void;
  onToggleWatchlist: (p: WinningProduct) => void;
  watchlistIds: Set<string>;
  page: number;
  setPage: (n: number) => void;
  total: number;
  pageOffset?: number;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 18,
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <ProductCard
                  product={p}
                  rank={(pageOffset ?? (page - 1) * PAGE_SIZE) + idx + 1}
                  onSelect={onSelect}
                  onToggleWatchlist={onToggleWatchlist}
                  inWatchlist={watchlistIds.has(p.id)}
                />
              </motion.div>
            ))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.glass,
              border: `1px solid ${C.border}`,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: C.sub }}>
            Page {page} of {totalPages} · {total} products
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.glass,
              border: `1px solid ${C.border}`,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
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

  // ── Tab ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');

  // ── View ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<'table' | 'cards'>('cards');

  // ── Products ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState<WinningProduct[]>(SEEDED_PRODUCTS);
  const [total, setTotal] = useState(SEEDED_PRODUCTS.length);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedISO, setLastUpdatedISO] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Health & Beauty',
    'Pet',
    'Fitness',
    'Home & Kitchen',
    'Tech',
    'Fashion',
  ]);
  const [top3, setTop3] = useState<WinningProduct[]>(SEEDED_PRODUCTS.slice(0, 3));

  // ── Watchlist (localStorage) ──────────────────────────────────────────
  const [watchlistProducts, setWatchlistProducts] = useState<WinningProduct[]>(() =>
    loadWatchlistFromStorage(),
  );
  const watchlistIds = useMemo(
    () => new Set(watchlistProducts.map((p) => p.id)),
    [watchlistProducts],
  );

  // ── Filters ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [trend, setTrend] = useState('All');
  const [sort, setSort] = useState('Score');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Detail drawer ─────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<WinningProduct | null>(null);

  // ── Refresh ───────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);

  // ── Debounce search ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Load categories from DB ───────────────────────────────────────────
  useEffect(() => {
    void supabase
      .from('winning_products')
      .select('category')
      .not('category', 'is', null)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const cats = [
            ...new Set(
              (data as { category: string | null }[]).map((r) => r.category).filter(Boolean),
            ),
          ] as string[];
          if (cats.length > 0) setCategories(['All', ...cats.sort()]);
        }
      });
  }, []);

  // ── Load meta (last updated, top 3) ──────────────────────────────────
  const loadMeta = async () => {
    const { data: latestData } = await supabase
      .from('winning_products')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (latestData?.[0]) {
      setLastUpdatedISO((latestData[0] as { updated_at: string }).updated_at);
    }

    const { data: topData } = await supabase
      .from('winning_products')
      .select('*')
      .order('winning_score', { ascending: false })
      .limit(3);
    if (topData && topData.length > 0) {
      setTop3(topData as WinningProduct[]);
    }
  };

  useEffect(() => {
    void loadMeta();
  }, []);

  // ── Supabase Realtime ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('winning_products_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'winning_products' }, () => {
        toast('🔥 New products just dropped!', {
          action: { label: 'Refresh', onClick: () => void fetchProducts() },
        });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch products ────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('winning_products').select('*', { count: 'exact' });

      if (debouncedSearch) query = query.ilike('product_title', `%${debouncedSearch}%`);
      if (category !== 'All') query = query.eq('category', category);
      if (trend !== 'All') query = query.eq('trend', trend.toLowerCase());

      switch (sort) {
        case 'Score':
          query = query.order('winning_score', { ascending: false });
          break;
        case 'Revenue':
          query = query.order('est_daily_revenue_aud', { ascending: false });
          break;
        case 'Newest':
          query = query.order('scraped_at', { ascending: false });
          break;
        case 'Most Sold':
          query = query.order('sold_count', { ascending: false });
          break;
      }

      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) {
        // Table not ready — use seeded products
        const filtered = SEEDED_PRODUCTS.filter((p) => {
          if (debouncedSearch && !p.product_title.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
          if (category !== 'All' && p.category !== category) return false;
          if (trend !== 'All' && p.trend !== trend.toLowerCase()) return false;
          return true;
        });
        setProducts(filtered);
        setTotal(filtered.length);
      } else {
        const loaded = (data as WinningProduct[] | null) ?? [];
        if (loaded.length === 0 && !debouncedSearch && category === 'All' && trend === 'All') {
          // DB empty — show seeded
          setProducts(SEEDED_PRODUCTS);
          setTotal(SEEDED_PRODUCTS.length);
        } else {
          setProducts(loaded);
          setTotal(count ?? 0);
        }
      }
    } catch {
      setProducts(SEEDED_PRODUCTS);
      setTotal(SEEDED_PRODUCTS.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, trend, sort]);

  useEffect(() => {
    if (activeTab === 'all') void fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, trend, sort, page, activeTab]);

  // ── Toggle watchlist (localStorage) ──────────────────────────────────
  const toggleWatchlist = (p: WinningProduct) => {
    setWatchlistProducts((prev) => {
      let next: WinningProduct[];
      if (prev.some((w) => w.id === p.id)) {
        next = prev.filter((w) => w.id !== p.id);
        toast('Removed from watchlist');
      } else {
        next = [...prev, p];
        toast('❤️ Saved to watchlist!');
      }
      saveWatchlistToStorage(next);
      return next;
    });
  };

  // ── Manual refresh ────────────────────────────────────────────────────
  const handleRefresh = async () => {
    if (!token) {
      toast.error('Sign in to trigger refresh');
      return;
    }
    setRefreshing(true);
    try {
      const res = await fetch('/api/products/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.status === 429) {
        toast.error('Rate limited — try again later');
      } else if (res.ok) {
        toast.success('⚡ Refresh triggered!');
        setTimeout(() => {
          void fetchProducts();
          void loadMeta();
        }, 2000);
      } else {
        const json = (await res.json()) as { error?: string };
        toast.error(json.error ?? 'Refresh failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const activeFilters = [
    debouncedSearch !== '',
    category !== 'All',
    trend !== 'All',
  ].filter(Boolean).length;

  const nextRefreshTime = useMemo(() => {
    if (!lastUpdatedISO) return null;
    return new Date(new Date(lastUpdatedISO).getTime() + 6 * 60 * 60 * 1000);
  }, [lastUpdatedISO]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: 'DM Sans, sans-serif',
        color: C.text,
      }}
    >
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:.2} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(0.88)} }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* ── Market Intelligence Header ──────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <h1
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 30,
                    fontWeight: 800,
                    color: C.text,
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Winning Products
                </h1>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 20,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: C.green,
                      display: 'inline-block',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.green,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Live
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
                AU Market Snapshot —{' '}
                <span style={{ color: C.text }}>Updated {fmtLastUpdated(lastUpdatedISO)}</span>
                {nextRefreshTime && (
                  <>
                    {' · '}
                    Next refresh ~{' '}
                    <span style={{ color: C.gold, fontWeight: 600 }}>
                      {fmtLastUpdated(nextRefreshTime.toISOString()).replace(' ago', '')} from now
                    </span>
                  </>
                )}
              </p>
            </div>

            <button
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 18px',
                borderRadius: 12,
                background: C.goldBg,
                border: `1px solid ${C.goldBorder}`,
                color: C.gold,
                fontSize: 13,
                fontWeight: 700,
                cursor: refreshing ? 'wait' : 'pointer',
                flexShrink: 0,
              }}
            >
              {refreshing ? (
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Zap size={13} />
              )}
              ⚡ Refresh Now
            </button>
          </div>
        </div>

        {/* ── Hero Stats Bar ─────────────────────────────────────────────── */}
        <HeroStatsBar products={products} total={total} />

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 28,
            background: C.glass,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 4,
            width: 'fit-content',
          }}
        >
          {[
            { id: 'all', label: 'All Products', icon: <Layers size={13} /> },
            {
              id: 'watchlist',
              label: 'My Watchlist',
              icon: <Heart size={13} />,
              count: watchlistIds.size,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'all' | 'watchlist')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 11,
                background: activeTab === tab.id ? C.gold : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? '#000' : C.sub,
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
              {'count' in tab && (tab.count ?? 0) > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : C.goldBg,
                    color: activeTab === tab.id ? '#000' : C.gold,
                    padding: '1px 6px',
                    borderRadius: 20,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Top 3 Podium (all tab) ─────────────────────────────────────── */}
        {activeTab === 'all' && top3.length > 0 && (
          <Top3Podium products={top3} onSelect={setSelectedProduct} />
        )}

        {/* ── Filter Bar ─────────────────────────────────────────────────── */}
        {activeTab === 'all' && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: filtersOpen ? C.goldBg : C.glass,
                  border: `1px solid ${filtersOpen ? C.goldBorder : C.border}`,
                  color: filtersOpen ? C.gold : C.sub,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Filter size={12} />
                Filters
                {activeFilters > 0 && (
                  <span
                    style={{
                      background: C.gold,
                      color: '#000',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 20,
                    }}
                  >
                    {activeFilters}
                  </span>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search
                    size={13}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: C.muted,
                    }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    style={{
                      padding: '8px 12px 8px 30px',
                      borderRadius: 10,
                      background: C.glass,
                      border: `1px solid ${C.border}`,
                      color: C.text,
                      fontSize: 12,
                      outline: 'none',
                      width: 200,
                    }}
                  />
                </div>

                {/* View toggle */}
                <div
                  style={{
                    display: 'flex',
                    background: C.glass,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  {(
                    [
                      { v: 'cards', icon: <Grid3X3 size={14} /> },
                      { v: 'table', icon: <Table2 size={14} /> },
                    ] as const
                  ).map(({ v, icon }) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      style={{
                        width: 36,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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

            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      background: C.glass,
                      border: `1px solid ${C.glassBorder}`,
                      borderRadius: 16,
                      padding: '20px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 20,
                    }}
                  >
                    {/* Category */}
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={filterLabelStyle}>Category</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {categories.map((c) => (
                          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                            {c}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {/* Trend */}
                    <div style={{ flex: '1 1 160px' }}>
                      <div style={filterLabelStyle}>Trend</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(['All', 'Exploding', 'Growing', 'Stable'] as const).map((t) => {
                          const meta =
                            t !== 'All'
                              ? TREND_MAP[t.toLowerCase() as Trend]
                              : null;
                          return (
                            <Chip key={t} active={trend === t} onClick={() => setTrend(t)}>
                              {meta ? `${meta.emoji} ${t}` : t}
                            </Chip>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sort */}
                    <div style={{ flex: '1 1 140px' }}>
                      <div style={filterLabelStyle}>Sort by</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {['Score', 'Revenue', 'Newest', 'Most Sold'].map((s) => (
                          <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
                            {s}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {/* Clear */}
                    {activeFilters > 0 && (
                      <button
                        onClick={() => {
                          setCategory('All');
                          setTrend('All');
                          setSearch('');
                          setSort('Score');
                        }}
                        style={{
                          alignSelf: 'flex-end',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '7px 12px',
                          borderRadius: 10,
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: C.red,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <X size={11} /> Clear all
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── All Products ───────────────────────────────────────────────── */}
        {activeTab === 'all' && (
          view === 'cards' ? (
            <CardGrid
              products={products}
              loading={loading}
              onSelect={setSelectedProduct}
              onToggleWatchlist={toggleWatchlist}
              watchlistIds={watchlistIds}
              page={page}
              setPage={setPage}
              total={total}
            />
          ) : (
            <TableView
              products={products}
              loading={loading}
              onSelect={setSelectedProduct}
              onToggleWatchlist={toggleWatchlist}
              watchlistIds={watchlistIds}
              page={page}
              setPage={setPage}
              total={total}
            />
          )
        )}

        {/* ── Watchlist ──────────────────────────────────────────────────── */}
        {activeTab === 'watchlist' && (
          watchlistProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                padding: '72px 24px',
                background: C.glass,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>❤️</div>
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.text,
                  margin: '0 0 8px',
                }}
              >
                No saved products yet
              </h3>
              <p style={{ fontSize: 13, color: C.sub, margin: '0 0 20px' }}>
                Hit ❤️ on any product to save it to your watchlist
              </p>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  background: C.gold,
                  border: 'none',
                  color: '#000',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Browse Products
              </button>
            </motion.div>
          ) : (
            <CardGrid
              products={watchlistProducts}
              loading={false}
              onSelect={setSelectedProduct}
              onToggleWatchlist={toggleWatchlist}
              watchlistIds={watchlistIds}
              page={1}
              setPage={() => {}}
              total={watchlistProducts.length}
              pageOffset={0}
            />
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

// ── Style helpers ─────────────────────────────────────────────────────────────

const filterLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 8,
};
