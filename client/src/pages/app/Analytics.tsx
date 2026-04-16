import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Package, Star, Sparkles, FileText, Megaphone, Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CATEGORY_COLOURS = ['#4f8ef7','#10b981','#f59e0b','#f97316','#3b82f6','#ec4899','#14b8a6','#4f8ef7','#ef4444','#84cc16','#06b6d4','#4f8ef7','#78716c','#0ea5e9','#d946ef'];

interface MyActivity {
  briefs: number;
  ads: number;
  saves: number;
  topCategory?: string | null;
}

// Fix 6 — display "Uncategorised" instead of "general" and sort it to the bottom.
function normaliseAndSortCategories(raw: { category: string; count: number }[]): { category: string; count: number; isUncategorised: boolean }[] {
  const items = raw.map(c => {
    const isUnc = (c.category || '').trim().toLowerCase() === 'general';
    return {
      category: isUnc ? 'Uncategorised' : c.category,
      count: c.count,
      isUncategorised: isUnc,
    };
  });
  // Sort: real categories first (by count desc), then uncategorised at the bottom.
  return items.sort((a, b) => {
    if (a.isUncategorised && !b.isUncategorised) return 1;
    if (!a.isUncategorised && b.isUncategorised) return -1;
    return b.count - a.count;
  });
}

export default function Analytics() {
  const [overview, setOverview] = useState<{ total: number; score90: number; newThisWeek: number } | null>(null);
  const [categories, setCategories] = useState<{ category: string; count: number; isUncategorised: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<MyActivity | null>(null);
  const [recategorising, setRecategorising] = useState(false);
  const [recategoriseMsg, setRecategoriseMsg] = useState('');

  useEffect(() => {
    document.title = 'Analytics — Majorka';
    Promise.all([
      fetch('/api/products/analytics-overview').then(r => r.json()),
      fetch('/api/products/analytics-categories').then(r => r.json()),
    ]).then(([ov, cats]) => {
      setOverview(ov);
      setCategories(normaliseAndSortCategories(cats.categories || []));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Fix 7 — Your Activity (current month). Degrade gracefully on errors.
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch('/api/analytics/my-activity', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setActivity({
            briefs: Number(data.briefs ?? 0),
            ads: Number(data.ads ?? 0),
            saves: Number(data.saves ?? 0),
            topCategory: data.topCategory ?? null,
          });
        } else {
          setActivity({ briefs: 0, ads: 0, saves: 0, topCategory: null });
        }
      } catch {
        setActivity({ briefs: 0, ads: 0, saves: 0, topCategory: null });
      }
    })();
  }, []);

  const triggerRecategorise = async () => {
    setRecategorising(true);
    setRecategoriseMsg('');
    try {
      const adminToken = window.prompt('Admin token (X-Admin-Token):') || '';
      if (!adminToken) { setRecategorising(false); return; }
      const res = await fetch('/api/admin/recategorise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setRecategoriseMsg(`Re-categorised ${data.updated ?? 0} of ${data.attempted ?? 0} products.`);
        // Refresh categories list
        const cats = await fetch('/api/products/analytics-categories').then(r => r.json()).catch(() => ({ categories: [] }));
        setCategories(normaliseAndSortCategories(cats.categories || []));
      } else {
        const err = await res.json().catch(() => ({ error: 'failed' }));
        setRecategoriseMsg(`Error: ${err.error || res.status}`);
      }
    } catch {
      setRecategoriseMsg('Network error — try again.');
    } finally {
      setRecategorising(false);
    }
  };

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
          { label: 'Total Products', value: loading ? '—' : (overview?.total || 0).toLocaleString(), icon: Package, color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)', trend: 'Tracked in database' },
          { label: 'Score 90+', value: loading ? '—' : (overview?.score90 || 0).toLocaleString(), icon: Star, color: '#10b981', bg: 'rgba(16,185,129,0.12)', trend: `${elitePct}% of database` },
          { label: 'New This Week', value: loading ? '—' : (overview?.newThisWeek || 0).toLocaleString(), icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', trend: 'Added last 7 days' },
          { label: 'Categories', value: loading ? '—' : String(categories.length), icon: BarChart2, color: '#6ba3ff', bg: 'rgba(229,193,88,0.12)', trend: 'Across the database' },
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

      {/* Fix 7 — Your Activity (current month). 4 small tiles, gold mono numbers. */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Your Activity (this month)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'AI Briefs', value: activity?.briefs ?? 0, icon: FileText },
            { label: 'Ads Generated', value: activity?.ads ?? 0, icon: Megaphone },
            { label: 'Products Saved', value: activity?.saves ?? 0, icon: Bookmark },
            ...(activity?.topCategory ? [{ label: 'Top Category', value: activity.topCategory, icon: Sparkles }] : []),
          ].map(t => (
            <div key={t.label} style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <t.icon size={13} color="#4f8ef7" />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4f8ef7', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '-0.01em' }}>{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff' }}>Products by category</div>
          {/* Fix 6 — Re-categorise button (admin token gated). */}
          <button
            onClick={triggerRecategorise}
            disabled={recategorising}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.3)',
              color: '#4f8ef7', fontSize: 11, fontWeight: 600, cursor: recategorising ? 'wait' : 'pointer',
            }}
          >{recategorising ? 'Re-categorising…' : 'Re-categorise'}</button>
        </div>
        {recategoriseMsg && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>{recategoriseMsg}</div>
        )}
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
