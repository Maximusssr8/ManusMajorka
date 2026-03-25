import { useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  product: string;
  price: number;
  location: string;
  timestamp: number;
}

interface Toast {
  id: string;
  message: string;
  price: number;
  location: string;
  createdAt: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRODUCTS = [
  { name: 'Posture Corrector Belt', price: 44.99 },
  { name: 'Dog Lick Mat Slow Feeder', price: 24.99 },
  { name: 'LED Strip Lights USB', price: 18.99 },
  { name: 'Portable Blender Bottle', price: 39.99 },
  { name: 'Bamboo Charging Station', price: 59.99 },
  { name: 'Scalp Massager Brush', price: 29.99 },
];

const LOCATIONS = [
  'Sydney NSW', 'Melbourne VIC', 'Brisbane QLD',
  'Perth WA', 'Gold Coast QLD', 'Adelaide SA',
];

const HOURLY_REVENUE = [
  12, 8, 5, 4, 6, 10, 22, 45, 120, 210, 280, 340,
  390, 370, 310, 260, 230, 270, 340, 400, 380, 310, 180, 80,
];

const TOP_PRODUCTS = [
  { name: 'Posture Corrector Belt', units: 124, revenue: 5573.76, trend: '+12%' },
  { name: 'Dog Lick Mat Slow Feeder', units: 98, revenue: 2449.02, trend: '+8%' },
  { name: 'Portable Blender Bottle', units: 76, revenue: 3039.24, trend: '+21%' },
  { name: 'LED Strip Lights USB', units: 49, revenue: 930.51, trend: '-3%' },
  { name: 'Bamboo Charging Station', units: 31, revenue: 1859.69, trend: '+5%' },
];

const NAV_ITEMS = [
  { label: 'Overview', active: true },
  { label: 'Orders', active: false },
  { label: 'Products', active: false },
  { label: 'Analytics', active: false },
  { label: 'Ads Manager', active: false },
  { label: 'AI Assistant', active: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let _oidCounter = 1000;
function genOrderId(): string {
  return `#${++_oidCounter}`;
}

function pickRandom<T>(arr: T[]): T {
  const idx = Math.floor((Date.now() / 1000) % arr.length);
  return arr[idx];
}

// ─── Shopify-style colours ────────────────────────────────────────────────────

const S = {
  bg: '#F6F6F7',
  white: '#FFFFFF',
  border: '#E1E3E5',
  text: '#1A1A1A',
  muted: '#6D7175',
  green: '#008060',
  greenBg: '#F1F8F5',
  red: '#D82C0D',
  redBg: '#FFF4F4',
  sidebar: '#FFFFFF',
  sidebarActive: '#F6F6F7',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, trend, prefix = '' }: { label: string; value: string; trend?: string; prefix?: string }) {
  const isPositive = trend?.startsWith('+');
  return (
    <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: S.muted, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: S.text, lineHeight: 1 }}>{prefix}{value}</div>
      {trend && (
        <div style={{ fontSize: 12, color: isPositive ? S.green : S.red, marginTop: 6, fontWeight: 500 }}>
          {isPositive ? '▲' : '▼'} {trend} vs yesterday
        </div>
      )}
    </div>
  );
}

function RevenueChart({ currentHour }: { currentHour: number }) {
  const max = Math.max(...HOURLY_REVENUE);
  return (
    <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 8, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>Revenue by hour</div>
        <div style={{ fontSize: 12, color: S.muted }}>Today — AUD</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
        {HOURLY_REVENUE.map((val, i) => {
          const h = (i + 24) % 24;
          const pct = (val / max) * 100;
          const isActive = h === currentHour;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 0 }}>
              <div
                title={`${i}:00 — $${val}`}
                style={{
                  width: '100%',
                  height: `${pct}%`,
                  minHeight: 2,
                  background: isActive ? S.green : '#C9E8E0',
                  borderRadius: '2px 2px 0 0',
                  transition: 'height 0.3s ease',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {['12am', '6am', '12pm', '6pm', '11pm'].map(t => (
          <span key={t} style={{ fontSize: 10, color: S.muted }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <tr>
      <td style={{ padding: '10px 16px', fontSize: 13, color: '#2C6ECB', fontWeight: 500, borderBottom: `1px solid ${S.border}` }}>{order.id}</td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: S.text, borderBottom: `1px solid ${S.border}` }}>{order.product}</td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: S.muted, borderBottom: `1px solid ${S.border}` }}>{order.location}</td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: S.text, fontWeight: 500, textAlign: 'right' as const, borderBottom: `1px solid ${S.border}` }}>${fmt(order.price)}</td>
      <td style={{ padding: '10px 16px', fontSize: 12, borderBottom: `1px solid ${S.border}` }}>
        <span style={{ background: S.greenBg, color: S.green, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Paid</span>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PromoDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [revenue, setRevenue] = useState(2847.34);
  const [orderCount, setOrderCount] = useState(63);
  const [avgOrder, setAvgOrder] = useState(45.19);
  const [activeNav, setActiveNav] = useState('Overview');
  const currentHour = new Date().getHours();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Seed initial orders
  useEffect(() => {
    const initial: Order[] = [];
    for (let i = 0; i < 8; i++) {
      const prod = PRODUCTS[i % PRODUCTS.length];
      initial.push({
        id: genOrderId(),
        product: prod.name,
        price: prod.price,
        location: LOCATIONS[i % LOCATIONS.length],
        timestamp: Date.now() - (8 - i) * 4 * 60 * 1000,
      });
    }
    setOrders(initial);
  }, []);

  // Simulate live orders every 6-12 seconds
  useEffect(() => {
    const tick = () => {
      const delay = 6000 + Math.floor(Date.now() % 6000);
      intervalRef.current = setTimeout(() => {
        const prod = PRODUCTS[Math.floor(Date.now() / 1000) % PRODUCTS.length];
        const loc = LOCATIONS[Math.floor(Date.now() / 7000) % LOCATIONS.length];
        const newOrder: Order = { id: genOrderId(), product: prod.name, price: prod.price, location: loc, timestamp: Date.now() };
        const toast: Toast = { id: String(Date.now()), message: prod.name, price: prod.price, location: loc, createdAt: Date.now() };

        setOrders(prev => [newOrder, ...prev].slice(0, 20));
        setToasts(prev => [toast, ...prev].slice(0, 3));
        setRevenue(prev => prev + prod.price);
        setOrderCount(prev => prev + 1);
        setAvgOrder(prev => parseFloat(((prev * 0.95) + (prod.price * 0.05)).toFixed(2)));

        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 4000);
        tick();
      }, delay);
    };
    tick();
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, []);

  const conversionRate = 2.4 + ((orderCount - 63) * 0.01);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: S.font, background: S.bg, overflow: 'hidden', position: 'relative' as const }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: S.sidebar, borderRight: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column' as const, flexShrink: 0 }}>
        {/* Store header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${S.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: S.green, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>M</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: S.text }}>Majorka Store</div>
              <div style={{ fontSize: 11, color: S.muted }}>Demo Store</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' as const }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveNav(item.label)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left' as const,
                  padding: '8px 16px', fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? S.text : S.muted,
                  background: isActive ? S.sidebarActive : 'transparent',
                  border: 'none', borderLeft: isActive ? `3px solid ${S.green}` : '3px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${S.border}` }}>
          <div style={{ fontSize: 11, color: S.muted }}>Powered by Majorka AI</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' as const }}>

        {/* Top bar */}
        <div style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: S.text }}>Overview</div>
            <div style={{ fontSize: 12, color: S.muted, marginTop: 1 }}>Today · Sydney, NSW</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: S.muted, background: S.bg, padding: '6px 12px', borderRadius: 6, border: `1px solid ${S.border}` }}>Today</span>
            <span style={{ fontSize: 12, color: S.white, background: S.green, padding: '6px 12px', borderRadius: 6, fontWeight: 500 }}>Live</span>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: 24, flex: 1 }}>

          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <StatCard label="Revenue today" value={`$${fmt(revenue)}`} trend="+18%" />
            <StatCard label="Orders" value={String(orderCount)} trend="+12%" />
            <StatCard label="Conversion rate" value={`${conversionRate.toFixed(1)}%`} trend="+0.3%" />
            <StatCard label="Avg order value" value={`$${fmt(avgOrder)}`} trend="+2%" />
          </div>

          {/* Two-col layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 20 }}>
            <RevenueChart currentHour={currentHour} />

            {/* Top products */}
            <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 8, padding: '20px 20px 8px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: S.text, marginBottom: 16 }}>Top products</div>
              {TOP_PRODUCTS.map((p, i) => {
                const isPositive = p.trend.startsWith('+');
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, marginBottom: 12, borderBottom: i < TOP_PRODUCTS.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: S.text, fontWeight: 500, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{p.units} units · ${fmt(p.revenue)}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isPositive ? S.green : S.red, flexShrink: 0, marginLeft: 8 }}>{p.trend}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Orders table */}
          <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>Recent orders</div>
              <span style={{ fontSize: 12, color: S.muted }}>Live stream</span>
            </div>
            <div style={{ overflowX: 'auto' as const }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr style={{ background: S.bg }}>
                    {['Order', 'Product', 'Location', 'Amount', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: S.muted, textAlign: h === 'Amount' ? 'right' as const : 'left' as const, borderBottom: `1px solid ${S.border}`, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map(o => <OrderRow key={o.id} order={o} />)}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Toast notifications */}
      <div style={{ position: 'fixed' as const, bottom: 24, right: 24, display: 'flex', flexDirection: 'column' as const, gap: 8, zIndex: 50 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: S.white, border: `1px solid ${S.border}`, borderRadius: 8,
            padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.2s ease',
            minWidth: 240,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: S.text, marginBottom: 2 }}>New order — ${fmt(toast.price)}</div>
            <div style={{ fontSize: 12, color: S.muted }}>{toast.message}</div>
            <div style={{ fontSize: 11, color: S.muted, marginTop: 4 }}>📍 {toast.location}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
