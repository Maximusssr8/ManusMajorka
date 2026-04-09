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

/**
 * Nav — pure black, no background on the sidebar itself.
 * Section labels are 10px uppercase tracked grey. The active item
 * gets a 2px white inset left line and pure white text. That's it.
 */
export function Nav() {
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
      {/* Brand — real Majorka logo + wordmark */}
      <Link
        href="/app"
        style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          gap: t.s3,
          padding: `0 ${t.s6}px`,
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        <img
          src="/majorka-logo.jpg"
          alt="Majorka"
          width={30}
          height={30}
          draggable={false}
          style={{
            width: 30,
            height: 30,
            borderRadius: t.rMd,
            objectFit: 'cover',
            display: 'block',
            flexShrink: 0,
            border: `1px solid ${t.line}`,
          }}
        />
        <span
          style={{
            fontFamily: t.fontDisplay,
            fontWeight: 600,
            fontSize: 19,
            color: t.text,
            letterSpacing: '-0.025em',
          }}
        >
          Majorka
        </span>
      </Link>

      {/* Search — single hairline field, no fake kbd */}
      <div style={{ padding: `0 ${t.s4}px ${t.s6}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: t.s2,
            background: 'transparent',
            border: `1px solid ${t.line}`,
            borderRadius: t.rMd,
            padding: `${t.s2}px ${t.s3}px`,
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
              fontSize: t.fBody,
              fontFamily: t.fontBody,
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Groups */}
      <div style={{ paddingBottom: t.s6 }}>
        {GROUPS.map((group, gi) => {
          const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
          if (visible.length === 0) return null;
          return (
            <div key={gi} style={{ marginBottom: t.s6 }}>
              <div
                style={{
                  padding: `0 ${t.s6}px ${t.s3}px`,
                  fontFamily: t.fontBody,
                  fontSize: t.fMicro,
                  fontWeight: 500,
                  color: t.muted,
                  letterSpacing: '0.1em',
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
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* User footer — single hairline, no avatar tile */}
      <div
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${t.line}`,
          padding: `${t.s4}px ${t.s6}px`,
          display: 'flex',
          alignItems: 'center',
          gap: t.s3,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: t.rMd,
            border: `1px solid ${t.line}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: t.fontBody,
            fontWeight: 600,
            fontSize: 11,
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
              fontWeight: 500,
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
              fontSize: t.fMicro,
              color: t.muted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 1,
            }}
          >
            {isPro ? 'Scale' : 'Builder'}
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
    gap: t.s3,
    padding: `${t.s2}px ${t.s6}px`,
    // 2px white inset line on the left for active state — the only decoration.
    boxShadow: active ? `inset 2px 0 0 ${t.text}` : 'none',
    cursor: item.soon ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    fontSize: t.fBody,
    fontFamily: t.fontBody,
    transition: `color ${t.dur} ${t.ease}`,
    color: active ? t.text : item.soon ? t.faint : t.muted,
    background: 'transparent',
    fontWeight: active ? 600 : 400,
    minHeight: 32,
  };
  return (
    <Link
      href={item.soon ? '#' : item.path}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!active && !item.soon) (e.currentTarget as HTMLAnchorElement).style.color = t.text;
      }}
      onMouseLeave={(e) => {
        if (!active && !item.soon) (e.currentTarget as HTMLAnchorElement).style.color = t.muted;
      }}
    >
      <Icon size={14} strokeWidth={1.5} style={{ flexShrink: 0 }} />
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
            fontSize: t.fMicro,
            fontWeight: 400,
            color: t.faint,
            flexShrink: 0,
          }}
        >
          Soon
        </span>
      )}
    </Link>
  );
}
