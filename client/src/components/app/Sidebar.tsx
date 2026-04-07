import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, TrendingUp,
  Sparkles, Megaphone, Store,
  Bell, DollarSign, Eye,
  Settings,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

interface NavItem { label: string; path: string; icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>; exact?: boolean }
interface NavGroup { label: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    label: 'INTELLIGENCE',
    items: [
      { label: 'Home',     path: '/app',          icon: LayoutDashboard, exact: true },
      { label: 'Products', path: '/app/products', icon: Package },
      { label: 'Market',   path: '/app/market',   icon: TrendingUp },
    ],
  },
  {
    label: 'AI TOOLS',
    items: [
      { label: 'Maya AI',       path: '/app/ai',            icon: Sparkles },
      { label: 'Ads Studio',    path: '/app/ads-studio',    icon: Megaphone },
      { label: 'Store Builder', path: '/app/store-builder', icon: Store },
    ],
  },
  {
    label: 'MANAGE',
    items: [
      { label: 'Alerts',         path: '/app/alerts',  icon: Bell },
      { label: 'Revenue',        path: '/app/revenue', icon: DollarSign },
      { label: 'Competitor Spy', path: '/app/spy',     icon: Eye },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, isPro } = useAuth();
  const planLabel = isPro ? 'SCALE' : 'BUILDER';
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Operator';

  const isActive = (item: NavItem) =>
    item.exact ? location === item.path : location.startsWith(item.path);

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: '#0a0a0a',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 64,
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <img src="/majorka-logo.jpg" alt="Majorka" height={28} style={{ height: 28, width: 'auto', borderRadius: 6, display: 'block' }} />
        <span style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 16,
          color: '#ededed',
          letterSpacing: '-0.02em',
        }}>Majorka</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: mono,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: '#52525b',
              padding: '8px 12px 6px',
            }}>{group.label}</div>
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 6,
                  borderLeft: `3px solid ${active ? '#6366F1' : 'transparent'}`,
                  background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: active ? '#ededed' : '#71717a',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  textDecoration: 'none',
                  marginBottom: 2,
                  transition: 'background 150ms, color 150ms',
                }}
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
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{
        padding: 16,
        background: '#0d0d10',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: display,
          fontWeight: 700,
          fontSize: 13,
          color: '#fff',
          flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            color: '#ededed',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{displayName}</div>
          <div style={{
            fontFamily: mono,
            fontSize: 9,
            color: '#6366F1',
            letterSpacing: '0.08em',
            marginTop: 2,
          }}>{planLabel}</div>
        </div>
        <Link href="/app/settings" style={{ color: '#52525b', display: 'flex', alignItems: 'center' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#a1a1aa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
        >
          <Settings size={15} />
        </Link>
      </div>
    </aside>
  );
}
