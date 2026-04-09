import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, TrendingUp, Video,
  Sparkles, Megaphone, Store, FileText,
  Bell, DollarSign, Eye, Calculator, Settings,
  GraduationCap, ShieldCheck, Search, Radio,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
// isPro ⇒ SCALE tier label

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  exact?: boolean;
  soon?: boolean;
  adminOnly?: boolean;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Intelligence',
    items: [
      { label: 'Home',     path: '/app',          icon: LayoutDashboard, exact: true },
      { label: 'Radar',    path: '/app/radar',    icon: Radio },
      { label: 'Products', path: '/app/products', icon: Package },
      { label: 'Market',   path: '/app/market',   icon: TrendingUp },
      { label: 'Creators', path: '/app/creators', icon: Video },
    ],
  },
  {
    title: 'Create',
    items: [
      { label: 'Maya AI',       path: '/app/ai-chat',       icon: Sparkles },
      { label: 'Ads Studio',    path: '/app/ads-studio',    icon: Megaphone },
      { label: 'Ad Briefs',     path: '/app/ad-briefs',     icon: FileText },
      { label: 'Store Builder', path: '/app/store-builder', icon: Store },
    ],
  },
  {
    title: 'Operate',
    items: [
      { label: 'Alerts',         path: '/app/alerts',         icon: Bell },
      { label: 'Competitor Spy', path: '/app/competitor-spy', icon: Eye, soon: true },
      { label: 'Revenue',        path: '/app/revenue',        icon: DollarSign },
      { label: 'Profit Calc',    path: '/app/profit',         icon: Calculator },
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
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = (user as { role?: string } | null)?.role === 'admin';
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Operator';

  const isActive = (item: NavItem): boolean => {
    if (item.exact) return location === item.path;
    return location === item.path || location.startsWith(item.path + '/');
  };

  return (
    <nav className="relative w-[220px] h-full bg-[#0a0b0f] border-r border-white/[0.06] flex flex-col shrink-0 font-body overflow-hidden">
      {/* Top ambient gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/[0.04] to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo + wordmark */}
        <Link
          href="/app"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-4 pt-5 pb-3 no-underline shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white text-xs font-black">
            M
          </div>
          <span className="text-[15px] font-display font-bold text-text tracking-tight">
            Majorka
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
                {gi > 0 && <div className="h-px bg-white/[0.04] mx-3 my-1" />}
                <p className="px-3 pt-4 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
                  {group.title}
                </p>
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.path}
                      href={item.soon ? '#' : item.path}
                      onClick={() => { if (!item.soon) onNavigate?.(); }}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg mb-0.5 text-[13px] transition-colors no-underline ${
                        active
                          ? 'bg-accent/15 border-l-2 border-accent text-text font-medium shadow-[inset_0_0_12px_rgba(99,102,241,0.08)]'
                          : item.soon
                            ? 'text-muted cursor-not-allowed'
                            : 'text-body hover:bg-white/[0.04] hover:text-text border-l-2 border-transparent'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.5} className="shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
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
        <div className="border-t border-white/[0.06] px-3 py-3 flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {initial}
          </div>
          <span className="text-[13px] text-text flex-1 truncate flex items-center gap-1.5 min-w-0">
            <span className="truncate">{displayName}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-semibold shrink-0">
              {isPro ? 'SCALE' : 'BUILDER'}
            </span>
          </span>
          <Link
            href="/app/settings"
            onClick={onNavigate}
            aria-label="Settings"
            className="text-muted hover:text-text transition-colors cursor-pointer shrink-0 flex items-center no-underline"
          >
            <Settings size={14} strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
