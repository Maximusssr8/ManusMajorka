import { useEffect, useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useNicheStats } from '@/hooks/useNicheStats';
import { shortenCategory } from '@/lib/categoryColor';

const display = "'Bricolage Grotesque', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

type AlertType = 'score' | 'new' | 'price' | 'trending';
type Frequency = 'immediately' | 'daily' | 'weekly';

interface StoredAlert {
  id: string;
  type: AlertType;
  category: string;
  value: number;
  frequency: Frequency;
  email: string;
  createdAt: string;
}

const STORAGE_KEY = 'majorka-alerts-v1';

const ALERT_TYPES: { key: AlertType; label: string; hint: string; unit: string; placeholder: string }[] = [
  { key: 'score',    label: 'Score Threshold', hint: 'Notify me when a product exceeds a score of',          unit: '',       placeholder: '80' },
  { key: 'new',      label: 'New Products',    hint: 'Notify me when new products are added in',             unit: 'category', placeholder: '' },
  { key: 'price',    label: 'Price Drop',      hint: 'Notify me when any product drops below',               unit: 'AUD',    placeholder: '10' },
  { key: 'trending', label: 'Trending Now',    hint: "Notify me when a product's orders increase by",        unit: '% in 7 days', placeholder: '20' },
];

function loadAlerts(): StoredAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAlert[]) : [];
  } catch { return []; }
}
function saveAlerts(alerts: StoredAlert[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch { /* ignore */ }
}

export default function Alerts() {
  const { user } = useAuth();
  const { niches } = useNicheStats(20);
  const [alerts, setAlerts] = useState<StoredAlert[]>([]);
  const [type, setType] = useState<AlertType>('score');
  const [category, setCategory] = useState<string>('');
  const [value, setValue] = useState<string>('80');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [email, setEmail] = useState<string>(user?.email ?? '');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setAlerts(loadAlerts()); }, []);
  useEffect(() => { if (user?.email && !email) setEmail(user.email); }, [user?.email, email]);

  const activeType = ALERT_TYPES.find((t) => t.key === type)!;

  const createAlert = () => {
    const numericValue = Number(value) || 0;
    const alert: StoredAlert = {
      id: `alert-${Date.now()}`,
      type,
      category: category || 'All categories',
      value: numericValue,
      frequency,
      email,
      createdAt: new Date().toISOString(),
    };
    const next = [alert, ...alerts];
    setAlerts(next);
    saveAlerts(next);
    setToast('Alert created. You\'ll be notified based on your settings.');
    setTimeout(() => setToast(null), 3000);
  };

  const deleteAlert = (id: string) => {
    const next = alerts.filter((a) => a.id !== id);
    setAlerts(next);
    saveAlerts(next);
  };

  const scrollToForm = () => {
    document.getElementById('mj-alerts-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ padding: '32px 36px', overflow: 'auto', color: '#e8e8f0', fontFamily: sans }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: display, fontSize: 28, fontWeight: 800,
          letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #f5f5f5 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Alerts</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Get notified when products hit your thresholds. Delivered to your inbox or in-app.
        </p>
      </div>

      {toast && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#10b981',
          fontSize: 13,
        }}>{toast}</div>
      )}

      {/* Section 1 — Active alerts */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Active Alerts</h2>
        {alerts.length === 0 ? (
          <div style={{
            background: '#1c1c1c',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(124,106,255,0.1)',
              border: '1px solid rgba(124,106,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              color: '#a78bfa',
              position: 'relative',
            }}>
              <Bell size={22} />
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 16, height: 16, borderRadius: '50%',
                background: '#7c6aff', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>+</span>
            </div>
            <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>No alerts set up yet</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
              Get notified when a product hits your score threshold, enters a new trend, or drops in competition
            </div>
            <button
              onClick={scrollToForm}
              style={{
                padding: '10px 18px',
                borderRadius: 9,
                background: 'linear-gradient(135deg,#7c6aff,#a78bfa)',
                color: 'white',
                border: 'none',
                fontFamily: sans, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(124,106,255,0.35)',
              }}
            >Create your first alert →</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {alerts.map((a) => {
              const typeLabel = ALERT_TYPES.find((t) => t.key === a.type)?.label ?? a.type;
              return (
                <div key={a.id} style={{
                  background: '#1c1c1c',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: 16,
                  position: 'relative',
                }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{typeLabel}</div>
                  <div style={{ fontSize: 13, color: '#e8e8f0', marginBottom: 4 }}>
                    {a.type === 'score'    && <>Score ≥ {a.value} in <strong>{shortenCategory(a.category)}</strong></>}
                    {a.type === 'new'      && <>New products in <strong>{shortenCategory(a.category)}</strong></>}
                    {a.type === 'price'    && <>Price &lt; ${a.value} AUD in <strong>{shortenCategory(a.category)}</strong></>}
                    {a.type === 'trending' && <>Orders +{a.value}% / 7d in <strong>{shortenCategory(a.category)}</strong></>}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {a.frequency} · {a.email}
                  </div>
                  <button
                    onClick={() => deleteAlert(a.id)}
                    aria-label="Delete alert"
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                      fontSize: 16, padding: 0,
                    }}
                  >×</button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2 — Create alert form */}
      <section id="mj-alerts-form" style={{ marginBottom: 36 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Create an Alert</h2>
        <div style={{
          background: '#1c1c1c',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Alert Type</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {ALERT_TYPES.map((t) => {
              const active = t.key === type;
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: active ? 'rgba(124,106,255,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? '#f5f5f5' : 'rgba(255,255,255,0.5)',
                    fontFamily: sans, fontSize: 12, fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >{t.label}</button>
              );
            })}
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{activeType.hint}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            <FormField label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={selectStyle}
              >
                <option value="">All categories</option>
                {niches.map((n) => (
                  <option key={n.name} value={n.name}>{shortenCategory(n.name)}</option>
                ))}
              </select>
            </FormField>
            {type !== 'new' && (
              <FormField label={`Threshold${activeType.unit ? ` (${activeType.unit})` : ''}`}>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={activeType.placeholder}
                  style={inputStyle}
                />
              </FormField>
            )}
            <FormField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Frequency</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {(['immediately', 'daily', 'weekly'] as Frequency[]).map((f) => {
              const active = f === frequency;
              return (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? '#10b981' : 'rgba(255,255,255,0.5)',
                    fontFamily: sans, fontSize: 12, fontWeight: active ? 600 : 500, textTransform: 'capitalize',
                    cursor: 'pointer',
                  }}
                >{f}</button>
              );
            })}
          </div>

          <button
            onClick={createAlert}
            disabled={!email}
            style={{
              padding: '12px 24px',
              borderRadius: 9,
              background: email ? 'linear-gradient(135deg,#7c6aff,#a78bfa)' : 'rgba(124,106,255,0.2)',
              border: 'none',
              color: 'white',
              fontFamily: sans, fontSize: 14, fontWeight: 600,
              cursor: email ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: email ? '0 4px 20px rgba(124,106,255,0.35)' : 'none',
            }}
          ><Plus size={14} /> Create Alert</button>
        </div>
      </section>

      {/* Section 3 — Example notifications */}
      <section>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>Example Notifications</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 14px' }}>These illustrate what a triggered alert looks like.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {[
            { icon: '🔥', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', title: 'Score Alert', body: 'Nano Tape hit 99/100 — 231K orders this month' },
            { icon: '⚡', bg: 'rgba(124,106,255,0.08)', border: 'rgba(124,106,255,0.2)', title: 'New Product', body: '3 new Kitchen & Bar products added today' },
            { icon: '📉', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', title: 'Price Drop', body: 'Oil Dispenser dropped to $7.83 AUD' },
          ].map((n) => (
            <div key={n.title} style={{
              background: n.bg,
              border: `1px solid ${n.border}`,
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{n.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{n.body}</div>
                <div style={{ marginTop: 6, fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Example</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#151515',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#e8e8f0',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
