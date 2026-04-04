import React, { useState } from 'react';

export interface FilterState {
  categories: string[];
  revenueMin: number;
  revenueMax: number;
  growthFilter: 'all' | 'growing' | 'rapid' | 'declining';
  scoreMin: number;
  marginFilter: ('high' | 'medium' | 'low')[];
}

export const DEFAULT_FILTERS: FilterState = {
  categories: [],
  revenueMin: 0,
  revenueMax: 999999999, // no upper cap by default — AliExpress products have high order counts
  growthFilter: 'all',
  scoreMin: 0,
  marginFilter: [],
};

interface Props {
  open: boolean;
  onToggle: () => void;
  categories: string[];
  onFiltersChange: (f: FilterState) => void;
}

export function ProductFilterSidebar({ open, onToggle, categories, onFiltersChange }: Props) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const brico = "'Bricolage Grotesque', sans-serif";

  const update = (partial: Partial<FilterState>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    onFiltersChange(next);
  };

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    update({ categories: next });
  };

  const toggleMargin = (m: 'high' | 'medium' | 'low') => {
    const next = filters.marginFilter.includes(m)
      ? filters.marginFilter.filter(x => x !== m)
      : [...filters.marginFilter, m];
    update({ marginFilter: next });
  };

  const reset = () => { setFilters(DEFAULT_FILTERS); onFiltersChange(DEFAULT_FILTERS); };

  const sectionTitle = (label: string) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8, marginTop: 16 }}>
      {label}
    </div>
  );

  const checkPill = (label: string, checked: boolean, onClick: () => void) => (
    <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onClick} style={{ accentColor: '#6366F1', width: 14, height: 14, cursor: 'pointer' }} />
      <span style={{ fontSize: 12, color: 'var(--cell-text, #374151)' }}>{label}</span>
    </label>
  );

  return (
    <>
      {/* Toggle button */}
      <button onClick={onToggle}
        style={{ position: 'fixed' as const, left: open ? 228 : 0, top: '50%', transform: 'translateY(-50%)', width: 20, height: 48, background: 'var(--card-bg, white)', border: '1px solid var(--border-color, #E5E7EB)', borderLeft: open ? '1px solid var(--border-color, #E5E7EB)' : 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', zIndex: 50, fontSize: 10, color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'left 300ms ease', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
        {open ? '\u2039' : '\u203A'}
      </button>

      {/* Sidebar */}
      <div style={{
        position: 'fixed' as const, left: 0, top: 0, bottom: 0, width: open ? 228 : 0, background: 'var(--card-bg, white)',
        borderRight: '1px solid var(--border-color, #E5E7EB)', overflowX: 'hidden' as const, overflowY: open ? 'auto' as const : 'hidden' as const,
        transition: 'width 300ms ease', zIndex: 40, boxShadow: open ? '4px 0 16px rgba(0,0,0,0.1)' : 'none',
      }}>
        <div style={{ width: 228, padding: '60px 16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontFamily: brico, fontWeight: 700, fontSize: 14, color: 'var(--content-text, #0A0A0A)' }}>Filters</span>
            <button onClick={reset} style={{ fontSize: 11, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset</button>
          </div>

          {sectionTitle('\uD83D\uDCE6 Category')}
          {categories.slice(0, 10).map(cat => checkPill(cat, filters.categories.includes(cat), () => toggleCategory(cat)))}

          {sectionTitle('\uD83D\uDCC8 Revenue Growth')}
          {(['all', 'growing', 'rapid', 'declining'] as const).map(g => (
            <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
              <input type="radio" checked={filters.growthFilter === g} onChange={() => update({ growthFilter: g })} style={{ accentColor: '#6366F1', cursor: 'pointer' }} />
              <span style={{ fontSize: 12, color: '#CBD5E1' }}>
                {g === 'all' ? 'All rates' : g === 'growing' ? 'Growing (>0%)' : g === 'rapid' ? 'Rapid (>20%)' : 'Declining (<0%)'}
              </span>
            </label>
          ))}

          {sectionTitle('\uD83C\uDFAF Min AI Score')}
          <div style={{ padding: '0 2px' }}>
            <input type="range" min={50} max={95} value={filters.scoreMin} onChange={e => update({ scoreMin: +e.target.value })}
              style={{ width: '100%', accentColor: '#6366F1' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              <span>50</span>
              <span style={{ fontWeight: 700, color: '#6366F1' }}>{filters.scoreMin}+</span>
              <span>95</span>
            </div>
          </div>

          {sectionTitle('\uD83D\uDC8E Margin')}
          {checkPill('High (>50%)', filters.marginFilter.includes('high'), () => toggleMargin('high'))}
          {checkPill('Medium (30\u201350%)', filters.marginFilter.includes('medium'), () => toggleMargin('medium'))}
          {checkPill('Low (<30%)', filters.marginFilter.includes('low'), () => toggleMargin('low'))}

          {sectionTitle('\uD83D\uDCB0 Revenue Range')}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>Min</div>
              <input type="number" value={filters.revenueMin} onChange={e => update({ revenueMin: +e.target.value })}
                style={{ width: '100%', height: 30, padding: '0 8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 12, outline: 'none' }} placeholder="$0" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>Max</div>
              <input type="number" value={filters.revenueMax} onChange={e => update({ revenueMax: +e.target.value })}
                style={{ width: '100%', height: 30, padding: '0 8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 12, outline: 'none' }} placeholder="$200k" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
