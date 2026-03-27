/**
 * Alerts Engine — Smart threshold alerts for product/trend/competitor monitoring
 * Route: /app/alerts
 */
import { useIsMobile } from '@/hooks/useIsMobile';
import { Bell, BellOff, Plus, Trash2, TrendingUp, ShoppingBag, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const brico = "'Bricolage Grotesque', sans-serif";
const dm = 'DM Sans, sans-serif';
const C = { bg: '#F9FAFB', card: '#FFFFFF', border: '#E5E7EB', text: '#0A0A0A', sub: '#6B7280', muted: '#9CA3AF', indigo: '#6366F1', indigoBg: '#EEF2FF', indigoBorder: '#C7D2FE' };

type AlertType = 'trending' | 'price_drop' | 'competitor';
interface Alert { id: string; alert_type: AlertType; config: Record<string, unknown>; is_active: boolean; last_triggered_at: string | null; created_at: string; }

const NICHES = ['Health & Wellness', 'Beauty', 'Fitness', 'Tech & Gadgets', 'Pet Care', 'Kitchen', 'Fashion', 'Outdoor & Sports', 'Home & Sleep'];
const REGIONS = ['AU', 'US', 'UK', 'CA', 'DE', 'SG'];

export default function Alerts() {
  React.useEffect(() => { document.title = 'Smart Alerts | Majorka'; }, []);
  const { session, isPro } = useAuth();
  const isMobile = useIsMobile();
const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [showCreate, setShowCreate] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('trending');
  const [form, setForm] = useState<Record<string, string>>({ niche: 'Health & Wellness', region: 'AU', threshold: '50', category: 'Beauty', store_domain: '' });
  const [domainError, setDomainError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => { loadAlerts(); }, [session]);

  async function loadAlerts() {
    if (!session) { setLoading(false); return; }
    const { data } = await supabase.from('user_alerts').select('*').order('created_at', { ascending: false });
    setAlerts((data || []).filter((a: Alert) => a.is_active));
    setHistory((data || []).filter((a: Alert) => a.last_triggered_at));
    setLoading(false);
  }

  async function createAlert() {
    if (!session) return;
    setSaving(true);
    let config: Record<string, unknown> = {};
    if (alertType === 'trending') config = { niche: form.niche, region: form.region };
    else if (alertType === 'price_drop') config = { threshold: parseFloat(form.threshold), keyword: form.niche || '' };
    else config = { store_domain: form.store_domain, category: form.category };
    const { error } = await supabase.from('user_alerts').insert({ user_id: session.user.id, alert_type: alertType, config, is_active: true });
    if (error) toast.error('Failed to create alert');
    else { toast.success('Alert created!'); setShowCreate(false); loadAlerts(); }
    setSaving(false);
  }

  async function deleteAlert(id: string) {
    // First click: set as pending (show confirm state on card)
    if (pendingDelete !== id) {
      setPendingDelete(id);
      // Auto-cancel confirm after 4s
      setTimeout(() => setPendingDelete(prev => prev === id ? null : prev), 4000);
      return;
    }
    // Second click: confirmed — delete
    setPendingDelete(null);
    await supabase.from('user_alerts').update({ is_active: false }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alert removed');
  }

  const ALERT_TYPES = [
    { type: 'trending' as AlertType, icon: TrendingUp, label: 'Trending Alert', desc: 'Notify me when a new product reaches early velocity in a niche' },
    { type: 'price_drop' as AlertType, icon: ShoppingBag, label: 'Price Drop Alert', desc: 'Notify me when a tracked product drops below a price threshold' },
    { type: 'competitor' as AlertType, icon: Store, label: 'Competitor Alert', desc: 'Notify me when a competitor store lists a new product' },
  ];

  if (!isPro) return (
    <div style={{ padding: isMobile ? '24px 16px' : '48px 32px', textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
      <Bell size={40} style={{ color: C.indigo, margin: '0 auto 16px' }} />
      <h2 style={{ fontFamily: brico, fontSize: 22, color: C.text, marginBottom: 8 }}>Smart Alerts</h2>
      <p style={{ color: C.sub, fontSize: 14, maxWidth: 400, margin: '0 auto 24px' }}>Set up intelligent alerts for trending products, price drops, and competitor moves. Available on Builder and Scale plans.</p>
      <a href="/pricing" style={{ display: 'inline-flex', padding: '12px 28px', background: C.indigo, color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: brico }}>Upgrade to Enable Alerts →</a>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px' : '32px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: brico, fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>Smart Alerts</h1>
            <p style={{ color: C.sub, fontSize: 14 }}>{alerts.length} active alert{alerts.length !== 1 ? 's' : ''} · Get notified when opportunities emerge</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: C.indigo, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: brico }}>
            <Plus size={14} /> New Alert
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {(['active', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all 150ms', fontFamily: dm, fontWeight: tab === t ? 600 : 400, background: tab === t ? C.indigoBg : 'transparent', color: tab === t ? C.indigo : C.sub, border: `1px solid ${tab === t ? C.indigoBorder : 'transparent'}` }}>
              {t === 'active' ? `Active (${alerts.length})` : `History (${history.length})`}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted, alignSelf: 'center', paddingRight: 4 }}>
            {alerts.length}/10 alerts used
          </span>
        </div>

        {/* Alert List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: 12, background: '#F3F4F6', animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : tab === 'history' && history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
            <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 6 }}>No alerts have fired yet</div>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>
              When an alert triggers — a trending product, price drop, or competitor move — it will appear here with a timestamp and details.
            </div>
            <div style={{ marginTop: 20, fontSize: 12, color: C.muted }}>Checks run hourly while your alerts are active.</div>
          </div>
        ) : tab === 'active' && alerts.length === 0 ? (
          <div>
            {/* Email notice */}
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={15} style={{ color: '#6366F1', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#374151' }}>Alerts are delivered to your account email. Make sure notifications are enabled in <a href="/app/settings/notifications" style={{ color: '#6366F1', fontWeight: 600 }}>Settings → Notifications</a>.</span>
            </div>
            {/* Suggested starter alerts */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <p style={{ fontFamily: brico, fontSize: 15, color: C.text, marginBottom: 4, fontWeight: 700 }}>Start with a suggested alert</p>
              <p style={{ color: C.sub, fontSize: 12, marginBottom: 16 }}>One click to set up — we'll notify you when it triggers.</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {[
                  { icon: '🔥', label: 'Trending: Posture & Health products exploding', type: 'trending', preview: 'Notifies when a product in Health niche passes score 80+' },
                  { icon: '💰', label: 'Price drop: LED lights below $15 AUD', type: 'price_drop', preview: 'Notifies when product price drops 20%+ in a week' },
                  { icon: '🏆', label: 'New competitor: Watch for new Shopify stores in Beauty', type: 'competitor', preview: 'Notifies when a new competitor store appears in your niche' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', cursor: 'default' }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: C.sub }}>{s.preview}</div>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                      style={{ flexShrink: 0, height: 30, padding: '0 12px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      + Set Up
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '24px', color: C.sub, fontSize: 12 }}>
              Or create a custom alert using the <strong style={{ color: C.text }}>+ New Alert</strong> button above.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {(tab === 'active' ? alerts : history).map(alert => {
              const cfg = alert.config as Record<string, string>;
              const TypeIcon = alert.alert_type === 'trending' ? TrendingUp : alert.alert_type === 'price_drop' ? ShoppingBag : Store;
              const typeLabel = alert.alert_type === 'trending' ? 'Trending Alert' : alert.alert_type === 'price_drop' ? 'Price Drop Alert' : 'Competitor Alert';
              const cfgText = alert.alert_type === 'trending' ? `${cfg.niche} · ${cfg.region}` : alert.alert_type === 'price_drop' ? `${cfg.keyword ? cfg.keyword + ' · ' : ''}Below $${cfg.threshold} AUD` : `${cfg.store_domain} · ${cfg.category}`;
              return (
                <div key={alert.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: C.indigoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TypeIcon size={16} style={{ color: C.indigo }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: brico, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{typeLabel}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{cfgText}</div>
                    {alert.last_triggered_at
                      ? <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>✓ Last triggered: {new Date(alert.last_triggered_at).toLocaleDateString('en-AU')}</div>
                      : <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>⏳ Monitoring — checks run hourly · no trigger yet</div>
                    }
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: '#ECFDF5', color: '#059669' }}>ACTIVE</span>
                    {tab === 'active' && (
                      pendingDelete === alert.id ? (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>Delete?</span>
                          <button onClick={() => deleteAlert(alert.id)} style={{ height: 26, padding: '0 8px', borderRadius: 6, border: 'none', background: '#DC2626', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Yes</button>
                          <button onClick={() => setPendingDelete(null)} style={{ height: 26, padding: '0 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#374151', cursor: 'pointer', fontSize: 11 }}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => deleteAlert(alert.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete alert"><Trash2 size={12} /></button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Alert Modal */}
        {showCreate && (
          <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }} onClick={() => setShowCreate(false)}>
            <div style={{ background: 'white', borderRadius: isMobile ? 0 : 20, padding: isMobile ? '24px 20px' : 28, width: '100%', maxWidth: 480, maxHeight: '100dvh', overflowY: 'auto' as const, marginTop: isMobile ? 'auto' : 0 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 20 }}>Create Alert</h3>
              {/* Alert type selector */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
                {ALERT_TYPES.map(at => (
                  <label key={at.type} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: `1px solid ${alertType === at.type ? C.indigoBorder : C.border}`, borderRadius: 10, cursor: 'pointer', background: alertType === at.type ? C.indigoBg : 'white' }}>
                    <input type="radio" name="alertType" value={at.type} checked={alertType === at.type} onChange={() => setAlertType(at.type)} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontFamily: dm, fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 2 }}>{at.label}</div>
                      <div style={{ fontSize: 12, color: C.sub }}>{at.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {/* Config fields */}
              {alertType === 'trending' && (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Niche
                    <select value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: dm, outline: 'none' }}>
                      {NICHES.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Region
                    <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: dm, outline: 'none' }}>
                      {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {alertType === 'price_drop' && (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Product keyword or niche to watch
                    <input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="e.g. posture corrector, LED lamp, dog toys" style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: dm, outline: 'none', boxSizing: 'border-box' as const }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Alert when supplier price drops below ($AUD)
                    <input type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} placeholder="50" style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: dm, outline: 'none', boxSizing: 'border-box' as const }} />
                  </label>
                  <div style={{ fontSize: 11, color: C.muted, background: '#F9FAFB', borderRadius: 8, padding: '8px 10px' }}>
                    💡 Watches products matching your keyword in the Majorka database. Triggers when any matching product's cost price drops below your threshold.
                  </div>
                </div>
              )}
              {alertType === 'competitor' && (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Competitor Store Domain
                    <input value={form.store_domain}
                      onChange={e => {
                        const val = e.target.value.toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'');
                        setForm(f => ({ ...f, store_domain: val }));
                        const isValid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(val) || val === '';
                        setDomainError(val && !isValid ? 'Enter a valid domain (e.g. store.myshopify.com)' : '');
                      }}
                      placeholder="competitor.myshopify.com"
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', border: `1px solid ${domainError ? '#EF4444' : C.border}`, borderRadius: 8, fontSize: 14, fontFamily: dm, outline: 'none', boxSizing: 'border-box' as const }} />
                    {domainError && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 3, display: 'block' }}>{domainError}</span>}
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Category to Watch
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: dm, outline: 'none' }}>
                      {NICHES.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </label>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '11px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'white', color: C.sub, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: dm }}>Cancel</button>
                <button onClick={createAlert} disabled={saving || !!domainError} style={{ flex: 2, padding: '11px', background: C.indigo, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (saving || !!domainError) ? 'not-allowed' : 'pointer', fontFamily: brico, opacity: domainError ? 0.6 : 1 }}>
                  {saving ? 'Creating…' : 'Create Alert'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
