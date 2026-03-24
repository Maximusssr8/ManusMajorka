import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { name: 'Posture Corrector Belt', price: 44.99 },
  { name: 'Dog Lick Mat Slow Feeder', price: 24.99 },
  { name: 'LED Strip Lights USB', price: 18.99 },
  { name: 'Portable Blender Bottle', price: 39.99 },
  { name: 'Bamboo Charging Station', price: 59.99 },
  { name: 'Scalp Massager Brush', price: 29.99 },
];

const LOCATIONS = [
  'Sydney NSW',
  'Melbourne VIC',
  'Brisbane QLD',
  'Perth WA',
  'Gold Coast QLD',
  'Adelaide SA',
];

// Revenue per hour — picks up 9am, peaks 12-1pm, spike 7-9pm
const HOURLY_REVENUE = [
  12, 8, 5, 4, 6, 10, 22, 45, 120, 210, 280, 340,
  390, 370, 310, 260, 230, 270, 340, 400, 380, 310, 180, 80,
];

const NAV_SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { icon: '▣', label: 'Overview', active: true, badge: null },
      { icon: '◈', label: 'Orders', active: false, badge: '3' },
      { icon: '⬡', label: 'Products', active: false, badge: null },
      { icon: '⬢', label: 'Analytics', active: false, badge: null },
    ],
  },
  {
    label: 'GROW',
    items: [
      { icon: '◆', label: 'Ads Manager', active: false, badge: null },
      { icon: '◉', label: 'Creators', active: false, badge: null },
      { icon: '▲', label: 'Trends', active: false, badge: 'NEW' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { icon: '◎', label: 'Payouts', active: false, badge: null },
      { icon: '◐', label: 'Reports', active: false, badge: null },
    ],
  },
];

const TOP_PRODUCTS = [
  { name: 'Posture Corrector Belt', units: 124, revenue: 5573.76, margin: 38 },
  { name: 'Dog Lick Mat Slow Feeder', units: 98, revenue: 2449.02, margin: 41 },
  { name: 'Portable Blender Bottle', units: 76, revenue: 3039.24, margin: 34 },
  { name: 'LED Strip Lights USB', units: 49, revenue: 930.51, margin: 52 },
  { name: 'Bamboo Charging Station', units: null, revenue: null, margin: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-AU');
}

function randBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genOrderId(): string {
  return '#AU' + String(Math.floor(Math.random() * 9000000 + 1000000));
}

function relativeTime(timestamp: number, now: number): string {
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatHUDDate(d: Date): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const day = days[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${dd}.${mm}.${yyyy} · ${hh}:${min} AEST`;
}

// ─── Animated Number Hook ─────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const startRef = useRef<number>(target);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(startRef.current + (target - startRef.current) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PromoDashboard() {
  const params = new URLSearchParams(window.location.search);
  const nameParam = params.get('name') || 'Maximus';
  const revenueParam = params.get('revenue') ? parseFloat(params.get('revenue')!) : 18420.60;
  const ordersParam = params.get('orders') ? parseInt(params.get('orders')!) : 347;

  const [revenue, setRevenue] = useState(revenueParam);
  const [profit, setProfit] = useState(revenueParam * 0.36);
  const [orders, setOrders] = useState(ordersParam);
  const [items, setItems] = useState(489 + (ordersParam - 347));
  const [flashCard, setFlashCard] = useState<string | null>(null);
  const [orders_feed, setOrdersFeed] = useState<Order[]>(() => {
    const now = Date.now();
    return [
      { id: genOrderId(), product: 'Posture Corrector Belt', price: 44.99, location: 'Sydney NSW', timestamp: now - 45000 },
      { id: genOrderId(), product: 'Dog Lick Mat Slow Feeder', price: 24.99, location: 'Melbourne VIC', timestamp: now - 90000 },
      { id: genOrderId(), product: 'LED Strip Lights USB', price: 18.99, location: 'Brisbane QLD', timestamp: now - 150000 },
      { id: genOrderId(), product: 'Portable Blender Bottle', price: 39.99, location: 'Perth WA', timestamp: now - 240000 },
      { id: genOrderId(), product: 'Scalp Massager Brush', price: 29.99, location: 'Gold Coast QLD', timestamp: now - 360000 },
    ];
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastOrderSec, setLastOrderSec] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [currentHourProgress, setCurrentHourProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hudDate, setHudDate] = useState(() => formatHUDDate(new Date()));

  const displayRevenue = useAnimatedNumber(revenue, 800);
  const displayProfit = useAnimatedNumber(profit, 800);
  const displayOrders = useAnimatedNumber(orders, 600);
  const displayItems = useAnimatedNumber(items, 600);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNow(Date.now());
      setLastOrderSec((s) => s + 1);
      setCurrentHourProgress(d.getMinutes() / 60);
      setHudDate(formatHUDDate(d));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const fireOrder = () => {
      const delay = randBetween(2000, 10000);

      timeout = setTimeout(() => {
        const addRevenue = randBetween(55, 180);
        const product = PRODUCTS[randInt(0, PRODUCTS.length - 1)];
        const location = LOCATIONS[randInt(0, LOCATIONS.length - 1)];

        setRevenue((r) => r + addRevenue);
        setProfit((p) => p + addRevenue * 0.36);
        setOrders((o) => o + 1);
        setItems((i) => i + randInt(1, 3));
        setLastOrderSec(0);

        const newOrder: Order = {
          id: genOrderId(),
          product: product.name,
          price: product.price,
          location,
          timestamp: Date.now(),
        };

        setOrdersFeed((prev) => [newOrder, ...prev].slice(0, 8));

        setFlashCard('revenue');
        setTimeout(() => setFlashCard(null), 800);

        const toastId = String(Date.now());
        setToasts((prev) => [...prev, {
          id: toastId,
          message: `New order from ${location}`,
          price: addRevenue,
          location,
          createdAt: Date.now(),
        }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 3500);

        fireOrder();
      }, delay);
    };

    fireOrder();
    return () => clearTimeout(timeout);
  }, []);

  const today = new Date();
  const currentHour = today.getHours();
  const maxBarHeight = Math.max(...HOURLY_REVENUE);
  const peakHour = HOURLY_REVENUE.indexOf(maxBarHeight);

  const greetingHour = today.getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const aov = revenue / Math.max(orders, 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .promo-root {
          font-family: 'DM Sans', sans-serif;
          background: #FAFAFA;
          color: #e8eaed;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* subtle gold glow in top-right corner */
        .promo-root::after {
          content: '';
          position: fixed;
          top: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .promo-body {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
          z-index: 2;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 256px;
          min-width: 256px;
          background: linear-gradient(180deg, #0d0f17 0%, #090b12 100%);
          border-right: 1px solid rgba(99,102,241,0.12);
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
        }

        /* Logo / brand area */
        .sidebar-logo {
          padding: 20px 18px 16px;
          border-bottom: 1px solid #F9FAFB;
          position: relative;
        }

        .sidebar-logo::after {
          content: '';
          position: absolute;
          bottom: 0; left: 18px; right: 18px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent);
        }

        .sidebar-logo-mark {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366F1, #c9a227);
          color: #FAFAFA;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 900;
          font-size: 18px;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.2);
          flex-shrink: 0;
          position: relative;
        }

        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: #fff;
          letter-spacing: -0.4px;
        }

        .logo-tagline {
          font-size: 10px;
          color: #9CA3AF;
          margin-top: 1px;
          letter-spacing: 0.3px;
        }

        /* User profile card */
        .sidebar-profile {
          margin: 14px 14px 0;
          background: rgba(99,102,241,0.04);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 10px;
          padding: 12px 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366F1 0%, #9d7e20 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: #FAFAFA;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.3);
        }

        .profile-info { flex: 1; min-width: 0; }

        .profile-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-plan {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #6366F1;
          font-weight: 500;
          margin-top: 1px;
        }

        .profile-plan::before {
          content: '✦';
          font-size: 8px;
        }

        /* Live revenue mini-card */
        .sidebar-live-revenue {
          margin: 12px 14px 0;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          padding: 11px 13px;
          position: relative;
          overflow: hidden;
        }

        .sidebar-live-revenue::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366F1, #f0c84a, #6366F1);
          background-size: 200% 100%;
          animation: shimmer-bar 2.5s linear infinite;
        }

        @keyframes shimmer-bar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .slr-label {
          font-size: 10px;
          color: #9CA3AF;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .slr-amount {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: #6366F1;
          letter-spacing: -0.8px;
          line-height: 1;
          margin-bottom: 4px;
        }

        .slr-sub {
          font-size: 10px;
          color: #4ade80;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 14px 0 8px;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .sidebar-nav::-webkit-scrollbar { display: none; }

        .nav-section { margin-bottom: 4px; }

        .nav-section-label {
          padding: 8px 18px 4px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.8px;
          color: #D1D5DB;
          text-transform: uppercase;
          user-select: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 16px;
          cursor: default;
          font-size: 13.5px;
          font-weight: 400;
          color: #6B7280;
          transition: all 0.18s;
          user-select: none;
          position: relative;
          margin: 1px 10px;
          border-radius: 8px;
        }

        .nav-item.active {
          color: #fff;
          background: rgba(99,102,241,0.1);
          font-weight: 500;
          box-shadow: inset 0 0 0 1px rgba(99,102,241,0.15);
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 25%; bottom: 25%;
          width: 3px;
          background: #6366F1;
          border-radius: 0 2px 2px 0;
          box-shadow: 0 0 8px rgba(99,102,241,0.6);
        }

        .nav-item:not(.active):hover {
          color: rgba(255,255,255,0.75);
          background: #F9FAFB;
        }

        .nav-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          background: #F9FAFB;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          transition: background 0.18s;
        }

        .nav-item.active .nav-icon-wrap {
          background: rgba(99,102,241,0.15);
        }

        .nav-label { flex: 1; }

        .nav-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 20px;
          background: rgba(99,102,241,0.12);
          color: #6366F1;
          border: 1px solid rgba(99,102,241,0.2);
        }

        .nav-badge.new-badge {
          background: rgba(74,222,128,0.1);
          color: #4ade80;
          border-color: rgba(74,222,128,0.2);
        }

        /* Bottom area */
        .sidebar-bottom {
          padding: 12px 14px 16px;
          border-top: 1px solid #F9FAFB;
        }

        .sidebar-bottom::before {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent);
          margin-bottom: 12px;
          margin-top: -1px;
        }

        /* Quick stats row */
        .sidebar-quick-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }

        .qs-card {
          background: #FAFAFA;
          border: 1px solid #F9FAFB;
          border-radius: 8px;
          padding: 9px 10px;
        }

        .qs-label {
          font-size: 9px;
          color: #9CA3AF;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .qs-value {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
        }

        .qs-value.gold { color: #6366F1; }
        .qs-value.green { color: #4ade80; }

        .store-live-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: rgba(74,222,128,0.05);
          border: 1px solid rgba(74,222,128,0.1);
          border-radius: 8px;
        }

        .store-live-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        .pulse-dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse-green 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(74,222,128,0); }
        }

        .store-live-uptime {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #4ade80;
          font-weight: 500;
        }

        /* ── Main Content ── */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          min-width: 0;
        }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            z-index: 200;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            width: 240px;
            min-width: 240px;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            display: block;
          }
          .mobile-header {
            display: flex;
          }
          .header {
            display: none;
          }
          .stats-row {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding: 12px;
          }
          .stat-value.gold { font-size: 28px; }
          .stat-value.green { font-size: 26px; }
          .stat-value { font-size: 26px; }
          .stat-card { padding: 14px 14px; }
          .bottom-panels { flex-direction: column; gap: 12px; padding: 0 12px 12px; }
          .chart-section { padding: 12px; }
          .revenue-chart-wrap { padding: 12px; }
          .promo-scroll { padding: 0; }
          .ticker { display: none; }
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 199;
        }

        .mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: #0c0e14;
          border-bottom: 1px solid rgba(99,102,241,0.1);
          position: relative;
          z-index: 10;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hamburger {
          background: none;
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 7px;
          width: 36px;
          height: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          padding: 0;
        }

        .hamburger span {
          display: block;
          width: 16px;
          height: 1.5px;
          background: #6366F1;
          border-radius: 2px;
        }

        .mobile-store-live {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #374151;
        }

        .main-content::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Header ── */
        .header {
          padding: 18px 28px;
          border-bottom: 1px solid rgba(99,102,241,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(5,8,16,0.95);
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 3;
        }

        .header-left {}

        .header-greeting {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }

        .header-greeting .glyph {
          color: rgba(99,102,241,0.55);
          margin-right: 8px;
          font-size: 18px;
        }

        .header-date {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(99,102,241,0.35);
          margin-top: 4px;
          letter-spacing: 0.5px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .store-live {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          color: #4ade80;
          letter-spacing: 0.5px;
        }

        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse-green 2s ease-in-out infinite;
        }

        .last-order {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(99,102,241,0.55);
          letter-spacing: 0.3px;
        }

        .notif-btn {
          position: relative;
          font-size: 16px;
          cursor: default;
        }

        .notif-badge {
          position: absolute;
          top: -4px;
          right: -6px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #6366F1;
          color: #FAFAFA;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Scrollable inner ── */
        .inner-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 22px 28px 80px;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.07) transparent;
          position: relative;
          z-index: 2;
        }

        /* ── Stat Cards ── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat-card {
          background: rgba(12,14,20,0.9);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 12px;
          padding: 20px 22px;
          position: relative;
          transition: box-shadow 0.3s;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 14px; height: 14px;
          border-top: 2px solid rgba(99,102,241,0.6);
          border-left: 2px solid rgba(99,102,241,0.6);
          border-radius: 2px 0 0 0;
        }

        .stat-card::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 14px; height: 14px;
          border-bottom: 2px solid rgba(99,102,241,0.6);
          border-right: 2px solid rgba(99,102,241,0.6);
          border-radius: 0 0 2px 0;
        }

        .stat-card.top-gold { border-top: 2px solid #6366F1; }
        .stat-card.top-green { border-top: 2px solid #4ade80; }
        .stat-card.top-cyan { border-top: 2px solid #6366F1; }
        .stat-card.top-purple { border-top: 2px solid #9d7e20; }

        .stat-card.flash {
          animation: card-flash 0.8s ease-out;
        }

        @keyframes card-flash {
          0% { box-shadow: none; }
          20% { box-shadow: 0 0 40px rgba(99,102,241,0.3); }
          100% { box-shadow: none; }
        }

        .stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #6B7280;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -1.5px;
          margin-bottom: 10px;
        }

        .stat-value.gold {
          color: #6366F1;
          font-size: 42px;
          text-shadow: 0 0 30px rgba(99,102,241,0.4);
        }
        .stat-value.green { color: #4ade80; font-size: 40px; }
        .stat-value.white { color: #ffffff; }
        .stat-value.cyan { color: #e8d5a0; }

        .stat-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.65);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-sub .positive { color: #4ade80; }
        .stat-sub .badge {
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 3px;
          padding: 1px 5px;
          font-size: 9px;
          color: #4ade80;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .stat-divider {
          height: 1px;
          background: rgba(99,102,241,0.07);
          margin: 8px 0;
        }

        .stat-secondary {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(99,102,241,0.35);
          letter-spacing: 0.3px;
        }

        /* ── Sparklines ── */
        .sparkline {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 24px;
          margin-bottom: 8px;
        }

        .spark-bar {
          flex: 1;
          border-radius: 2px;
          opacity: 0.65;
          transition: opacity 0.3s;
        }

        /* ── Section Title ── */
        .section-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          color: rgba(99,102,241,0.45);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .section-title .pulse-inline {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366F1;
          margin-left: 8px;
          vertical-align: middle;
          animation: pulse-cyan 1.5s ease-in-out infinite;
        }

        @keyframes pulse-cyan {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(99,102,241,0.45); }
          50% { opacity: 0.6; box-shadow: 0 0 0 4px rgba(99,102,241,0); }
        }

        /* ── Revenue Chart ── */
        .chart-section {
          background: rgba(5,8,16,0.8);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 16px;
          position: relative;
        }

        .chart-section::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 12px; height: 12px;
          border-top: 2px solid #6366F1;
          border-left: 2px solid #6366F1;
          border-radius: 1px 0 0 0;
        }

        .chart-section::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 12px; height: 12px;
          border-bottom: 2px solid #6366F1;
          border-right: 2px solid #6366F1;
          border-radius: 0 0 1px 0;
        }

        .chart-wrap {
          position: relative;
          height: 140px;
        }

        .chart-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /* ── Bottom Section ── */
        .bottom-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ── Orders Feed ── */
        .feed-section {
          background: rgba(5,8,16,0.8);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 10px;
          padding: 18px;
          position: relative;
        }

        .feed-section::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 12px; height: 12px;
          border-top: 2px solid #6366F1;
          border-left: 2px solid #6366F1;
          border-radius: 1px 0 0 0;
        }

        .feed-section::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 12px; height: 12px;
          border-bottom: 2px solid #6366F1;
          border-right: 2px solid #6366F1;
          border-radius: 0 0 1px 0;
        }

        .order-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .order-row {
          display: grid;
          grid-template-columns: 90px 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 9px 6px;
          border-bottom: 1px solid rgba(99,102,241,0.04);
          font-size: 12px;
          transition: background 0.2s;
        }

        .order-row:hover {
          background: rgba(99,102,241,0.03);
        }

        .order-row:last-child { border-bottom: none; }

        .order-row:first-child {
          animation: slide-in-left 0.3s ease-out;
        }

        @keyframes slide-in-left {
          from { transform: translateX(-8px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .order-id-col {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .order-glyph {
          color: #6366F1;
          font-size: 11px;
          opacity: 0.7;
          flex-shrink: 0;
        }

        .order-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(99,102,241,0.55);
        }

        .order-middle {
          min-width: 0;
        }

        .order-product {
          font-size: 12px;
          color: #1F2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-location {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(99,102,241,0.35);
          white-space: nowrap;
          margin-top: 1px;
        }

        .order-right {
          text-align: right;
          flex-shrink: 0;
        }

        .order-price {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #6366F1;
          font-weight: 600;
        }

        .order-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #9CA3AF;
          margin-top: 1px;
        }

        /* ── Top Products Table ── */
        .products-section {
          background: rgba(5,8,16,0.8);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 10px;
          padding: 18px;
          position: relative;
        }

        .products-section::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 12px; height: 12px;
          border-top: 2px solid #6366F1;
          border-left: 2px solid #6366F1;
          border-radius: 1px 0 0 0;
        }

        .products-section::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 12px; height: 12px;
          border-bottom: 2px solid #6366F1;
          border-right: 2px solid #6366F1;
          border-radius: 0 0 1px 0;
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }

        .products-table th {
          text-align: left;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 500;
          color: rgba(99,102,241,0.45);
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 0 0 10px;
          border-bottom: 1px solid rgba(99,102,241,0.07);
        }

        .products-table th:not(:first-child) { text-align: right; }

        .products-table td {
          padding: 9px 0;
          border-bottom: 1px solid rgba(99,102,241,0.03);
          color: #374151;
          vertical-align: middle;
        }

        .products-table td:not(:first-child) { text-align: right; }
        .products-table tr:last-child td { border-bottom: none; }

        .products-table tr:nth-child(even) td {
          background: rgba(99,102,241,0.02);
        }

        .prod-name {
          font-family: 'Syne', sans-serif;
          font-weight: 500;
          font-size: 12px;
          color: #e8eaed;
          max-width: 150px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .margin-pill {
          display: inline-block;
          border-radius: 3px;
          padding: 2px 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
        }

        .margin-green {
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          color: #4ade80;
        }

        .margin-cyan {
          background: rgba(99,102,241,0.07);
          border: 1px solid rgba(99,102,241,0.18);
          color: #6366F1;
        }

        .margin-amber {
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.2);
          color: #fbbf24;
        }

        .skeleton {
          display: inline-block;
          height: 11px;
          width: 40px;
          background: linear-gradient(90deg, rgba(99,102,241,0.03) 25%, rgba(99,102,241,0.1) 50%, rgba(99,102,241,0.03) 75%);
          background-size: 200% 100%;
          border-radius: 3px;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ── Toasts ── */
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 9999;
          pointer-events: none;
        }

        .toast {
          background: rgba(5,8,16,0.95);
          border: 1px solid rgba(99,102,241,0.18);
          border-left: 3px solid #6366F1;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 12.5px;
          font-weight: 500;
          color: #e8eaed;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(99,102,241,0.04);
          backdrop-filter: blur(10px);
          animation: toast-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          max-width: 300px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .toast-icon {
          color: #6366F1;
          font-size: 14px;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .toast-body {}

        .toast-msg {
          color: #1F2937;
          font-size: 12px;
        }

        .toast-price {
          font-family: 'JetBrains Mono', monospace;
          color: #6366F1;
          font-weight: 600;
          font-size: 13px;
          margin-top: 2px;
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes toast-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(60px); }
        }

        /* ── Ticker ── */
        .ticker {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 34px;
          background: rgba(99,102,241,0.05);
          border-top: 1px solid rgba(99,102,241,0.1);
          overflow: hidden;
          display: flex;
          align-items: center;
          z-index: 100;
        }

        .ticker-track {
          display: flex;
          white-space: nowrap;
          animation: ticker-scroll 35s linear infinite;
        }

        .ticker-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(99,102,241,0.55);
          padding-right: 80px;
          letter-spacing: 0.5px;
        }

        .ticker-text .gold { color: #6366F1; font-weight: 600; }
        .ticker-text .green { color: #4ade80; }

        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ── Chart bar current hour animation ── */
        .current-hour-bar {
          animation: bar-grow 1s ease-out;
          transform-origin: bottom;
        }
      `}</style>

      <div className="promo-root">
        {/* ── Toast Container ── */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              <span className="toast-icon">◈</span>
              <div className="toast-body">
                <div className="toast-msg">{t.message}</div>
                <div className="toast-price">+${fmt(t.price)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Mobile Header ── */}
        <div className="mobile-header">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <span /><span /><span />
          </button>
          <div className="mobile-logo">
            <div className="logo-icon">M</div>
            <span className="logo-name">majorka</span>
          </div>
          <div className="mobile-store-live">
            <div className="pulse-dot-green" />
            Live
          </div>
        </div>

        <div className="promo-body">
          {/* ── Sidebar overlay ── */}
          {sidebarOpen && (
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          )}

          {/* ── Sidebar ── */}
          <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>

            {/* Logo */}
            <div className="sidebar-logo">
              <div className="sidebar-logo-mark">
                <div className="logo-icon">M</div>
                <div>
                  <div className="logo-name">majorka</div>
                  <div className="logo-tagline">AI Ecommerce OS</div>
                </div>
              </div>
            </div>

            {/* User profile */}
            <div className="sidebar-profile">
              <div className="profile-avatar">MX</div>
              <div className="profile-info">
                <div className="profile-name">{nameParam}</div>
                <div className="profile-plan">Pro Member</div>
              </div>
            </div>

            {/* Live revenue card */}
            <div className="sidebar-live-revenue">
              <div className="slr-label">
                <div className="pulse-dot-green" />
                Today's Revenue
              </div>
              <div className="slr-amount">${fmt(displayRevenue)}</div>
              <div className="slr-sub">↑ +34.2% vs yesterday</div>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="nav-section">
                  <div className="nav-section-label">{section.label}</div>
                  {section.items.map((item) => (
                    <div key={item.label} className={`nav-item${item.active ? ' active' : ''}`}>
                      <div className="nav-icon-wrap">{item.icon}</div>
                      <span className="nav-label">{item.label}</span>
                      {item.badge && (
                        <span className={`nav-badge${item.badge === 'NEW' ? ' new-badge' : ''}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </nav>

            {/* Bottom stats + status */}
            <div className="sidebar-bottom">
              <div className="sidebar-quick-stats">
                <div className="qs-card">
                  <div className="qs-label">Orders</div>
                  <div className="qs-value gold">{fmtInt(displayOrders)}</div>
                </div>
                <div className="qs-card">
                  <div className="qs-label">Margin</div>
                  <div className="qs-value green">36%</div>
                </div>
                <div className="qs-card">
                  <div className="qs-label">Rating</div>
                  <div className="qs-value">4.9★</div>
                </div>
                <div className="qs-card">
                  <div className="qs-label">Returns</div>
                  <div className="qs-value">1.2%</div>
                </div>
              </div>
              <div className="store-live-row">
                <div className="store-live-label">
                  <div className="pulse-dot-green" />
                  Store Online
                </div>
                <div className="store-live-uptime">99.9% uptime</div>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="main-content">
            {/* Header */}
            <header className="header">
              <div className="header-left">
                <div className="header-greeting">
                  <span className="glyph">⬡</span>{greeting}, {nameParam}
                </div>
                <div className="header-date">{hudDate}</div>
              </div>
              <div className="header-right">
                <div className="store-live">
                  <div className="pulse-dot" />
                  STORE ONLINE
                </div>
                <div className="last-order">
                  ◈ LAST ORDER: {lastOrderSec === 0 ? 'just now' : `${lastOrderSec}s ago`}
                </div>
                <div className="notif-btn">
                  🔔
                  <span className="notif-badge">3</span>
                </div>
              </div>
            </header>

            {/* Scrollable content */}
            <div className="inner-scroll">
              {/* Stat Cards */}
              <div className="stats-row">
                {/* Card 1 — Revenue */}
                <div className={`stat-card top-gold${flashCard === 'revenue' ? ' flash' : ''}`}>
                  <div className="stat-label">Daily Revenue</div>
                  <div className="stat-value gold">${fmt(displayRevenue)}</div>
                  <div className="stat-sub">
                    <span className="positive">↑ +34.2% vs yesterday</span>
                  </div>
                  <div className="sparkline">
                    {[40, 55, 35, 65, 50, 80, 70].map((h, i) => (
                      <div key={i} className="spark-bar" style={{ height: `${h}%`, background: '#6366F1' }} />
                    ))}
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-secondary">AOV ${fmt(aov)} · {fmtInt(displayOrders)} orders</div>
                </div>

                {/* Card 2 — Profit */}
                <div className="stat-card top-green">
                  <div className="stat-label">Net Profit</div>
                  <div className="stat-value green">${fmt(displayProfit)}</div>
                  <div className="stat-sub">
                    <span className="badge">36.0% margin</span>
                  </div>
                  <div className="sparkline">
                    {[35, 50, 30, 60, 45, 75, 65].map((h, i) => (
                      <div key={i} className="spark-bar" style={{ height: `${h}%`, background: '#4ade80' }} />
                    ))}
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-secondary">After COGS + fees</div>
                </div>

                {/* Card 3 — Orders */}
                <div className="stat-card top-cyan">
                  <div className="stat-label">Orders Fulfilled</div>
                  <div className="stat-value cyan">{fmtInt(displayOrders)}</div>
                  <div className="stat-sub">
                    <span className="positive">↑ 48 since 9am</span>
                  </div>
                  <div className="sparkline">
                    {[30, 45, 40, 55, 50, 65, 75].map((h, i) => (
                      <div key={i} className="spark-bar" style={{ height: `${h}%`, background: '#6366F1' }} />
                    ))}
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-secondary">All shipped on time</div>
                </div>

                {/* Card 4 — Items Shipped */}
                <div className="stat-card top-purple">
                  <div className="stat-label">Items Shipped</div>
                  <div className="stat-value white">{fmtInt(displayItems)}</div>
                  <div className="stat-sub">
                    via AusPost + Sendle
                  </div>
                  <div className="sparkline">
                    {[25, 40, 35, 50, 55, 60, 80].map((h, i) => (
                      <div key={i} className="spark-bar" style={{ height: `${h}%`, background: '#b8962e' }} />
                    ))}
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-secondary">AU-wide coverage</div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="chart-section">
                <div className="section-title">◈ REVENUE STREAM · TODAY</div>
                <div className="chart-wrap">
                  <svg className="chart-svg" viewBox="0 0 840 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(99,102,241,0.55)" />
                        <stop offset="100%" stopColor="rgba(99,102,241,0.12)" />
                      </linearGradient>
                      <linearGradient id="barGradCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="rgba(99,102,241,0.5)" />
                      </linearGradient>
                      <filter id="peakGlow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>

                    {/* Y-axis gridlines */}
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={i}
                        x1="0" x2="840"
                        y1={i * 30} y2={i * 30}
                        stroke="#F9FAFB"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Bars */}
                    {HOURLY_REVENUE.map((val, hour) => {
                      const barWidth = 30;
                      const gap = 5;
                      const x = hour * (barWidth + gap);
                      const isCurrentHour = hour === currentHour;
                      const isPeakHour = hour === peakHour;
                      const effectiveVal = isCurrentHour ? val * currentHourProgress : val;
                      const heightPct = effectiveVal / maxBarHeight;
                      const barH = Math.max(heightPct * 100, 2);

                      return (
                        <g key={hour}>
                          {isPeakHour && (
                            <text
                              x={x + barWidth / 2}
                              y={100 - barH - 5}
                              textAnchor="middle"
                              fontSize="7"
                              fill="#6366F1"
                              fontFamily="JetBrains Mono, monospace"
                              filter="url(#peakGlow)"
                            >
                              ▲ PEAK
                            </text>
                          )}
                          <rect
                            x={x}
                            y={100 - barH}
                            width={barWidth}
                            height={barH}
                            rx="2"
                            fill={isCurrentHour ? 'url(#barGradCurrent)' : 'url(#barGrad)'}
                            className={isCurrentHour ? 'current-hour-bar' : ''}
                          />
                          {hour % 3 === 0 && (
                            <text
                              x={x + barWidth / 2}
                              y="118"
                              textAnchor="middle"
                              fontSize="8"
                              fill="rgba(99,102,241,0.25)"
                              fontFamily="JetBrains Mono, monospace"
                            >
                              {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="bottom-section">
                {/* Live Orders Feed */}
                <div className="feed-section">
                  <div className="section-title">
                    ◈ LIVE ORDER STREAM
                    <span className="pulse-inline" />
                  </div>
                  <div className="order-list">
                    {orders_feed.map((order) => (
                      <div key={order.id} className="order-row">
                        <div className="order-id-col">
                          <span className="order-glyph">◈</span>
                          <span className="order-id">{order.id}</span>
                        </div>
                        <div className="order-middle">
                          <div className="order-product">{order.product}</div>
                          <div className="order-location">{order.location}</div>
                        </div>
                        <div className="order-right">
                          <div className="order-price">${fmt(order.price)}</div>
                          <div className="order-time">{relativeTime(order.timestamp, now)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Products */}
                <div className="products-section">
                  <div className="section-title">◈ PRODUCT PERFORMANCE</div>
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Units</th>
                        <th>Revenue</th>
                        <th>Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOP_PRODUCTS.map((p) => (
                        <tr key={p.name}>
                          <td className="prod-name" title={p.name}>{p.name}</td>
                          <td>
                            {p.units !== null ? (
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6366F1', fontSize: 11 }}>{p.units}</span>
                            ) : (
                              <span className="skeleton" />
                            )}
                          </td>
                          <td>
                            {p.revenue !== null ? (
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6366F1', fontWeight: 600, fontSize: 11 }}>${fmt(p.revenue)}</span>
                            ) : (
                              <span className="skeleton" />
                            )}
                          </td>
                          <td>
                            {p.margin !== null ? (
                              <span className={`margin-pill ${p.margin > 40 ? 'margin-green' : p.margin > 30 ? 'margin-cyan' : 'margin-amber'}`}>
                                {p.margin}%
                              </span>
                            ) : (
                              <span className="skeleton" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* ── Ticker ── */}
        <div className="ticker">
          <div className="ticker-track">
            {[0, 1].map((i) => (
              <span key={i} className="ticker-text">
                ◈ <span className="green">{fmtInt(orders)} orders</span> fulfilled today&nbsp;&nbsp;
                ◈ All shipments on time&nbsp;&nbsp;
                ◈ <span className="gold">${fmt(profit)}</span> profit today&nbsp;&nbsp;
                ◈ 4.9★ average store rating&nbsp;&nbsp;
                ◈ Shipping Australia-wide&nbsp;&nbsp;
                ◈ majorka.io&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
