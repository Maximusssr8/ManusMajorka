/**
 * AdminControlPanel — /app/admin
 * Only accessible to maximusmajorka@gmail.com
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'maximusmajorka@gmail.com';

const C = {
  bg: '#FAFAFA',
  surface: 'white',
  border: '#E5E7EB',
  gold: '#3B82F6',
  goldBg: 'rgba(59,130,246,0.08)',
  text: '#0A0A0A',
  sub: '#6B7280',
  muted: '#9CA3AF',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
};

type Tab = 'users' | 'trends' | 'subscriptions' | 'health';

async function apiCall<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || '';
  if (!token) {
    throw new Error('Not signed in — refresh the page and sign in again');
  }
  const res = await fetch(`/api/admin${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.error || body.message || '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
  }
  return (await res.json()) as T;
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diag, setDiag] = useState<Record<string, unknown> | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    setWarning(null);
    apiCall<{ users: any[]; total: number; warning?: string }>('/users')
      .then((d) => {
        setUsers(d.users || []);
        setTotal(d.total || 0);
        if (d.warning) setWarning(d.warning);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  };

  const runDiagnose = async () => {
    setDiagLoading(true);
    setDiag(null);
    try {
      const d = await apiCall<Record<string, unknown>>('/_diagnose');
      setDiag(d);
    } catch (e: any) {
      setError(e?.message || 'Diagnose failed');
    } finally {
      setDiagLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updatePlan = async (userId: string, plan: string, status = 'active') => {
    setUpdatingId(userId);
    setError(null);
    try {
      await apiCall(`/users/${userId}/plan`, {
        method: 'POST',
        body: JSON.stringify({ plan, status }),
      });
      load();
    } catch (e: any) {
      setError(e?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div style={{ fontSize: 13, color: C.sub }}>
          <span style={{ color: C.text, fontWeight: 700 }}>{total}</span> total users
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={runDiagnose}
            disabled={diagLoading}
            style={{ padding: '7px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontSize: 12, cursor: 'pointer' }}
          >
            {diagLoading ? 'Diagnosing…' : 'Diagnose env'}
          </button>
          <button
            onClick={load}
            style={{ padding: '7px 12px', background: '#3B82F6', border: '1px solid #3B82F6', borderRadius: 8, color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
          >
            Refresh
          </button>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by email..."
            style={{ padding: '7px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, width: 220 }}
          />
        </div>
      </div>
      {warning && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, color: C.amber, fontSize: 12 }}>
          <strong>Warning:</strong> {warning}
        </div>
      )}
      {diag && (
        <div style={{ marginBottom: 16, padding: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>Environment diagnosis</div>
          {Object.entries(diag).map(([k, v]) => {
            const isBoolLike = typeof v === 'boolean' || k.endsWith('_set') || k.endsWith('_ok');
            const good = typeof v === 'boolean' ? v : v !== null && v !== false && v !== '' && v !== undefined;
            return (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.sub }}>{k}</span>
                <span style={{ color: isBoolLike ? (good ? C.green : C.red) : C.text }}>
                  {typeof v === 'boolean' ? (v ? '✓ true' : '✗ false') : String(v)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: C.red, fontSize: 12 }}>
          <strong>Request failed:</strong> {error}
          <button onClick={load} style={{ marginLeft: 12, padding: '2px 8px', background: 'transparent', border: `1px solid ${C.red}`, color: C.red, borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Retry</button>
        </div>
      )}
      {loading ? (
        <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Email', 'Plan', 'Status', 'Created', 'Last Sign In', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left' as const, color: C.muted, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <td style={{ padding: '10px 12px', color: C.text }}>{u.email}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: ['pro','builder','scale'].includes(u.plan) ? C.goldBg : '#F9FAFB',
                      color: ['pro','builder','scale'].includes(u.plan) ? C.gold : C.muted,
                    }}>{u.plan || 'free'}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: u.status === 'active' ? C.green : C.muted, fontSize: 12 }}>{u.status || '—'}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: C.muted }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-AU') : '—'}</td>
                  <td style={{ padding: '10px 12px', color: C.muted }}>{u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString('en-AU') : '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select
                        defaultValue={u.plan || 'free'}
                        onChange={e => updatePlan(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                        style={{ padding: '4px 6px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontSize: 11, cursor: 'pointer' }}
                      >
                        {['free','pro','builder','scale'].map(p => <option key={p} value={p} style={{ background: '#0d0d10' }}>{p}</option>)}
                      </select>
                      <button
                        onClick={() => updatePlan(u.id, 'pro', 'active')}
                        disabled={updatingId === u.id}
                        style={{ padding: '4px 8px', background: C.goldBg, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 5, color: C.gold, fontSize: 11, cursor: 'pointer' }}
                      >Grant Pro</button>
                      <button
                        onClick={() => updatePlan(u.id, u.plan || 'free', 'inactive')}
                        disabled={updatingId === u.id}
                        style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 5, color: C.red, fontSize: 11, cursor: 'pointer' }}
                      >Revoke</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Trends Tab ────────────────────────────────────────────────────────────────
function TrendsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', niche: '', estimated_retail_aud: '', estimated_margin_pct: '', trend_score: '', dropship_viability_score: '', trend_reason: '' });

  const load = () => {
    setLoading(true);
    apiCall('/trend-signals').then(d => { setProducts(d.products || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token || '';
      return fetch('/api/cron/refresh-trends', { headers: { Authorization: `Bearer ${token}` } });
    });
    await new Promise(r => setTimeout(r, 3000));
    load();
    setRefreshing(false);
  };

  const clearAll = async () => {
    if (!confirm('Delete ALL trend signals? This cannot be undone.')) return;
    await apiCall('/trend-signals', { method: 'DELETE' });
    load();
  };

  const addProduct = async () => {
    await apiCall('/trend-signals', { method: 'POST', body: JSON.stringify(form) });
    setShowAddForm(false);
    setForm({ name: '', niche: '', estimated_retail_aud: '', estimated_margin_pct: '', trend_score: '', dropship_viability_score: '', trend_reason: '' });
    load();
  };

  const lastRefreshed = products[0]?.refreshed_at ? new Date(products[0].refreshed_at) : null;
  const hoursAgo = lastRefreshed ? Math.round((Date.now() - lastRefreshed.getTime()) / 3600000) : null;
  const nextIn = hoursAgo !== null ? Math.max(0, 6 - (hoursAgo % 6)) : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.sub }}>
          {lastRefreshed && <span>Last refreshed: <strong style={{ color: C.text }}>{hoursAgo}h ago</strong> · Next in: <strong style={{ color: C.text }}>{nextIn}h</strong></span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '7px 14px', background: C.goldBg, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 7, color: C.gold, fontSize: 12, cursor: 'pointer' }}>+ Add Product</button>
          <button onClick={refresh} disabled={refreshing} style={{ padding: '7px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 12, cursor: 'pointer' }}>
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </button>
          <button onClick={clearAll} style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 7, color: C.red, fontSize: 12, cursor: 'pointer' }}>Clear All</button>
        </div>
      </div>

      {showAddForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            {([['name','Product Name'],['niche','Niche'],['estimated_retail_aud','Price AUD'],['estimated_margin_pct','Margin %'],['trend_score','Trend Score (0-100)'],['dropship_viability_score','Viability (0-10)']] as [string,string][]).map(([k, label]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
                <input value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '6px 10px', background: '#0d0d10', border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, boxSizing: 'border-box' as const }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Why Trending</div>
            <input value={form.trend_reason} onChange={e => setForm(f => ({ ...f, trend_reason: e.target.value }))}
              style={{ width: '100%', padding: '6px 10px', background: '#0d0d10', border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addProduct} style={{ padding: '7px 16px', background: C.gold, border: 'none', borderRadius: 7, color: '#FAFAFA', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            <button onClick={() => setShowAddForm(false)} style={{ padding: '7px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, color: C.sub, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: C.muted, textAlign: 'center' as const, padding: 40 }}>Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Product','Niche','Score','Viability','Margin','Price','Refreshed'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left' as const, color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <td style={{ padding: '10px 12px', color: C.text, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '10px 12px', color: C.sub }}>{p.niche}</td>
                  <td style={{ padding: '10px 12px', color: p.trend_score >= 80 ? C.red : p.trend_score >= 60 ? C.amber : C.sub, fontWeight: 800 }}>{p.trend_score}</td>
                  <td style={{ padding: '10px 12px', color: p.dropship_viability_score >= 8 ? C.green : C.sub }}>{p.dropship_viability_score}/10</td>
                  <td style={{ padding: '10px 12px', color: '#10b981' }}>{p.estimated_margin_pct}%</td>
                  <td style={{ padding: '10px 12px', color: C.text }}>${p.estimated_retail_aud}</td>
                  <td style={{ padding: '10px 12px', color: C.muted }}>{p.refreshed_at ? new Date(p.refreshed_at).toLocaleDateString('en-AU') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', plan: 'pro', status: 'active' });

  const load = () => {
    setLoading(true);
    apiCall('/subscriptions').then(d => { setSubs(d.subscriptions || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addSub = async () => {
    await apiCall('/subscriptions', { method: 'POST', body: JSON.stringify(addForm) });
    setShowAdd(false);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '7px 14px', background: C.goldBg, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 7, color: C.gold, fontSize: 12, cursor: 'pointer' }}>+ Manual Subscription</button>
      </div>

      {showAdd && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          {([['email','Email'],['plan','Plan'],['status','Status']] as [string,string][]).map(([k, label]) => (
            <div key={k} style={{ flex: k === 'email' ? 2 : 1 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
              {k === 'plan' ? (
                <select value={addForm.plan} onChange={e => setAddForm(f => ({ ...f, plan: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', background: '#0d0d10', border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12 }}>
                  {['pro','builder','scale','free'].map(p => <option key={p} value={p} style={{ background: '#0d0d10' }}>{p}</option>)}
                </select>
              ) : (
                <input value={(addForm as any)[k]} onChange={e => setAddForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', background: '#0d0d10', border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12 }} />
              )}
            </div>
          ))}
          <button onClick={addSub} style={{ padding: '7px 16px', background: C.gold, border: 'none', borderRadius: 7, color: '#FAFAFA', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Add</button>
        </div>
      )}

      {loading ? <div style={{ color: C.muted, textAlign: 'center' as const, padding: 40 }}>Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Email','Plan','Status','Period End','Stripe ID',''].map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', textAlign: 'left' as const, color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <td style={{ padding: '10px 12px', color: C.text }}>{s.email}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: C.goldBg, color: C.gold }}>{s.plan}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: s.status === 'active' ? C.green : C.muted }}>{s.status}</td>
                  <td style={{ padding: '10px 12px', color: C.muted }}>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('en-AU') : '—'}</td>
                  <td style={{ padding: '10px 12px', color: C.muted, fontFamily: 'monospace', fontSize: 11 }}>{s.stripe_customer_id || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {s.stripe_customer_id && (
                      <a href={`https://dashboard.stripe.com/customers/${s.stripe_customer_id}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: C.gold, textDecoration: 'none' }}>Stripe</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Health Tab ────────────────────────────────────────────────────────────────
function HealthTab() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [scrapingReal, setScrapingReal] = useState(false);
  const [refreshingAE, setRefreshingAE] = useState(false);
  const [refreshingRapid, setRefreshingRapid] = useState(false);

  const load = () => {
    setLoading(true);
    apiCall('/system-health').then(d => { setHealth(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ color: C.muted, textAlign: 'center' as const, padding: 40 }}>Loading...</div>;
  if (!health) return <div style={{ color: C.red, textAlign: 'center' as const, padding: 40 }}>Failed to load health data.</div>;

  const checks = [
    { label: 'Supabase', value: health.supabase ? 'Connected' : 'Disconnected', ok: health.supabase },
    { label: 'Stripe Mode', value: health.stripe?.mode === 'live' ? 'Live Mode' : 'Test Mode', ok: health.stripe?.mode === 'live' },
    { label: 'Last Cron Run', value: health.cron?.lastRun ? new Date(health.cron.lastRun).toLocaleString('en-AU') : 'Never', ok: !!health.cron?.lastRun },
  ];

  const counts = [
    { label: 'Total Users', value: health.counts?.users ?? '—' },
    { label: 'Winning Products', value: health.counts?.products ?? '—' },
    { label: 'Generated Stores', value: health.counts?.stores ?? '—' },
    { label: 'Trend Signals', value: health.counts?.trendSignals ?? '—' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        {checks.map(c => (
          <div key={c.label} style={{ background: C.surface, border: `1px solid ${c.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{c.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.ok ? C.green : C.red }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        {counts.map(c => (
          <div key={c.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' as const }}>
        <button onClick={load} style={{ padding: '9px 20px', background: C.goldBg, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 8, color: C.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Run All Checks
        </button>
        <button
          onClick={async () => {
            try {
              setEnriching(true);
              const data = await apiCall('/enrich-products', { method: 'POST' });
              alert(`${data.message || 'Done!'}\nEnriched: ${data.enriched ?? '?'} / Total: ${data.total ?? '?'}\n${data.error ? 'Error: ' + data.error : ''}`);
            } catch (e: any) {
              alert('Error: ' + e.message);
            } finally {
              setEnriching(false);
            }
          }}
          disabled={enriching}
          style={{ marginLeft: 8, padding: '9px 16px', background: '#3B82F6', color: '#000', border: 'none', borderRadius: 6, cursor: enriching ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: enriching ? 0.7 : 1 }}
        >
          {enriching ? 'Enriching…' : '⚡ Enrich Products'}
        </button>
        <button
          onClick={async () => {
            try {
              const data = await apiCall('/run-supplier-migration', { method: 'POST' });
              alert(JSON.stringify(data, null, 2));
            } catch (e: any) {
              alert('Error: ' + e.message);
            }
          }}
          style={{ marginLeft: 8, padding: '9px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          🔧 Supplier Migration
        </button>
        <button
          onClick={async () => {
            try {
              const data = await apiCall('/run-user-tables-migration', { method: 'POST' });
              alert(JSON.stringify(data, null, 2));
            } catch (e: any) {
              alert('Error: ' + e.message);
            }
          }}
          style={{ marginLeft: 8, padding: '9px 16px', background: '#1a1a1a', color: '#e5c158', border: '1px solid #3b1f6b', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          🗃️ User Tables
        </button>
        <button
          onClick={async () => {
            const n = prompt('How many products to scrape? (max 20, default 5)', '5');
            if (n === null) return;
            try {
              const data = await apiCall('/scrape-aliexpress', { method: 'POST', body: JSON.stringify({ limit: parseInt(n) || 5 }) });
              alert(`${data.message || 'Done!'}\n\n${data.results?.map((r: any) => `${r.success ? '✅' : '❌'} ${r.name.slice(0,35)} | $${r.priceUsd ?? '?'} | ${r.imageCount} imgs`).join('\n') || JSON.stringify(data)}`);
            } catch (e: any) {
              alert('Error: ' + e.message);
            }
          }}
          style={{ marginLeft: 8, padding: '9px 16px', background: '#1a1a1a', color: '#7dd3fc', border: '1px solid #1e3a5f', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          🔍 Scrape AliExpress
        </button>
        <button
          onClick={async () => {
            try {
              setScrapingReal(true);
              // apiCall already parses JSON — no .json() needed
              const data = await apiCall('/scrape-real-data', { method: 'POST' });
              if (data.sql) {
                alert(`Run this SQL in Supabase first:\n\n${data.sql}`);
              } else {
                alert(`${data.message || 'Done!'}\nScraped: ${data.scraped ?? '?'} / ${data.total ?? '?'} products`);
              }
            } catch (e: any) {
              alert('Error: ' + e.message);
            } finally {
              setScrapingReal(false);
            }
          }}
          disabled={scrapingReal}
          style={{ marginLeft: 8, padding: '9px 16px', background: '#2a9d8f', color: '#fff', border: 'none', borderRadius: 6, cursor: scrapingReal ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: scrapingReal ? 0.7 : 1 }}
        >
          {scrapingReal ? 'Scraping…' : '🔍 Scrape Real Data'}
        </button>
        <button
          onClick={async () => {
            try {
              setRefreshingAE(true);
              const data = await apiCall('/refresh-from-aliexpress', { method: 'POST' });
              if (data.error && data.authUrl) {
                alert(`❌ Not authorized yet!\n\nVisit to authorize:\n${data.authUrl}`);
              } else {
                alert(`✅ Refreshed ${data.refreshed} products from AliExpress API across ${data.niches} niches!`);
              }
            } catch (e: any) {
              alert('Error: ' + e.message);
            } finally {
              setRefreshingAE(false);
            }
          }}
          disabled={refreshingAE}
          style={{ marginLeft: 8, padding: '9px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, cursor: refreshingAE ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: refreshingAE ? 0.7 : 1 }}
        >
          {refreshingAE ? 'Refreshing…' : '🔴 Refresh from AliExpress'}
        </button>
        <button
          onClick={async () => {
            try {
              setRefreshingRapid(true);
              const data = await apiCall('/refresh-db-rapidapi', { method: 'POST' });
              const summary = (data.results || []).map((r: any) => `${r.niche}: ${r.count ?? 0} ${r.error ? '❌' : '✅'}`).join('\n');
              alert(`✅ Refreshed ${data.total} products via RapidAPI!\n\n${summary}`);
            } catch (e: any) {
              alert('Error: ' + e.message);
            } finally {
              setRefreshingRapid(false);
            }
          }}
          disabled={refreshingRapid}
          style={{ marginLeft: 8, padding: '9px 16px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: 6, cursor: refreshingRapid ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: refreshingRapid ? 0.7 : 1 }}
        >
          {refreshingRapid ? 'Refreshing…' : '⚡ Refresh DB (RapidAPI)'}
        </button>
        <button
          onClick={async () => {
            try {
              const data = await apiCall('/aliexpress-status');
              alert(`AliExpress Status:\n\nApp Key: ${data.appKey}\nApp Secret: ${data.appSecret}\n\n${data.authorized ? '✅ API Ready!' : '⚠️ Check credentials'}`);
            } catch (e: any) {
              alert('Error: ' + e.message);
            }
          }}
          style={{ marginLeft: 8, padding: '9px 16px', background: '#1a1a1a', color: '#f39c12', border: '1px solid #5a3a00', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          🛒 AliExpress Status
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminControlPanel() {
  const [, setLocation] = useLocation();
  const { session, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { setAuthorized(false); return; }
    const email = session?.user?.email;
    const isAdmin = email === ADMIN_EMAIL;
    setAuthorized(isAdmin);
    if (!isAdmin && email) {
      setLocation('/app');
    }
  }, [isAuthenticated, session, setLocation]);

  if (authorized === null || !authorized) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted }}>{authorized === null ? 'Checking access...' : 'Redirecting...'}</div>
    </div>
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: 'users', label: 'Users' },
    { id: 'trends', label: 'Trend Data' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'health', label: 'System Health' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800, color: C.text, margin: 0, marginBottom: 4 }}>
              Admin Control Panel
            </h1>
            <div style={{ fontSize: 13, color: C.muted }}>Majorka internal tools · {session?.user?.email}</div>
          </div>
          <button onClick={() => setLocation('/app')} style={{ padding: '8px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontSize: 12, cursor: 'pointer' }}>
            Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#05070F', border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Bricolage Grotesque', sans-serif",
              background: tab === t.id ? C.gold : 'transparent',
              color: tab === t.id ? '#FAFAFA' : C.sub,
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          {tab === 'users' && <UsersTab />}
          {tab === 'trends' && <TrendsTab />}
          {tab === 'subscriptions' && <SubscriptionsTab />}
          {tab === 'health' && <HealthTab />}
        </div>
      </div>
    </div>
  );
}
