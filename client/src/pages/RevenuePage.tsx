import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  DollarSign,
  Share2,
  ShoppingBag,
  Star,
  TrendingUp,
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
import { useLocation } from 'wouter';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#070B14',
  surface: '#0E1420',
  surfaceHover: '#141C2E',
  border: 'rgba(255,255,255,0.07)',
  borderGlow: 'rgba(99,102,241,0.3)',
  green: '#22C55E',
  greenDim: '#16A34A',
  greenBg: 'rgba(34,197,94,0.1)',
  indigo: '#6366F1',
  indigoDim: 'rgba(99,102,241,0.15)',
  violet: '#8B5CF6',
  white: '#FFFFFF',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  text: '#F1F5F9',
};

const brico = "'Bricolage Grotesque', sans-serif";
const geist = "'DM Sans', sans-serif";

// ── Chart data ────────────────────────────────────────────────────────────────
interface ChartPoint { day: string; revenue: number; }

function buildChartData(): ChartPoint[] {
  // Deterministic curve — no Math.random()
  const CURVE = [
    52, 61, 48, 73, 80, 58, 44, // week 1 (slow start, weekend dips)
    94, 112, 127, 138, 155, 103, 88, // week 2 (ramp)
    169, 187, 211, 228, 243, 178, 142, // week 3 (peak zone)
    267, 289, 301, 312, 287, 241, 198, 176, // week 4+ (slight pullback)
    163, // day 30
  ];
  const now = new Date();
  return CURVE.map((revenue, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { day: label, revenue };
  });
}

const ALL_DATA = buildChartData();

// ── Demo orders ───────────────────────────────────────────────────────────────
const DEMO_ORDERS = [
  { id: '1847', product: 'LED Light Therapy Face Mask', amount: 156.91, flag: '🇦🇺', time: '2h ago' },
  { id: '1846', product: 'Dog Harness No Pull Reflective', amount: 21.08, flag: '🇳🇿', time: '3h ago' },
  { id: '1845', product: 'Posture Corrector Adjustable', amount: 46.84, flag: '🇦🇺', time: '5h ago' },
  { id: '1844', product: 'Portable Blender Juicer', amount: 94.00, flag: '🇬🇧', time: '6h ago' },
  { id: '1843', product: 'Reusable Makeup Remover Pads', amount: 40.92, flag: '🇦🇺', time: '8h ago' },
  { id: '1842', product: 'UV Sanitiser Box Steriliser', amount: 31.20, flag: '🇺🇸', time: '9h ago' },
  { id: '1841', product: 'Facial Roller Massager Jade', amount: 171.00, flag: '🇦🇺', time: '11h ago' },
  { id: '1840', product: 'Car Seat Back Organiser', amount: 16.00, flag: '🇦🇺', time: '12h ago' },
  { id: '1839', product: 'Eyebrow Stamp Kit Professional', amount: 12.00, flag: '🇸🇬', time: '14h ago' },
  { id: '1838', product: 'Biotin Hair Growth Serum', amount: 5.21, flag: '🇦🇺', time: '16h ago' },
];

type Range = '7D' | '30D' | '90D';

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const { day, revenue } = payload[0].payload;
  return (
    <div style={{
      background: '#0E1420',
      border: `1px solid ${C.borderGlow}`,
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{day}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.green, fontFamily: brico }}>
        ${revenue.toFixed(2)}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RevenuePage() {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [display, setDisplay] = useState(0);
  const [range, setRange] = useState<Range>('30D');
  const [toast, setToast] = useState('');
  const animRef = useRef<number | null>(null);
  const TARGET = 12847.50;

  // Animated counter
  useEffect(() => {
    const start = performance.now();
    const dur = 1600;
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 4); // ease out quart — snappier
      setDisplay(ease * TARGET);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const chartData = range === '7D' ? ALL_DATA.slice(-7) : ALL_DATA;

  const handleShare = useCallback(async () => {
    const text = `💰 My Store Earnings\n\nEst. Total: $12,847.50\nThis Month: $3,240\nToday: $187\n\nTracked by Majorka · majorka.io`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setToast('Copied to clipboard!');
      setTimeout(() => setToast(''), 2200);
    }
  }, []);

  // Month-over-month change (+18%)
  const moM = '+18.4%';

  const px = isMobile ? 16 : 28;

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: geist,
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
      overflowX: 'hidden',
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: C.green, color: '#fff', padding: '10px 20px', borderRadius: 999,
          fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap' as const,
          boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
        }}>
          ✓ {toast}
        </div>
      )}

      {/* Demo banner */}
      <div style={{
        background: 'rgba(245,158,11,0.08)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        padding: '9px 16px', textAlign: 'center', fontSize: 12, color: '#F59E0B', fontWeight: 500,
      }}>
        📊 Demo Mode — Connect your Shopify store to see real earnings
      </div>

      {/* ── Hero card ── */}
      <div style={{ padding: `28px ${px}px 0` }}>
        <div style={{
          background: 'linear-gradient(135deg, #12183a 0%, #1a1040 50%, #0d1526 100%)',
          border: `1px solid ${C.borderGlow}`,
          borderRadius: 24,
          padding: isMobile ? '28px 20px 24px' : '36px 32px 28px',
          position: 'relative' as const,
          overflow: 'hidden' as const,
          boxShadow: '0 0 80px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)',
        }}>
          {/* Glow orbs */}
          <div style={{
            position: 'absolute' as const, top: -40, right: -40, width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none' as const,
          }} />
          <div style={{
            position: 'absolute' as const, bottom: -30, left: -20, width: 160, height: 160,
            background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
            pointerEvents: 'none' as const,
          }} />

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: C.indigoDim, border: `1px solid ${C.borderGlow}`,
                borderRadius: 10, padding: 8,
              }}>
                <Wallet size={16} color={C.indigo} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.mutedLight }}>Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 999, padding: '4px 10px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
                <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>LIVE</span>
              </div>
              <button onClick={handleShare} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '7px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, color: C.mutedLight, fontSize: 12,
              }}>
                <Share2 size={13} /> Share
              </button>
            </div>
          </div>

          {/* Balance label */}
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
            Est. Total Earnings
          </div>

          {/* The big number */}
          <div style={{
            fontSize: isMobile ? 44 : 60,
            fontWeight: 900,
            fontFamily: brico,
            lineHeight: 1,
            marginBottom: 12,
            background: `linear-gradient(135deg, ${C.green} 0%, #4ADE80 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 24px rgba(34,197,94,0.3))',
          }}>
            ${display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* MoM badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: C.greenBg, border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 999, padding: '4px 10px',
            }}>
              <ArrowUpRight size={12} color={C.green} />
              <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>{moM} vs last month</span>
            </div>
            <span style={{ fontSize: 12, color: C.muted }}>· Demo data</span>
          </div>
        </div>
      </div>

      {/* ── 4 Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 10, padding: `16px ${px}px 0`,
      }}>
        {[
          { label: 'This Month', value: '$3,240', sub: '+12% vs prev', Icon: TrendingUp, color: C.green },
          { label: 'Today', value: '$187', sub: '3 orders', Icon: DollarSign, color: C.indigo },
          { label: 'Best Day', value: '$891', sub: 'Mar 24', Icon: Star, color: '#F59E0B' },
          { label: 'Total Orders', value: '847', sub: 'all time', Icon: ShoppingBag, color: C.violet },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: isMobile ? '14px 12px' : '18px 16px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${s.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
            }}>
              <s.Icon size={15} color={s.color} />
            </div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: C.white, fontFamily: brico, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color, marginTop: 2, fontWeight: 500 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart ── */}
      <div style={{ padding: `16px ${px}px 0` }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: isMobile ? '16px 12px' : '22px 20px',
        }}>
          {/* Chart header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Revenue Trend</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Daily earnings</div>
            </div>
            <div style={{
              display: 'flex', gap: 4,
              background: C.bg, borderRadius: 10, padding: 3, border: `1px solid ${C.border}`,
            }}>
              {(['7D', '30D', '90D'] as Range[]).map((r) => (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: range === r ? C.indigo : 'transparent',
                  color: range === r ? '#fff' : C.muted,
                  transition: 'all 150ms',
                }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts */}
          <ResponsiveContainer width="100%" height={isMobile ? 150 : 210}>
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: C.muted }}
                axisLine={false} tickLine={false}
                interval={range === '7D' ? 0 : 4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: C.muted }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone" dataKey="revenue"
                stroke={C.green} strokeWidth={2.5}
                fill="url(#greenGrad)" dot={false}
                activeDot={{ r: 5, fill: C.green, stroke: C.bg, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div style={{ padding: `16px ${px}px 0` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Recent Orders</div>
          <div style={{ fontSize: 11, color: C.muted }}>Demo data</div>
        </div>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, overflow: 'hidden',
        }}>
          {DEMO_ORDERS.map((o, i) => (
            <div key={o.id} style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
              padding: isMobile ? '12px 14px' : '14px 18px',
              borderBottom: i < DEMO_ORDERS.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: 'background 150ms',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {/* Order # pill */}
              <div style={{
                background: C.indigoDim, border: `1px solid ${C.borderGlow}`,
                borderRadius: 6, padding: '2px 7px', fontSize: 11,
                fontWeight: 700, color: C.indigo, minWidth: 46, textAlign: 'center' as const,
              }}>
                #{o.id}
              </div>

              {/* Product name */}
              <span style={{
                flex: 1, fontSize: isMobile ? 12 : 13, color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              }}>
                {o.product}
              </span>

              {/* Amount */}
              <span style={{
                fontSize: isMobile ? 14 : 15, fontWeight: 800, color: C.green,
                fontFamily: brico, minWidth: 60, textAlign: 'right' as const,
              }}>
                ${o.amount.toFixed(2)}
              </span>

              {/* Flag */}
              <span style={{ fontSize: 16, minWidth: 22, textAlign: 'center' as const }}>{o.flag}</span>

              {/* Time */}
              <span style={{
                fontSize: 11, color: C.muted,
                minWidth: isMobile ? 46 : 56, textAlign: 'right' as const,
              }}>
                {o.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Connect store CTA ── */}
      <div style={{ padding: `16px ${px}px 0` }}>
        <div style={{
          background: 'linear-gradient(135deg, #0d1526 0%, #1a1040 100%)',
          border: `1px solid ${C.borderGlow}`,
          borderRadius: 20,
          padding: isMobile ? '24px 18px' : '28px 24px',
          textAlign: 'center',
          position: 'relative' as const, overflow: 'hidden' as const,
        }}>
          <div style={{
            position: 'absolute' as const, top: -20, right: -20, width: 120, height: 120,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none' as const,
          }} />
          <Zap size={28} color={C.indigo} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 6 }}>Connect your store</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
            Link your Shopify store to replace demo data with your real orders and revenue.
          </div>
          <button
            onClick={() => navigate('/app/store-builder')}
            style={{
              padding: '13px 28px', borderRadius: 12, border: 'none',
              background: C.indigo, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: brico, letterSpacing: '-0.01em',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}
          >
            Connect Shopify →
          </button>
        </div>
      </div>

      {/* ── Withdrawal ── */}
      <div style={{ padding: `16px ${px}px 0` }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: isMobile ? '22px 16px' : '26px 24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Available to withdraw</div>
              <div style={{ fontSize: isMobile ? 28 : 34, fontWeight: 900, fontFamily: brico, color: C.white }}>
                $12,847.50
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Processed within 2-3 business days</div>
            </div>
            <div style={{ position: 'relative' as const, display: 'inline-block' }}>
              <button
                disabled
                title="Connect your Shopify store to enable withdrawals"
                style={{
                  padding: '14px 24px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: C.muted, fontSize: 14, fontWeight: 700,
                  cursor: 'not-allowed', fontFamily: brico,
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: 0.55,
                }}
              >
                <DollarSign size={16} />
                Request Withdrawal
              </button>
              <span style={{
                position: 'absolute' as const, bottom: -22, left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10, color: C.muted, whiteSpace: 'nowrap' as const,
              }}>
                Connect Shopify to enable
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
