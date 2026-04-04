import React from 'react';

interface Stats {
  total?: number;
  nicheCount?: number;
  hotCount?: number;
  avgScore?: number;
  topMarginNiche?: string;
  topMargin?: number;
}

export function StatsBar({ stats, isLoading }: { stats?: Stats; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 rounded-xl overflow-hidden mt-4" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRight: 'none' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-5 py-4 animate-pulse" style={{ background: '#0d0d0d', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-2.5 w-20 rounded mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-7 w-16 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-2 w-24 rounded mt-2" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    { label: 'Products tracked', value: stats?.total?.toLocaleString() || '—', sub: `across ${stats?.nicheCount || '—'} niches`, color: 'text-slate-100' },
    { label: 'Hot products', value: stats?.hotCount?.toLocaleString() || '—', sub: 'winning score ≥ 65', color: 'text-orange-400' },
    { label: 'Avg winning score', value: stats?.avgScore ? Math.round(stats.avgScore).toString() : '—', sub: 'out of 100', color: 'text-amber-400' },
    { label: 'Top margin niche', value: stats?.topMarginNiche || '—', sub: stats?.topMargin ? `${stats.topMargin}% avg margin` : 'calculating...', color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-4 rounded-xl overflow-hidden mt-4" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRight: 'none' }}>
      {metrics.map((m, i) => (
        <div key={i} className="px-5 py-4" style={{ background: '#0d0d0d', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[11px] text-white/30 uppercase tracking-[0.08em] font-medium mb-2">{m.label}</div>
          <div className={`text-[22px] font-semibold leading-none ${m.color}`}>{m.value}</div>
          <div className="text-[11px] mt-1.5 text-white/25">{m.sub}</div>
        </div>
      ))}
    </div>
  );
}
