import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, TrendingUp, Video,
  Sparkles, Megaphone, Store, FileText,
  Bell, DollarSign, Eye, Calculator, Settings,
  GraduationCap, ShieldCheck, Search,
} from 'lucide-react';
import type { ComponentType, SVGProps, CSSProperties } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProductStats } from '@/hooks/useProducts';
import { t } from '@/lib/designTokens';

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  exact?: boolean;
  soon?: boolean;
  adminOnly?: boolean;
}

/**
 * Nav groups — labelled so the eye can parse the sections.
 * Labels render as tiny uppercase captions, not dividers,
 * which gives the sidebar real information architecture.
 */
const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Intelligence',
    items: [
      { label: 'Home',     path: '/app',          icon: LayoutDashboard, exact: true },
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

export function Nav() {
  const [location, navigate] = useLocation();
  const { user, isPro } = useAuth();
  const { hotCount } = useProductStats();
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = (user as { role?: string } | null)?.role === 'admin';
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Operator';

  const isActive = (item: NavItem): boolean => {
    if (item.exact) return location === item.path;
    return location === item.path || location.startsWith(item.path + '/');
  };

  return (
    <nav
      style={{
        width: 232,
        background: t.bg,
        borderRight: `1px solid ${t.line}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {/* Brand mark — clean, no gradient, no glow. */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${t.s5}px`,
          gap: t.s3,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: t.rSm,
            background: t.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 15, color: '#fff' }}>M</span>
        </div>
        <span
          style={{
            fontFamily: t.fontDisplay,
            fontWeight: 700,
            fontSize: 17,
            color: t.text,
            letterSpacing: '-0.02em',
          }}
        >
          Majorka
        </span>
      </div>

      {/* Search — single flat input. No mock-keyboard shortcut noise. */}
      <div style={{ padding: `0 ${t.s3}px ${t.s3}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: t.s2,
            background: t.surface,
            border: `1px solid ${t.line}`,
            borderRadius: t.rSm,
            padding: `${t.s2}px ${t.s3}px`,
          }}
        >
          <Search size={14} color={t.faint} strokeWidth={2} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim().length > 0) {
                navigate(`/app/products?search=${encodeURIComponent(searchTerm.trim())}`);
                setSearchTerm('');
              }
            }}
            placeholder="Search products"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: t.text,
              fontSize: t.fBody,
              fontFamily: t.fontBody,
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Nav groups — section titles give real IA, not just coloured dividers. */}
      <div style={{ paddingBottom: t.s4 }}>
        {GROUPS.map((group, gi) => {
          const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
          if (visible.length === 0) return null;
          return (
            <div key={gi} style={{ marginBottom: t.s4 }}>
              <div
                style={{
                  padding: `${t.s2}px ${t.s5}px ${t.s1}px`,
                  fontFamily: t.fontBody,
                  fontSize: 10,
                  fontWeight: 600,
                  color: t.faint,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {group.title}
              </div>
              {visible.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  active={isActive(item)}
                  hotCount={item.label === 'Products' ? hotCount : 0}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* User footer — single row, no emoji, no fake plan pill. */}
      <div
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${t.line}`,
          padding: `${t.s3}px ${t.s4}px`,
          display: 'flex',
          alignItems: 'center',
          gap: t.s3,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: t.rSm,
            background: t.surface,
            border: `1px solid ${t.lineStrong}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: t.fontDisplay,
            fontWeight: 700,
            fontSize: 13,
            color: t.text,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fBody,
              fontWeight: 600,
              color: t.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fCaption,
              color: t.muted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isPro ? 'Scale' : 'Builder'} · AUD
          </div>
        </div>
        <Link
          href="/app/settings"
          style={{
            color: t.faint,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            transition: `color ${t.dur} ${t.ease}`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.faint; }}
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={2} />
        </Link>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  hotCount: number;
}

function NavLink({ item, active, hotCount }: NavLinkProps) {
  const Icon = item.icon;
  const baseStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: t.s3,
    padding: `${t.s2}px ${t.s3}px`,
    margin: `1px ${t.s2}px`,
    borderRadius: t.rSm,
    cursor: item.soon ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    fontSize: t.fBody,
    fontFamily: t.fontBody,
    transition: `background ${t.dur} ${t.ease}, color ${t.dur} ${t.ease}`,
    color: active ? t.text : item.soon ? t.faint : t.body,
    background: active ? t.surface : 'transparent',
    fontWeight: active ? 600 : 500,
    // Active state uses a 1px inner line in place of a heavy border
    // — quiet, Linear-style.
    boxShadow: active ? `inset 0 0 0 1px ${t.line}` : 'none',
  };
  return (
    <Link
      href={item.soon ? '#' : item.path}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!active && !item.soon) {
          (e.currentTarget as HTMLAnchorElement).style.background = t.surface;
          (e.currentTarget as HTMLAnchorElement).style.color = t.text;
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !item.soon) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.color = t.body;
        }
      }}
    >
      <Icon size={15} strokeWidth={1.75} style={{ flexShrink: 0, color: active ? t.accent : 'currentColor' }} />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.label}
      </span>
      {item.soon && (
        <span
          style={{
            fontFamily: t.fontBody,
            fontSize: 10,
            fontWeight: 600,
            color: t.faint,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}
        >
          Soon
        </span>
      )}
      {hotCount > 0 && (
        <span
          style={{
            background: t.accentDim,
            color: t.accent,
            borderRadius: t.rPill,
            padding: '1px 7px',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: t.fontBody,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {hotCount}
        </span>
      )}
    </Link>
  );
}
