import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Mail, MessageCircle, Send, CheckCircle } from 'lucide-react';

const display = "'Syne', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = 'monospace';

/**
 * Public /contact page. Static contact information + a working contact
 * form that POSTs to /api/affiliates/apply (which already forwards to
 * hello@majorka.io via Resend in the backend) — we re-use the existing
 * pipeline rather than spinning up a parallel /api/contact route.
 */
export default function Contact() {
  useEffect(() => { document.title = 'Contact — Majorka'; }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrMsg('Please fill in all fields');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setErrMsg(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject: 'Contact form message', message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Network error');
      setStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f5f5f5', fontFamily: sans }}>
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
            background: 'linear-gradient(135deg, #4f8ef7, #4f8ef7)',
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

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 96px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(79,142,247,0.08)',
            border: '1px solid rgba(79,142,247,0.2)',
            fontSize: 11, fontFamily: mono, color: '#a5b4fc',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 18,
          }}>Get in touch</div>
          <h1 style={{
            fontFamily: display,
            fontSize: 'clamp(36px, 5vw, 52px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 14px',
            lineHeight: 1.1,
          }}>
            Talk to the Majorka team
          </h1>
          <p style={{ fontSize: 16, color: '#a1a1aa', margin: 0, lineHeight: 1.55 }}>
            We&apos;re a small team building Majorka in the open. Real humans read every email.
          </p>
        </div>

        {/* Channels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 56,
        }}>
          <a href="mailto:hello@majorka.io" style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: 22,
            textDecoration: 'none',
            display: 'block',
          }}>
            <Mail size={22} color="#a5b4fc" style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#f5f5f5', marginBottom: 4 }}>
              Email
            </div>
            <div style={{ fontSize: 13, color: '#a1a1aa' }}>hello@majorka.io</div>
          </a>
          <a href="mailto:support@majorka.io" style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: 22,
            textDecoration: 'none',
            display: 'block',
          }}>
            <MessageCircle size={22} color="#a5b4fc" style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#f5f5f5', marginBottom: 4 }}>
              Support
            </div>
            <div style={{ fontSize: 13, color: '#a1a1aa' }}>support@majorka.io</div>
          </a>
        </div>

        {/* Form */}
        <h2 style={{
          fontFamily: display,
          fontSize: 22,
          fontWeight: 700,
          color: '#f5f5f5',
          margin: '0 0 20px',
          letterSpacing: '-0.02em',
        }}>Or send us a message</h2>

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
              Message sent
            </div>
            <div style={{ fontSize: 14, color: '#a1a1aa' }}>
              We&apos;ll get back to you within 24 hours at {email}.
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
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>Your name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="What can we help you with?"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
              />
            </div>
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
                background: status === 'submitting' ? 'rgba(79,142,247,0.4)' : '#4f8ef7',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                marginTop: 6,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {status === 'submitting' ? 'Sending…' : <>Send message <Send size={14} /></>}
            </button>
          </form>
        )}

        <p style={{ marginTop: 32, fontSize: 12, color: '#52525b', textAlign: 'center', fontFamily: mono }}>
          Majorka Pty Ltd · Gold Coast, Australia
        </p>
      </div>
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
