import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DollarSign,
  Share2,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLocation } from 'wouter';

// ── Chart data generator ─────────────────────────────────────────────────────
interface ChartPoint {
  day: string;
  revenue: number;
}

function generate30DayData(): ChartPoint[] {
  const data: ChartPoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayIndex = 30 - i; // 1..30
    const dow = d.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6;

    // Growth curve: starts low, peaks day 22-26, slight pullback
    let base: number;
    if (dayIndex <= 5) {
      base = 40 + Math.random() * 40; // $40-80
    } else if (dayIndex <= 15) {
      base = 80 + (dayIndex - 5) * 15 + Math.random() * 30; // ramp up
    } else if (dayIndex <= 26) {
      base = 220 + (dayIndex - 15) * 10 + Math.random() * 40; // peak zone
    } else {
      base = 260 - (dayIndex - 26) * 20 + Math.random() * 30; // pullback
    }

    if (isWeekend) base *= 0.8;
    const revenue = Math.round(base * 100) / 100;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    data.push({ day: label, revenue });
  }
  return data;
}

const CHART_DATA = generate30DayData();

// ── Demo orders ──────────────────────────────────────────────────────────────
interface DemoOrder {
  id: string;
  product: string;
  amount: number;
  country: string;
  time: string;
}

const DEMO_ORDERS: DemoOrder[] = [
  { id: '#1,847', product: 'LED Light Therapy Face Mask', amount: 156.91, country: '\u{1F1E6}\u{1F1FA}', time: '2 hours ago' },
  { id: '#1,846', product: 'Dog Harness No Pull Reflective', amount: 21.08, country: '\u{1F1F3}\u{1F1FF}', time: '3 hours ago' },
  { id: '#1,845', product: 'Posture Corrector Adjustable', amount: 46.84, country: '\u{1F1E6}\u{1F1FA}', time: '5 hours ago' },
  { id: '#1,844', product: 'Portable Blender Juicer', amount: 94.00, country: '\u{1F1EC}\u{1F1E7}', time: '6 hours ago' },
  { id: '#1,843', product: 'Reusable Makeup Remover Pads', amount: 40.92, country: '\u{1F1E6}\u{1F1FA}', time: '8 hours ago' },
  { id: '#1,842', product: 'UV Sanitiser Box Steriliser', amount: 31.20, country: '\u{1F1FA}\u{1F1F8}', time: '9 hours ago' },
  { id: '#1,841', product: 'Facial Roller Massager Jade', amount: 171.00, country: '\u{1F1E6}\u{1F1FA}', time: '11 hours ago' },
  { id: '#1,840', product: 'Car Seat Back Organiser', amount: 16.00, country: '\u{1F1E6}\u{1F1FA}', time: '12 hours ago' },
  { id: '#1,839', product: 'Eyebrow Stamp Kit Professional', amount: 12.00, country: '\u{1F1F8}\u{1F1EC}', time: '14 hours ago' },
  { id: '#1,838', product: 'Biotin Hair Growth Serum', amount: 5.21, country: '\u{1F1E6}\u{1F1FA}', time: '16 hours ago' },
];

// ── Stats config ─────────────────────────────────────────────────────────────
const STATS = [
  { label: 'This Month', value: '$3,240', icon: TrendingUp },
  { label: 'Today', value: '$187', icon: DollarSign },
  { label: 'Best Day', value: '$891', icon: Zap },
  { label: 'Total Orders', value: '847', icon: ShoppingBag },
] as const;

// ── Time range type ──────────────────────────────────────────────────────────
type TimeRange = '7D' | '30D' | '90D';

// ── Custom tooltip ───────────────────────────────────────────────────────────
interface TooltipPayloadEntry {
  value: number;
  payload: ChartPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid rgba(212,175,55,0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 13,
      color: '#f0ede8',
    }}>
      {entry.payload.day} &middot; <span style={{ color: '#d4af37', fontWeight: 700 }}>${entry.value.toFixed(2)}</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function RevenuePage() {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [displayAmount, setDisplayAmount] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [toast, setToast] = useState('');
  const animRef = useRef<number | null>(null);

  // Animated counter
  useEffect(() => {
    const target = 12847.50;
    const duration = 1500;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayAmount(eased * target);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Filter chart data by range
  const chartData = timeRange === '7D' ? CHART_DATA.slice(-7) : CHART_DATA;

  // Share handler
  const handleShare = useCallback(async () => {
    const shareText = `\u{1F4B0} My Store Earnings\n\nEst. Total: $12,847.50\nThis Month: $3,240\nToday: $187\n\nTracked by Majorka \u00B7 majorka.io`;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setToast('Share link copied!');
      setTimeout(() => setToast(''), 2000);
    }
  }, []);

  const gold = '#d4af37';
  const syne = "'Syne', sans-serif";
  const bricolage = "'Bricolage Grotesque', sans-serif";

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      color: '#f0ede8',
      fontFamily: "'DM Sans', sans-serif",
      paddingBottom: 'env(safe-area-inset-bottom, 24px)',
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#22c55e',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Demo mode banner */}
      <div style={{
        background: 'rgba(245,158,11,0.12)',
        borderBottom: '1px solid rgba(245,158,11,0.2)',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: 12,
        color: '#f59e0b',
        fontWeight: 500,
      }}>
        {'\u{1F4CA}'} Demo Mode — Connect your Shopify store to see real earnings
      </div>

      {/* Header */}
      <div style={{ padding: isMobile ? '24px 16px 20px' : '32px 32px 24px', textAlign: 'center', position: 'relative' }}>
        {/* Top left: Wallet icon */}
        <div style={{ position: 'absolute', top: isMobile ? 24 : 32, left: isMobile ? 16 : 32 }}>
          <Wallet size={20} color={gold} />
        </div>

        {/* Top right: Live badge + Share */}
        <div style={{ position: 'absolute', top: isMobile ? 24 : 32, right: isMobile ? 16 : 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Live</span>
          </div>
          <button
            onClick={handleShare}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#9CA3AF',
              fontSize: 11,
            }}
          >
            <Share2 size={12} /> Share
          </button>
        </div>

        {/* Earnings display */}
        <div style={{
          fontSize: 11,
          color: '#6B7280',
          fontFamily: syne,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          EST. TOTAL EARNINGS
        </div>
        <div style={{
          fontSize: isMobile ? 40 : 52,
          fontWeight: 800,
          color: gold,
          fontFamily: bricolage,
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          ${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: 12, color: '#52525b' }}>
          Across all active stores &middot; Demo Mode
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 12,
        padding: isMobile ? '0 16px 20px' : '0 32px 24px',
      }}>
        {STATS.map((stat) => (
          <div key={stat.label} style={{
            background: '#141414',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 12,
            padding: isMobile ? '14px 12px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <stat.icon size={16} color={gold} style={{ opacity: 0.7 }} />
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: gold, fontFamily: bricolage }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: '#52525b', fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart section */}
      <div style={{ padding: isMobile ? '0 16px 20px' : '0 32px 24px' }}>
        <div style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: isMobile ? '16px 12px' : '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8' }}>30-Day Revenue Trend</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['7D', '30D', '90D'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: timeRange === range ? 'rgba(212,175,55,0.15)' : 'transparent',
                    color: timeRange === range ? gold : '#52525b',
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} interval={timeRange === '7D' ? 0 : 4} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#revGradient)"
                dot={false}
                activeDot={{ r: 4, fill: gold, stroke: '#0A0A0A', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Connected Stores — empty state */}
      <div style={{ padding: isMobile ? '0 16px 20px' : '0 32px 24px' }}>
        <div style={{
          background: '#141414',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 12,
          padding: isMobile ? '28px 16px' : '32px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{'\u{1F4B3}'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#f0ede8', marginBottom: 6 }}>No stores connected</div>
          <div style={{ fontSize: 13, color: '#52525b', marginBottom: 20 }}>
            Connect your Shopify store to track real earnings
          </div>
          <button
            onClick={() => navigate('/app/store-builder')}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#6366F1',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: syne,
              transition: 'transform 150ms ease',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          >
            Connect Shopify &rarr;
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ padding: isMobile ? '0 16px 20px' : '0 32px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8', marginBottom: 12 }}>Recent Orders</div>
        <div style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {DEMO_ORDERS.map((order, i) => (
            <div
              key={order.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 8 : 12,
                padding: isMobile ? '10px 12px' : '12px 16px',
                borderBottom: i < DEMO_ORDERS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: gold, minWidth: 50, fontFamily: "'DM Mono', monospace" }}>
                {order.id}
              </span>
              <span style={{
                flex: 1,
                fontSize: 13,
                color: '#f0ede8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: isMobile ? 140 : 'none',
              }}>
                {order.product.length > 30 ? order.product.slice(0, 30) + '...' : order.product}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', minWidth: 64, textAlign: 'right' }}>
                ${order.amount.toFixed(2)}
              </span>
              <span style={{ fontSize: 14, minWidth: 24, textAlign: 'center' }}>{order.country}</span>
              <span style={{ fontSize: 11, color: '#52525b', minWidth: isMobile ? 60 : 80, textAlign: 'right' }}>
                {order.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal section */}
      <div style={{ padding: isMobile ? '0 16px 32px' : '0 32px 40px' }}>
        <div style={{
          background: '#141414',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 12,
          padding: isMobile ? '24px 16px' : '28px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 6 }}>Available Balance</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: gold, fontFamily: bricolage, marginBottom: 16 }}>
            $12,847.50
          </div>
          <button
            onClick={() => alert('Withdrawal requests coming soon \u00B7 Connect your Shopify store to enable payouts')}
            style={{
              padding: '14px 32px',
              borderRadius: 8,
              border: 'none',
              background: gold,
              color: '#0A0A0A',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: syne,
              marginBottom: 12,
              transition: 'transform 150ms ease',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          >
            Request Withdrawal
          </button>
          <div style={{ fontSize: 11, color: '#52525b' }}>
            Withdrawals processed within 2-3 business days
          </div>
        </div>
      </div>

      {/* Keyframe animation for toast */}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}
