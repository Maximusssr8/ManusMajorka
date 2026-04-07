import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, TrendingUp, Video,
  Sparkles, Megaphone, Store, FileText,
  Bell, DollarSign, Eye, Calculator, Settings,
} from 'lucide-react';
import type { ComponentType, SVGProps, CSSProperties } from 'react';
import { useState } from 'react';
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
}

const GROUPS: NavItem[][] = [
  // Group 1 — core
  [
    { label: 'Home',     path: '/app',          icon: LayoutDashboard, exact: true },
    { label: 'Products', path: '/app/products', icon: Package },
  ],
  // Group 2 — AI tools
  [
    { label: 'Maya AI',       path: '/app/ai-chat',       icon: Sparkles },
    { label: 'Ads Studio',    path: '/app/ads-studio',    icon: Megaphone },
    { label: 'Ad Briefs',     path: '/app/ad-spy',        icon: FileText },
    { label: 'Store Builder', path: '/app/store-builder', icon: Store },
  ],
  // Group 3 — manage
  [
    { label: 'Alerts',         path: '/app/alerts',         icon: Bell },
    { label: 'Competitor Spy', path: '/app/competitor-spy', icon: Eye },
    { label: 'Revenue',        path: '/app/revenue',        icon: DollarSign },
    { label: 'Profit Calc',    path: '/app/profit',         icon: Calculator },
  ],
];

const SOON_ITEMS: NavItem[] = [
  { label: 'Market',           path: '/app/market',   icon: TrendingUp, soon: true },
  { label: 'Creators & Video', path: '/app/creators', icon: Video,      soon: true },
];

export function Nav() {
  const [location] = useLocation();
  const { user, isPro } = useAuth();
  const { hotCount } = useProductStats();
  const [showSoon, setShowSoon] = useState(false);
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
      background: '#0a0a0c',
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
          background: 'linear-gradient(135deg,#6366f1,#818cf8)',
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
        background: 'rgba(99,102,241,0.07)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        cursor: 'pointer',
      }}>
        <span style={{ fontSize: 17 }}>🇦🇺</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: '#e2e2e8', lineHeight: 1.2 }}>Australia</div>
          <div style={{ fontFamily: mono, fontSize: 9, color: '#6366f1', marginTop: 1 }}>AUD · GST 10%</div>
        </div>
        <span style={{ fontFamily: mono, fontSize: 9, color: '#4a4a5e' }}>▾</span>
      </div>

      {/* Nav groups */}
      {GROUPS.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 10px 8px' }} />
          )}
          {group.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              active={isActive(item)}
              hotCount={item.label === 'Products' ? hotCount : 0}
            />
          ))}
        </div>
      ))}

      {/* Coming soon collapsible */}
      {SOON_ITEMS.length > 0 && (
        <div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 10px 8px' }} />
          <button
            onClick={() => setShowSoon((s) => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              margin: '1px 8px',
              width: 'calc(100% - 16px)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#3f3f52',
              fontSize: 11,
              fontFamily: mono,
              letterSpacing: '0.03em',
              boxSizing: 'border-box',
              textAlign: 'left',
              transition: 'color 120ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b6b80'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f52'; }}
          >
            <span style={{
              transition: 'transform 120ms',
              display: 'inline-block',
              transform: showSoon ? 'rotate(90deg)' : 'none',
              fontSize: 9,
            }}>›</span>
            <span>{SOON_ITEMS.length} coming soon</span>
          </button>
          {showSoon && SOON_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  margin: '1px 8px',
                  borderRadius: 8,
                  fontFamily: sans,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#3f3f52',
                  cursor: 'not-allowed',
                  border: '1px solid transparent',
                }}
              >
                <Icon size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 8,
                  fontWeight: 700,
                  color: '#3f3f52',
                  letterSpacing: '0.05em',
                }}>SOON</span>
              </div>
            );
          })}
        </div>
      )}

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
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 600,
            color: '#e2e2e8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{displayName}</div>
          <div style={{
            fontFamily: mono,
            fontSize: 9,
            color: '#6366f1',
            marginTop: 1,
          }}>{planLabel}</div>
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
    color: active ? '#e8e8f0' : '#6b6b80',
    background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
    border: `1px solid ${active ? 'rgba(99,102,241,0.18)' : 'transparent'}`,
    fontWeight: active ? 600 : 500,
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
      <span style={{ flex: 1 }}>{item.label}</span>
      {hotCount > 0 && (
        <span style={{
          background: 'rgba(239,68,68,0.15)',
          color: '#f87171',
          borderRadius: 999,
          padding: '1px 7px',
          fontSize: 9,
          fontWeight: 700,
          fontFamily: mono,
        }}>{hotCount}</span>
      )}
    </Link>
  );
}
