import { useEffect, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { Bell, Plus, Package, X, Tag } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/_core/hooks/useAuth';
import { useNicheStats } from '@/hooks/useNicheStats';
import { useTracking, TRACK_LIMIT_BUILDER } from '@/hooks/useTracking';
import { shortenCategory } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { supabase } from '@/lib/supabase';

import { C } from '@/lib/designTokens';
const display = C.fontDisplay;
const sans = C.fontBody;
const mono = C.fontBody;

// ─── Types that match the server contract (server/routes/alerts.ts) ─────────

type AlertType = 'price_drop' | 'score_change' | 'sold_count_spike';
type Frequency = 'instant' | 'daily' | 'weekly';

interface ServerAlert {
  id: string;
  user_id: string;
  product_id: string | null;
  type: AlertType;
  threshold: number;
  frequency: Frequency;
  email: string;
  category: string | null;
  last_fired_at: string | null;
  created_at: string;
}

interface EmailHealth {
  ok: boolean;
  provider: 'resend' | 'postmark' | 'none';
  reason?: 'no_provider';
}

const ALERT_TYPES: { key: AlertType; label: string; hint: string; unit: string; placeholder: string }[] = [
  { key: 'score_change',      label: 'Score Threshold', hint: 'Notify me when a product score is at or above',   unit: '',       placeholder: '80' },
  { key: 'price_drop',        label: 'Price Drop',      hint: 'Notify me when any product drops to or below',    unit: 'AUD',    placeholder: '10' },
  { key: 'sold_count_spike',  label: 'Orders Spike',    hint: 'Notify me when total orders are at or above',     unit: 'orders', placeholder: '1000' },
];

// Optimistic cache key — kept as a fallback display only; server is source of truth.
const CACHE_KEY = 'majorka-alerts-cache-v2';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export default function Alerts() {
  useEffect(() => { document.title = 'Alerts — Majorka'; }, []);
  const { user, isPro } = useAuth();
  const { niches } = useNicheStats(20);
  const { tracked, trackedCount, untrack } = useTracking();

  const [alerts, setAlerts] = useState<ServerAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emailHealth, setEmailHealth] = useState<EmailHealth | null>(null);

  const [type, setType] = useState<AlertType>('score_change');
  const [category, setCategory] = useState<string>('');
  const [value, setValue] = useState<string>('80');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [email, setEmail] = useState<string>(user?.email ?? '');
  const [toast, setToast] = useState<string | null>(null);
  const [toastKind, setToastKind] = useState<'ok' | 'err'>('ok');

  const emailConfigured = emailHealth?.ok === true;

  // ── Price drop alerts (AU Moat) — declared here so showToast is hoisted ──
  interface PriceAlertRow {
    id: string;
    product_id: string;
    product_name: string;
    product_image: string | null;
    original_price: number;
    target_price: number | null;
    alert_type: 'any_drop' | 'percentage' | 'target_price';
    threshold_percent: number | null;
    status: 'active' | 'triggered' | 'cancelled';
    triggered_at: string | null;
    created_at: string;
  }
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertRow[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [priceAlertsLoading, setPriceAlertsLoading] = useState(true);

  const showToast = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast(msg);
    setToastKind(kind);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load price alerts + hydrate live prices ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = await authHeaders();
        if (!('Authorization' in headers)) { setPriceAlertsLoading(false); return; }
        const res = await fetch('/api/alerts/price', { headers });
        if (!res.ok) { setPriceAlertsLoading(false); return; }
        const json = (await res.json()) as { alerts?: PriceAlertRow[] };
        if (cancelled) return;
        const list = json.alerts ?? [];
        setPriceAlerts(list);
        const ids = Array.from(new Set(list.map((a) => a.product_id))).slice(0, 50);
        const priceMap: Record<string, number> = {};
        await Promise.all(ids.map(async (id) => {
          try {
            const r = await fetch(`/api/products/${encodeURIComponent(id)}`);
            if (!r.ok) return;
            const p = await r.json() as { price_aud?: number; product?: { price_aud?: number } };
            const cur = Number(p?.price_aud ?? p?.product?.price_aud ?? 0);
            if (cur > 0) priceMap[id] = cur;
          } catch { /* skip */ }
        }));
        if (!cancelled) setLivePrices(priceMap);
      } finally {
        if (!cancelled) setPriceAlertsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const cancelPriceAlert = async (id: string) => {
    const prev = priceAlerts;
    setPriceAlerts(prev.map((a) => a.id === id ? { ...a, status: 'cancelled' as const } : a));
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/alerts/price/${id}`, { method: 'DELETE', headers });
      if (!res.ok) {
        setPriceAlerts(prev);
        showToast('Could not cancel alert.', 'err');
      }
    } catch {
      setPriceAlerts(prev);
      showToast('Network error.', 'err');
    }
  };

  // ── Load alerts + email health ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // Optimistic cache render
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const cached = JSON.parse(raw) as ServerAlert[];
            if (!cancelled && Array.isArray(cached)) setAlerts(cached);
          }
        } catch { /* ignore */ }

        const headers = await authHeaders();
        const [listRes, healthRes] = await Promise.all([
          fetch('/api/alerts', { headers }),
          fetch('/api/health/email'),
        ]);

        if (!cancelled && healthRes.ok) {
          const h = (await healthRes.json()) as EmailHealth;
          setEmailHealth(h);
        }

        if (!listRes.ok) {
          if (!cancelled) setLoadError(`Could not load alerts (${listRes.status})`);
        } else {
          const json = (await listRes.json()) as { success: boolean; alerts: ServerAlert[] };
          if (!cancelled) {
            setAlerts(json.alerts ?? []);
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(json.alerts ?? [])); } catch { /* ignore */ }
          }
        }
      } catch (err: unknown) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (user?.email && !email) setEmail(user.email); }, [user?.email, email]);

  const activeType = ALERT_TYPES.find((t) => t.key === type)!;

  const createAlert = async () => {
    if (!email || saving) return;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      showToast('Threshold must be a number.', 'err');
      return;
    }
    setSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type,
          threshold: numericValue,
          frequency,
          email,
          category: category || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(`Could not save alert: ${body?.error ?? res.status}`, 'err');
        return;
      }
      const json = (await res.json()) as { success: boolean; alert: ServerAlert };
      const next = [json.alert, ...alerts];
      setAlerts(next);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      showToast(
        emailConfigured
          ? 'Alert created. You will be emailed when the threshold fires.'
          : 'Alert saved. Email delivery is not configured yet — you will not receive emails until an admin enables it.',
        'ok',
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Network error', 'err');
    } finally {
      setSaving(false);
    }
  };

  const deleteAlert = async (id: string) => {
    const prev = alerts;
    setAlerts(prev.filter((a) => a.id !== id));
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE', headers });
      if (!res.ok) {
        setAlerts(prev);
        showToast('Could not delete alert.', 'err');
        return;
      }
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(prev.filter((a) => a.id !== id))); } catch { /* ignore */ }
    } catch {
      setAlerts(prev);
      showToast('Network error deleting alert.', 'err');
    }
  };

  const scrollToForm = () => {
    document.getElementById('mj-alerts-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formDisabled = !emailConfigured;

  return (
    <div style={{ padding: '32px 36px', overflow: 'auto', color: C.text, fontFamily: sans }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: display, fontSize: 28, fontWeight: 800,
          letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #f5f5f5 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Alerts</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {emailConfigured
            ? 'Get notified when products hit your thresholds. Delivered to your inbox.'
            : 'Set up tracking alerts (email delivery coming when sending domain is verified).'}
        </p>
      </div>

      {/* Honest email-provider banner */}
      {emailHealth && !emailConfigured && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#f59e0b',
          fontSize: 13,
        }}>
          Email delivery isn&apos;t configured yet — alerts are tracked but not emailed. An admin must set
          <code style={{ margin: '0 4px', background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: 4, fontFamily: mono }}>RESEND_API_KEY</code>
          or
          <code style={{ margin: '0 4px', background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: 4, fontFamily: mono }}>POSTMARK_API_KEY</code>
          in Vercel for emails to send.
        </div>
      )}

      {loadError && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#f87171',
          fontSize: 13,
        }}>{loadError}</div>
      )}

      {toast && (
        <div style={{
          background: toastKind === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${toastKind === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          color: toastKind === 'ok' ? C.green : '#f87171',
          fontSize: 13,
        }}>{toast}</div>
      )}

      {/* Section A — Price Drop Alerts (AU Moat) */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: 0, color: '#f5f5f5' }}>Price Drop Alerts</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
              Tracked SKUs — emailed when price drops vs your snapshot. Cron runs every 6h.
            </p>
          </div>
          <Link href="/app/products" style={{ fontSize: 12, color: '#4f8ef7', textDecoration: 'none', fontWeight: 600 }}>
            Browse products →
          </Link>
        </div>
        {priceAlertsLoading ? (
          <div style={{
            background: '#111', border: '1px solid #161b22', borderRadius: 12,
            padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13,
          }}>Loading price alerts…</div>
        ) : priceAlerts.length === 0 ? (
          <div style={{
            background: '#111', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12,
            padding: '32px 24px', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(79,142,247,0.10)',
              border: '1px solid rgba(79,142,247,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', color: '#4f8ef7',
            }}>
              <Tag size={20} />
            </div>
            <div style={{ fontFamily: display, fontSize: 15, fontWeight: 700, color: '#f5f5f5', marginBottom: 4 }}>
              No price alerts yet
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              Open any product and tap the bell to track its price.
            </div>
          </div>
        ) : (
          <div style={{
            background: '#111', border: '1px solid #161b22', borderRadius: 12,
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #161b22' }}>
                    {['', 'Product', 'Type', 'Original', 'Current', 'Status', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '10px 12px', textAlign: 'left',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                        color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priceAlerts.map((a) => {
                    const current = livePrices[a.product_id] ?? null;
                    const dropped = current != null && current < a.original_price;
                    const badge =
                      a.status === 'triggered' || dropped
                        ? { c: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'TRIGGERED' }
                        : a.status === 'cancelled'
                          ? { c: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', label: 'CANCELLED' }
                          : { c: '#4f8ef7', bg: 'rgba(79,142,247,0.12)', label: 'ACTIVE' };
                    const typeLabel = a.alert_type === 'any_drop'
                      ? 'Any drop'
                      : a.alert_type === 'percentage'
                        ? `≥ ${a.threshold_percent ?? '?'}%`
                        : `≤ $${a.target_price?.toFixed(2) ?? '?'}`;
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #161b22' }}>
                        <td style={{ padding: '10px 12px', width: 60 }}>
                          {a.product_image ? (
                            <img
                              src={proxyImage(a.product_image) ?? a.product_image}
                              alt=""
                              loading="lazy"
                              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #161b22' }}
                            />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: '#f5f5f5', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.product_name}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                          {typeLabel}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: mono, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                          ${a.original_price.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: mono, fontSize: 13, color: dropped ? '#10b981' : '#f5f5f5', fontWeight: dropped ? 700 : 500 }}>
                          {current != null ? `$${current.toFixed(2)}` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 8px', borderRadius: 6,
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                            color: badge.c, background: badge.bg, border: `1px solid ${badge.c}55`,
                          }}>{badge.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          {a.status !== 'cancelled' ? (
                            <button
                              type="button"
                              onClick={() => cancelPriceAlert(a.id)}
                              aria-label="Cancel alert"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.10)',
                                color: 'rgba(255,255,255,0.6)',
                                borderRadius: 8, padding: '6px 10px', fontSize: 11, cursor: 'pointer',
                              }}
                            >Cancel</button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Section 0 — Tracked Products */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: 0 }}>Tracked Products</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
              Track up to {isPro ? 'unlimited' : TRACK_LIMIT_BUILDER} products ({isPro ? 'Scale' : 'Builder'} tier) — {trackedCount} used
            </p>
          </div>
          <Link href="/app/products" style={{
            fontSize: 12,
            color: C.accentHover,
            textDecoration: 'none',
            fontWeight: 600,
          }}>Browse products →</Link>
        </div>

        {trackedCount === 0 ? (
          <div style={{
            background: C.raised,
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              color: '#f59e0b',
            }}>
              <Bell size={22} />
            </div>
            <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
              No products tracked yet
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, maxWidth: 420, marginInline: 'auto' }}>
              Track products to get notified when their order velocity increases significantly. Click Track on any product detail panel.
            </div>
            <Link href="/app/products" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px',
              borderRadius: 9,
              background: 'linear-gradient(135deg,#7c6aff,#a78bfa)',
              color: 'white',
              fontFamily: sans, fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(124,106,255,0.35)',
            }}>
              <Package size={13} /> Browse products →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, marginBottom: 14 }}>
              {tracked.map((t) => (
                <div key={t.productId} style={{
                  background: C.raised,
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  position: 'relative',
                }}>
                  {t.productImage ? (
                    <img
                      src={proxyImage(t.productImage) ?? t.productImage}
                      alt={t.productTitle ?? ''}
                      loading="lazy"
                      style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.productTitle ?? 'Untitled'}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: mono }}>
                      <span>Score {t.aiScore ?? '—'}</span>
                      <span>·</span>
                      <span>{t.soldCount != null ? t.soldCount.toLocaleString() : '—'} orders</span>
                      <span>·</span>
                      <span>${t.priceAud != null ? t.priceAud.toFixed(0) : '—'}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                      Tracked {new Date(t.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => untrack(t.productId)}
                    aria-label="Untrack"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                      borderRadius: 8,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  ><X size={11} /> Untrack</button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontStyle: 'italic' }}>
              {emailConfigured
                ? 'Alerts are sent to your email when a tracked product\u2019s order velocity increases significantly.'
                : 'Tracked products will trigger alerts once an email sending domain is verified.'}
            </p>
          </>
        )}
      </section>

      {/* Section 1 — Active alerts */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Active Alerts</h2>
        {loading ? (
          <div style={{
            background: C.raised,
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '32px 24px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 13,
          }}>Loading your alerts…</div>
        ) : alerts.length === 0 ? (
<<<<<<< HEAD
          <EmptyState
            icon={<Bell size={40} strokeWidth={1.75} />}
            title="No alerts yet"
            body="Track a product's price, score, or order velocity. We'll email you the moment it changes."
            primaryCta={{ label: 'Create your first alert', onClick: scrollToForm }}
          />
=======
          <div style={{
            background: C.raised,
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
              color: C.accentHover,
              position: 'relative',
            }}>
              <Bell size={22} />
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 16, height: 16, borderRadius: '50%',
                background: C.accent, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>+</span>
            </div>
            <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>No alerts set up yet</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
              Get notified when a product hits your score threshold, orders spike, or price drops.
            </div>
            <button
              onClick={scrollToForm}
              style={{
                padding: '10px 18px',
                borderRadius: 9,
                background: '#4f8ef7',
                color: '#04060f',
                border: 'none',
                fontFamily: sans, fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(79,142,247,0.3)',
              }}
            >Create your first alert →</button>
          </div>
>>>>>>> origin/app-theme-cobalt
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {alerts.map((a) => {
              const typeLabel = ALERT_TYPES.find((t) => t.key === a.type)?.label ?? a.type;
              return (
                <div key={a.id} style={{
                  background: C.raised,
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: 16,
                  position: 'relative',
                }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{typeLabel}</div>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>
                    {a.type === 'score_change'     && <>Score ≥ {a.threshold}{a.category ? <> in <strong>{shortenCategory(a.category)}</strong></> : null}</>}
                    {a.type === 'price_drop'       && <>Price ≤ ${a.threshold} AUD{a.category ? <> in <strong>{shortenCategory(a.category)}</strong></> : null}</>}
                    {a.type === 'sold_count_spike' && <>Orders ≥ {a.threshold.toLocaleString()}{a.category ? <> in <strong>{shortenCategory(a.category)}</strong></> : null}</>}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {a.frequency} · {a.email}
                  </div>
                  {a.last_fired_at && (
                    <div style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                      Last fired {new Date(a.last_fired_at).toLocaleDateString()}
                    </div>
                  )}
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
      <section id="mj-alerts-form" style={{ marginBottom: 36, opacity: formDisabled ? 0.5 : 1 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Create an Alert</h2>
        <div style={{
          background: C.raised,
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
                  disabled={formDisabled}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: active ? 'rgba(124,106,255,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? '#f5f5f5' : 'rgba(255,255,255,0.5)',
                    fontFamily: sans, fontSize: 12, fontWeight: active ? 600 : 500,
                    cursor: formDisabled ? 'not-allowed' : 'pointer',
                  }}
                >{t.label}</button>
              );
            })}
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{activeType.hint}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            <FormField label="Category (optional)">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={formDisabled}
                style={selectStyle}
              >
                <option value="">All categories</option>
                {niches.map((n) => (
                  <option key={n.name} value={n.name}>{shortenCategory(n.name)}</option>
                ))}
              </select>
            </FormField>
            <FormField label={`Threshold${activeType.unit ? ` (${activeType.unit})` : ''}`}>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={activeType.placeholder}
                disabled={formDisabled}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={formDisabled}
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Frequency</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {(['instant', 'daily', 'weekly'] as Frequency[]).map((f) => {
              const active = f === frequency;
              return (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  disabled={formDisabled}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? C.green : 'rgba(255,255,255,0.5)',
                    fontFamily: sans, fontSize: 12, fontWeight: active ? 600 : 500, textTransform: 'capitalize',
                    cursor: formDisabled ? 'not-allowed' : 'pointer',
                  }}
                >{f}</button>
              );
            })}
          </div>

          <button
            onClick={createAlert}
            disabled={!email || saving || formDisabled}
            style={{
              padding: '12px 24px',
              borderRadius: 9,
              background: (email && !saving && !formDisabled) ? 'linear-gradient(135deg,#7c6aff,#a78bfa)' : 'rgba(124,106,255,0.2)',
              border: 'none',
              color: 'white',
              fontFamily: sans, fontSize: 14, fontWeight: 600,
              cursor: (email && !saving && !formDisabled) ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: (email && !saving && !formDisabled) ? '0 4px 20px rgba(124,106,255,0.35)' : 'none',
            }}
          ><Plus size={14} /> {saving ? 'Saving…' : 'Create Alert'}</button>
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
  color: C.text,
  fontFamily: C.fontBody,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
