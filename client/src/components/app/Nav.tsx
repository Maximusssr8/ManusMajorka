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
import { C as TOK } from '@/lib/designTokens';

/* ── Local shorthand — pulls from the shared design tokens so
   nav palette stays consistent with every other page. ── */
const C = {
  navBg: '#0a0c12',
  surface: TOK.surface,
  text: TOK.text,
  body: TOK.body,
  muted: TOK.muted,
  faint: '#4b5563',
  accent: TOK.accent,
  accentHover: TOK.accentHover,
  accentSubtle: TOK.accentSubtle,
  line: 'rgba(255,255,255,0.06)',
  lineStrong: TOK.borderStrong,
} as const;

const INTER = TOK.fontBody;

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
  const { user } = useAuth();
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
        width: 220,
        background: C.navBg,
        borderRight: `1px solid ${C.line}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        overflowY: 'auto',
        fontFamily: INTER,
      }}
    >
      {/* Top — logo + wordmark */}
      <Link
        href="/app"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '20px 16px 12px',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <img
          src="/majorka-logo.jpg"
          alt="Majorka"
          width={24}
          height={24}
          draggable={false}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            objectFit: 'cover',
            display: 'block',
            flexShrink: 0,
            border: `1px solid ${C.lineStrong}`,
          }}
        />
        <span
          style={{
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 15,
            color: C.text,
            letterSpacing: '-0.01em',
          }}
        >
          Majorka
        </span>
      </Link>

      {/* Search */}
      <div style={{ margin: '8px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: C.surface,
            border: `1px solid ${C.lineStrong}`,
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <Search size={13} strokeWidth={1.75} color={C.muted} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim().length > 0) {
                navigate(`/app/products?search=${encodeURIComponent(searchTerm.trim())}`);
                setSearchTerm('');
              }
            }}
            placeholder="Search products..."
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: C.text,
              fontSize: 13,
              fontFamily: INTER,
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Groups */}
      <div style={{ paddingBottom: 12, flex: 1 }}>
        {GROUPS.map((group, gi) => {
          const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
          if (visible.length === 0) return null;
          return (
            <div key={gi}>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: INTER,
                  fontWeight: 500,
                  color: C.faint,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '16px 16px 4px',
                }}
              >
                {group.title}
              </div>
              {visible.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  active={isActive(item)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* User footer */}
      <div
        style={{
          borderTop: `1px solid ${C.line}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: C.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: INTER,
            fontWeight: 600,
            fontSize: 12,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: INTER,
            fontSize: 13,
            color: C.text,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </div>
        <Link
          href="/app/settings"
          style={{
            color: C.muted,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.muted; }}
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={1.75} />
        </Link>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
}

function NavLink({ item, active }: NavLinkProps) {
  const Icon = item.icon;
  const baseStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 12px',
    margin: '1px 8px',
    borderRadius: 8,
    cursor: item.soon ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    fontSize: 13,
    fontFamily: INTER,
    transition: 'background 150ms ease, color 150ms ease',
    color: active ? C.text : item.soon ? C.muted : C.body,
    background: active ? C.accentSubtle : 'transparent',
    borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
    fontWeight: active ? 600 : 500,
  };
  return (
    <Link
      href={item.soon ? '#' : item.path}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!active && !item.soon) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)';
          (e.currentTarget as HTMLAnchorElement).style.color = C.text;
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !item.soon) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.color = C.body;
        }
      }}
    >
      <Icon size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
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
            background: 'rgba(99,102,241,0.15)',
            color: C.accentHover,
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: 10,
            fontFamily: INTER,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          Soon
        </span>
      )}
    </Link>
  );
}
