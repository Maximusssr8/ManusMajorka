import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, TrendingUp,
  Sparkles, Megaphone, Store,
  Bell, DollarSign, Eye, Settings,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  exact?: boolean;
}
interface NavGroup { label: string | null; items: NavItem[] }

const GROUPS: NavGroup[] = [
  { label: null, items: [
    { label: 'Home', path: '/app', icon: LayoutDashboard, exact: true },
  ]},
  { label: 'INTELLIGENCE', items: [
    { label: 'Products', path: '/app/products', icon: Package },
    { label: 'Market',   path: '/app/market',   icon: TrendingUp },
  ]},
  { label: 'AI TOOLS', items: [
    { label: 'Maya AI',       path: '/app/ai', icon: Sparkles },
    { label: 'Ads Studio',    path: '/app/ai', icon: Megaphone },
    { label: 'Store Builder', path: '/app/ai', icon: Store },
  ]},
  { label: 'MANAGE', items: [
    { label: 'Alerts',  path: '/app/alerts',  icon: Bell },
    { label: 'Revenue', path: '/app/revenue', icon: DollarSign },
    { label: 'Spy',     path: '/app/spy',     icon: Eye },
  ]},
];

export function Nav() {
  const [location] = useLocation();
  const { user, isPro } = useAuth();
  const planLabel = isPro ? 'SCALE' : 'BUILDER';
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Operator';

  const isActive = (item: NavItem) => {
    if (item.exact) return location === item.path;
    return location === item.path || location.startsWith(item.path + '/');
  };

  return (
    <nav style={{
      width: 220,
      flexShrink: 0,
      background: '#0a0a0a',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo area */}
      <div style={{
        height: 56,
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <img
          src="/majorka-logo.jpg"
          alt="Majorka"
          style={{ height: 26, width: 'auto', borderRadius: 5, display: 'block' }}
        />
        <span style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 15,
          color: '#ededed',
          letterSpacing: '-0.02em',
        }}>Majorka</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div style={{
                padding: '16px 16px 6px',
                fontFamily: mono,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#52525b',
              }}>{group.label}</div>
            )}
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const baseStyle: React.CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                margin: '1px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 500,
                transition: 'background 150ms, color 150ms',
                textDecoration: 'none',
                color: active ? '#ededed' : '#71717a',
                background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
              };
              if (active) {
                baseStyle.borderLeft = '3px solid #6366F1';
                baseStyle.paddingLeft = 9;
                baseStyle.marginLeft = 5;
              }
              return (
                <Link
                  key={`${item.path}-${item.label}`}
                  href={item.path}
                  style={baseStyle}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = '#a1a1aa';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = '#71717a';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User area */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          color: '#fff',
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 500,
            color: '#ededed',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{displayName}</div>
          <span style={{
            display: 'inline-block',
            padding: '2px 7px',
            background: 'rgba(99,102,241,0.12)',
            color: '#6366F1',
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 600,
            borderRadius: 999,
            marginTop: 3,
          }}>{planLabel}</span>
        </div>
        <Link
          href="/app/settings"
          style={{
            marginLeft: 'auto',
            color: '#52525b',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#a1a1aa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
        >
          <Settings size={14} />
        </Link>
      </div>
    </nav>
  );
}
