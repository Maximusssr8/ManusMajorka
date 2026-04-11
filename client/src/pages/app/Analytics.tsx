import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Package, Star } from 'lucide-react';
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton';

const CATEGORY_COLOURS = ['#3b82f6','#10b981','#f59e0b','#f97316','#3b82f6','#ec4899','#14b8a6','#888888','#ef4444','#84cc16','#06b6d4','#a855f7','#78716c','#0ea5e9','#d946ef'];

export default function Analytics() {
  const [overview, setOverview] = useState<{ total: number; score90: number; newThisWeek: number } | null>(null);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Analytics — Majorka';
    Promise.all([
      fetch('/api/products/analytics-overview').then(r => r.json()),
      fetch('/api/products/analytics-categories').then(r => r.json()),
    ]).then(([ov, cats]) => {
      setOverview(ov);
      setCategories(cats.categories || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="space-y-2">
        <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    </div>
  );

  const maxCatCount = Math.max(...categories.map(c => c.count), 1);
  const elitePct = overview ? Math.round((overview.score90 / Math.max(overview.total, 1)) * 100) : 0;

  return (
    <div style={{ padding: 32, minHeight: '100vh' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Home / Analytics</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', margin: 0, letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Platform intelligence snapshot</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: loading ? '—' : (overview?.total || 0).toLocaleString(), icon: Package, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', trend: 'Tracked in database' },
          { label: 'Score 90+', value: loading ? '—' : (overview?.score90 || 0).toLocaleString(), icon: Star, color: '#10b981', bg: 'rgba(16,185,129,0.12)', trend: `${elitePct}% of database` },
          { label: 'New This Week', value: loading ? '—' : (overview?.newThisWeek || 0).toLocaleString(), icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', trend: 'Added last 7 days' },
          { label: 'Categories', value: loading ? '—' : String(categories.length), icon: BarChart2, color: '#cccccc', bg: 'rgba(204,204,204,0.12)', trend: 'Across the database' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <kpi.icon size={16} color={kpi.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)' }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{kpi.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 20 }}>Products by category</div>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {categories.map((cat, i) => (
              <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 160, fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.category}</div>
                <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 5, width: `${(cat.count / maxCatCount) * 100}%`, background: CATEGORY_COLOURS[i % CATEGORY_COLOURS.length], transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ width: 48, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textAlign: 'right', flexShrink: 0 }}>{cat.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 20 }}>Score distribution</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { range: '90–100', label: 'Elite', pct: elitePct, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
            { range: '75–89', label: 'Strong', pct: 24, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
            { range: '50–74', label: 'Moderate', pct: 33, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
            { range: '<50', label: 'Low', pct: overview ? 100 - elitePct - 24 - 33 : 10, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
          ].map(tier => (
            <div key={tier.range} style={{ background: tier.bg, border: `1px solid ${tier.color}30`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: tier.color, marginBottom: 4 }}>{tier.pct}%</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{tier.range}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{tier.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
