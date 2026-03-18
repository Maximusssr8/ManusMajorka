/**
 * MajorkaAppShell — premium 240px sidebar + mobile bottom tab bar.
 * Sidebar: phase-based (Discover / Build / Spy) with collapsible sections.
 */

import {
  Activity,
  ArrowUpRight,
  BarChart3,
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
  GraduationCap,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  PenTool,
  Play,
  Search,
  Settings,
  Shield,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import MarketSelector from '@/components/MarketSelector';
// SocialProofTicker removed — felt cheap/spammy
import { BEGINNER_LABELS, BEGINNER_TOOLTIPS, useBeginnerMode } from '@/hooks/useBeginnerMode';
import { supabase } from '@/lib/supabase';
import { allTools } from '@/lib/tools';
import { trpc } from '@/lib/trpc';
import { FREE_LESSON_IDS, TOTAL_FREE } from '@/pages/LearnHub';

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

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Home', path: '/app', exact: true, icon: Home },
    ],
  },
  {
    label: 'DISCOVER',
    items: [
      { label: 'Product Intelligence', path: '/app/intelligence', icon: Sparkles, badge: 'NEW', tooltip: 'Trending products + full database + AI scout — all in one.' },
      { label: 'Shop Intelligence', path: '/app/shops', icon: Store, badge: 'PRO', tooltip: 'Discover top performing AU Shopify stores and analyse competitor strategy.' },
      { label: 'Product Search', path: '/app/product-search', icon: Search, badge: 'LIVE', tooltip: 'Search TikTok Shop & AliExpress for real trending products.' },
      { label: 'Spy Tools', path: '/app/spy', icon: Eye, tooltip: 'Market overview, AU creators, trending video hooks.' },
    ],
  },
  {
    label: 'BUILD',
    items: [
      { label: 'Store Builder', path: '/app/website-generator', icon: Globe, badge: 'AI', tooltip: 'Generate a complete Shopify-ready store in 60 seconds.' },
      { label: 'Growth Tools', path: '/app/growth', icon: Zap, tooltip: 'Ad Studio, Copy Studio, and Brand DNA — one place.' },
    ],
  },
  {
    label: 'MANAGE',
    items: [
      { label: 'Profit & Suppliers', path: '/app/profit', icon: DollarSign, tooltip: 'Profit calculator + AU supplier directory.' },
      { label: 'Academy', path: '/app/learn', icon: BookOpen, tooltip: 'Learn dropshipping for the AU market.' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { label: 'Settings & Billing', path: '/app/billing', icon: Settings, tooltip: 'Account settings, plan, and billing.' },
    ],
  },
];

// Legacy constants kept for compatibility
const PHASE_SECTIONS: PhaseSection[] = [];

const MOBILE_TABS: NavItem[] = [
  { label: 'Home', path: '/app', icon: Home, exact: true },
  { label: 'Products', path: '/app/trend-signals', icon: TrendingUp },
  { label: 'Maya', path: '/app/ai-chat', icon: MessageSquare },
  { label: 'Tools', path: '/app/product-discovery', icon: Search },
  { label: 'Account', path: '/account', icon: User },
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
  { id: '1', text: '🔥 New trending product detected: Silicone Air Fryer Liners — $5,100/day' },
  { id: '2', text: '📦 Your watchlist product price dropped 12%' },
  { id: '3', text: '💡 New trend signal: Portable Neck Fans are exploding in AU' },
  { id: '4', text: '🎉 Welcome to Majorka! Complete your profile to unlock all features' },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('majorka_notif_read');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
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
          background: open ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.06)',
          color: '#a1a1aa',
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
            fontFamily: 'Syne, sans-serif',
            border: '1.5px solid #0a0a0e',
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
          background: '#141418',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          zIndex: 500,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: '#f5f5f5' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, color: '#d4af37', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {INITIAL_NOTIFICATIONS.map((n) => (
              <div key={n.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                background: readIds.has(n.id) ? 'transparent' : 'rgba(212,175,55,0.03)',
              }}>
                {!readIds.has(n.id) && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37', flexShrink: 0, marginTop: 5 }} />
                )}
                <p style={{ fontSize: 12, color: readIds.has(n.id) ? '#52525b' : '#a1a1aa', lineHeight: 1.5, margin: 0, fontFamily: 'DM Sans, sans-serif', paddingLeft: readIds.has(n.id) ? 16 : 0 }}>
                  {n.text}
                </p>
              </div>
            ))}
          </div>
          {unread === 0 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: '#52525b' }}>
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
  // New users: Phase 1 open, 2+3 closed
  return { discover: true, build: false, spy: false };
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
    <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#131620', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 380, width: 'calc(100% - 32px)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #d4af37, #b8941f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 15, color: '#000', flexShrink: 0 }}>M</div>
      <p style={{ flex: 1, fontSize: 13, color: '#e2e8f0', lineHeight: 1.4, margin: 0 }}>Install Majorka as an app for faster access</p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={handleInstall} style={{ background: 'linear-gradient(135deg, #d4af37, #b8941f)', color: '#000', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>Install</button>
        <button onClick={handleDismiss} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Later</button>
      </div>
    </div>
  );
}

export default function MajorkaAppShell({ children }: Props) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading, session, isPro, subPlan } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseOpen, setPhaseOpen] = useState<Record<string, boolean>>(getDefaultPhaseState);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated });
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
    return allTools
      .filter((t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
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
          className="w-full flex items-center gap-2 text-sm transition-all relative"
          style={{
            borderRadius: 8,
            background: active ? 'rgba(212,175,55,0.08)' : 'transparent',
            color: active ? '#f5f5f5' : '#a1a1aa',
            fontFamily: 'DM Sans, sans-serif',
            border: 'none',
            cursor: 'pointer',
            borderLeft: active ? '2px solid #d4af37' : '2px solid transparent',
            paddingLeft: active ? 10 : 12,
            paddingRight: 12,
            paddingTop: 6,
            paddingBottom: 6,
            // On mobile: 56px touch targets for menu items
            minHeight: 36,
          }}
          onMouseEnter={(e) => {
            if (!active) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLButtonElement).style.color = '#f5f5f5';
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa';
            }
          }}
        >
          {createElement(item.icon, {
            size: 14,
            style: { flexShrink: 0, opacity: active ? 1 : 0.8, color: active ? '#d4af37' : undefined },
          })}
          <span className="flex-1 text-left truncate text-sm">
            {displayLabel}
            {badge && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                style={{
                  background:
                    item.path === '/app/learn' && badge !== 'HOT'
                      ? 'rgba(34,197,94,0.12)'
                      : 'rgba(212,175,55,0.15)',
                  color: item.path === '/app/learn' && badge !== 'HOT' ? '#4ade80' : '#d4af37',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {badge}
              </span>
            )}
          </span>
          {active && (
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: '#d4af37' }}
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
        className="flex items-center gap-2.5 px-3 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => setLocation('/app')}
          className="flex items-center gap-2.5 flex-1"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #d4af37, #b8941f)',
              color: '#0a0a0a',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            M
          </div>
          <span
            className="font-bold text-sm uppercase tracking-widest"
            style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5', letterSpacing: '0.12em' }}
          >
            MAJORKA
          </span>
        </button>
        <NotificationBell />
      </div>

      {/* Search bar */}
      <div className="px-2.5 py-2 flex-shrink-0">
        <button
          onClick={() => {
            setSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all"
          style={{
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#52525b',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search tools...</span>
          <kbd
            className="px-1.5 py-0.5 rounded text-xs"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#52525b',
              fontSize: 9,
              fontFamily: 'DM Mono, monospace',
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <div
        className="flex-1 overflow-y-auto py-2 px-2"
        data-tour="sidebar-nav"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
      >
        {/* Nav sections */}
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className="mb-1">
            {section.label && (
              <>
                {si > 0 && <div className="mt-1 mb-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />}
                <div className="px-3 py-1.5">
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#52525b', fontFamily: 'Syne, sans-serif' }}>
                    {section.label}
                  </span>
                </div>
              </>
            )}
            {section.items.map((item) => navItem(item))}
          </div>
        ))}

        {/* Admin — only visible to admin */}
        {(user?.email === 'maximusmajorka@gmail.com' || session?.user?.email === 'maximusmajorka@gmail.com') &&
          navItem({
            label: 'Admin',
            path: '/app/admin',
            icon: Shield,
            tooltip: 'Admin panel — user management, stats, quick actions.',
          })}
      </div>

      {/* AU flag + region */}
      <div
        className="flex-shrink-0 px-3 py-2 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span style={{ fontSize: 14 }}>🇦🇺</span>
        <span style={{ fontSize: 11, color: '#52525b', fontWeight: 500 }}>Australia</span>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* User section */}
      <div
        className="flex-shrink-0 px-2 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
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
                background: userMenuOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
                cursor: 'pointer',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                if (!userMenuOpen)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'rgba(255,255,255,0.04)';
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
                  className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37, #b8941f)',
                    color: '#0a0a0a',
                    fontFamily: 'Syne, sans-serif',
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
                    className="text-xs font-bold truncate"
                    style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
                  >
                    {user?.name ?? session?.user?.user_metadata?.full_name ?? 'User'}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-xs flex-shrink-0"
                    style={{
                      background: isPro ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isPro ? '#d4af37' : '#71717a',
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: 9,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {isPro ? subPlan.charAt(0).toUpperCase() + subPlan.slice(1).toLowerCase() : 'Free'}
                  </span>
                </div>
                {(user?.email ?? session?.user?.email) && (
                  <div
                    className="truncate"
                    style={{ color: '#52525b', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
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
                color: '#52525b',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#52525b';
              }}
            >
              <LogOut size={12} />
              Sign Out
            </button>

            {userMenuOpen && (
              <div
                className="absolute bottom-full left-0 mb-1 overflow-hidden w-full"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
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
                      color: '#a1a1aa',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')
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
                      color: '#a1a1aa',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')
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
                      color: '#a1a1aa',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')
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
              background: 'linear-gradient(135deg, #d4af37, #b8941f)',
              color: '#0a0a0a',
              fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#060608', color: '#f5f5f5', fontFamily: 'DM Sans, sans-serif' }}
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
            className="w-full max-w-lg mx-4 overflow-hidden"
            style={{
              background: '#141418',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Search size={16} style={{ color: '#52525b', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#f5f5f5', fontFamily: 'DM Sans, sans-serif' }}
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
                style={{ background: 'rgba(255,255,255,0.06)', color: '#52525b', fontSize: 10 }}
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
                      color: '#f5f5f5',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(212,175,55,0.06)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(212,175,55,0.1)' }}
                    >
                      {createElement(tool.icon, { size: 12, style: { color: '#d4af37' } })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-bold truncate"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        {tool.label}
                      </div>
                      <div className="text-xs truncate" style={{ color: '#52525b' }}>
                        {tool.description}
                      </div>
                    </div>
                    <ArrowUpRight size={12} style={{ color: '#52525b', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm" style={{ color: '#52525b' }}>
                  No tools found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — 240px, desktop: part of flex flow; mobile: slide-in drawer */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`flex-shrink-0 flex flex-col z-50 fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:inset-auto lg:translate-x-0`}
        style={{
          width: 240,
          background: '#0a0a0e',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 z-50 w-7 h-7 rounded-md flex items-center justify-center lg:hidden"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#f5f5f5',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={13} />
          </button>
        )}
        {sidebarContent()}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 px-4 border-b flex-shrink-0 lg:hidden"
          style={{ background: '#0a0a0e', borderColor: 'rgba(255,255,255,0.06)', height: 48 }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#f5f5f5',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Menu size={15} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs"
              style={{
                background: 'linear-gradient(135deg, #d4af37, #b8941f)',
                color: '#0a0a0a',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              M
            </div>
            <span
              className="font-bold text-sm uppercase tracking-widest"
              style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5', letterSpacing: '0.1em' }}
            >
              MAJORKA
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
                background: 'rgba(255,255,255,0.05)',
                color: '#a1a1aa',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Search size={14} />
            </button>
            <NotificationBell />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-16 lg:pb-0 dashboard-bg">{children}</div>

        {/* Mobile bottom tab bar */}
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
          style={{ background: '#0d1017', borderTop: '1px solid #1f2937' }}
        >
          <div className="flex items-center justify-around" style={{ paddingTop: 8, paddingBottom: 10 }}>
            {MOBILE_TABS.map((tab) => {
              const active = tab.exact ? location === tab.path : location.startsWith(tab.path);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.label}
                  onClick={() => setLocation(tab.path)}
                  className="flex flex-col items-center"
                  style={{
                    gap: 3,
                    padding: '4px 12px',
                    color: active ? '#d4af37' : 'rgba(107,114,128,0.8)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    minWidth: 56,
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: 'DM Sans, sans-serif',
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
