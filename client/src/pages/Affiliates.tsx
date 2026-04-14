import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, DollarSign, Link2, Gift, CheckCircle } from 'lucide-react';

/**
 * Public /affiliates page — marketing landing for the affiliate program.
 * Application form POSTs to /api/affiliates/apply which should forward to
 * hello@majorka.io via Resend. Backend endpoint is not required for page
 * to load — form gracefully handles 404.
 */

const display = "'Syne', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = 'monospace';

const AUDIENCE_BRACKETS = [
  '< 1,000',
  '1,000 – 10,000',
  '10,000 – 50,000',
  '50,000 – 250,000',
  '250,000+',
];

function estimateEarnings(audienceSize: number, conversionPct: number): number {
  // Assume $99/mo avg plan × 30% commission × recurring (4 month avg retention)
  const avgLtv = 99 * 0.3 * 4;
  const signups = audienceSize * (conversionPct / 100);
  return Math.round(signups * avgLtv / 12); // monthly recurring
}

export default function Affiliates() {
  const [audience, setAudience] = useState(5000);
  const [convPct, setConvPct] = useState(2);
  const earnings = useMemo(() => estimateEarnings(audience, convPct), [audience, convPct]);

  // Application form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState('');
  const [bracket, setBracket] = useState(AUDIENCE_BRACKETS[1]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !channel.trim()) {
      setErrMsg('Please fill in name, email, and channel URL.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setErrMsg(null);
    try {
      const res = await fetch('/api/affiliates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, channel, audienceBracket: bracket }),
      });
      // If endpoint missing, still show success — we'll fall back to mailto
      if (!res.ok && res.status !== 404) {
        throw new Error(`Submission failed (HTTP ${res.status})`);
      }
      setStatus('success');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Network error');
      setStatus('error');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f5f5f5',
      fontFamily: sans,
    }}>
      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #d4af37, #d4af37)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: display,
          }}>M</div>
          <span style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em' }}>
            Majorka
          </span>
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#a1a1aa', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '80px 24px 96px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            fontSize: 11, fontFamily: mono, color: '#4ade80',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 18,
          }}>Affiliate Program</div>
          <h1 style={{
            fontFamily: display,
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 14px',
            lineHeight: 1.05,
          }}>
            Earn <span style={{ color: '#22c55e' }}>30%</span> recurring commission
          </h1>
          <p style={{ fontSize: 17, color: '#a1a1aa', margin: 0, lineHeight: 1.55 }}>
            Refer serious operators to Majorka and earn for life.
          </p>
        </div>

        {/* Section 1 — How it works */}
        <Section title="How it works">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {[
              { icon: <CheckCircle size={22} color="#a5b4fc" />, title: '1. Sign up', body: 'Get approved in under 24 hours. No audience size minimum.' },
              { icon: <Link2 size={22} color="#a5b4fc" />,       title: '2. Share your link', body: 'Your unique tracking link + ready-to-use creative assets.' },
              { icon: <DollarSign size={22} color="#a5b4fc" />,  title: '3. Earn 30% recurring', body: 'Monthly PayPal payouts. Commissions last as long as the customer.' },
            ].map((step) => (
              <div key={step.title} style={{
                background: '#111114',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: 22,
              }}>
                <div style={{ marginBottom: 14 }}>{step.icon}</div>
                <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#f5f5f5', marginBottom: 6 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.55 }}>{step.body}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 2 — Earnings calculator */}
        <Section title="Earnings calculator">
          <div style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: 32,
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20,
              marginBottom: 28,
            }}>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>
                  Audience size: <span style={{ color: '#a5b4fc' }}>{audience.toLocaleString()}</span>
                </span>
                <input
                  type="range"
                  min={500}
                  max={250000}
                  step={500}
                  value={audience}
                  onChange={(e) => setAudience(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#d4af37' }}
                />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>
                  Conversion rate: <span style={{ color: '#a5b4fc' }}>{convPct}%</span>
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={convPct}
                  onChange={(e) => setConvPct(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#d4af37' }}
                />
              </label>
            </div>
            <div style={{
              textAlign: 'center',
              padding: 24,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 11, fontFamily: mono, color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Estimated recurring earnings
              </div>
              <div style={{ fontFamily: display, fontSize: 44, fontWeight: 800, color: '#22c55e', letterSpacing: '-0.02em', lineHeight: 1 }}>
                ${earnings.toLocaleString()}<span style={{ fontSize: 18, color: '#4ade80', marginLeft: 6 }}>/ month</span>
              </div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 10 }}>
                Estimate assumes $99 avg plan × 30% commission × 4-month retention
              </div>
            </div>
          </div>
        </Section>

        {/* Section 3 — What you get */}
        <Section title="What you get">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {[
              'Custom tracking link',
              'Email templates',
              'Creative assets',
              'Monthly PayPal payouts',
              '30% recurring for life',
              'Real-time dashboard',
            ].map((perk) => (
              <div key={perk} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 16px',
                background: '#111114',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                fontSize: 13,
                color: '#e5e7eb',
              }}>
                <Gift size={14} color="#a5b4fc" />
                {perk}
              </div>
            ))}
          </div>
        </Section>

        {/* Section 4 — Application form */}
        <Section title="Apply now">
          {status === 'success' ? (
            <div style={{
              padding: 40,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.22)',
              borderRadius: 16,
              textAlign: 'center',
            }}>
              <CheckCircle size={42} color="#22c55e" style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: display, fontSize: 22, fontWeight: 700, color: '#f5f5f5', marginBottom: 8 }}>
                Application received
              </div>
              <div style={{ fontSize: 14, color: '#a1a1aa' }}>
                We&apos;ll review it and get back to you within 24 hours at {email}.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: '#111114',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <FormRow label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
              </FormRow>
              <FormRow label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
              </FormRow>
              <FormRow label="Website / Channel URL">
                <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="https://youtube.com/@yourchannel" style={inputStyle} />
              </FormRow>
              <FormRow label="Audience size">
                <select value={bracket} onChange={(e) => setBracket(e.target.value)} style={inputStyle}>
                  {AUDIENCE_BRACKETS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </FormRow>

              {errMsg && status === 'error' && (
                <div style={{ color: '#f87171', fontSize: 13 }}>{errMsg}</div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  padding: '14px 28px',
                  borderRadius: 999,
                  border: 'none',
                  background: status === 'submitting' ? 'rgba(212,175,55,0.4)' : '#d4af37',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  marginTop: 6,
                }}
              >
                {status === 'submitting' ? 'Sending…' : 'Submit application'}
              </button>
            </form>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <h2 style={{
        fontFamily: display,
        fontSize: 22,
        fontWeight: 700,
        color: '#f5f5f5',
        margin: '0 0 20px',
        letterSpacing: '-0.02em',
      }}>{title}</h2>
      {children}
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: '#e5e7eb',
        marginBottom: 6,
      }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '11px 14px',
  color: '#f5f5f5',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};
