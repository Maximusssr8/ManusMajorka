/**
 * AdminControlPanel — /app/admin
 * Comprehensive admin panel — only accessible to maximusmajorka@gmail.com
 * Tabs: Users, Promo Codes, Roles, Analytics, System Health, Broadcast
 */
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'maximusmajorka@gmail.com';

// ── Dark design tokens ───────────────────────────────────────────────────────
const C = {
  bg: '#04060f',
  surface: '#0d1117',
  surfaceHover: '#161b22',
  border: '#161b22',
  borderLight: '#21262d',
  accent: '#6366f1',
  accentBg: 'rgba(99,102,241,0.10)',
  accentBorder: 'rgba(99,102,241,0.25)',
  text: '#f0f4ff',
  sub: '#8b949e',
  muted: '#484f58',
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,0.10)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.10)',
  amber: '#f59e0b',
  amberBg: 'rgba(245,158,11,0.10)',
  cyan: '#22d3ee',
};

const FONT = {
  heading: "'Syne', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
};

type Tab = 'users' | 'promo' | 'roles' | 'analytics' | 'health' | 'broadcast';

function apiCall(path: string, opts?: RequestInit) {
  return supabase.auth.getSession().then(({ data }) => {
    const token = data.session?.access_token || '';
    const adminSecret = import.meta.env.VITE_ADMIN_SECRET || '';
    return fetch(`/api/admin${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Admin-Token': adminSecret,
        ...(opts?.headers || {}),
      },
    }).then(r => r.json());
  });
}

// ── Shared Components ────────────────────────────────────────────────────────

function StatCard({ label, value, sub: subtitle, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT.body }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || C.text, fontFamily: FONT.mono }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: bg, color, letterSpacing: '0.02em',
    }}>{text}</span>
  );
}

function Btn({ children, onClick, variant = 'default', disabled = false, style: extraStyle }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'default' | 'accent' | 'danger' | 'ghost';
  disabled?: boolean; style?: React.CSSProperties;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: C.surface, border: `1px solid ${C.borderLight}`, color: C.text },
    accent: { background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent },
    danger: { background: C.redBg, border: `1px solid rgba(239,68,68,0.25)`, color: C.red },
    ghost: { background: 'transparent', border: `1px solid ${C.border}`, color: C.sub },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', fontFamily: FONT.body,
      ...styles[variant], ...extraStyle,
    }}>
      {children}
    </button>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
        color: C.text, fontSize: 12, width: 240, fontFamily: FONT.body, outline: 'none',
      }}
    />
  );
}

function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
        {columns.map(h => (
          <th key={h} style={{
            padding: '10px 14px', textAlign: 'left', color: C.muted, fontWeight: 600, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT.body,
          }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

// ── Tab 1: Users Dashboard ───────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'last_sign_in' | 'created_at' | 'plan'>('last_sign_in');

  const load = useCallback(() => {
    setLoading(true);
    apiCall('/users').then(d => {
      setUsers(d.users || []);
      setTotal(d.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updatePlan = async (userId: string, plan: string, status = 'active') => {
    setUpdatingId(userId);
    await apiCall(`/users/${userId}/plan`, { method: 'POST', body: JSON.stringify({ plan, status }) });
    load();
    setUpdatingId(null);
  };

  const filtered = users
    .filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'plan') return (a.plan || '').localeCompare(b.plan || '');
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      return bVal.localeCompare(aVal);
    });

  const activeThisWeek = users.filter(u => {
    if (!u.last_sign_in) return false;
    return Date.now() - new Date(u.last_sign_in).getTime() < 7 * 24 * 3600 * 1000;
  }).length;
  const paidUsers = users.filter(u => ['builder', 'scale', 'pro'].includes(u.plan)).length;
  const trialUsers = users.filter(u => u.status === 'trialing').length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Users" value={total} />
        <StatCard label="Active This Week" value={activeThisWeek} color={C.green} />
        <StatCard label="Paid Users" value={paidUsers} color={C.accent} />
        <StatCard label="Trial Users" value={trialUsers} color={C.amber} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['last_sign_in', 'created_at', 'plan'] as const).map(s => (
            <Btn key={s} variant={sortBy === s ? 'accent' : 'ghost'} onClick={() => setSortBy(s)}>
              {s === 'last_sign_in' ? 'Last Active' : s === 'created_at' ? 'Sign-up' : 'Plan'}
            </Btn>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by email..." />
      </div>

      {loading ? (
        <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 40 }}>Loading users...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <TableHead columns={['Email', 'Plan', 'Status', 'Signed Up', 'Last Active', 'Actions']} />
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <td style={{ padding: '12px 14px', color: C.text, fontFamily: FONT.mono, fontSize: 11 }}>{u.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge
                      text={u.plan || 'free'}
                      color={['builder', 'scale', 'pro'].includes(u.plan) ? C.accent : C.muted}
                      bg={['builder', 'scale', 'pro'].includes(u.plan) ? C.accentBg : 'rgba(255,255,255,0.04)'}
                    />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ color: u.status === 'active' ? C.green : u.status === 'trialing' ? C.amber : C.muted, fontSize: 12, fontWeight: 600 }}>
                      {u.status || 'inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: C.sub, fontSize: 11 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-AU') : '--'}
                  </td>
                  <td style={{ padding: '12px 14px', color: C.sub, fontSize: 11 }}>
                    {u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString('en-AU') : '--'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select
                        defaultValue={u.plan || 'free'}
                        onChange={e => updatePlan(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                        style={{
                          padding: '5px 8px', background: C.surface, border: `1px solid ${C.border}`,
                          borderRadius: 6, color: C.text, fontSize: 11, cursor: 'pointer', fontFamily: FONT.body,
                        }}
                      >
                        {['free', 'builder', 'scale', 'pro'].map(p => (
                          <option key={p} value={p} style={{ background: C.surface }}>{p}</option>
                        ))}
                      </select>
                      <Btn variant="danger" disabled={updatingId === u.id} onClick={() => updatePlan(u.id, u.plan || 'free', 'inactive')}>
                        Disable
                      </Btn>
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

// ── Tab 2: Promo Codes ───────────────────────────────────────────────────────
function PromoTab() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_percent: '10', max_uses: '100', valid_until: '', plan_restriction: '' });
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiCall('/promo-codes').then(d => { setCodes(d.codes || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MJK-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, code }));
  };

  const createCode = async () => {
    await apiCall('/promo-codes', {
      method: 'POST',
      body: JSON.stringify({
        code: form.code,
        discount_percent: Number(form.discount_percent),
        max_uses: Number(form.max_uses) || 100,
        valid_until: form.valid_until || null,
        plan_restriction: form.plan_restriction || null,
      }),
    });
    setShowForm(false);
    setForm({ code: '', discount_percent: '10', max_uses: '100', valid_until: '', plan_restriction: '' });
    load();
  };

  const deactivate = async (id: string) => {
    await apiCall(`/promo-codes/${id}`, { method: 'DELETE' });
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeCodes = codes.filter(c => c.is_active);
  const inactiveCodes = codes.filter(c => !c.is_active);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: C.sub }}>
          <span style={{ color: C.text, fontWeight: 700 }}>{activeCodes.length}</span> active codes
        </div>
        <Btn variant="accent" onClick={() => { setShowForm(!showForm); if (!showForm) generateCode(); }}>
          + Create Promo Code
        </Btn>
      </div>

      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            {([
              ['code', 'Code'],
              ['discount_percent', 'Discount %'],
              ['max_uses', 'Max Uses'],
              ['valid_until', 'Expires (optional)'],
            ] as [string, string][]).map(([k, label]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <input
                  type={k === 'valid_until' ? 'date' : 'text'}
                  value={(form as Record<string, string>)[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 8, color: C.text, fontSize: 12, fontFamily: k === 'code' ? FONT.mono : FONT.body,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan</div>
              <select
                value={form.plan_restriction}
                onChange={e => setForm(f => ({ ...f, plan_restriction: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 8, color: C.text, fontSize: 12, fontFamily: FONT.body,
                }}
              >
                <option value="" style={{ background: C.bg }}>Any plan</option>
                <option value="builder" style={{ background: C.bg }}>Builder only</option>
                <option value="scale" style={{ background: C.bg }}>Scale only</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="accent" onClick={createCode}>Create</Btn>
            <Btn variant="ghost" onClick={generateCode}>Regenerate Code</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <TableHead columns={['Code', 'Discount', 'Uses', 'Valid Until', 'Plan', 'Status', 'Actions']} />
            <tbody>
              {[...activeCodes, ...inactiveCodes].map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: c.is_active ? 1 : 0.4 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <td style={{ padding: '12px 14px', fontFamily: FONT.mono, color: C.text, fontWeight: 700, fontSize: 13 }}>{c.code}</td>
                  <td style={{ padding: '12px 14px', color: C.green, fontFamily: FONT.mono, fontWeight: 700 }}>{c.discount_percent}%</td>
                  <td style={{ padding: '12px 14px', color: C.sub, fontFamily: FONT.mono }}>{c.current_uses}/{c.max_uses}</td>
                  <td style={{ padding: '12px 14px', color: C.sub, fontSize: 11 }}>
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-AU') : 'No expiry'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge text={c.plan_restriction || 'any'} color={C.sub} bg="rgba(255,255,255,0.04)" />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge
                      text={c.is_active ? 'Active' : 'Inactive'}
                      color={c.is_active ? C.green : C.red}
                      bg={c.is_active ? C.greenBg : C.redBg}
                    />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="ghost" onClick={() => copyCode(c.code)} style={{ fontSize: 11, padding: '4px 10px' }}>
                        {copied === c.code ? 'Copied!' : 'Copy'}
                      </Btn>
                      {c.is_active && (
                        <Btn variant="danger" onClick={() => deactivate(c.id)} style={{ fontSize: 11, padding: '4px 10px' }}>
                          Deactivate
                        </Btn>
                      )}
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

// ── Tab 3: Role Management ───────────────────────────────────────────────────
function RolesTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiCall('/users'), apiCall('/user-roles')]).then(([userData, roleData]) => {
      setUsers(userData.users || []);
      setRoles(roleData.roles || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const roleMap = new Map(roles.map((r: any) => [r.user_id, r.role]));

  const setRole = async (userId: string, role: string) => {
    setUpdatingId(userId);
    await apiCall('/user-roles', { method: 'POST', body: JSON.stringify({ user_id: userId, role }) });
    load();
    setUpdatingId(null);
  };

  const filtered = users.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase()));

  const adminCount = roles.filter(r => r.role === 'admin').length;
  const betaCount = roles.filter(r => r.role === 'beta_tester').length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Admins" value={adminCount} color={C.red} />
        <StatCard label="Beta Testers" value={betaCount} color={C.cyan} />
        <StatCard label="Operators" value={users.length - adminCount - betaCount} color={C.sub} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by email..." />
      </div>

      {loading ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <TableHead columns={['Email', 'Current Role', 'Plan', 'Change Role']} />
            <tbody>
              {filtered.map(u => {
                const currentRole = roleMap.get(u.id) || 'operator';
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <td style={{ padding: '12px 14px', color: C.text, fontFamily: FONT.mono, fontSize: 11 }}>{u.email}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge
                        text={currentRole}
                        color={currentRole === 'admin' ? C.red : currentRole === 'beta_tester' ? C.cyan : C.sub}
                        bg={currentRole === 'admin' ? C.redBg : currentRole === 'beta_tester' ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.04)'}
                      />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge
                        text={u.plan || 'free'}
                        color={['builder', 'scale', 'pro'].includes(u.plan) ? C.accent : C.muted}
                        bg={['builder', 'scale', 'pro'].includes(u.plan) ? C.accentBg : 'rgba(255,255,255,0.04)'}
                      />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={currentRole}
                        onChange={e => setRole(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                        style={{
                          padding: '6px 10px', background: C.surface, border: `1px solid ${C.border}`,
                          borderRadius: 6, color: C.text, fontSize: 11, cursor: 'pointer', fontFamily: FONT.body,
                        }}
                      >
                        {['operator', 'beta_tester', 'admin'].map(r => (
                          <option key={r} value={r} style={{ background: C.surface }}>{r}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Platform Analytics ────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall('/platform-analytics').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Loading analytics...</div>;
  if (!data) return <div style={{ color: C.red, textAlign: 'center', padding: 40 }}>Failed to load analytics</div>;

  const featureEntries = Object.entries(data.featureUsage || {}).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <div>
      {/* Revenue Metrics */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT.body }}>Revenue</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard label="Estimated MRR" value={`A$${data.revenue?.estimatedMRR || 0}`} color={C.green} />
          <StatCard label="Builder Plans" value={data.revenue?.builderCount || 0} sub="$99/mo each" />
          <StatCard label="Scale Plans" value={data.revenue?.scaleCount || 0} sub="$199/mo each" />
        </div>
      </div>

      {/* User Growth */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT.body }}>User Growth</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <StatCard label="Total Users" value={data.users?.total || 0} />
          <StatCard label="Active This Week" value={data.users?.activeThisWeek || 0} color={C.green} />
          <StatCard label="Signups This Week" value={data.users?.signupsThisWeek || 0} color={C.cyan} />
          <StatCard label="Paid Users" value={data.users?.paidUsers || 0} color={C.accent} />
          <StatCard label="Trial Users" value={data.users?.trialUsers || 0} color={C.amber} />
        </div>
      </div>

      {/* API Usage */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT.body }}>API Usage</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="API Calls Today" value={data.api?.callsToday || 0} />
          <StatCard label="Cost Today" value={`$${data.api?.costToday || '0.00'}`} color={C.amber} />
          <StatCard label="Cost This Week" value={`$${data.api?.costWeek || '0.00'}`} color={C.red} />
          <StatCard label="Products in DB" value={data.productCount || 0} />
        </div>
      </div>

      {/* Feature Usage + Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature Usage (This Week)</div>
          {featureEntries.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 12 }}>No API calls recorded</div>
          ) : (
            featureEntries.map(([feature, count]) => (
              <div key={feature} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.text, fontSize: 12 }}>{feature}</span>
                <span style={{ color: C.accent, fontFamily: FONT.mono, fontSize: 12, fontWeight: 700 }}>{count as number}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pipeline Health</div>
          {data.pipeline ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: C.sub, fontSize: 12 }}>Status</span>
                <Badge
                  text={data.pipeline.status || 'unknown'}
                  color={data.pipeline.status === 'success' ? C.green : C.amber}
                  bg={data.pipeline.status === 'success' ? C.greenBg : C.amberBg}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: C.sub, fontSize: 12 }}>Last Run</span>
                <span style={{ color: C.text, fontSize: 12, fontFamily: FONT.mono }}>
                  {data.pipeline.started_at ? new Date(data.pipeline.started_at).toLocaleString('en-AU') : '--'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: C.sub, fontSize: 12 }}>Products Added</span>
                <span style={{ color: C.green, fontSize: 12, fontFamily: FONT.mono, fontWeight: 700 }}>{data.pipeline.products_added || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.sub, fontSize: 12 }}>Duration</span>
                <span style={{ color: C.text, fontSize: 12, fontFamily: FONT.mono }}>
                  {data.pipeline.duration_ms ? `${Math.round(data.pipeline.duration_ms / 1000)}s` : '--'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: C.muted, fontSize: 12 }}>No pipeline data</div>
          )}
        </div>
      </div>

      {/* Top Users */}
      {data.topUsers && data.topUsers.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT.body }}>Top Users by API Usage</div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            {data.topUsers.map((u: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px', borderBottom: i < data.topUsers.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: C.muted, fontFamily: FONT.mono, fontSize: 11, width: 20 }}>#{i + 1}</span>
                  <span style={{ color: C.text, fontSize: 12, fontFamily: FONT.mono }}>{u.email}</span>
                </div>
                <span style={{ color: C.accent, fontFamily: FONT.mono, fontSize: 12, fontWeight: 700 }}>{u.apiCalls} calls</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 5: System Health ─────────────────────────────────────────────────────
function HealthTab() {
  const [health, setHealth] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiCall('/system-health'),
      apiCall('/platform-analytics'),
    ]).then(([h, a]) => {
      setHealth(h);
      setAnalytics(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Running health checks...</div>;

  const stripeKey = health?.stripe?.mode || 'unknown';

  const checks = [
    { label: 'Supabase', status: health?.supabase ? 'Connected' : 'Disconnected', ok: health?.supabase },
    { label: 'Stripe', status: stripeKey === 'live' ? 'Live Mode' : 'Test Mode', ok: stripeKey === 'live' },
    { label: 'Pipeline', status: analytics?.pipeline?.status || 'Unknown', ok: analytics?.pipeline?.status === 'success' },
  ];

  const counts = [
    { label: 'Winning Products', value: health?.counts?.products ?? '--' },
    { label: 'Total Users', value: health?.counts?.users ?? '--' },
    { label: 'Generated Stores', value: health?.counts?.stores ?? '--' },
    { label: 'Trend Signals', value: health?.counts?.trendSignals ?? '--' },
  ];

  return (
    <div>
      {/* Status Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {checks.map(c => (
          <div key={c.label} style={{
            background: C.surface, border: `1px solid ${c.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: c.ok ? C.green : C.red,
              boxShadow: c.ok ? '0 0 8px rgba(34,197,94,0.4)' : '0 0 8px rgba(239,68,68,0.4)',
            }} />
            <div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.ok ? C.green : C.red, fontFamily: FONT.body }}>{c.status}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {counts.map(c => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </div>

      {/* Detailed System Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pipeline Details</div>
          {analytics?.pipeline ? (
            <>
              {[
                ['Last Run', analytics.pipeline.started_at ? new Date(analytics.pipeline.started_at).toLocaleString('en-AU') : '--'],
                ['Duration', analytics.pipeline.duration_ms ? `${Math.round(analytics.pipeline.duration_ms / 1000)}s` : '--'],
                ['Products Added', analytics.pipeline.products_added || 0],
                ['Products Updated', analytics.pipeline.products_updated || 0],
                ['Products Rejected', analytics.pipeline.products_rejected || 0],
                ['Type', analytics.pipeline.pipeline_type || '--'],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.sub, fontSize: 12 }}>{label}</span>
                  <span style={{ color: C.text, fontSize: 12, fontFamily: FONT.mono }}>{value}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ color: C.muted, fontSize: 12 }}>No pipeline data available</div>
          )}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Claude API Spend</div>
          {[
            ['Today', `$${analytics?.api?.costToday || '0.00'}`],
            ['This Week', `$${analytics?.api?.costWeek || '0.00'}`],
            ['API Calls Today', analytics?.api?.callsToday || 0],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.sub, fontSize: 12 }}>{label}</span>
              <span style={{ color: C.amber, fontSize: 12, fontFamily: FONT.mono, fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Btn variant="accent" onClick={load}>Refresh All Checks</Btn>
      </div>
    </div>
  );
}

// ── Tab 6: Broadcast / Announcements ─────────────────────────────────────────
function BroadcastTab() {
  const [banner, setBanner] = useState({ message: '', enabled: false, type: 'info' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiCall('/site-config/banner').then(d => {
      if (d.config?.value) {
        setBanner({
          message: d.config.value.message || '',
          enabled: d.config.value.enabled || false,
          type: d.config.value.type || 'info',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await apiCall('/site-config', {
      method: 'POST',
      body: JSON.stringify({ key: 'banner', value: banner }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT.body }}>Site-wide Banner</div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <button
              onClick={() => setBanner(b => ({ ...b, enabled: !b.enabled }))}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: banner.enabled ? C.green : C.border,
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: banner.enabled ? 23 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ color: banner.enabled ? C.green : C.muted, fontSize: 13, fontWeight: 600 }}>
              {banner.enabled ? 'Banner is LIVE' : 'Banner is hidden'}
            </span>
          </div>

          {/* Banner Type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Banner Type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['info', 'warning', 'success', 'promo'].map(t => (
                <Btn
                  key={t}
                  variant={banner.type === t ? 'accent' : 'ghost'}
                  onClick={() => setBanner(b => ({ ...b, type: t }))}
                  style={{ textTransform: 'capitalize' }}
                >
                  {t}
                </Btn>
              ))}
            </div>
          </div>

          {/* Message */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</div>
            <textarea
              value={banner.message}
              onChange={e => setBanner(b => ({ ...b, message: e.target.value }))}
              placeholder="Enter your banner message..."
              rows={3}
              style={{
                width: '100%', padding: '12px 16px', background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 10, color: C.text, fontSize: 14, fontFamily: FONT.body, resize: 'vertical',
                boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          {/* Preview */}
          {banner.message && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</div>
              <div style={{
                padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: FONT.body,
                background: banner.type === 'warning' ? C.amberBg : banner.type === 'success' ? C.greenBg : banner.type === 'promo' ? C.accentBg : 'rgba(34,211,238,0.10)',
                color: banner.type === 'warning' ? C.amber : banner.type === 'success' ? C.green : banner.type === 'promo' ? C.accent : C.cyan,
                border: `1px solid ${banner.type === 'warning' ? 'rgba(245,158,11,0.25)' : banner.type === 'success' ? 'rgba(34,197,94,0.25)' : banner.type === 'promo' ? C.accentBorder : 'rgba(34,211,238,0.25)'}`,
              }}>
                {banner.message}
              </div>
            </div>
          )}

          {/* Save */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn variant="accent" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Banner'}
            </Btn>
            {saved && <span style={{ color: C.green, fontSize: 12, fontWeight: 600 }}>Saved successfully</span>}
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT.body }}>Quick Presets</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Maintenance', message: 'We are performing scheduled maintenance. Some features may be temporarily unavailable.', type: 'warning' },
            { label: 'New Feature', message: 'New: AI-powered ad briefs are now available! Try them in the Ads Studio.', type: 'success' },
            { label: 'Promo', message: 'Limited time: Get 20% off Scale plan with code SCALE20', type: 'promo' },
            { label: 'Welcome', message: 'Welcome to Majorka! Start by exploring trending products in the Products tab.', type: 'info' },
          ].map(preset => (
            <Btn
              key={preset.label}
              variant="ghost"
              onClick={() => setBanner({ message: preset.message, enabled: false, type: preset.type })}
            >
              {preset.label}
            </Btn>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
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
      <div style={{ color: C.muted, fontFamily: FONT.body }}>{authorized === null ? 'Checking access...' : 'Redirecting...'}</div>
    </div>
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: 'users', label: 'Users' },
    { id: 'promo', label: 'Promo Codes' },
    { id: 'roles', label: 'Roles' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'health', label: 'System' },
    { id: 'broadcast', label: 'Broadcast' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px', fontFamily: FONT.body }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: FONT.heading, fontSize: 24, fontWeight: 800, color: C.text, margin: 0, marginBottom: 4, letterSpacing: '-0.01em' }}>
              Admin Control Panel
            </h1>
            <div style={{ fontSize: 12, color: C.muted }}>{session?.user?.email}</div>
          </div>
          <Btn variant="ghost" onClick={() => setLocation('/app')}>
            Back to Dashboard
          </Btn>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 2, marginBottom: 24, background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 4, width: 'fit-content', flexWrap: 'wrap',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: FONT.heading, letterSpacing: '0.01em',
              background: tab === t.id ? C.accent : 'transparent',
              color: tab === t.id ? '#fff' : C.sub,
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28,
        }}>
          {tab === 'users' && <UsersTab />}
          {tab === 'promo' && <PromoTab />}
          {tab === 'roles' && <RolesTab />}
          {tab === 'analytics' && <AnalyticsTab />}
          {tab === 'health' && <HealthTab />}
          {tab === 'broadcast' && <BroadcastTab />}
        </div>
      </div>
    </div>
  );
}
