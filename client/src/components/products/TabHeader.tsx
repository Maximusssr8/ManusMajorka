/**
 * TabHeader — the Products page top-bar: three data-distinct tabs
 * (Trending / Hot / High Volume). Each tab shows its Lucide icon, label,
 * and current result count. The active tab renders a gold underline.
 *
 * Tap target: full 44px height — click anywhere on the tab, not just the text.
 */
import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Flame, TrendingUp, ShoppingBag } from 'lucide-react';

export type ProductsTabKey = 'trending' | 'hot' | 'high-volume';

interface TabDef {
  key: ProductsTabKey;
  label: string;
  sublabel: string;
  Icon: LucideIcon;
}

export const PRODUCT_TABS: ReadonlyArray<TabDef> = [
  { key: 'trending',    label: 'Trending',      sublabel: '7d velocity leaders',   Icon: TrendingUp },
  { key: 'hot',         label: 'Hot Products',  sublabel: 'New last 48 hours',     Icon: Flame },
  { key: 'high-volume', label: 'High Volume',   sublabel: 'Evergreen all-time',    Icon: ShoppingBag },
];

interface TabHeaderProps {
  active: ProductsTabKey;
  counts: Readonly<Record<ProductsTabKey, number>>;
  loading?: Readonly<Partial<Record<ProductsTabKey, boolean>>>;
  onChange: (key: ProductsTabKey) => void;
}

function TabHeaderImpl({ active, counts, loading, onChange }: TabHeaderProps) {
  return (
    <div
      role="tablist"
      aria-label="Products tabs"
      style={{
        display: 'flex',
        gap: 8,
        padding: '4px 4px',
        background: '#111111',
        border: '1px solid #1a1a1a',
        borderRadius: 12,
      }}
    >
      {PRODUCT_TABS.map((t) => {
        const isActive = active === t.key;
        const count = counts[t.key];
        const isLoading = Boolean(loading?.[t.key]);
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              flex: 1,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 12,
              padding: '8px 14px',
              background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(212,175,55,0.35)' : 'transparent'}`,
              borderRadius: 10,
              color: isActive ? '#f5f5f5' : '#a3a3a3',
              cursor: 'pointer',
              transition: 'background 160ms ease, border 160ms ease, color 160ms ease',
              textAlign: 'left',
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <t.Icon
              size={18}
              strokeWidth={1.75}
              style={{ color: isActive ? '#d4af37' : '#737373', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: "'Syne', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: isActive ? '#f5f5f5' : '#d4d4d4',
                }}
              >
                {t.label}
              </span>
              <span style={{ fontSize: 11, color: '#737373', marginTop: 2 }}>{t.sublabel}</span>
            </div>
            <span
              className="mj-num"
              style={{
                fontSize: 11,
                padding: '2px 7px',
                color: isActive ? '#d4af37' : '#737373',
                background: isActive ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 6,
                minWidth: 28,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              {isLoading ? '…' : count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const TabHeader = memo(TabHeaderImpl);
export default TabHeader;
