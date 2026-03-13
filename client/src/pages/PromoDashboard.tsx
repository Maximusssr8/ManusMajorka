import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  product: string;
  price: number;
  location: string;
  timestamp: number; // ms since epoch when order was created
}

interface Toast {
  id: string;
  message: string;
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

const NAV_ITEMS = [
  { icon: '📊', label: 'Overview', active: true },
  { icon: '🛒', label: 'Orders', active: false },
  { icon: '📦', label: 'Products', active: false },
  { icon: '💰', label: 'Payouts', active: false },
  { icon: '📈', label: 'Analytics', active: false },
  { icon: '🎯', label: 'Ads', active: false },
  { icon: '⚙️', label: 'Settings', active: false },
];

const TOP_PRODUCTS = [
  { name: 'Posture Corrector Belt', units: 32, revenue: 1439.68, margin: 38 },
  { name: 'Dog Lick Mat Slow Feeder', units: 28, revenue: 699.72, margin: 41 },
  { name: 'Portable Blender Bottle', units: 19, revenue: 759.81, margin: 34 },
  { name: 'LED Strip Lights USB', units: 15, revenue: 284.85, margin: 52 },
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

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
      // ease out cubic
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
  // URL params
  const params = new URLSearchParams(window.location.search);
  const nameParam = params.get('name') || 'Alex';
  const revenueParam = params.get('revenue') ? parseFloat(params.get('revenue')!) : 4847.2;
  const ordersParam = params.get('orders') ? parseInt(params.get('orders')!) : 94;

  // Live state
  const [revenue, setRevenue] = useState(revenueParam);
  const [profit, setProfit] = useState(revenueParam * 0.36);
  const [orders, setOrders] = useState(ordersParam);
  const [items, setItems] = useState(127 + (ordersParam - 94));
  const [flashCard, setFlashCard] = useState<string | null>(null);
  const [orders_feed, setOrdersFeed] = useState<Order[]>(() => {
    // Pre-populate with some fake old orders
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

  // Animated display values
  const displayRevenue = useAnimatedNumber(revenue, 800);
  const displayProfit = useAnimatedNumber(profit, 800);
  const displayOrders = useAnimatedNumber(orders, 600);
  const displayItems = useAnimatedNumber(items, 600);

  // Tick timer — updates "X seconds ago" every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      setLastOrderSec((s) => s + 1);
      // Update current hour bar progress
      const d = new Date();
      setCurrentHourProgress(d.getMinutes() / 60);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Order simulator
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const fireOrder = () => {
      const delay = randBetween(8000, 12000);

      timeout = setTimeout(() => {
        const addRevenue = randBetween(32, 95);
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

        // Flash cards
        setFlashCard('revenue');
        setTimeout(() => setFlashCard(null), 800);

        // Toast
        const toastId = String(Date.now());
        const toastMsg = `🛒 New order from ${location} — $${fmt(addRevenue)}`;
        setToasts((prev) => [...prev, { id: toastId, message: toastMsg, createdAt: Date.now() }]);
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

  const greetingHour = today.getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const tickerText =
    `🔥 ${fmtInt(orders)} orders fulfilled today · 📦 All shipments on time · 💰 $${fmt(profit)} profit today · 🌟 4.9★ average store rating · 🇦🇺 Shipping Australia-wide · 🚀 majorka.io`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .promo-root {
          font-family: 'DM Sans', sans-serif;
          background: #080a0e;
          color: #e8eaed;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .promo-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 240px;
          min-width: 240px;
          background: #0c0e14;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .sidebar-logo {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .sidebar-logo-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #d4af37, #f0c040);
          color: #080a0e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 900;
          font-size: 16px;
        }

        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .sidebar-label {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          cursor: default;
          font-size: 14px;
          color: rgba(255,255,255,0.45);
          transition: color 0.2s;
          border-left: 3px solid transparent;
          user-select: none;
        }

        .nav-item.active {
          color: #d4af37;
          border-left-color: #d4af37;
          background: rgba(212,175,55,0.06);
        }

        .nav-item:not(.active):hover {
          color: rgba(255,255,255,0.7);
        }

        .nav-icon { font-size: 15px; }

        .sidebar-bottom {
          padding: 16px 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .pro-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(212,175,55,0.12);
          border: 1px solid rgba(212,175,55,0.3);
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #d4af37;
          margin-bottom: 8px;
        }

        .sidebar-domain {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
        }

        /* ── Main Content ── */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── Header ── */
        .header {
          padding: 20px 28px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #080a0e;
        }

        .header-left {}

        .header-greeting {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }

        .header-date {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin-top: 3px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .store-live {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 500;
          color: #4ade80;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse-green 2s ease-in-out infinite;
        }

        @keyframes pulse-green {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          50% { opacity: 0.8; transform: scale(1.15); box-shadow: 0 0 0 5px rgba(74,222,128,0); }
        }

        .last-order {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          padding: 5px 10px;
        }

        /* ── Scrollable inner ── */
        .inner-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px 80px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }

        /* ── Stat Cards ── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
          transition: border-color 0.3s;
        }

        .stat-card.flash {
          animation: card-flash 0.8s ease-out;
        }

        @keyframes card-flash {
          0% { border-color: rgba(255,255,255,0.08); box-shadow: none; }
          20% { border-color: #d4af37; box-shadow: 0 0 20px rgba(212,175,55,0.25); }
          100% { border-color: rgba(255,255,255,0.08); box-shadow: none; }
        }

        .stat-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .stat-value.gold { color: #d4af37; font-size: 42px; }
        .stat-value.green { color: #4ade80; }
        .stat-value.white { color: #ffffff; }

        .stat-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-sub .positive { color: #4ade80; }
        .stat-sub .badge {
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          color: #4ade80;
        }

        /* ── Sparklines ── */
        .sparkline {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 28px;
          margin-top: 6px;
        }

        .spark-bar {
          flex: 1;
          border-radius: 2px;
          opacity: 0.7;
        }

        /* ── Revenue Chart ── */
        .chart-section {
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
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
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
        }

        .order-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .order-row {
          display: grid;
          grid-template-columns: 80px 1fr auto auto;
          gap: 10px;
          align-items: center;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 12.5px;
          transition: all 0.3s ease;
        }

        .order-row:last-child { border-bottom: none; }
        .order-row:first-child { animation: slide-in 0.3s ease-out; }

        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .order-id {
          font-family: 'DM Sans', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }

        .order-product {
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-location {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          white-space: nowrap;
        }

        .order-status {
          font-size: 11px;
          color: #4ade80;
          white-space: nowrap;
        }

        .order-time {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          white-space: nowrap;
          text-align: right;
        }

        /* ── Top Products Table ── */
        .products-section {
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .products-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 0 0 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .products-table th:not(:first-child) { text-align: right; }

        .products-table td {
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75);
          vertical-align: middle;
        }

        .products-table td:not(:first-child) { text-align: right; }
        .products-table tr:last-child td { border-bottom: none; }

        .prod-name {
          font-weight: 500;
          color: #e8eaed;
          max-width: 150px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .margin-pill {
          display: inline-block;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 4px;
          padding: 2px 7px;
          font-size: 11px;
          color: #4ade80;
          font-weight: 600;
        }

        .skeleton {
          display: inline-block;
          height: 12px;
          width: 40px;
          background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 75%);
          background-size: 200% 100%;
          border-radius: 4px;
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
          background: #161a22;
          border: 1px solid rgba(212,175,55,0.3);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #e8eaed;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: toast-in 0.3s ease-out forwards;
          max-width: 300px;
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .toast.dismissing {
          animation: toast-out 0.3s ease-in forwards;
        }

        @keyframes toast-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(40px); }
        }

        /* ── Ticker ── */
        .ticker {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 36px;
          background: #0c0e14;
          border-top: 1px solid rgba(255,255,255,0.06);
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
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          padding-right: 80px;
          letter-spacing: 0.3px;
        }

        .ticker-text .gold { color: #d4af37; }
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
              {t.message}
            </div>
          ))}
        </div>

        <div className="promo-body">
          {/* ── Sidebar ── */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="sidebar-logo-mark">
                <div className="logo-icon">M</div>
                <span className="logo-name">majorka</span>
              </div>
              <div className="sidebar-label">Seller Dashboard</div>
            </div>

            <nav className="sidebar-nav">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={`nav-item${item.active ? ' active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>

            <div className="sidebar-bottom">
              <div className="pro-badge">
                ✦ Pro Plan
              </div>
              <div className="sidebar-domain">majorka.io</div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="main-content">
            {/* Header */}
            <header className="header">
              <div className="header-left">
                <div className="header-greeting">
                  {greeting}, {nameParam} 👋
                </div>
                <div className="header-date">{formatDate(today)}</div>
              </div>
              <div className="header-right">
                <div className="store-live">
                  <div className="pulse-dot" />
                  Store Live
                </div>
                <div className="last-order">
                  Last order: {lastOrderSec === 0 ? 'just now' : `${lastOrderSec}s ago`}
                </div>
              </div>
            </header>

            {/* Scrollable content */}
            <div className="inner-scroll">
              {/* Stat Cards */}
              <div className="stats-row">
                {/* Card 1 — Revenue */}
                <div className={`stat-card${flashCard === 'revenue' ? ' flash' : ''}`}>
                  <div className="stat-label">Today's Revenue</div>
                  <div className="stat-value gold">${fmt(displayRevenue)}</div>
                  <div className="stat-sub">
                    <span className="positive">▲ +34%</span> vs yesterday
                  </div>
                  <div className="sparkline">
                    {[40, 55, 35, 65, 50, 80, 70].map((h, i) => (
                      <div
                        key={i}
                        className="spark-bar"
                        style={{ height: `${h}%`, background: '#d4af37' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Card 2 — Profit */}
                <div className="stat-card">
                  <div className="stat-label">Net Profit</div>
                  <div className="stat-value green">${fmt(displayProfit)}</div>
                  <div className="stat-sub">
                    <span className="badge">36.0% margin</span>
                  </div>
                  <div className="sparkline">
                    {[35, 50, 30, 60, 45, 75, 65].map((h, i) => (
                      <div
                        key={i}
                        className="spark-bar"
                        style={{ height: `${h}%`, background: '#4ade80' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Card 3 — Orders */}
                <div className="stat-card">
                  <div className="stat-label">Orders Fulfilled</div>
                  <div className="stat-value white">{fmtInt(displayOrders)}</div>
                  <div className="stat-sub">
                    <span className="positive">↑12</span> since 9am
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                    📦 All shipped on time
                  </div>
                </div>

                {/* Card 4 — Items Shipped */}
                <div className="stat-card">
                  <div className="stat-label">Items Shipped</div>
                  <div className="stat-value white">{fmtInt(displayItems)}</div>
                  <div className="stat-sub">
                    via AusPost + Sendle
                  </div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="chart-section">
                <div className="section-title">Hourly Revenue — Today</div>
                <div className="chart-wrap">
                  <svg className="chart-svg" viewBox="0 0 840 120" preserveAspectRatio="none">
                    {/* Y-axis gridlines */}
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={i}
                        x1="0"
                        x2="840"
                        y1={i * 30}
                        y2={i * 30}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Bars */}
                    {HOURLY_REVENUE.map((val, hour) => {
                      const barWidth = 30;
                      const gap = 5;
                      const x = hour * (barWidth + gap);
                      const isCurrentHour = hour === currentHour;
                      const effectiveVal = isCurrentHour ? val * currentHourProgress : val;
                      const heightPct = effectiveVal / maxBarHeight;
                      const barH = Math.max(heightPct * 100, 2);

                      return (
                        <g key={hour}>
                          <rect
                            x={x}
                            y={100 - barH}
                            width={barWidth}
                            height={barH}
                            rx="2"
                            fill={isCurrentHour ? '#d4af37' : 'rgba(212,175,55,0.45)'}
                            className={isCurrentHour ? 'current-hour-bar' : ''}
                          />
                          {hour % 3 === 0 && (
                            <text
                              x={x + barWidth / 2}
                              y="118"
                              textAnchor="middle"
                              fontSize="8"
                              fill="rgba(255,255,255,0.25)"
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
                  <div className="section-title">Live Orders</div>
                  <div className="order-list">
                    {orders_feed.map((order) => (
                      <div key={order.id} className="order-row">
                        <span className="order-id">{order.id}</span>
                        <span className="order-product">{order.product}</span>
                        <span className="order-location">{order.location}</span>
                        <span className="order-status">✅ Fulfilled</span>
                        <span className="order-time">{relativeTime(order.timestamp, now)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Products */}
                <div className="products-section">
                  <div className="section-title">Top Products Today</div>
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
                              <span style={{ color: '#e8eaed' }}>{p.units}</span>
                            ) : (
                              <span className="skeleton" />
                            )}
                          </td>
                          <td>
                            {p.revenue !== null ? (
                              <span style={{ color: '#d4af37', fontWeight: 600 }}>${fmt(p.revenue)}</span>
                            ) : (
                              <span className="skeleton" />
                            )}
                          </td>
                          <td>
                            {p.margin !== null ? (
                              <span className="margin-pill">{p.margin}%</span>
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
            {/* Duplicate for seamless loop */}
            {[0, 1].map((i) => (
              <span key={i} className="ticker-text">
                🔥 {fmtInt(orders)} orders fulfilled today&nbsp;&nbsp;·&nbsp;&nbsp;
                📦 All shipments on time&nbsp;&nbsp;·&nbsp;&nbsp;
                💰 ${fmt(profit)} profit today&nbsp;&nbsp;·&nbsp;&nbsp;
                🌟 4.9★ average store rating&nbsp;&nbsp;·&nbsp;&nbsp;
                🇦🇺 Shipping Australia-wide&nbsp;&nbsp;·&nbsp;&nbsp;
                🚀 majorka.io&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
