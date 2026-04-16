import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, Video, BarChart2,
  Sparkles, Megaphone, Store, FileText,
  Bell, DollarSign, Eye, Settings,
  GraduationCap, ShieldCheck, Search,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTracking } from '@/hooks/useTracking';
import { useAdmin } from '@/hooks/useAdmin';
import { GradientM } from '@/components/MajorkaLogo';
// isPro ⇒ SCALE tier label

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  exact?: boolean;
  soon?: boolean;
  adminOnly?: boolean;
  badge?: 'trackedCount';
  tooltip?: string;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Intelligence',
    items: [
      { label: 'Home',      path: '/app',           icon: LayoutDashboard, exact: true },
      { label: 'Products',  path: '/app/products',  icon: Package },
      { label: 'Analytics', path: '/app/analytics', icon: BarChart2 },
      { label: 'Creators',  path: '/app/creators',  icon: Video },
    ],
  },
  {
    title: 'Create',
    items: [
      { label: 'Maya AI',       path: '/app/ai-chat',       icon: Sparkles },
      { label: 'Ad Copy',        path: '/app/ads-studio',    icon: Megaphone, tooltip: 'Headlines, body copy & CTAs' },
      { label: 'Campaign Brief', path: '/app/ad-briefs',     icon: FileText,  tooltip: 'Strategy & brief' },
      { label: 'Store Builder', path: '/app/store-builder', icon: Store },
    ],
  },
  {
    title: 'Operate',
    items: [
      { label: 'Alerts',         path: '/app/alerts',         icon: Bell, badge: 'trackedCount' },
      { label: 'Competitor Spy', path: '/app/competitor-spy', icon: Eye, soon: true },
      { label: 'Revenue',        path: '/app/revenue',        icon: DollarSign },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Academy',  path: '/app/learn',    icon: GraduationCap },
      { label: 'Settings', path: '/app/settings', icon: Settings },
      { label: 'Admin',    path: '/app/admin',    icon: ShieldCheck, adminOnly: true },
    ],
  },
];

interface NavProps {
  onNavigate?: () => void;
}

export function Nav({ onNavigate }: NavProps = {}) {
  const [location, navigate] = useLocation();
  const { user, isPro } = useAuth();
  const { trackedCount } = useTracking();
  const [searchTerm, setSearchTerm] = useState('');
  const [comingSoonItem, setComingSoonItem] = useState<NavItem | null>(null);
  // Admin gate: prefer the strict UUID match from useAdmin (compares
  // session.user.id against VITE_ADMIN_USER_ID). Falls back to the
  // legacy profile.role === 'admin' check for backwards compat.
  const { isAdmin: isAdminByUUID } = useAdmin();
  const legacyAdmin = (user as { role?: string } | null)?.role === 'admin';
  const isAdmin = isAdminByUUID || legacyAdmin;
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Operator';

  const isActive = (item: NavItem): boolean => {
    if (item.exact) return location === item.path;
    return location === item.path || location.startsWith(item.path + '/');
  };

  return (
    <nav
      aria-label="Main navigation"
      className="relative w-[220px] h-full border-r flex flex-col shrink-0 font-body overflow-hidden"
      style={{
        background: '#04060f',
        borderColor: '#161b22',
      }}
    >
      {/* Top ambient cobalt mesh */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 30% 0%, rgba(79,142,247,0.08) 0%, transparent 70%)',
        }}
      />
      {/* Hairline cobalt inner glow */}
      <div className="absolute inset-y-0 right-0 w-px pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, rgba(79,142,247,0.22), transparent)' }} />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo + wordmark — uses shared MajorkaLogo lockup */}
        <Link
          href="/app"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-4 pt-5 pb-3 no-underline shrink-0"
        >
          <img
            src="/majorka-logo.jpg"
            alt="Majorka"
            className="shrink-0"
            style={{ height: 32, width: 32, borderRadius: 8, objectFit: 'cover' }}
          />
          <span
            className="text-[16px] inline-flex items-baseline"
            style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontWeight: 800,
              color: '#e5e5e5',
              letterSpacing: '-0.02em',
            }}
          >
            Majorka
            <span className="mj-wordmark-dot" aria-hidden="true" />
          </span>
        </Link>

        {/* Search */}
        <div className="mx-2 mb-2">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: '#0a0a0a', border: '1px solid #161b22' }}
          >
            <Search size={13} style={{ color: '#737373' }} className="shrink-0" strokeWidth={1.75} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim().length > 0) {
                  navigate(`/app/products?search=${encodeURIComponent(searchTerm.trim())}`);
                  setSearchTerm('');
                  onNavigate?.();
                }
              }}
              placeholder="Search products..."
              className="bg-transparent text-sm outline-none w-full min-w-0"
              style={{ color: '#e5e5e5' }}
            />
          </div>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {GROUPS.map((group, gi) => {
            const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
            if (visible.length === 0) return null;
            return (
              <div key={gi} className="mt-2">
                {gi > 0 && <div className="h-px mx-3 my-1" style={{ background: '#141414' }} />}
                <p
                  className="px-3 pt-4 pb-1 text-[9px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: '#525252' }}
                >
                  {group.title}
                </p>
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.path}
                      href={item.soon ? '#' : item.path}
                      aria-current={active ? 'page' : undefined}
                      aria-disabled={item.soon || undefined}
                      title={item.tooltip}
                      onClick={(e) => {
                        if (item.soon) {
                          e.preventDefault();
                          setComingSoonItem(item);
                          return;
                        }
                        onNavigate?.();
                      }}
                      className="mj-tap flex items-center gap-2.5 px-3 py-1.5 rounded-lg mb-0.5 text-[13px] transition-all duration-200 no-underline"
                      style={
                        active
                          ? {
                              background: 'rgba(79,142,247,0.06)',
                              borderLeft: '2px solid #4f8ef7',
                              color: '#4f8ef7',
                              fontWeight: 600,
                              boxShadow:
                                '0 0 0 1px rgba(79,142,247,0.08), 0 6px 24px -10px rgba(59,130,246,0.25), inset 0 0 20px rgba(79,142,247,0.05)',
                            }
                          : item.soon
                            ? { color: '#525252', cursor: 'not-allowed', borderLeft: '2px solid transparent' }
                            : { color: '#a3a3a3', borderLeft: '2px solid transparent' }
                      }
                      onMouseEnter={(e) => {
                        if (!active && !item.soon) {
                          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(79,142,247,0.04)';
                          (e.currentTarget as HTMLAnchorElement).style.color = '#e5e5e5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active && !item.soon) {
                          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                          (e.currentTarget as HTMLAnchorElement).style.color = '#a3a3a3';
                        }
                      }}
                    >
                      <Icon size={16} strokeWidth={1.5} className="shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge === 'trackedCount' && trackedCount > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums shrink-0 min-w-[18px] text-center"
                          style={{
                            background: 'rgba(245,158,11,0.14)',
                            border: '1px solid rgba(245,158,11,0.4)',
                            color: '#f59e0b',
                          }}
                        >
                          {trackedCount}
                        </span>
                      )}
                      {item.soon && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                          style={{
                            background: 'rgba(79,142,247,0.12)',
                            border: '1px solid rgba(79,142,247,0.3)',
                            color: '#6ba3ff',
                          }}
                        >
                          Soon
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User row */}
        <div
          className="px-3 py-3 flex items-center gap-2.5 shrink-0"
          style={{ borderTop: '1px solid #161b22' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #6ba3ff)',
              color: '#04060f',
            }}
          >
            {initial}
          </div>
          <span className="text-[13px] flex-1 truncate flex items-center gap-1.5 min-w-0" style={{ color: '#e5e5e5' }}>
            <span className="truncate">{displayName}</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0"
              style={{
                background: 'rgba(79,142,247,0.14)',
                color: '#4f8ef7',
                border: '1px solid rgba(79,142,247,0.3)',
              }}
            >
              {isPro ? 'SCALE' : 'BUILDER'}
            </span>
          </span>
          <Link
            href="/app/settings"
            onClick={onNavigate}
            aria-label="Settings"
            className="transition-colors cursor-pointer shrink-0 flex items-center no-underline"
            style={{ color: '#737373' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#4f8ef7')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#737373')}
          >
            <Settings size={14} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* Coming-soon modal — fires when an item with `soon: true` is clicked */}
      {comingSoonItem && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setComingSoonItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-7 glass-card glass-card--elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(79,142,247,0.10)', border: '1px solid rgba(79,142,247,0.25)' }}
            >
              {(() => {
                const Icon = comingSoonItem.icon;
                return <Icon size={20} style={{ color: '#4f8ef7' }} strokeWidth={2} />;
              })()}
            </div>
            <h2
              className="text-xl mb-2 tracking-tight"
              style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 700, color: '#e5e5e5' }}
            >
              {comingSoonItem.label}
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#a3a3a3' }}>
              {comingSoonItem.label === 'Competitor Spy'
                ? 'Enter any Shopify store URL to see their best-selling products, estimated revenue, traffic sources, and full app stack. Coming in the next update.'
                : `${comingSoonItem.label} is in active development and will land in the next release. We'll notify all users when it's live.`}
            </p>
            <div className="flex items-center gap-2 text-[11px] mb-6" style={{ color: '#737373' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4f8ef7' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>In development · ETA next update</span>
            </div>
            <button
              type="button"
              onClick={() => setComingSoonItem(null)}
              className="mj-btn-gold w-full"
              style={{ height: 44 }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
