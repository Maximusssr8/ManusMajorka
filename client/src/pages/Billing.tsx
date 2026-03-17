/**
 * Billing — current plan, next billing date, manage/upgrade.
 */
import { CreditCard, ExternalLink, RefreshCw, Star, Zap } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const C = {
  bg: '#0a0b0d',
  surface: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  gold: '#d4af37',
  text: '#f0ede8',
  muted: 'rgba(240,237,232,0.4)',
  sub: 'rgba(240,237,232,0.6)',
  green: '#10b981',
  card: 'rgba(255,255,255,0.02)',
};

interface SubData {
  plan: string;
  status: string;
  periodEnd: string | null;
  stripeConfigured: boolean;
}

export default function Billing() {
  const { session } = useAuth();
  const [sub, setSub] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch('/api/stripe/subscription-status', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => setSub(d))
      .catch(() => setSub(null))
      .finally(() => setLoading(false));
  }, [session]);

  const openPortal = async () => {
    if (!session) return;
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ returnUrl: 'https://majorka.io/app/billing' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not open billing portal. Try again.');
      }
    } catch {
      toast.error('Could not open billing portal. Check your connection.');
    } finally {
      setPortalLoading(false);
    }
  };

  const planLabel = sub?.plan === 'scale' ? 'Scale' : sub?.plan === 'builder' || sub?.plan === 'pro' ? 'Builder' : 'Free';
  const isActive = sub?.status === 'active' && planLabel !== 'Free';
  const periodEnd = sub?.periodEnd ? new Date(sub.periodEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <SEO title="Billing | Majorka" description="Manage your Majorka subscription." path="/app/billing" />
      <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text, marginBottom: 4 }}>
        Billing & Plan
      </h1>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>Manage your Majorka subscription</p>

      {loading ? (
        <div style={{ height: 120, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} style={{ color: C.muted, animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current Plan Card */}
          <div style={{ background: C.card, border: `1px solid ${isActive ? 'rgba(212,175,55,0.25)' : C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: isActive ? 'rgba(212,175,55,0.15)' : C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {planLabel === 'Free' ? <Zap size={18} style={{ color: C.muted }} /> : <Star size={18} style={{ color: C.gold }} />}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text }}>{planLabel} Plan</div>
                <div style={{ fontSize: 12, color: isActive ? C.green : C.muted }}>{isActive ? '● Active' : '● Inactive'}</div>
              </div>
              {isActive && (
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(212,175,55,0.12)', color: C.gold, fontFamily: 'Syne, sans-serif' }}>
                  SUBSCRIBED
                </span>
              )}
            </div>

            {periodEnd && (
              <div style={{ fontSize: 12, color: C.muted, padding: '10px 14px', background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <span style={{ color: C.sub }}>Next billing date:</span> <strong style={{ color: C.text }}>{periodEnd}</strong>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isActive && (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, fontWeight: 600, cursor: portalLoading ? 'not-allowed' : 'pointer', opacity: portalLoading ? 0.7 : 1, fontFamily: 'DM Sans, sans-serif' }}
              >
                {portalLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={14} />}
                {portalLoading ? 'Opening...' : 'Manage Billing'} <ExternalLink size={12} style={{ opacity: 0.5 }} />
              </button>
            )}

            {planLabel === 'Free' && (
              <a
                href="/pricing"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: '#d4af37', color: '#080a0e', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}
              >
                <Star size={14} /> Upgrade Plan
              </a>
            )}

            {planLabel === 'Builder' && (
              <a
                href="/pricing"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: C.surface, border: '1px solid rgba(212,175,55,0.3)', color: C.gold, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}
              >
                <Zap size={14} /> Upgrade to Scale
              </a>
            )}
          </div>

          {/* Plan features summary */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontFamily: 'Syne, sans-serif' }}>
              Your Plan Includes
            </div>
            {planLabel === 'Free' ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Product Scout (5/month)', 'Winning Products (preview)', 'Basic Store Builder'].map(f => (
                  <li key={f} style={{ fontSize: 13, color: C.sub, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.muted }}>○</span> {f}
                  </li>
                ))}
              </ul>
            ) : planLabel === 'Builder' ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Unlimited Product Scout', 'Full Winning Products (69+)', 'Store Builder + Shopify Push', 'AI Copywriter + Ad Studio', 'Profit Calculator', 'Supplier Directory'].map(f => (
                  <li key={f} style={{ fontSize: 13, color: C.sub, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.green }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Everything in Builder', 'Scale dashboard', 'Creator Intelligence', 'TikTok Spy', 'Priority support'].map(f => (
                  <li key={f} style={{ fontSize: 13, color: C.sub, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.gold }}>★</span> {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
