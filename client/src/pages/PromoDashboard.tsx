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
          background: #030508;
          background-image: radial-gradient(circle, rgba(0,212,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          color: #e8eaed;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .promo-root::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
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
          background: #050810;
          border-right: 1px solid rgba(0,212,255,0.1);
          box-shadow: inset -1px 0 0 rgba(0,212,255,0.08);
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .sidebar-logo {
          padding: 22px 18px 16px;
          border-bottom: 1px solid rgba(0,212,255,0.08);
        }

        .sidebar-logo-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          color: #030508;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 16px;
          box-shadow: 0 0 20px rgba(0,212,255,0.3);
          flex-shrink: 0;
        }

        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 17px;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .sidebar-sublabel {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(0,212,255,0.5);
          letter-spacing: 2px;
          text-transform: uppercase;
          padding-left: 46px;
          margin-top: 1px;
        }

        .sidebar-status {
          padding: 10px 18px;
          border-bottom: 1px solid rgba(0,212,255,0.06);
        }

        .status-operational {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #4ade80;
          margin-bottom: 4px;
        }

        .status-streams {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(0,212,255,0.35);
        }

        .pulse-dot-green {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse-green 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes pulse-green {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          50% { opacity: 0.8; transform: scale(1.2); box-shadow: 0 0 0 4px rgba(74,222,128,0); }
        }

        .sidebar-nav {
          flex: 1;
          padding: 12px 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,212,255,0.08) transparent;
        }

        .nav-section {
          margin-bottom: 6px;
        }

        .nav-section-label {
          padding: 10px 18px 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2px;
          color: rgba(0,212,255,0.3);
          text-transform: uppercase;
          user-select: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 18px;
          cursor: default;
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,0.3);
          transition: all 0.15s;
          border-left: 2px solid transparent;
          user-select: none;
          position: relative;
          margin: 1px 8px 1px 0;
        }

        .nav-item.active {
          color: #00d4ff;
          background: rgba(0,212,255,0.08);
          border-left: 2px solid #00d4ff;
          font-weight: 500;
        }

        .nav-item:not(.active):hover {
          color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.03);
        }

        .nav-icon {
          font-size: 12px;
          width: 18px;
          text-align: center;
          opacity: 0.7;
          flex-shrink: 0;
        }

        .nav-item.active .nav-icon { opacity: 1; }

        .nav-badge {
          margin-left: auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 10px;
          background: rgba(0,212,255,0.12);
          color: #00d4ff;
          border: 1px solid rgba(0,212,255,0.2);
        }

        .nav-badge.new-badge {
          background: rgba(74,222,128,0.1);
          color: #4ade80;
          border-color: rgba(74,222,128,0.2);
        }

        .sidebar-bottom {
          padding: 14px 16px;
          border-top: 1px solid rgba(0,212,255,0.08);
        }

        .store-health {
          background: rgba(0,212,255,0.04);
          border: 1px solid rgba(0,212,255,0.12);
          border-radius: 8px;
          padding: 11px 13px;
          margin-bottom: 10px;
          position: relative;
        }

        .store-health::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 10px; height: 10px;
          border-top: 1px solid #00d4ff;
          border-left: 1px solid #00d4ff;
        }

        .store-health::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 10px; height: 10px;
          border-bottom: 1px solid #00d4ff;
          border-right: 1px solid #00d4ff;
        }

        .store-health-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .store-health-title {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .store-health-score {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #00d4ff;
        }

        .health-bar-bg {
          height: 3px;
          background: rgba(0,212,255,0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 7px;
        }

        .health-bar-fill {
          height: 100%;
          width: 92%;
          background: linear-gradient(90deg, #00d4ff, #7c3aed);
          border-radius: 2px;
        }

        .health-stats {
          display: flex;
          gap: 10px;
        }

        .health-stat {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.25);
        }

        .health-stat span {
          color: rgba(0,212,255,0.7);
          font-weight: 600;
        }

        .pro-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1));
          border: 1px solid rgba(0,212,255,0.2);
          border-radius: 7px;
          padding: 8px 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #00d4ff;
        }

        .pro-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 6px rgba(74,222,128,0.8);
          flex-shrink: 0;
        }

        .pro-badge-right {
          margin-left: auto;
          font-size: 9px;
          color: rgba(0,212,255,0.45);
          letter-spacing: 1px;
        }

        /* ── Main Content ── */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .main-content::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Header ── */
        .header {
          padding: 18px 28px;
          border-bottom: 1px solid rgba(0,212,255,0.1);
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
          color: rgba(0,212,255,0.6);
          margin-right: 8px;
          font-size: 18px;
        }

        .header-date {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(0,212,255,0.4);
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
          color: rgba(0,212,255,0.6);
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
          background: #00d4ff;
          color: #030508;
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
          scrollbar-color: rgba(0,212,255,0.08) transparent;
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
          background: rgba(5,8,16,0.8);
          border: 1px solid rgba(0,212,255,0.1);
          border-radius: 10px;
          padding: 18px;
          position: relative;
          transition: box-shadow 0.3s;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 12px; height: 12px;
          border-top: 2px solid #00d4ff;
          border-left: 2px solid #00d4ff;
          border-radius: 1px 0 0 0;
        }

        .stat-card::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 12px; height: 12px;
          border-bottom: 2px solid #00d4ff;
          border-right: 2px solid #00d4ff;
          border-radius: 0 0 1px 0;
        }

        .stat-card.top-gold { border-top: 2px solid #d4af37; }
        .stat-card.top-green { border-top: 2px solid #4ade80; }
        .stat-card.top-cyan { border-top: 2px solid #00d4ff; }
        .stat-card.top-purple { border-top: 2px solid #7c3aed; }

        .stat-card.flash {
          animation: card-flash 0.8s ease-out;
        }

        @keyframes card-flash {
          0% { box-shadow: none; }
          20% { box-shadow: 0 0 30px rgba(0,212,255,0.3); }
          100% { box-shadow: none; }
        }

        .stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 500;
          color: rgba(0,212,255,0.6);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .stat-label::before {
          content: '▸ ';
          color: rgba(0,212,255,0.4);
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .stat-value.gold { color: #d4af37; font-size: 36px; }
        .stat-value.green { color: #4ade80; }
        .stat-value.white { color: #ffffff; }
        .stat-value.cyan { color: #00d4ff; }

        .stat-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.3);
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
          background: rgba(0,212,255,0.08);
          margin: 8px 0;
        }

        .stat-secondary {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(0,212,255,0.4);
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
          color: rgba(0,212,255,0.5);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .section-title .pulse-inline {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00d4ff;
          margin-left: 8px;
          vertical-align: middle;
          animation: pulse-cyan 1.5s ease-in-out infinite;
        }

        @keyframes pulse-cyan {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,212,255,0.5); }
          50% { opacity: 0.6; box-shadow: 0 0 0 4px rgba(0,212,255,0); }
        }

        /* ── Revenue Chart ── */
        .chart-section {
          background: rgba(5,8,16,0.8);
          border: 1px solid rgba(0,212,255,0.1);
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
          border-top: 2px solid #00d4ff;
          border-left: 2px solid #00d4ff;
          border-radius: 1px 0 0 0;
        }

        .chart-section::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 12px; height: 12px;
          border-bottom: 2px solid #00d4ff;
          border-right: 2px solid #00d4ff;
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
          border: 1px solid rgba(0,212,255,0.1);
          border-radius: 10px;
          padding: 18px;
          position: relative;
        }

        .feed-section::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 12px; height: 12px;
          border-top: 2px solid #00d4ff;
          border-left: 2px solid #00d4ff;
          border-radius: 1px 0 0 0;
        }

        .feed-section::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 12px; height: 12px;
          border-bottom: 2px solid #00d4ff;
          border-right: 2px solid #00d4ff;
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
          border-bottom: 1px solid rgba(0,212,255,0.06);
          font-size: 12px;
          transition: background 0.2s;
        }

        .order-row:hover {
          background: rgba(0,212,255,0.03);
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
          color: #00d4ff;
          font-size: 11px;
          opacity: 0.7;
          flex-shrink: 0;
        }

        .order-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(0,212,255,0.6);
        }

        .order-middle {
          min-width: 0;
        }

        .order-product {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-location {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(0,212,255,0.35);
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
          color: #d4af37;
          font-weight: 600;
        }

        .order-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.2);
          margin-top: 1px;
        }

        /* ── Top Products Table ── */
        .products-section {
          background: rgba(5,8,16,0.8);
          border: 1px solid rgba(0,212,255,0.1);
          border-radius: 10px;
          padding: 18px;
          position: relative;
        }

        .products-section::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 12px; height: 12px;
          border-top: 2px solid #00d4ff;
          border-left: 2px solid #00d4ff;
          border-radius: 1px 0 0 0;
        }

        .products-section::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 12px; height: 12px;
          border-bottom: 2px solid #00d4ff;
          border-right: 2px solid #00d4ff;
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
          color: rgba(0,212,255,0.5);
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 0 0 10px;
          border-bottom: 1px solid rgba(0,212,255,0.08);
        }

        .products-table th:not(:first-child) { text-align: right; }

        .products-table td {
          padding: 9px 0;
          border-bottom: 1px solid rgba(0,212,255,0.04);
          color: rgba(255,255,255,0.7);
          vertical-align: middle;
        }

        .products-table td:not(:first-child) { text-align: right; }
        .products-table tr:last-child td { border-bottom: none; }

        .products-table tr:nth-child(even) td {
          background: rgba(0,212,255,0.02);
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
          background: rgba(0,212,255,0.08);
          border: 1px solid rgba(0,212,255,0.2);
          color: #00d4ff;
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
          background: linear-gradient(90deg, rgba(0,212,255,0.04) 25%, rgba(0,212,255,0.1) 50%, rgba(0,212,255,0.04) 75%);
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
          border: 1px solid rgba(0,212,255,0.2);
          border-left: 3px solid #00d4ff;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 12.5px;
          font-weight: 500;
          color: #e8eaed;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,212,255,0.06);
          backdrop-filter: blur(10px);
          animation: toast-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          max-width: 300px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .toast-icon {
          color: #00d4ff;
          font-size: 14px;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .toast-body {}

        .toast-msg {
          color: rgba(255,255,255,0.8);
          font-size: 12px;
        }

        .toast-price {
          font-family: 'JetBrains Mono', monospace;
          color: #d4af37;
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
          background: rgba(0,212,255,0.05);
          border-top: 1px solid rgba(0,212,255,0.1);
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
          color: rgba(0,212,255,0.6);
          padding-right: 80px;
          letter-spacing: 0.5px;
        }

        .ticker-text .gold { color: #d4af37; font-weight: 600; }
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

        <div className="promo-body">
          {/* ── Sidebar ── */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="sidebar-logo-mark">
                <div className="logo-icon">M</div>
                <span className="logo-name">majorka</span>
              </div>
              <div className="sidebar-sublabel">Command Center</div>
            </div>

            <div className="sidebar-status">
              <div className="status-operational">
                <div className="pulse-dot-green" />
                SYSTEMS OPERATIONAL
              </div>
              <div className="status-streams">
                ◈ 3 active data streams
              </div>
            </div>

            <nav className="sidebar-nav">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="nav-section">
                  <div className="nav-section-label">{section.label}</div>
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className={`nav-item${item.active ? ' active' : ''}`}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span>{item.label}</span>
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

            <div className="sidebar-bottom">
              <div className="store-health">
                <div className="store-health-row">
                  <span className="store-health-title">Store Health</span>
                  <span className="store-health-score">92/100</span>
                </div>
                <div className="health-bar-bg"><div className="health-bar-fill" /></div>
                <div className="health-stats">
                  <span className="health-stat">Listings <span>23</span></span>
                  <span className="health-stat">Returns <span>1.2%</span></span>
                  <span className="health-stat">Rating <span>4.9★</span></span>
                </div>
              </div>
              <div className="pro-badge">
                <div className="pro-dot" />
                PRO ACTIVE
                <span className="pro-badge-right">majorka.io</span>
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
                      <div key={i} className="spark-bar" style={{ height: `${h}%`, background: '#d4af37' }} />
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
                      <div key={i} className="spark-bar" style={{ height: `${h}%`, background: '#00d4ff' }} />
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
                      <div key={i} className="spark-bar" style={{ height: `${h}%`, background: '#7c3aed' }} />
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
                        <stop offset="0%" stopColor="rgba(0,212,255,0.6)" />
                        <stop offset="100%" stopColor="rgba(0,212,255,0.15)" />
                      </linearGradient>
                      <linearGradient id="barGradCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="rgba(212,175,55,0.3)" />
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
                              fill="#d4af37"
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
                              fill="rgba(0,212,255,0.3)"
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
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00d4ff', fontSize: 11 }}>{p.units}</span>
                            ) : (
                              <span className="skeleton" />
                            )}
                          </td>
                          <td>
                            {p.revenue !== null ? (
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#d4af37', fontWeight: 600, fontSize: 11 }}>${fmt(p.revenue)}</span>
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
