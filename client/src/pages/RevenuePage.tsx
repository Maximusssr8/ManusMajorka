import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  DollarSign,
  ExternalLink,
  Globe,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Star,
  TrendingUp,
  Trophy,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';

// ── Palette ───────────────────────────────────────────────────────────────────
const G = '#22C55E';
const I = '#6366F1';
const V = '#8B5CF6';
const A = '#F59E0B';

const brico = "'Bricolage Grotesque', sans-serif";
const geist = "'DM Sans', sans-serif";

// ── Chart data ───────────────────────────────────────────────────────────────
interface Pt { day: string; revenue: number }

function buildCurve(raw: number[]): Pt[] {
  return raw.map((revenue, i) => {
    const d = new Date(); d.setDate(d.getDate() - (raw.length - 1 - i));
    return { day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue };
  });
}

const MAX_CURVE = [189,214,178,256,310,198,152,287,334,376,412,455,298,241,398,467,521,548,612,445,318,587,634,701,812,689,598,487,412,287];
const MAX_DATA = buildCurve(MAX_CURVE);
const ZERO_DATA = buildCurve(Array(30).fill(0));

// ── Marketing data ───────────────────────────────────────────────────────────
const MAX_STATS = {
  total: 24847.50,
  month: '$8,241',
  today: '$287',
  bestDay: '$1,891',
  aov: '$64.20',
  orders: '387',
  moM: '+34.2%',
};

const ZERO_STATS = {
  total: 0,
  month: '$0',
  today: '$0',
  bestDay: '$0',
  aov: '$0',
  orders: '0',
  moM: '--',
};

interface Order {
  id: string;
  product: string;
  amount: number;
  flag: string;
  time: string;
  color: string;
  emoji: string;
  today: boolean;
}

const MAX_ORDERS: Order[] = [
  { id: '2847', product: 'LED Light Therapy Face Mask',    amount: 156.91, flag: '\u{1F1E6}\u{1F1FA}', time: '34m ago',  color: '#EC4899', emoji: '\u2728', today: true  },
  { id: '2846', product: 'UV Sanitiser Box Steriliser',    amount:  63.24, flag: '\u{1F1E6}\u{1F1FA}', time: '1h ago',   color: '#38BDF8', emoji: '\u{1F52C}', today: true  },
  { id: '2845', product: 'Posture Corrector Adjustable',   amount:  46.84, flag: '\u{1F1F3}\u{1F1FF}', time: '2h ago',   color: '#6366F1', emoji: '\u{1F4AA}', today: true  },
  { id: '2844', product: 'Biotin Hair Growth Serum',       amount:  20.01, flag: '\u{1F1E6}\u{1F1FA}', time: '3h ago',   color: '#4ADE80', emoji: '\u{1F331}', today: true  },
  { id: '2843', product: 'Facial Roller Massager Jade',    amount: 171.00, flag: '\u{1F1E6}\u{1F1FA}', time: 'Yesterday', color: '#34D399', emoji: '\u{1F486}', today: false },
  { id: '2842', product: 'Portable Blender Juicer',        amount:  94.00, flag: '\u{1F1EC}\u{1F1E7}', time: 'Yesterday', color: '#22C55E', emoji: '\u{1F964}', today: false },
  { id: '2841', product: 'Dog Harness No Pull Reflective', amount:  42.16, flag: '\u{1F1F3}\u{1F1FF}', time: 'Yesterday', color: '#F59E0B', emoji: '\u{1F43E}', today: false },
  { id: '2840', product: 'Reusable Makeup Remover Pads',   amount:  40.92, flag: '\u{1F1E6}\u{1F1FA}', time: 'Yesterday', color: '#A78BFA', emoji: '\u{1F33F}', today: false },
  { id: '2839', product: 'Eyebrow Stamp Kit Professional', amount:  36.00, flag: '\u{1F1F8}\u{1F1EC}', time: 'Yesterday', color: '#F472B6', emoji: '\u{1F484}', today: false },
  { id: '2838', product: 'Car Seat Back Organiser',        amount:  16.00, flag: '\u{1F1E6}\u{1F1FA}', time: 'Yesterday', color: '#FB923C', emoji: '\u{1F697}', today: false },
];

// ── Country breakdown ────────────────────────────────────────────────────────
const COUNTRIES = [
  { flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia',      amount: 14218, pct: 57.2, color: G },
  { flag: '\u{1F1F3}\u{1F1FF}', name: 'New Zealand',    amount: 4847,  pct: 19.5, color: I },
  { flag: '\u{1F1EC}\u{1F1E7}', name: 'United Kingdom', amount: 3612,  pct: 14.5, color: V },
  { flag: '\u{1F1FA}\u{1F1F8}', name: 'United States',  amount: 2170,  pct: 8.7,  color: A },
];

// ── Top products ─────────────────────────────────────────────────────────────
const TOP_PRODUCTS = [
  { emoji: '\u2728', name: 'LED Light Therapy Face Mask',  revenue: 4180, border: '#FFD700' },
  { emoji: '\u{1F486}', name: 'Facial Roller Massager Jade',  revenue: 3762, border: '#C0C0C0' },
  { emoji: '\u{1F964}', name: 'Portable Blender Juicer',      revenue: 3104, border: '#CD7F32' },
  { emoji: '\u{1F4AA}', name: 'Posture Corrector Adjustable', revenue: 2890, border: 'transparent' },
  { emoji: '\u{1F52C}', name: 'UV Sanitiser Box Steriliser',  revenue: 2640, border: 'transparent' },
];

// ── Achievement badges ───────────────────────────────────────────────────────
const BADGES = [
  { emoji: '\u{1F48E}', title: '$25K Club',      sub: 'Unlocking',       color: A,   progress: '99.4%' },
  { emoji: '\u{1F525}', title: '14-Day Streak',  sub: 'Active streak',   color: G,   progress: null },
  { emoji: '\u{1F30F}', title: 'Global Seller',  sub: '4 countries',     color: I,   progress: null },
  { emoji: '\u2B50',    title: 'Rising Star',    sub: 'Top 5% this month', color: V, progress: null },
  { emoji: '\u{1F680}', title: '$1K Day',        sub: 'Mar 22 \u00B7 Unlocked', color: A, progress: null },
];

type Range = '7D' | '30D' | '90D';

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tip({ active, payload }: { active?: boolean; payload?: { payload: Pt }[] }) {
  if (!active || !payload?.length) return null;
  const { day, revenue } = payload[0].payload;
  return (
    <div style={{ background: '#0E1420', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 10, padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>{day}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: G, fontFamily: brico }}>${revenue.toFixed(2)}</div>
    </div>
  );
}

// ── Glass card helper ────────────────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,.08)',
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function RevenuePage() {
  const isMobile = useIsMobile();
  const [, nav] = useLocation();
  const { user } = useAuth();
  const [display, setDisplay] = useState(0);
  const [range, setRange] = useState<Range>('30D');
  const [toast, setToast] = useState('');
  const [progressReady, setProgressReady] = useState(false);
  const ref = useRef<number | null>(null);

  const isMarketing = user?.email === 'maximusmajorka@gmail.com';
  const stats  = isMarketing ? MAX_STATS  : ZERO_STATS;
  const orders = isMarketing ? MAX_ORDERS : [];
  const allData = isMarketing ? MAX_DATA  : ZERO_DATA;
  const TARGET = stats.total;

  // Animated counter
  useEffect(() => {
    if (TARGET === 0) { setDisplay(0); return; }
    const t0 = performance.now();
    const dur = 1500;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay((1 - Math.pow(1 - p, 4)) * TARGET);
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [TARGET]);

  // Progress bar animation delay
  useEffect(() => {
    const id = setTimeout(() => setProgressReady(true), 150);
    return () => clearTimeout(id);
  }, []);

  const chartData = range === '7D' ? allData.slice(-7) : allData;

  const handleShare = useCallback(async () => {
    const text = isMarketing
      ? `\u{1F4B0} My Store Earnings\n\nEst. Total: $24,847.50\nThis Month: $8,241\nToday: $287\n\nTracked by Majorka \u00B7 majorka.io`
      : `\u{1F4B0} Track your store earnings with Majorka \u00B7 majorka.io`;
    if (navigator.share) { try { await navigator.share({ text }); } catch { /**/ } }
    else { await navigator.clipboard.writeText(text); setToast('Copied!'); setTimeout(() => setToast(''), 2000); }
  }, [isMarketing]);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const maxCountry = COUNTRIES[0].amount;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #050811 0%, #0B0E1C 40%, #060A12 100%)', color: '#fff', fontFamily: geist, paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 80px)' }}>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes orbFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,20px)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes progressFill { from{width:0} to{width:var(--w)} }
        .rev-card:hover { border-color: rgba(99,102,241,.35) !important; transform: translateY(-2px); }
        .rev-order:hover { background: rgba(255,255,255,.04) !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed' as const, top: 20, left: '50%', transform: 'translateX(-50%)', background: G, color: '#fff', padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, zIndex: 9999, animation: 'fadeSlide .2s ease', boxShadow: `0 4px 20px rgba(34,197,94,.4)` }}>
          {'\u2713'} {toast}
        </div>
      )}

      {/* Demo banner */}
      {!isMarketing && (
        <div style={{ background: 'rgba(245,158,11,.08)', borderBottom: '1px solid rgba(245,158,11,.15)', padding: '9px 20px', textAlign: 'center' as const, fontSize: 12, color: '#F59E0B', fontWeight: 500 }}>
          {'\u{1F4CA}'} Connect your Shopify store to start tracking real earnings
        </div>
      )}

      {/* ═══ HERO SECTION ═════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(160deg, #0D1530 0%, #14103A 40%, #0A1220 100%)',
        borderBottom: '1px solid rgba(99,102,241,.2)',
        padding: isMobile ? '28px 16px 32px' : '48px 48px 52px',
        position: 'relative' as const,
        overflow: 'hidden' as const,
      }}>
        {/* Animated orbs */}
        <div style={{ position: 'absolute' as const, top: -100, right: -60, width: 400, height: 400, background: 'radial-gradient(circle, rgba(34,197,94,.12) 0%, transparent 65%)', pointerEvents: 'none' as const, animation: 'orbFloat 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute' as const, bottom: -80, left: -40, width: 350, height: 350, background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 65%)', pointerEvents: 'none' as const, animation: 'orbFloat2 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute' as const, top: '30%', right: '30%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(139,92,246,.1) 0%, transparent 65%)', pointerEvents: 'none' as const, animation: 'orbFloat 12s ease-in-out infinite alternate' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' as const, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 48, alignItems: 'center' }}>

          {/* LEFT — Balance */}
          <div>
            {/* Top badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 20 : 28, flexWrap: 'wrap' as const }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)', borderRadius: 999, padding: '5px 12px' }}>
                <Wallet size={13} color={I} />
                <span style={{ fontSize: 11, color: I, fontWeight: 700, letterSpacing: '.04em' }}>REVENUE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 999, padding: '5px 10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}`, animation: 'glowPulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>LIVE</span>
              </div>
              {isMarketing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 999, padding: '5px 10px' }}>
                  <Trophy size={11} color={A} />
                  <span style={{ fontSize: 11, color: A, fontWeight: 700 }}>#47 {'\u{1F1E6}\u{1F1FA}'}</span>
                </div>
              )}
              <button onClick={handleShare} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#9CA3AF', fontSize: 12 }}>
                <Share2 size={13} /> Share
              </button>
            </div>

            {/* Label */}
            <div style={{ fontSize: 11, color: '#4B5563', letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8, fontWeight: 600 }}>
              Est. Total Earnings {'\u00B7'} All Stores
            </div>

            {/* THE NUMBER */}
            <div style={{
              fontFamily: brico,
              fontWeight: 900,
              fontSize: isMobile ? 56 : 96,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 50%, #86EFAC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 16,
              filter: 'drop-shadow(0 0 40px rgba(34,197,94,0.25))',
            }}>
              <span style={{ fontSize: '0.55em', verticalAlign: 'super', lineHeight: 1 }}>$</span>
              {display < 1 ? '0.00' : fmt(display)}
            </div>

            {/* MoM badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, marginBottom: isMarketing ? 24 : 0 }}>
              {isMarketing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 999, padding: '6px 12px' }}>
                  <ArrowUpRight size={14} color={G} />
                  <span style={{ fontSize: 13, color: G, fontWeight: 700 }}>{stats.moM} vs last month</span>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#374151' }}>Connect a store to start tracking</div>
              )}
            </div>

            {/* $25K Milestone progress bar */}
            {isMarketing && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{'\u{1F3AF}'} $25K Goal {'\u2014'} 99.4%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 999, overflow: 'hidden' as const }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #22C55E, #4ADE80)',
                    width: progressReady ? '99.4%' : '0%',
                    transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
                <div style={{ fontSize: 12, color: G, marginTop: 6, fontWeight: 600 }}>
                  Only $152.50 to go!
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Chart card */}
          <div style={{ ...glass, borderRadius: 20, padding: '20px 18px', display: isMobile ? 'none' : 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>30-Day Revenue</div>
                <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>Daily earnings</div>
              </div>
              <div style={{ display: 'flex', gap: 3, background: 'rgba(0,0,0,.3)', borderRadius: 8, padding: 3 }}>
                {(['7D', '30D', '90D'] as Range[]).map(r => (
                  <button key={r} onClick={() => setRange(r)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: range === r ? I : 'transparent', color: range === r ? '#fff' : '#4B5563' }}>{r}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={G} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={G} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} interval={range === '7D' ? 0 : 4} />
                <YAxis tick={{ fontSize: 10, fill: '#374131' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(99,102,241,.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" stroke={G} strokeWidth={2.5} fill="url(#hg)" dot={false} activeDot={{ r: 5, fill: G, stroke: '#060A12', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ ACHIEVEMENT BADGES ═══════════════════════════════════════════════ */}
      {isMarketing && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 16px 0' : '24px 48px 0' }}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto' as const, paddingBottom: 4, scrollbarWidth: 'none' as const }}>
            {BADGES.map(b => (
              <div key={b.title} className="rev-card" style={{
                ...glass, minWidth: 140, borderRadius: 14, padding: '14px 16px', flexShrink: 0,
                borderColor: `${b.color}30`, boxShadow: `0 0 20px ${b.color}10`,
                transition: 'border-color 150ms, transform 150ms',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{b.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{b.title}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{b.sub}</div>
                {b.progress && (
                  <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 999, overflow: 'hidden' as const }}>
                    <div style={{ height: '100%', borderRadius: 999, background: b.color, width: b.progress }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STAT CARDS (5) ════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 16px 0' : '24px 48px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: isMobile ? 10 : 14 }}>
          {[
            { label: 'This Month', value: stats.month,   sub: isMarketing ? '+12% vs prev' : 'No store connected', Icon: TrendingUp, color: G },
            { label: 'Today',      value: stats.today,   sub: isMarketing ? '4 orders' : '\u2014',                  Icon: DollarSign, color: I },
            { label: 'Best Day',   value: stats.bestDay, sub: isMarketing ? 'Mar 22' : '\u2014',                    Icon: Star,       color: A },
            { label: 'Avg Order',  value: stats.aov,     sub: isMarketing ? 'per transaction' : '\u2014',           Icon: ShoppingCart, color: V },
            { label: 'All Orders', value: stats.orders,  sub: isMarketing ? 'all time' : 'no orders yet',           Icon: ShoppingBag, color: '#64748B' },
          ].map(s => (
            <div key={s.label} className="rev-card" style={{ ...glass, borderRadius: 16, padding: isMobile ? '16px 14px' : '20px 18px', position: 'relative' as const, overflow: 'hidden' as const, transition: 'border-color 150ms, transform 150ms' }}>
              <div style={{ position: 'absolute' as const, top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle,${s.color}18 0%,transparent 70%)`, pointerEvents: 'none' as const }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 10 : 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.Icon size={16} color={s.color} />
                </div>
                <span style={{ fontSize: 10, color: s.color, fontWeight: 700, background: `${s.color}12`, border: `1px solid ${s.color}22`, borderRadius: 999, padding: '2px 8px' }}>{s.sub}</span>
              </div>
              <div style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, color: '#FFFFFF', fontFamily: brico, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: '#4B5563', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CHART (mobile only) ══════════════════════════════════════════════ */}
      {isMobile && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ ...glass, borderRadius: 16, padding: '16px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Revenue Trend</div>
              <div style={{ display: 'flex', gap: 3, background: 'rgba(0,0,0,.4)', borderRadius: 8, padding: 3 }}>
                {(['7D', '30D'] as Range[]).map(r => (
                  <button key={r} onClick={() => setRange(r)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: range === r ? I : 'transparent', color: range === r ? '#fff' : '#4B5563' }}>{r}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={G} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={G} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#374151' }} axisLine={false} tickLine={false} interval={range === '7D' ? 0 : 4} />
                <YAxis tick={{ fontSize: 9, fill: '#374151' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="revenue" stroke={G} strokeWidth={2} fill="url(#mg)" dot={false} activeDot={{ r: 4, fill: G, stroke: '#060A12', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ COUNTRY BREAKDOWN + TOP PRODUCTS (side by side desktop) ══════════ */}
      {isMarketing && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 16px 0' : '24px 48px 0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

          {/* Country breakdown */}
          <div style={{ ...glass, borderRadius: 20, padding: isMobile ? '20px 16px' : '24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Globe size={16} color={I} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: brico }}>Revenue by Country</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              {COUNTRIES.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{c.flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB' }}>{c.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: brico }}>${c.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 999, overflow: 'hidden' as const }}>
                      <div style={{ height: '100%', borderRadius: 999, background: c.color, width: `${(c.amount / maxCountry * 100).toFixed(1)}%`, transition: 'width .6s ease' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 12, color: '#6B7280' }}>
              4 countries {'\u00B7'} $24,847.50 total
            </div>
          </div>

          {/* Top products */}
          <div style={{ ...glass, borderRadius: 20, padding: isMobile ? '20px 16px' : '24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={16} color={G} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: brico }}>Top Products by Revenue</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {TOP_PRODUCTS.map((p, i) => (
                <div key={p.name} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,.02)',
                  borderLeft: i < 3 ? `3px solid ${p.border}` : '3px solid transparent',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#6B7280', fontFamily: brico, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{p.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: '#4B5563', marginTop: 2 }}>est.</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: G, fontFamily: brico, flexShrink: 0 }}>
                    ${p.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ORDERS ════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 16px 0' : '24px 48px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: '#fff', fontFamily: brico, letterSpacing: '-0.01em' }}>Recent Orders</div>
            <div style={{ fontSize: 11, color: '#374151', marginTop: 3 }}>{isMarketing ? 'Last 10 transactions' : 'No orders yet'}</div>
          </div>
          {isMarketing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.15)', borderRadius: 999, padding: '5px 12px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: G, boxShadow: `0 0 6px ${G}` }} />
              <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>4 orders today</span>
            </div>
          )}
        </div>

        {/* Empty state */}
        {orders.length === 0 && (
          <div style={{ ...glass, borderRadius: 20, padding: '40px 24px', textAlign: 'center' as const }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F6CD}\u{FE0F}'}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>No orders yet</div>
            <div style={{ fontSize: 13, color: '#374151' }}>Connect a store to see real data</div>
          </div>
        )}

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {isMarketing && <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', letterSpacing: '.1em', textTransform: 'uppercase' as const, paddingLeft: 4, paddingBottom: 2 }}>Today {'\u00B7'} {stats.today}</div>}
          {orders.map((o, i) => {
            const todayCount = orders.filter(x => x.today).length;
            const showYesterdayLabel = isMarketing && i === todayCount;
            return (
              <React.Fragment key={o.id}>
                {showYesterdayLabel && <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', letterSpacing: '.1em', textTransform: 'uppercase' as const, paddingLeft: 4, paddingTop: 8, paddingBottom: 2 }}>Yesterday</div>}
                <div className="rev-order" style={{
                  ...glass, borderRadius: 16,
                  padding: isMobile ? '14px 16px' : '16px 20px',
                  display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16,
                  transition: 'background 150ms, transform 150ms',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.08)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                >
                  <div style={{
                    width: isMobile ? 40 : 48, height: isMobile ? 40 : 48,
                    borderRadius: 14, flexShrink: 0,
                    background: `${o.color}18`,
                    border: `1.5px solid ${o.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isMobile ? 18 : 22,
                  }}>
                    {o.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: isMobile ? 13 : 14, fontWeight: 600, color: '#F1F5F9',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                      marginBottom: 4,
                    }}>
                      {o.product}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#374151', fontFamily: "'DM Mono',monospace" }}>#{o.id}</span>
                      <span style={{ fontSize: 10, color: '#374151' }}>{'\u00B7'}</span>
                      <span style={{ fontSize: 11, color: '#374151' }}>{o.time}</span>
                      <span style={{ fontSize: 14 }}>{o.flag}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    <div style={{
                      fontSize: isMobile ? 17 : 20, fontWeight: 900, color: '#FFFFFF',
                      fontFamily: brico, letterSpacing: '-0.01em', lineHeight: 1,
                    }}>
                      <span style={{ color: G, fontSize: '0.7em', verticalAlign: 'super' }}>$</span>{o.amount.toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: G,
                      background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)',
                      borderRadius: 999, padding: '2px 8px', letterSpacing: '.06em',
                    }}>
                      PAID
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ═══ BOTTOM ROW: Connect + Withdrawal ════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 16px 0' : '24px 48px 0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

        {/* Connect store */}
        <div style={{ background: 'linear-gradient(135deg,#0d1526 0%,#1a1040 100%)', border: '1px solid rgba(99,102,241,.25)', borderRadius: 20, padding: isMobile ? '24px 20px' : '28px 28px', position: 'relative' as const, overflow: 'hidden' as const }}>
          <div style={{ position: 'absolute' as const, top: -20, right: -20, width: 120, height: 120, background: 'radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)', pointerEvents: 'none' as const }} />
          <Zap size={28} color={I} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: brico, marginBottom: 6 }}>Connect your store</div>
          <div style={{ fontSize: 13, color: '#52525b', marginBottom: 20, lineHeight: 1.55 }}>
            Link Shopify to replace demo data with your real orders and revenue.
          </div>
          <button onClick={() => nav('/app/store-builder')} style={{ padding: '12px 22px', borderRadius: 12, border: 'none', background: I, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: brico, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 20px rgba(99,102,241,.3)' }}>
            <ExternalLink size={15} /> Connect Shopify
          </button>
        </div>

        {/* Withdrawal */}
        <div style={{ ...glass, borderRadius: 20, padding: isMobile ? '24px 20px' : '28px 28px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 8, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Available to Withdraw</div>
            <div style={{ fontSize: isMobile ? 32 : 44, fontWeight: 900, color: '#FFFFFF', fontFamily: brico, letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span style={{ color: G, fontSize: '0.65em', verticalAlign: 'super' }}>$</span>
              {TARGET > 0 ? TARGET.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <div style={{ fontSize: 11, color: '#374151', marginTop: 8 }}>Processed within 2{'\u2013'}3 business days</div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button disabled title="Connect Shopify to enable withdrawals" style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#4B5563', fontSize: 14, fontWeight: 700, cursor: 'not-allowed', fontFamily: brico, opacity: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={15} /> Request Withdrawal
            </button>
            <span style={{ fontSize: 11, color: '#374151' }}>Connect Shopify to enable</span>
          </div>
        </div>
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}
