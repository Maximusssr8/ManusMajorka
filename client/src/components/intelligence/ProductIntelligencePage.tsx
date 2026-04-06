import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { apiFetch } from '../../lib/api';
import { TrendingTodayTab } from './tabs/TrendingTodayTab';
import { FullDatabaseTab } from './tabs/FullDatabaseTab';
import { ScoutTab } from './tabs/ScoutTab';
import { StatsBar } from './components/StatsBar';

interface StatsData {
  total?: number;
  nicheCount?: number;
  hotCount?: number;
  avgScore?: number;
  topMarginNiche?: string;
  topMargin?: number;
  lastUpdated?: string;
}

export function ProductIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'trending' | 'database' | 'scout'>('trending');
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<StatsData>({
    queryKey: ['product-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await apiFetch('/api/products/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchStats();
    setTimeout(() => setRefreshing(false), 2000);
  };

  const tabs = [
    { id: 'trending' as const, label: '🔥 Trending Today', badge: null },
    { id: 'database' as const, label: '📦 Full Database', badge: null },
    { id: 'scout' as const, label: '🔍 Scout', badge: 'Soon' },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#080808' }}>
      {/* PAGE HEADER */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-semibold text-slate-100 tracking-tight">
              Product Intelligence
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {stats?.total?.toLocaleString() || '—'} winning products ·{' '}
              Updated {stats?.lastUpdated || '6h ago'} ·{' '}
              Powered by AliExpress API
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-1.5 text-emerald-400 text-[12px] px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live AliExpress data
            </div>
            <button
              onClick={() => window.open('/api/products/export?format=csv', '_blank')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 px-3 py-1.5 rounded-lg text-[13px] transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={refreshing ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <StatsBar stats={stats} isLoading={statsLoading} />
      </div>

      {/* TAB BAR */}
      <div
        className="flex mt-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080808', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' as any, paddingLeft: 24 }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.id !== 'scout' && setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3.5 text-[13px] font-medium border-b-2 transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'text-white border-indigo-500'
                : 'border-transparent hover:border-white/10'
            } ${tab.id === 'scout' ? 'cursor-default' : 'cursor-pointer'}`}
            style={{ color: activeTab === tab.id ? '#f1f5f9' : 'rgba(255,255,255,0.4)' }}
          >
            {tab.label}
            {tab.badge && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-indigo-400"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1">
        {activeTab === 'trending' && <TrendingTodayTab />}
        {activeTab === 'database' && <FullDatabaseTab />}
        {activeTab === 'scout' && <ScoutTab />}
      </div>
    </div>
  );
}
