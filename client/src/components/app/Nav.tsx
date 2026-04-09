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
import { t } from '@/lib/designTokens';

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

const NAV_BG = '#0a0c12';

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
        width: 200,
        background: NAV_BG,
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
      {/* Brand — logo + wordmark */}
      <Link
        href="/app"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '20px 16px',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <img
          src="/majorka-logo.jpg"
          alt="Majorka"
          width={26}
          height={26}
          draggable={false}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            objectFit: 'cover',
            display: 'block',
            flexShrink: 0,
            border: `1px solid ${t.line}`,
          }}
        />
        <span
          style={{
            fontFamily: t.fontDisplay,
            fontWeight: 800,
            fontSize: 15,
            color: t.text,
            letterSpacing: '-0.02em',
          }}
        >
          Majorka
        </span>
      </Link>

      {/* Search */}
      <div style={{ padding: '0 12px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: t.surface,
            border: `1px solid ${t.lineStrong}`,
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <Search size={13} color={t.muted} strokeWidth={1.75} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim().length > 0) {
                navigate(`/app/products?search=${encodeURIComponent(searchTerm.trim())}`);
                setSearchTerm('');
              }
            }}
            placeholder="Search"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: t.text,
              fontSize: 13,
              fontFamily: t.fontBody,
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Groups */}
      <div style={{ paddingBottom: 16, flex: 1 }}>
        {GROUPS.map((group, gi) => {
          const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
          if (visible.length === 0) return null;
          return (
            <div key={gi}>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: t.fontBody,
                  fontWeight: 600,
                  color: t.muted,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '20px 0 4px 16px',
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
          borderTop: `1px solid ${t.line}`,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: t.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: t.fontDisplay,
            fontWeight: 700,
            fontSize: 12,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: t.fontBody,
              fontSize: 13,
              fontWeight: 500,
              color: t.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </div>
        </div>
        <Link
          href="/app/settings"
          style={{
            color: t.muted,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            transition: `color ${t.dur} ${t.ease}`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.muted; }}
          aria-label="Settings"
        >
          <Settings size={13} strokeWidth={1.75} />
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
    borderRadius: 6,
    cursor: item.soon ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    fontSize: 13,
    fontFamily: t.fontBody,
    transition: `background ${t.dur} ${t.ease}, color ${t.dur} ${t.ease}`,
    color: active ? t.text : item.soon ? t.muted : t.body,
    background: active ? t.accentSubtle : 'transparent',
    borderLeft: active ? `2px solid ${t.accent}` : '2px solid transparent',
    fontWeight: active ? 600 : 500,
  };
  return (
    <Link
      href={item.soon ? '#' : item.path}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!active && !item.soon) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
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
      <Icon size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
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
            fontSize: 9,
            fontWeight: 500,
            color: t.muted,
            flexShrink: 0,
          }}
        >
          Soon
        </span>
      )}
    </Link>
  );
}
