import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, TrendingUp, Video,
  Sparkles, Megaphone, Store, FileText,
  Bell, DollarSign, Eye, Calculator, Settings,
  GraduationCap, ShieldCheck,
} from 'lucide-react';
import type { ComponentType, SVGProps, CSSProperties } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProductStats } from '@/hooks/useProducts';

const display = "'Bricolage Grotesque', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  exact?: boolean;
  soon?: boolean;
  /** Green AI pill badge next to the label. */
  ai?: boolean;
  /** Optional "Start" / "New" style tag. */
  tag?: string;
  /** Only shown to admins. */
  adminOnly?: boolean;
}

const GROUPS: NavItem[][] = [
  // Group 1 — intelligence
  [
    { label: 'Home',     path: '/app',          icon: LayoutDashboard, exact: true },
    { label: 'Products', path: '/app/products', icon: Package },
    { label: 'Market',           path: '/app/market',   icon: TrendingUp },
    { label: 'Creators & Video', path: '/app/creators', icon: Video },
  ],
  // Group 2 — AI tools (each AI-powered surface gets a green AI pill)
  [
    { label: 'Maya AI',       path: '/app/ai-chat',       icon: Sparkles,  ai: true },
    { label: 'Ads Studio',    path: '/app/ads-studio',    icon: Megaphone, ai: true },
    { label: 'Ad Briefs',     path: '/app/ad-briefs',     icon: FileText,  ai: true },
    { label: 'Store Builder', path: '/app/store-builder', icon: Store,     ai: true },
  ],
  // Group 3 — manage
  [
    { label: 'Alerts',         path: '/app/alerts',         icon: Bell },
    { label: 'Competitor Spy', path: '/app/competitor-spy', icon: Eye },
    { label: 'Revenue',        path: '/app/revenue',        icon: DollarSign },
    { label: 'Profit Calc',    path: '/app/profit',         icon: Calculator },
  ],
  // Group 4 — account (always-visible)
  [
    { label: 'Academy',  path: '/app/learn',    icon: GraduationCap, tag: 'Start' },
    { label: 'Settings', path: '/app/settings', icon: Settings },
    { label: 'Admin',    path: '/app/admin',    icon: ShieldCheck, adminOnly: true },
  ],
];


export function Nav() {
  const [location] = useLocation();
  const { user, isPro } = useAuth();
  const { hotCount } = useProductStats();
  const isAdmin = (user as { role?: string } | null)?.role === 'admin';
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Operator';
  const planLabel = isPro ? 'Scale Plan' : 'Builder Plan';

  const isActive = (item: NavItem): boolean => {
    if (item.exact) return location === item.path;
    return location === item.path || location.startsWith(item.path + '/');
  };

  return (
    <nav style={{
      width: 220,
      background: '#151515',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        height: 58,
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: 10,
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg,#7c6aff,#a78bfa)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: display, fontWeight: 800, fontSize: 13, color: 'white' }}>M</span>
        </div>
        <span style={{
          fontFamily: display,
          fontWeight: 800,
          fontSize: 16,
          color: '#f1f1f3',
          letterSpacing: '-0.03em',
        }}>Majorka</span>
      </div>

      {/* Search */}
      <button
        style={{
          width: 'calc(100% - 20px)',
          margin: '10px 10px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          padding: '8px 12px',
          cursor: 'pointer',
          color: '#5a5a6e',
          fontSize: 12,
          fontFamily: sans,
          boxSizing: 'border-box',
          transition: 'all 120ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
      >
        <span style={{ fontSize: 13, opacity: 0.5 }}>⌘</span>
        <span style={{ flex: 1, textAlign: 'left' }}>Search...</span>
        <span style={{
          fontFamily: mono,
          fontSize: 9,
          opacity: 0.4,
          background: 'rgba(255,255,255,0.06)',
          padding: '2px 5px',
          borderRadius: 3,
        }}>K</span>
      </button>

      {/* Market selector */}
      <div style={{
        margin: '4px 10px 14px',
        padding: '9px 12px',
        background: 'rgba(124,106,255,0.07)',
        border: '1px solid rgba(124,106,255,0.15)',
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        cursor: 'pointer',
      }}>
        <span style={{ fontSize: 17 }}>🇦🇺</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: '#e2e2e8', lineHeight: 1.2 }}>Australia</div>
          <div style={{ fontFamily: mono, fontSize: 9, color: '#7c6aff', marginTop: 1 }}>AUD · GST 10%</div>
        </div>
        <span style={{ fontFamily: mono, fontSize: 9, color: '#4a4a5e' }}>▾</span>
      </div>

      {/* Nav groups — admin items filtered out for non-admin users */}
      {GROUPS.map((group, gi) => {
        const visible = group.filter((i) => !i.adminOnly || isAdmin);
        if (visible.length === 0) return null;
        return (
          <div key={gi}>
            {gi > 0 && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 10px 8px' }} />
            )}
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

      {/* User area */}
      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: display,
          fontWeight: 700,
          fontSize: 12,
          color: 'white',
          flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              color: '#e2e2e8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}>{displayName}</span>
            <span style={{
              flexShrink: 0,
              fontFamily: mono,
              fontSize: 8,
              fontWeight: 700,
              color: isPro ? '#7c6aff' : 'rgba(255,255,255,0.4)',
              background: isPro ? 'rgba(124,106,255,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isPro ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
              padding: '1px 5px',
              borderRadius: 3,
              letterSpacing: '0.05em',
            }}>{isPro ? 'SCALE' : 'BUILDER'}</span>
          </div>
          <div style={{
            fontFamily: mono,
            fontSize: 9,
            color: 'rgba(255,255,255,0.35)',
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{user?.email ?? planLabel}</div>
        </div>
        <Link
          href="/app/settings"
          style={{
            color: '#3f3f52',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 120ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#a1a1aa'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#3f3f52'; }}
        >
          <Settings size={13} />
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
  const dim = item.soon && !active;
  const baseStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    margin: '1px 8px',
    borderRadius: 8,
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: 13,
    fontFamily: sans,
    transition: 'all 120ms',
    color: active ? '#e8e8f0' : dim ? 'rgba(255,255,255,0.28)' : '#6b6b80',
    background: active ? 'rgba(124,106,255,0.1)' : 'transparent',
    border: `1px solid ${active ? 'rgba(124,106,255,0.18)' : 'transparent'}`,
    fontWeight: active ? 600 : 500,
    opacity: dim ? 0.7 : 1,
  };
  return (
    <Link
      href={item.path}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.color = '#c0c0d0';
          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.color = '#6b6b80';
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
        }
      }}
    >
      <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
      {item.ai && (
        <span style={{
          background: 'rgba(16,185,129,0.15)',
          color: '#10b981',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 999,
          padding: '1px 6px',
          fontSize: 8,
          fontWeight: 700,
          fontFamily: mono,
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}>AI</span>
      )}
      {item.tag && (
        <span style={{
          background: 'rgba(124,106,255,0.15)',
          color: '#a78bfa',
          border: '1px solid rgba(124,106,255,0.25)',
          borderRadius: 999,
          padding: '1px 6px',
          fontSize: 8,
          fontWeight: 700,
          fontFamily: mono,
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}>{item.tag.toUpperCase()}</span>
      )}
      {item.soon && (
        <span style={{
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '1px 6px',
          fontSize: 8,
          fontWeight: 600,
          fontFamily: mono,
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}>SOON</span>
      )}
      {hotCount > 0 && (
        <span style={{
          background: 'rgba(239,68,68,0.15)',
          color: '#f87171',
          borderRadius: 999,
          padding: '1px 7px',
          fontSize: 9,
          fontWeight: 700,
          fontFamily: mono,
          flexShrink: 0,
        }}>{hotCount}</span>
      )}
    </Link>
  );
}
