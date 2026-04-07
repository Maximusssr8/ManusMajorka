import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, TrendingUp, Video,
  Sparkles, Megaphone, Store, FileText,
  Bell, DollarSign, Eye, Calculator, Settings,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProductStats } from '@/hooks/useProducts';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  exact?: boolean;
  soon?: boolean;
}
interface NavGroup { label: string | null; items: NavItem[] }

const GROUPS: NavGroup[] = [
  { label: null, items: [
    { label: 'Home', path: '/app', icon: LayoutDashboard, exact: true },
  ]},
  { label: 'INTELLIGENCE', items: [
    { label: 'Products',         path: '/app/products', icon: Package },
    { label: 'Market',           path: '/app/products', icon: TrendingUp, soon: true },
    { label: 'Creators & Video', path: '/app/creators', icon: Video, soon: true },
  ]},
  { label: 'AI TOOLS', items: [
    { label: 'Maya AI',       path: '/app/ai-chat',       icon: Sparkles },
    { label: 'Ads Studio',    path: '/app/ads-studio',    icon: Megaphone },
    { label: 'Ad Briefs',     path: '/app/ad-spy',        icon: FileText },
    { label: 'Store Builder', path: '/app/store-builder', icon: Store },
  ]},
  { label: 'MANAGE', items: [
    { label: 'Alerts',         path: '/app/alerts',         icon: Bell },
    { label: 'Competitor Spy', path: '/app/competitor-spy', icon: Eye },
    { label: 'Revenue',        path: '/app/revenue',        icon: DollarSign },
    { label: 'Profit Calc',    path: '/app/profit',         icon: Calculator },
  ]},
];

export function Nav() {
  const [location] = useLocation();
  const { user, isPro } = useAuth();
  const { hotCount } = useProductStats();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const planLabel = isPro ? 'Scale Plan' : 'Builder Plan';
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Operator';

  const isActive = (item: NavItem) => {
    if (item.exact) return location === item.path;
    return location === item.path || location.startsWith(item.path + '/');
  };

  const totalSoon = GROUPS.reduce((acc, g) => acc + g.items.filter((i) => i.soon).length, 0);

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
        height: 58,
        padding: '0 16px',
        background: 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: 'linear-gradient(135deg,#4f46e5,#6366F1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: display,
          fontWeight: 800,
          fontSize: 14,
          color: '#fff',
          flexShrink: 0,
        }}>M</div>
        <span style={{
          fontFamily: display,
          fontSize: 16,
          fontWeight: 700,
          color: '#ededed',
          letterSpacing: '-0.03em',
        }}>Majorka</span>
      </div>

      {/* Search */}
      <button
        style={{
          margin: '8px 8px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 7,
          padding: '8px 12px',
          cursor: 'pointer',
          color: '#52525b',
          fontSize: 12,
          fontFamily: sans,
          textAlign: 'left',
          transition: 'all 150ms',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.5 }}>⌘</span>
        <span style={{ flex: 1 }}>Search tools…</span>
        <span style={{
          fontSize: 9,
          fontFamily: mono,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '1px 5px',
          borderRadius: 3,
          opacity: 0.6,
        }}>K</span>
      </button>

      {/* Body */}
      <div style={{ flex: 1, padding: '4px 0', overflowY: 'auto' }}>
        {GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div style={{
                padding: '14px 16px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}>
                <div style={{
                  width: 2,
                  height: 8,
                  background: 'rgba(99,102,241,0.5)',
                  borderRadius: 1,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: mono,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#3f3f46',
                }}>{group.label}</span>
              </div>
            )}
            {group.items.filter((i) => !i.soon).map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const baseStyle: React.CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                margin: '1px 8px',
                borderRadius: 7,
                cursor: 'pointer',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 150ms',
                position: 'relative',
                color: active ? '#ededed' : '#6b7280',
                background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
              };
              if (active) {
                baseStyle.borderLeft = '2px solid #6366F1';
                baseStyle.paddingLeft = 12;
                baseStyle.marginLeft = 6;
              }
              return (
                <Link
                  key={`${item.path}-${item.label}`}
                  href={item.path}
                  style={baseStyle}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = '#a1a1aa';
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280';
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.label === 'Products' && hotCount > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: mono,
                    }}>{hotCount}</span>
                  )}
                  {item.soon && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: mono,
                      color: '#6b7280',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      letterSpacing: '0.02em',
                    }}>SOON</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Coming Soon collapsible */}
        {totalSoon > 0 && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setShowComingSoon((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: 'calc(100% - 16px)',
                margin: '0 8px',
                padding: '8px 12px',
                background: 'transparent',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: 7,
                cursor: 'pointer',
                fontFamily: mono,
                fontSize: 10,
                fontWeight: 600,
                color: '#52525b',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
            >
              <span style={{ flex: 1, textAlign: 'left' }}>Coming soon ({totalSoon})</span>
              <span style={{ fontSize: 11 }}>{showComingSoon ? '−' : '+'}</span>
            </button>
            {showComingSoon && (
              <div style={{ marginTop: 6 }}>
                {GROUPS.flatMap((g) => g.items.filter((i) => i.soon)).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`soon-${item.path}-${item.label}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 14px',
                        margin: '1px 8px',
                        borderRadius: 7,
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#52525b',
                        cursor: 'not-allowed',
                        opacity: 0.7,
                      }}
                    >
                      <Icon size={14} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        fontFamily: mono,
                        color: '#6b7280',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 4,
                        padding: '1px 5px',
                        letterSpacing: '0.02em',
                      }}>SOON</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User area */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
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
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 600,
            color: '#ededed',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{displayName}</div>
          <div style={{
            fontFamily: mono,
            fontSize: 10,
            color: '#6366F1',
            marginTop: 1,
          }}>{planLabel}</div>
        </div>
        <Link
          href="/app/settings"
          style={{
            color: '#52525b',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            flexShrink: 0,
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
