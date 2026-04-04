import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ProductFilters } from '../hooks/useProductFilters';

const FILTER_PILLS = [
  { id: 'all', label: 'All Products' },
  { id: 'bestsellers', label: '🏆 Bestsellers' },
  { id: 'hot', label: '🔥 Trending' },
  { id: 'high_margin', label: '💰 High Margin' },
  { id: 'top_rated', label: '⭐ Top Rated' },
  { id: 'new_today', label: '🆕 New Today' },
];

const SORT_OPTIONS = [
  { value: 'orders', label: 'Most Orders' },
  { value: 'winning_score', label: 'Best Score' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

interface FilterBarProps {
  filters: ProductFilters;
  onFiltersChange: (updates: Partial<ProductFilters>) => void;
  totalCount?: number;
}

interface SuggestionItem {
  label: string;
  isHot?: boolean;
  avgOrders?: number;
}

interface SuggestionsResponse {
  suggestions?: SuggestionItem[];
}

export function FilterBar({ filters, onFiltersChange, totalCount }: FilterBarProps) {
  const { data: suggestions } = useQuery<SuggestionsResponse>({
    queryKey: ['niche-suggestions'],
    queryFn: () => fetch('/api/products/suggestions').then(r => r.json()),
  });

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
  const selectClass = "rounded-lg px-3 py-2 text-[12px] text-slate-400 outline-none cursor-pointer transition-colors flex-shrink-0";

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0a' }}>
      <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto">
        {/* Search */}
        <div className="relative flex-shrink-0 w-56">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={filters.search}
            onChange={e => onFiltersChange({ search: e.target.value })}
            placeholder="Search products..."
            className="w-full rounded-lg pl-9 pr-8 py-2 text-[13px] text-slate-100 outline-none transition-all"
            style={{ ...inputStyle, caretColor: '#f1f5f9' }}
          />
          {filters.search && (
            <button onClick={() => onFiltersChange({ search: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
          )}
        </div>

        <div className="w-px h-5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {FILTER_PILLS.map(pill => (
          <button
            key={pill.id}
            onClick={() => onFiltersChange({ filter: pill.id })}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0 ${filters.filter === pill.id ? 'bg-indigo-600 text-white' : 'text-white/45 hover:text-white/65'}`}
            style={filters.filter === pill.id ? {} : { border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {pill.label}
          </button>
        ))}

        <div className="w-px h-5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <select value={filters.niche} onChange={e => onFiltersChange({ niche: e.target.value })} className={selectClass} style={inputStyle}>
          <option value="">All Niches</option>
          {suggestions?.suggestions?.map((s: SuggestionItem) => <option key={s.label} value={s.label}>{s.label}</option>)}
        </select>

        <select value={filters.sort} onChange={e => onFiltersChange({ sort: e.target.value })} className={selectClass} style={inputStyle}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="ml-auto flex-shrink-0 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {totalCount?.toLocaleString()} results
        </div>
      </div>

      {!filters.search && suggestions?.suggestions && suggestions.suggestions.length > 0 && (
        <div className="px-6 pb-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] uppercase tracking-wider flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>Trending:</span>
          {suggestions.suggestions.slice(0, 8).map((s: SuggestionItem) => (
            <button key={s.label} onClick={() => onFiltersChange({ search: s.label })} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {s.isHot && <span className="text-orange-400 text-[10px]">🔥</span>}
              {s.label}
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>{((s.avgOrders || 0) / 1000).toFixed(0)}k</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
