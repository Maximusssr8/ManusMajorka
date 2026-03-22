import { lazy, Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';

const CreatorIntelligence = lazy(() => import('./CreatorIntelligence'));
const VideoIntelligence = lazy(() => import('./VideoIntelligence'));

type TabKey = 'market' | 'creators' | 'videos';

const C = { bg: '#080a0e', surface: '#111118', border: '#1e1e1e', gold: '#6366F1', text: '#f0ede8', muted: 'rgba(240,237,232,0.5)' };

interface NicheStat {
  niche: string;
  count: number;
  avgScore: number;
  avgMargin: number;
}

export default function SpyTools() {
  const [tab, setTab] = useState<TabKey>('market');
  const [nicheList, setNicheList] = useState<NicheStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('trend_signals')
      .select('niche,trend_score,estimated_margin_pct')
      .then(({ data }) => {
        if (!data || data.length === 0) {
          // Seed data
          setNicheList([
            { niche: 'Health & Wellness', count: 12, avgScore: 82, avgMargin: 64 },
            { niche: 'Beauty & Skincare', count: 9, avgScore: 78, avgMargin: 71 },
            { niche: 'Home & Kitchen', count: 8, avgScore: 74, avgMargin: 58 },
            { niche: 'Fitness', count: 7, avgScore: 71, avgMargin: 62 },
            { niche: 'Pet', count: 5, avgScore: 68, avgMargin: 55 },
            { niche: 'Tech Gadgets', count: 4, avgScore: 65, avgMargin: 48 },
          ]);
        } else {
          const stats: Record<string, { count: number; totalScore: number; totalMargin: number }> = {};
          data.forEach((p: any) => {
            const n = p.niche || 'Other';
            if (!stats[n]) stats[n] = { count: 0, totalScore: 0, totalMargin: 0 };
            stats[n].count++;
            stats[n].totalScore += p.trend_score || 0;
            stats[n].totalMargin += p.estimated_margin_pct || 0;
          });
          const list = Object.entries(stats)
            .map(([niche, s]) => ({ niche, count: s.count, avgScore: Math.round(s.totalScore / s.count), avgMargin: Math.round(s.totalMargin / s.count) }))
            .sort((a, b) => b.avgScore - a.avgScore);
          setNicheList(list);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet><title>Spy Tools | Majorka</title></Helmet>
      <div style={{ padding: '24px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: C.text, margin: 0, marginBottom: 4 }}>Spy Tools</h1>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, marginBottom: 20 }}>Market overview, AU creators, trending video hooks</p>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {(['market', 'creators', 'videos'] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? C.gold : 'rgba(255,255,255,0.04)',
              color: tab === t ? '#080a0e' : C.muted,
              fontFamily: 'Syne, sans-serif',
            }}>
              {t === 'market' ? 'Market Overview' : t === 'creators' ? 'Creators' : 'Video Inspiration'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'market' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading market data...</div>
            ) : (
              <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 16 }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#52525b', fontFamily: 'Syne, sans-serif' }}>NICHE</span>
                  <span style={{ width: 200, fontSize: 12, fontWeight: 700, color: '#52525b', fontFamily: 'Syne, sans-serif' }}>TREND SCORE</span>
                  <span style={{ width: 60, fontSize: 12, fontWeight: 700, color: '#52525b', textAlign: 'right' }}>MARGIN</span>
                  <span style={{ width: 60, fontSize: 12, fontWeight: 700, color: '#52525b', textAlign: 'right' }}>COUNT</span>
                </div>
                {nicheList.map((item, i) => (
                  <div key={item.niche} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: i < nicheList.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{ width: 20, color: C.muted, fontSize: 12, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.niche}</span>
                    </div>
                    <div style={{ width: 200, position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${item.avgScore}%`, height: '100%', background: C.gold, borderRadius: 3, opacity: 0.8 }} />
                      </div>
                      <span style={{ width: 30, textAlign: 'right', fontSize: 13, color: C.gold, fontWeight: 700 }}>{item.avgScore}</span>
                    </div>
                    <span style={{ width: 60, textAlign: 'right', fontSize: 13, color: '#10b981', fontWeight: 600 }}>{item.avgMargin}%</span>
                    <span style={{ width: 60, textAlign: 'right', fontSize: 12, color: C.muted }}>{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'creators' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <CreatorIntelligence />
          </Suspense>
        )}

        {tab === 'videos' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <VideoIntelligence />
          </Suspense>
        )}
      </div>
    </div>
  );
}
