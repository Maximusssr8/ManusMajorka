/**
 * MajorkaAppShell — premium 240px sidebar + mobile bottom tab bar.
 * Sidebar: phase-based (Discover / Build / Spy) with collapsible sections.
 */

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Calculator,
  ChevronDown,
  CreditCard,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Eye,
  Flame,
  Globe,
  Radio,
  GraduationCap,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  Package,
  PenTool,
  Play,
  Search,
  Settings,
  Shield,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/_core/hooks/useAuth';
import MarketSelector from '@/components/MarketSelector';
import { RegionSelector } from '@/components/RegionSelector';
// SocialProofTicker removed — felt cheap/spammy
import { BEGINNER_LABELS, BEGINNER_TOOLTIPS, useBeginnerMode } from '@/hooks/useBeginnerMode';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { allTools } from '@/lib/tools';
import { trpc } from '@/lib/trpc';
import { FREE_LESSON_IDS, TOTAL_FREE } from '@/pages/LearnHub';
import { CommandPalette } from '@/components/CommandPalette';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
  icon: any;
  badge?: string;
  tooltip?: string;
}

interface PhaseSection {
  id: string;
  phaseNum: number;
  label: string;
  color: string;
  items: NavItem[];
}

// ── Nav structure — 6-section sidebar ─────────────────────────────────────────

interface NavSection {
  label?: string;
  items: NavItem[];
}

// ── Inline SVG icons (15×15, no emoji, no Lucide dep for nav) ─────────────────
const SvgHome = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const SvgProducts = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const SvgMarket = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const SvgCreators = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const SvgAdBrief = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const SvgCompetitor = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const SvgAlerts = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const SvgMaya = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const SvgStore = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>;
const SvgAdsStudio = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M11 13l9-9"/><path d="M15 3h6v6"/></svg>;
const SvgAdsManager = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SvgProfit = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>;
const SvgRevenue = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const SvgAcademy = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const SvgSettings = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const SvgAdmin = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

// ── Sidebar nav — 4 labeled groups ───────────────────────────────────────────
const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Intelligence',
    items: [
      { label: 'Home', path: '/app', exact: true, icon: SvgHome, tooltip: 'Your dashboard — activity, top products, quick access.' },
      { label: 'Products', path: '/app/product-intelligence', icon: SvgProducts, tooltip: 'Find winning products — trending, database, AI scout.' },
      { label: 'Market', path: '/app/market', icon: SvgMarket, tooltip: 'Category trends, niche demand data, and market-level signals.' },
      { label: 'Creators & Video', path: '/app/creators', icon: SvgCreators, tooltip: 'Top TikTok creators and highest-performing product videos.' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { label: 'Maya AI', path: '/app/ai-chat', icon: SvgMaya, badge: 'AI', tooltip: 'Your AI ecommerce advisor — ask anything.' },
      { label: 'Ads Studio', path: '/app/ads-studio', icon: SvgAdsStudio, badge: 'AI', tooltip: 'Generate Meta and TikTok ad creatives with Maya.' },
      { label: 'Ad Briefs', path: '/app/ad-spy', icon: SvgAdBrief, tooltip: 'Generate ad briefs and discover winning ad angles.' },
      { label: 'Store Builder', path: '/app/store-builder', icon: SvgStore, badge: 'AI', tooltip: 'Build a Shopify-ready store in 60 seconds.' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Alerts', path: '/app/alerts', icon: SvgAlerts, tooltip: 'Smart alerts for trending products, price drops, and competitor moves.' },
      { label: 'Competitor Spy', path: '/app/competitor-spy', icon: SvgCompetitor, tooltip: 'Analyse competitor stores, pricing strategy, and product selection.' },
      { label: 'Revenue', path: '/app/revenue', icon: SvgRevenue, tooltip: 'Track your store earnings and order revenue.' },
      { label: 'Profit Calc', path: '/app/profit', icon: SvgProfit, tooltip: 'Model unit economics, margins and break-even CPA.' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Academy', path: '/app/learn', icon: SvgAcademy, tooltip: 'Dropshipping courses and tutorials.' },
      { label: 'Settings', path: '/app/settings', icon: SvgSettings, tooltip: 'Account settings, plan, and billing.' },
    ],
  },
];

// Legacy constants kept for compatibility
const PHASE_SECTIONS: PhaseSection[] = [];

const MOBILE_TABS: NavItem[] = [
  { label: 'Home', path: '/app', icon: SvgHome, exact: true },
  { label: 'Products', path: '/app/trend-signals', icon: SvgProducts },
  { label: 'Maya', path: '/app/ai-chat', icon: SvgMaya },
  { label: 'Revenue', path: '/app/revenue', icon: SvgRevenue },
  { label: 'Account', path: '/account', icon: SvgAdmin },
];

// Beginner mode labels for the new sidebar items
export const PHASE_BEGINNER_LABELS: Record<string, string> = {
  'product-discovery': 'Find Products to Sell',
  'winning-products': "What's Hot Right Now",
  'profit-calculator': 'Check Your Profit',
  'website-generator': 'Build Your Store',
  'brand-dna': 'Design Your Brand',
  copywriter: 'Write Your Copy',
  'meta-ads': 'Create Your Ads',
  'store-spy': 'Spy on Competitors',
  'saturation-checker': 'Check Market Crowding',
};

// ── NotificationBell component ────────────────────────────────────────────────

const INITIAL_NOTIFICATIONS = [
  { id: '1', text: '🔥 New trending product detected: Silicone Air Fryer Liners trending on TikTok Shop' },
  { id: '3', text: '💡 New trend signal: Portable Neck Fans are growing fast this season' },
  { id: '4', text: '🎉 Welcome to Majorka! Complete your profile to unlock all features' },
];

const VALID_NOTIF_IDS = new Set(INITIAL_NOTIFICATIONS.map(n => n.id));

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('majorka_notif_read');
      if (!stored) return new Set<string>();
      const parsed: string[] = JSON.parse(stored);
      // Only keep IDs that still exist in current notifications
      const valid = parsed.filter(id => VALID_NOTIF_IDS.has(id));
      if (valid.length !== parsed.length) {
        localStorage.setItem('majorka_notif_read', JSON.stringify(valid));
      }
      return new Set(valid);
    } catch {
      return new Set<string>();
    }
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = INITIAL_NOTIFICATIONS.filter((n) => !readIds.has(n.id)).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = () => {
    const allIds = new Set(INITIAL_NOTIFICATIONS.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem('majorka_notif_read', JSON.stringify([...allIds]));
    } catch { /* ignore */ }
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: open ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
          border: open ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: '#94A3B8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            fontSize: 9,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', -apple-system, sans-serif",
            border: '1.5px solid white',
          }}>
            {unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 320,
          background: '#0E1420',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          zIndex: 500,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 700, fontSize: 13, color: '#F1F5F9' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', -apple-system, sans-serif" }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {INITIAL_NOTIFICATIONS.map((n) => (
              <div key={n.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                background: readIds.has(n.id) ? 'transparent' : 'rgba(99,102,241,0.08)',
              }}>
                {!readIds.has(n.id) && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', flexShrink: 0, marginTop: 5 }} />
                )}
                <p style={{ fontSize: 12, color: readIds.has(n.id) ? '#6B7280' : '#CBD5E1', lineHeight: 1.5, margin: 0, fontFamily: "'Inter', -apple-system, sans-serif", paddingLeft: readIds.has(n.id) ? 16 : 0 }}>
                  {n.text}
                </p>
              </div>
            ))}
          </div>
          {unread === 0 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
              All caught up ✓
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Phase collapse state ───────────────────────────────────────────────────────

const PHASE_STORAGE_KEY = 'majorka_phase_open';

function getDefaultPhaseState(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(PHASE_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  // New users: Phase 1 open, 2+3 closed. spy is always accessible (not phase-gated).
  return { discover: true, build: false, spy: true };
}

// ── Usage helper ──────────────────────────────────────────────────────────────
function getUsageToday(): number {
  try {
    const raw = localStorage.getItem('majorka_ai_count');
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

// ── Academy badge helper ───────────────────────────────────────────────────────
function getAcademyBadge(): string | null {
  try {
    const raw = localStorage.getItem('majorka_academy_v1');
    const p: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    const completedFree = FREE_LESSON_IDS.filter((id) => p[id]).length;
    if (completedFree >= TOTAL_FREE) return null;
    return completedFree === 0 ? 'Start' : `${TOTAL_FREE - completedFree} left`;
  } catch {
    return 'Start';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
}

function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa-install-dismissed')) return;
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#0E1420', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 380, width: 'calc(100% - 32px)' }}>
      <img src="/majorka-logo.jpg" alt="Majorka" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8, flexShrink: 0, display: 'block' }} draggable={false} />
      <p style={{ flex: 1, fontSize: 13, color: '#CBD5E1', lineHeight: 1.4, margin: 0 }}>Install Majorka as an app for faster access</p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={handleInstall} style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, fontFamily: "'Inter', -apple-system, sans-serif", cursor: 'pointer' }}>Install</button>
        <button onClick={handleDismiss} style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Later</button>
      </div>
    </div>
  );
}

function ShopifyStatusIndicator() {
  const [connected, setConnected] = useState(false);
  const [shop, setShop] = useState<string | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    fetch('/api/shopify/status')
      .then(r => r.json())
      .then(d => {
        if (d.connected) { setConnected(true); setShop(d.shop || null); }
      })
      .catch(() => {});
  }, []);

  // Only show when connected (status indicator) OR on store-builder related pages
  const storePages = ['/app/store-builder', '/app/my-stores', '/app/stores', '/app/website'];
  const onStorePage = storePages.some(p => location.startsWith(p));
  if (!connected && !onStorePage) return null;

  return (
    <div style={{ margin: '8px 12px 0', padding: '8px 12px', background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${connected ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#10B981' : '#6366F1', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontWeight: 600, color: connected ? '#34D399' : '#A5B4FC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {connected ? (shop || 'Store Connected') : 'Connect Shopify'}
      </span>
    </div>
  );
}

export default function MajorkaAppShell({ children }: Props) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading, session, isPro, subPlan } = useAuth();
  // STATE — ALL HOOKS AT TOP (Task 9 requirement)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 1280;
    return false;
  });
  const isAdminUser = session?.user?.email === 'maximusmajorka@gmail.com';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobileShell, setIsMobileShell] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobileShell(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobileShell(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('majorka-theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('majorka-theme', theme);
  }, [theme]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseOpen, setPhaseOpen] = useState<Record<string, boolean>>(getDefaultPhaseState);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated, staleTime: 5 * 60 * 1000 });
  const productCount = productsQuery.data?.length ?? 0;
  const [usageCount, setUsageCount] = useState(0);
  const [academyBadge, setAcademyBadge] = useState<string | null>(getAcademyBadge());
  const createdAtStr =
    user?.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : (user?.createdAt as string | null | undefined);
  const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode(createdAtStr);

  // Persist phase open state
  useEffect(() => {
    try {
      localStorage.setItem(PHASE_STORAGE_KEY, JSON.stringify(phaseOpen));
    } catch {
      /* ignore */
    }
  }, [phaseOpen]);

  const togglePhase = (id: string) => {
    setPhaseOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Update usage count periodically
  useEffect(() => {
    setUsageCount(getUsageToday());
    const interval = setInterval(() => setUsageCount(getUsageToday()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Academy badge — refresh when navigating (lesson completions update localStorage)
  useEffect(() => {
    setAcademyBadge(getAcademyBadge());
  }, [location]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    // Expanded keywords map for common search terms
    const ALIASES: Record<string, string[]> = {
      'ad copy': ['/app/growth'], 'ads': ['/app/ad-spy', '/app/growth'],
      'profit': ['/app/profit'], 'margin': ['/app/profit'],
      'creator': ['/app/creators'], 'video': ['/app/videos'],
      'market': ['/app/market'], 'shop': ['/app/spy-tools'],
      'spy': ['/app/ad-spy', '/app/spy-tools'], 'competitor': ['/app/spy-tools'],
      'trend': ['/app/intelligence'], 'product': ['/app/intelligence'],
      'supplier': ['/app/profit'], 'settings': ['/app/settings'],
      'billing': ['/app/settings'], 'shopify': ['/app/profit'],
    };
    const aliasMatches = Object.entries(ALIASES)
      .filter(([key]) => key.includes(q) || q.includes(key))
      .flatMap(([, paths]) => paths);
    const fromAliases = NAV_SECTIONS.flatMap(s => s.items)
      .filter(item => aliasMatches.includes(item.path))
      .map(item => ({ id: item.path, label: item.label, description: item.tooltip || '', path: item.path, icon: item.icon }));
    const fromTools = allTools
      .filter((t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    const combined = [...fromAliases, ...fromTools];
    const seen = new Set<string>();
    return combined.filter(t => { if (seen.has(t.path)) return false; seen.add(t.path); return true; }).slice(0, 6);
  }, [searchQuery]);

  // Keyboard shortcut for command palette and search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(open => !open);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setCmdPaletteOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isActive = (path: string, exact?: boolean) => {
    if (path === '/app/my-products') {
      return location.startsWith('/app/my-products') || location.startsWith('/app/product-hub');
    }
    // "Creators & Video" item covers both /app/creators and /app/videos
    if (path === '/app/creators') {
      return location.startsWith('/app/creators') || location.startsWith('/app/videos') || location.startsWith('/app/video-intel') || location.startsWith('/app/creator-intel');
    }
    // "Products" item covers product-intelligence + intelligence + winning-products
    if (path === '/app/product-intelligence') {
      return location.startsWith('/app/product-intelligence') || location.startsWith('/app/intelligence') || location.startsWith('/app/winning-products');
    }
    // "Ad Spy" covers /app/ad-spy + /app/spy
    if (path === '/app/ad-spy') {
      return location.startsWith('/app/ad-spy') || location.startsWith('/app/spy');
    }
    return exact ? location === path : location === path || location.startsWith(path + '/');
  };

  const handleNavClick = (path: string) => {
    setLocation(path);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLocation('/login');
  };

  const DAILY_LIMIT = 50;
  const usagePercent = Math.min((usageCount / DAILY_LIMIT) * 100, 100);

  const navItem = (item: NavItem) => {
    const active = isActive(item.path, item.exact);
    const toolId = item.path.replace('/app/', '').replace(/\//g, '-');
    const beginnerLabel = isBeginnerMode
      ? (PHASE_BEGINNER_LABELS[toolId] ?? BEGINNER_LABELS[toolId])
      : undefined;
    const beginnerTooltip = isBeginnerMode ? BEGINNER_TOOLTIPS[toolId] : undefined;
    const displayLabel = beginnerLabel ?? item.label;
    const tooltip = beginnerTooltip ?? item.tooltip;
    // Inject dynamic academy badge
    const badge = item.path === '/app/learn' ? (academyBadge ?? item.badge) : item.badge;

    return (
      <div key={item.path} className="mb-0.5" data-tour={`nav-${toolId}`}>
        <button
          onClick={() => handleNavClick(item.path)}
          title={tooltip}
          className="flex items-center gap-2 text-sm transition-all relative"
          style={{
            width: sidebarCollapsed ? 44 : '100%',
            height: sidebarCollapsed ? 44 : 'auto',
            borderRadius: 8,
            background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: active ? '#818CF8' : '#CBD5E1',
            fontFamily: "'Inter', -apple-system, sans-serif",
            border: 'none',
            borderLeft: !sidebarCollapsed && active ? '3px solid #6366F1' : '3px solid transparent',
            cursor: 'pointer',
            position: 'relative' as const,
            paddingLeft: sidebarCollapsed ? 0 : (active ? 9 : 12),
            paddingRight: sidebarCollapsed ? 0 : 12,
            paddingTop: sidebarCollapsed ? 0 : 8,
            paddingBottom: sidebarCollapsed ? 0 : 8,
            fontSize: 14,
            minHeight: sidebarCollapsed ? 44 : 36,
            fontWeight: active ? 600 : 400,
            transition: 'all 150ms',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => {
            if (!active) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = '#E2E8F0';
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1';
            }
          }}
        >
          <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7, color: active ? '#6366F1' : 'currentColor', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            {createElement(item.icon)}
          </span>
          {!sidebarCollapsed && (
            <span className="flex-1 text-left truncate text-sm">
              {displayLabel}
              {badge && (() => {
                const bs = badge === 'PRO'
                  ? { background: '#6366F1', color: 'white', border: '1px solid rgba(99,102,241,0.4)' }
                  : badge === 'LIVE'
                  ? { background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }
                  : badge === 'SOON'
                  ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }
                  : item.path === '/app/learn' && badge !== 'HOT'
                  ? { background: 'rgba(16,185,129,0.12)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }
                  : { background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.25)' };
                return (
                  <span
                    className="ml-1.5"
                    style={{
                      ...bs,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {badge}
                  </span>
                );
              })()}
            </span>
          )}
          {/* Ads Manager recommendation badge */}
          {item.path === '/app/ads-manager' && (() => {
            try {
              const count = parseInt(localStorage.getItem('majorka_ads_recs_count') || '0', 10);
              if (count > 0) return <span style={{ position: 'absolute' as const, top: 4, right: 4, width: 8, height: 8, background: '#EF4444', borderRadius: '50%' }} />;
            } catch { /* ignore */ }
            return null;
          })()}
          {active && (
            <div
              style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#6366F1', borderRadius: '0 4px 4px 0' }}
            />
          )}
        </button>
      </div>
    );
  };

  const sidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', height: 64, padding: sidebarCollapsed ? 0 : '0 12px' }}
      >
        <button
          onClick={() => setLocation('/app')}
          className="flex items-center flex-1"
          style={{ background: 'none', border: 'none', cursor: 'pointer', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: sidebarCollapsed ? 0 : 10 }}
        >
          <div className="flex-shrink-0">
            <img src="/majorka-logo.jpg" alt="Majorka" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8, display: 'block' }} draggable={false} />
          </div>
          {!sidebarCollapsed && (
            <span
              className="font-bold text-sm"
              style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: 'var(--sidebar-text, #F1F5F9)', letterSpacing: '-0.01em', fontSize: 15, fontWeight: 800 }}
            >
              Majorka
            </span>
          )}
        </button>
      </div>

      {/* Search bar */}
      {!sidebarCollapsed && (
        <div className="px-2.5 py-2 flex-shrink-0">
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all"
            style={{
              borderRadius: 8,
              background: 'var(--search-bg, rgba(255,255,255,0.05))',
              border: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
              color: '#94A3B8',
              cursor: 'pointer',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--sidebar-border, #E5E7EB)')}
          >
            <Search size={12} />
            <span className="flex-1 text-left">Search tools...</span>
            <kbd
              className="px-1.5 py-0.5 rounded text-xs"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#CBD5E1',
                fontSize: 9,
                fontFamily: 'DM Mono, monospace',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Nav */}
      <div
        className="flex-1 overflow-y-auto py-2 px-2"
        data-tour="sidebar-nav"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#F5F5F5 transparent' }}
      >
        {/* Nav sections */}
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className="mb-1">
            {section.label ? (
              <>
                {si > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />}
                <div style={{ padding: '8px 16px 4px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase' as const }}>
                    {section.label}
                  </span>
                </div>
              </>
            ) : si > 0 ? (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 8px' }} />
            ) : null}
            {section.items.map((item) => navItem(item))}
          </div>
        ))}

        {/* Admin — only visible to admin */}
        {(user?.email === 'maximusmajorka@gmail.com' || session?.user?.email === 'maximusmajorka@gmail.com') &&
          navItem({
            label: 'Admin',
            path: '/app/admin',
            icon: SvgAdmin,
            tooltip: 'Admin panel — user management, stats, quick actions.',
          })}
      </div>

      {/* Shopify connection status */}
      <ShopifyStatusIndicator />

      {/* Region selector */}
      <div
        className="flex-shrink-0 px-3 py-2 flex items-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <RegionSelector />
      </div>

      {/* User section */}
      <div
        className="flex-shrink-0 px-2 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        ref={userMenuRef}
      >
        {loading ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
            <div className="flex-1 space-y-1.5">
              <div
                className="h-2.5 rounded animate-pulse"
                style={{ background: 'rgba(255,255,255,0.08)', width: '60%' }}
              />
              <div
                className="h-2 rounded animate-pulse"
                style={{ background: 'rgba(255,255,255,0.05)', width: '80%' }}
              />
            </div>
          </div>
        ) : isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 transition-all"
              style={{
                borderRadius: 8,
                background: userMenuOpen ? 'rgba(255,255,255,0.07)' : 'transparent',
                cursor: 'pointer',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                if (!userMenuOpen)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'rgba(255,255,255,0.07)';
              }}
              onMouseLeave={(e) => {
                if (!userMenuOpen)
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name ?? 'User'}
                  className="rounded-full flex-shrink-0 object-cover"
                  style={{ width: 32, height: 32 }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
                  style={{
                    width: 32, height: 32,
                    background: 'rgba(99,102,241,0.15)',
                    color: '#A5B4FC',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {(user?.name ?? user?.email ?? session?.user?.email ?? 'M')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span
                    className="truncate"
                    style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}
                  >
                    {user?.name ?? session?.user?.user_metadata?.full_name ?? 'User'}
                  </span>
                  <span
                    className="flex-shrink-0"
                    style={{
                      background: isPro ? '#6366F1' : '#E5E7EB',
                      color: isPro ? 'white' : '#6B7280',
                      fontFamily: "'Inter', -apple-system, sans-serif",
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.05em',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {isAdminUser ? 'Scale' : isPro ? subPlan.charAt(0).toUpperCase() + subPlan.slice(1).toLowerCase() : 'Free'}
                  </span>
                </div>
                {(user?.email ?? session?.user?.email) && (
                  <div
                    className="truncate"
                    style={{ color: '#9CA3AF', fontSize: 12, fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {user?.email ?? session?.user?.email}
                  </div>
                )}
              </div>
            </button>

            {/* Sign Out button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-all mt-0.5"
              style={{
                borderRadius: 6,
                background: 'transparent',
                color: '#9CA3AF',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Inter', -apple-system, sans-serif",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
              }}
            >
              <LogOut size={12} />
              Sign Out
            </button>

            {userMenuOpen && (
              <div
                className="absolute bottom-full left-0 mb-1 overflow-hidden w-full"
                style={{
                  background: '#0B0F1E',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
                  minWidth: 180,
                  zIndex: 100,
                  borderRadius: 10,
                }}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setLocation('/account');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{
                      color: '#94A3B8',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User size={11} /> Account
                  </button>
                  <button
                    onClick={() => {
                      setLocation('/app/billing');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{
                      color: '#94A3B8',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <CreditCard size={11} /> Billing
                  </button>
                  <button
                    onClick={() => {
                      setLocation('/app/settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{
                      color: '#94A3B8',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Settings size={11} /> Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLocation('/sign-in')}
            className="w-full text-xs font-bold px-3 py-2 transition-all"
            style={{
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#FFFFFF',
              fontFamily: "'Inter', -apple-system, sans-serif",
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Sign In
          </button>
        )}
      </div>

      {/* Collapse toggle — only on desktop */}
      {!isMobileShell && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: sidebarCollapsed ? 44 : '100%',
              height: 40,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              transition: 'width 0.3s ease-in-out',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            {sidebarCollapsed ? '→' : '←'}
            {!sidebarCollapsed && <span style={{ marginLeft: 6, fontSize: 12 }}>Collapse</span>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--content-bg, #060A12)', color: 'var(--content-text, #F1F5F9)', fontFamily: "'Inter', -apple-system, sans-serif" }}
    >
      <PWAInstallBanner />
      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => {
            setSearchOpen(false);
            setSearchQuery('');
          }}
        >
          <div
            className="w-full overflow-hidden"
            style={{
              maxWidth: 560,
              marginLeft: isMobileShell ? '16px' : 'calc(240px + 40px)',
              marginRight: '16px',
              background: '#0E1420',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-100 caret-slate-100 placeholder:text-slate-500"
                style={{ color: '#F1F5F9', caretColor: '#F1F5F9', fontFamily: "'Inter', -apple-system, sans-serif" }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }
                  if (e.key === 'Enter' && searchResults.length > 0) {
                    setLocation(searchResults[0].path);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }
                }}
              />
              <kbd
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: 10 }}
              >
                ESC
              </kbd>
            </div>
            {searchResults.length > 0 && (
              <div className="py-1 max-h-[300px] overflow-auto">
                {searchResults.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setLocation(tool.path);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#F1F5F9',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.1)' }}
                    >
                      {createElement(tool.icon, { size: 12, style: { color: '#6366F1' } })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-bold truncate"
                        style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
                      >
                        {tool.label}
                      </div>
                      <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                        {tool.description}
                      </div>
                    </div>
                    <ArrowUpRight size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm" style={{ color: '#9CA3AF' }}>
                  No tools found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Command Palette */}
      {cmdPaletteOpen && <CommandPalette onClose={() => setCmdPaletteOpen(false)} />}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — 220/60px toggle, desktop: part of flex flow; mobile: slide-in drawer */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`flex flex-col z-50 transition-all duration-300 ease-in-out`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: !isMobileShell && sidebarCollapsed ? 60 : 220,
          transform: mobileOpen || !isMobileShell ? 'translateX(0)' : 'translateX(-100%)',
          background: 'var(--sidebar-bg, #0B0F1E)',
          borderRight: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
        }}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="absolute top-3 right-3 z-50 w-8 h-8 rounded-md flex items-center justify-center lg:hidden"
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#F8FAFC',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>
        )}
        {sidebarContent()}
      </aside>

      {/* Main content */}
      <div className="flex flex-col min-h-0" style={{ marginLeft: isMobileShell ? 0 : (sidebarCollapsed ? 60 : 220), flex: 1, minWidth: 0, transition: 'margin-left 0.3s ease-in-out' }}>
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 px-4 border-b flex-shrink-0 lg:hidden"
          style={{ background: 'var(--sidebar-bg, #0B0F1E)', borderColor: 'var(--sidebar-border, rgba(255,255,255,0.08))', height: 48 }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#CBD5E1',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Menu size={15} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/majorka-logo.jpg" alt="Majorka" width={28} height={28} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 7, display: 'block', flexShrink: 0 }} draggable={false} />
            <span
              className="font-bold text-sm"
              style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#F1F5F9', letterSpacing: '-0.01em', fontSize: 15, fontWeight: 800 }}
            >
              Majorka
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#94A3B8',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Search size={14} />
            </button>
            <NotificationBell />
          </div>
        </div>

        {/* Desktop top header bar */}
        <div
          className="hidden lg:flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: 56, background: 'var(--card-bg, #0B0F1E)', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}
        >
          <span style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>
            {(() => {
              const allItems = NAV_SECTIONS.flatMap(s => s.items);
              const current = allItems.find(item => isActive(item.path, item.exact));
              return current?.label || 'Dashboard';
            })()}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              aria-label="Toggle dark mode"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#F0F0F0'}`, background: theme === 'dark' ? '#0E1420' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'dark' ? '#94A3B8' : '#6B7280', transition: 'background 150ms', marginRight: 4 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
              onMouseLeave={e => (e.currentTarget.style.background = theme === 'dark' ? '#0E1420' : 'white')}
            >
              {theme === 'light' ? createElement(Moon, { size: 16 }) : createElement(Sun, { size: 16 })}
            </button>
            <NotificationBell />
            <div
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, fontFamily: "'Inter', -apple-system, sans-serif", cursor: 'pointer' }}
              onClick={() => setLocation('/account')}
            >
              {(user?.name ?? user?.email ?? session?.user?.email ?? 'M').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto pb-16 lg:pb-0 dashboard-bg mkr-page" style={{ background: location === '/app/revenue' ? 'transparent' : '#060A12', color: '#F1F5F9' }}>
          <div className="mkr-page-content" key={location} style={{ height: '100%' }}>
              <ErrorBoundary fallback={<div style={{padding:32,color:'#f87171',fontFamily:'monospace',fontSize:13}}><b>Content render error</b> — check browser console (F12 → Console tab)</div>}>
                {children}
              </ErrorBoundary>
          </div>
        </div>

        {/* Mobile bottom tab bar */}
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
          style={{ background: '#0B0F1E', borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-around" style={{ paddingTop: 8, paddingBottom: 10 }}>
            {MOBILE_TABS.map((tab) => {
              const active = tab.exact ? location === tab.path : location.startsWith(tab.path);
              return (
                <button
                  key={tab.label}
                  onClick={() => setLocation(tab.path)}
                  className="flex flex-col items-center"
                  style={{
                    gap: 3,
                    padding: '4px 12px',
                    color: active ? '#818CF8' : '#6B7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    minWidth: 56,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', opacity: active ? 1 : 0.75 }}>
                    {createElement(tab.icon)}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "'Inter', -apple-system, sans-serif",
                      fontWeight: active ? 700 : 500,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
