import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, Video, BarChart2,
  Sparkles, Megaphone, Store, FileText,
  Bell, DollarSign, Eye, Settings,
  GraduationCap, ShieldCheck, Search, Flame,
  Key, BookOpen, Library,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTracking } from '@/hooks/useTracking';
import { useAdmin } from '@/hooks/useAdmin';
// isPro ⇒ SCALE tier label

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  exact?: boolean;
  soon?: boolean;
  adminOnly?: boolean;
  badge?: 'trackedCount';
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
      { label: 'Ads Studio',    path: '/app/ads-studio',    icon: Megaphone },
      { label: 'Ad Briefs',     path: '/app/ad-briefs',     icon: FileText },
      { label: 'Ad Library',    path: '/app/ad-library',    icon: Library },
      { label: 'Store Builder', path: '/app/store-builder', icon: Store },
    ],
  },
  {
    title: 'Operate',
    items: [
      { label: 'Alerts',             path: '/app/alerts',             icon: Bell, badge: 'trackedCount' },
      { label: 'TikTok Leaderboard', path: '/app/tiktok-leaderboard', icon: Flame },
      { label: 'Competitor Spy',     path: '/app/competitor-spy',     icon: Eye },
      { label: 'Revenue',            path: '/app/revenue',            icon: DollarSign },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Academy',  path: '/app/learn',    icon: GraduationCap },
      { label: 'API Keys', path: '/app/api-keys', icon: Key },
      { label: 'API Docs', path: '/app/api-docs', icon: BookOpen },
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
  const { user, isPro, subPlan } = useAuth();
  const { trackedCount } = useTracking();
  const [searchTerm, setSearchTerm] = useState('');
  const [comingSoonItem, setComingSoonItem] = useState<NavItem | null>(null);
  // Admin gate: server-side check via /api/auth/admin-check.
  const { isAdmin: isAdminByUUID } = useAdmin();
  const legacyAdmin = (user as { role?: string } | null)?.role === 'admin';
  const isAdmin = isAdminByUUID || legacyAdmin;
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Operator';
  const userEmail = user?.email ?? '';
  const planLower = (subPlan ?? '').toLowerCase();
  const showUpgrade = planLower === '' || planLower === 'free' || planLower === 'builder';

  const isActive = (item: NavItem): boolean => {
    if (item.exact) return location === item.path;
    return location === item.path || location.startsWith(item.path + '/');
  };

  return (
    <nav className="relative w-[220px] h-full bg-[#050505] border-r border-white/[0.06] flex flex-col shrink-0 font-body overflow-hidden">
      {/* Subtle top gradient border — gold fading to transparent */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none z-20"
        style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.35), transparent)' }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(212,175,55,0.10), transparent)' }}
      />

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
            className="text-[15px] font-display font-bold tracking-tight lowercase"
            style={{ color: '#d4af37' }}
          >
            majorka
          </span>
        </Link>

        {/* Search */}
        <div className="mx-2 mb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-white/[0.08] rounded-lg">
            <Search size={13} className="text-muted shrink-0" strokeWidth={1.75} />
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
              className="bg-transparent text-sm text-text placeholder-muted outline-none w-full min-w-0"
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
                {gi > 0 && <div className="h-px bg-white/[0.06] mx-3 mt-4 mb-1" />}
                <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
                  {group.title}
                </p>
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.path}
                      href={item.soon ? '#' : item.path}
                      onClick={(e) => {
                        if (item.soon) {
                          e.preventDefault();
                          setComingSoonItem(item);
                          return;
                        }
                        onNavigate?.();
                      }}
                      style={
                        active
                          ? {
                              boxShadow: '0 0 20px rgba(212,175,55,0.15)',
                              borderLeft: '3px solid #d4af37',
                              background: 'rgba(212,175,55,0.08)',
                              color: '#d4af37',
                              transition: 'all 200ms ease-out',
                            }
                          : { borderLeft: '3px solid transparent', transition: 'all 200ms ease-out' }
                      }
                      className={`flex items-center gap-2.5 pl-[9px] pr-3 py-2.5 min-h-[44px] rounded-md mb-0.5 text-[13px] no-underline ${
                        active
                          ? 'font-medium'
                          : item.soon
                            ? 'text-[#555] cursor-not-allowed'
                            : 'text-[#888] hover:bg-[rgba(212,175,55,0.04)] hover:text-[#d4af37] hover:translate-x-[2px]'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.5} className="shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge === 'trackedCount' && trackedCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber/15 border border-amber/40 text-amber font-bold tabular-nums shrink-0 min-w-[18px] text-center">
                          {trackedCount}
                        </span>
                      )}
                      {item.soon && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 border border-accent/40 text-accent-hover shrink-0">
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
        <div className="border-t border-white/[0.06] px-3 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center shrink-0 font-semibold"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.35)',
                color: '#d4af37',
                fontSize: 14,
              }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-text truncate flex items-center gap-1.5">
                <span className="truncate">{displayName}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0"
                  style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}
                >
                  {isPro ? 'SCALE' : 'BUILDER'}
                </span>
              </div>
              {userEmail && (
                <div className="text-[12px] text-muted truncate font-body">
                  {userEmail}
                </div>
              )}
            </div>
            <ThemeToggle />
            <Link
              href="/app/settings"
              onClick={onNavigate}
              aria-label="Settings"
              className="text-muted hover:text-[#d4af37] transition-colors cursor-pointer shrink-0 flex items-center no-underline"
            >
              <Settings size={14} strokeWidth={1.75} />
            </Link>
          </div>
          {showUpgrade && (
            <Link
              href="/app/settings"
              onClick={onNavigate}
              className="mt-2.5 flex items-center justify-center py-1.5 rounded-md text-[11px] font-semibold no-underline"
              style={{
                color: '#d4af37',
                background: 'transparent',
                border: '1px solid rgba(212,175,55,0.4)',
                transition: 'all 200ms ease-out',
              }}
            >
              Upgrade
            </Link>
          )}
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
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              {(() => {
                const Icon = comingSoonItem.icon;
                return <Icon size={20} className="text-accent" strokeWidth={2} />;
              })()}
            </div>
            <h2 className="text-xl font-display font-bold text-text mb-2 tracking-tight">
              {comingSoonItem.label}
            </h2>
            <p className="text-sm text-body leading-relaxed mb-6">
              {comingSoonItem.label === 'Competitor Spy'
                ? 'Enter any Shopify store URL to see their best-selling products, estimated revenue, traffic sources, and full app stack. Coming in the next update.'
                : `${comingSoonItem.label} is in active development and will land in the next release. We'll notify all users when it's live.`}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-mono">In development · ETA next update</span>
            </div>
            <button
              onClick={() => setComingSoonItem(null)}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01]"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
