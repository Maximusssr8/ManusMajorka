import { useLocation } from 'wouter';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

const TITLES: Record<string, string> = {
  '/app':          'Home',
  '/app/products': 'Products',
  '/app/market':   'Market Intelligence',
  '/app/ai':       'AI Tools',
  '/app/alerts':   'Alerts',
  '/app/revenue':  'Revenue',
  '/app/spy':      'Competitor Spy',
};

export function TopBar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const title = TITLES[location] ?? TITLES[Object.keys(TITLES).find((k) => location.startsWith(k)) ?? '/app'] ?? 'Majorka';
  const initial = (user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase();
  const market = (typeof window !== 'undefined' ? localStorage.getItem('majorka_region') : null) ?? 'AU';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      height: 64,
      padding: '0 24px',
      background: 'rgba(10,10,10,0.85)',
      backdropFilter: 'blur(12px) saturate(160%)',
      WebkitBackdropFilter: 'blur(12px) saturate(160%)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <h1 style={{
        fontFamily: display,
        fontWeight: 600,
        fontSize: 22,
        color: '#ededed',
        letterSpacing: '-0.015em',
        margin: 0,
        flexShrink: 0,
      }}>{title}</h1>

      <div style={{
        flex: 1,
        maxWidth: 360,
        position: 'relative',
        marginLeft: 24,
      }}>
        <Search size={14} style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#52525b',
        }} />
        <input
          type="search"
          placeholder="Search products, tools, niches…"
          style={{
            width: '100%',
            height: 36,
            padding: '0 12px 0 34px',
            background: '#0d0d10',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            color: '#ededed',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 150ms',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 999,
        fontFamily: mono,
        fontSize: 11,
        color: '#a1a1aa',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
        Market · <span style={{ color: '#ededed' }}>{market}</span>
      </div>

      <button style={{
        position: 'relative',
        width: 36,
        height: 36,
        borderRadius: 6,
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#71717a',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 150ms, border-color 150ms',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      >
        <Bell size={15} />
        <span style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#ef4444',
        }} />
      </button>

      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: display,
        fontWeight: 700,
        fontSize: 13,
        color: '#fff',
        cursor: 'pointer',
      }}>{initial}</div>
    </header>
  );
}
