// API Strip — Academy-style: monospace eyebrow, Syne heading, dark card,
// cobalt accents, clean code block.
import { useState } from 'react';
import { Link } from 'wouter';
import { F } from '@/lib/landingTokens';
import { Eyebrow } from './shared';

const API_CSS = `
@media (max-width: 768px) {
  .mj-api-grid { grid-template-columns: 1fr !important; }
}
`;

const CODE_TEXT = `GET /api/v1/products?score_min=80&market=AU

{
  "ok": true,
  "products": [
    {
      "id": "prod_8xK2m",
      "title": "LED Pet Collar \u2014 Rechargeable",
      "score": 94,
      "orders_30d": 12_847,
      "trend": "rising",
      "price_aud": 14.90,
      "est_daily_revenue_aud": 580,
      "markets": ["AU", "US", "UK"]
    }
  ],
  "meta": { "total": 312, "page": 1 }
}`;

function CodeLine({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', lineHeight: 1.7 }}>
      <span style={{ width: 32, textAlign: 'right', paddingRight: 12, color: '#3f3f46', fontFamily: F.mono, fontSize: 12, userSelect: 'none', flexShrink: 0 }}>
        {num}
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 12 }}>{children}</span>
    </div>
  );
}

function SyntaxCode() {
  const cobalt = '#4f8ef7';
  const white = '#E0E0E0';
  const muted = '#9CA3AF';
  const dim = '#52525b';

  return (
    <div>
      <CodeLine num={1}>
        <span style={{ color: cobalt }}>GET</span>{' '}
        <span style={{ color: white }}>/api/v1/products?score_min=80&amp;market=AU</span>
      </CodeLine>
      <CodeLine num={2}><span style={{ color: dim }}>&nbsp;</span></CodeLine>
      <CodeLine num={3}><span style={{ color: dim }}>{'{'}</span></CodeLine>
      <CodeLine num={4}>
        {'  '}<span style={{ color: cobalt }}>&quot;ok&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: white }}>true</span>
        <span style={{ color: dim }}>,</span>
      </CodeLine>
      <CodeLine num={5}>
        {'  '}<span style={{ color: cobalt }}>&quot;products&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: dim }}>{'['}</span>
      </CodeLine>
      <CodeLine num={6}>{'    '}<span style={{ color: dim }}>{'{'}</span></CodeLine>
      <CodeLine num={7}>
        {'      '}<span style={{ color: cobalt }}>&quot;id&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: muted }}>&quot;prod_8xK2m&quot;</span>
        <span style={{ color: dim }}>,</span>
      </CodeLine>
      <CodeLine num={8}>
        {'      '}<span style={{ color: cobalt }}>&quot;title&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: muted }}>&quot;LED Pet Collar \u2014 Rechargeable&quot;</span>
        <span style={{ color: dim }}>,</span>
      </CodeLine>
      <CodeLine num={9}>
        {'      '}<span style={{ color: cobalt }}>&quot;score&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: white }}>94</span>
        <span style={{ color: dim }}>,</span>
      </CodeLine>
      <CodeLine num={10}>
        {'      '}<span style={{ color: cobalt }}>&quot;orders_30d&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: white }}>12847</span>
        <span style={{ color: dim }}>,</span>
      </CodeLine>
      <CodeLine num={11}>
        {'      '}<span style={{ color: cobalt }}>&quot;trend&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: muted }}>&quot;rising&quot;</span>
        <span style={{ color: dim }}>,</span>
      </CodeLine>
      <CodeLine num={12}>
        {'      '}<span style={{ color: cobalt }}>&quot;price_aud&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: white }}>14.90</span>
        <span style={{ color: dim }}>,</span>
      </CodeLine>
      <CodeLine num={13}>
        {'      '}<span style={{ color: cobalt }}>&quot;est_daily_revenue_aud&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: white }}>580</span>
        <span style={{ color: dim }}>,</span>
      </CodeLine>
      <CodeLine num={14}>
        {'      '}<span style={{ color: cobalt }}>&quot;markets&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: dim }}>{'['}</span>
        <span style={{ color: muted }}>&quot;AU&quot;</span>
        <span style={{ color: dim }}>, </span>
        <span style={{ color: muted }}>&quot;US&quot;</span>
        <span style={{ color: dim }}>, </span>
        <span style={{ color: muted }}>&quot;UK&quot;</span>
        <span style={{ color: dim }}>{']'}</span>
      </CodeLine>
      <CodeLine num={15}>{'    '}<span style={{ color: dim }}>{'}'}</span></CodeLine>
      <CodeLine num={16}>{'  '}<span style={{ color: dim }}>{']'}</span><span style={{ color: dim }}>,</span></CodeLine>
      <CodeLine num={17}>
        {'  '}<span style={{ color: cobalt }}>&quot;meta&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: dim }}>{'{ '}</span>
        <span style={{ color: cobalt }}>&quot;total&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: white }}>312</span>
        <span style={{ color: dim }}>, </span>
        <span style={{ color: cobalt }}>&quot;page&quot;</span>
        <span style={{ color: dim }}>: </span>
        <span style={{ color: white }}>1</span>
        <span style={{ color: dim }}>{' }'}</span>
      </CodeLine>
      <CodeLine num={18}><span style={{ color: dim }}>{'}'}</span></CodeLine>
    </div>
  );
}

export function ApiStrip() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(CODE_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* noop */ });
  }

  return (
    <section
      style={{
        width: '100%',
        background: '#0d1117',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '80px 20px',
      }}
    >
      <style>{API_CSS}</style>
      <div
        className="mj-api-grid"
        style={{
          maxWidth: 1152,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}
      >
        {/* Left -- copy */}
        <div>
          <Eyebrow>Majorka API</Eyebrow>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 600,
            lineHeight: 1.25,
            color: '#E0E0E0',
            margin: '0 0 16px',
          }}>
            Plug winning products<br />directly into your stack.
          </h3>
          <p style={{
            fontFamily: F.body,
            fontSize: 16,
            lineHeight: 1.65,
            color: '#9CA3AF',
            margin: '0 0 28px',
            maxWidth: 440,
          }}>
            RESTful API with real-time scores, trend data, and price alerts. Build your own edge.
          </p>
          <Link
            href="/docs"
            className="mj-cta-ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.04)',
              color: '#4f8ef7',
              fontFamily: F.mono,
              fontWeight: 500,
              fontSize: 14,
              border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: 12,
              textDecoration: 'none',
              letterSpacing: '0.02em',
              transition: 'background 150ms ease, border-color 150ms ease',
            }}
          >
            View API docs {'\u2192'}
          </Link>
        </div>

        {/* Right -- code block */}
        <div style={{ position: 'relative' }}>
          <div style={{
            background: '#080c14',
            border: '1px solid rgba(79,142,247,0.12)',
            borderRadius: 16,
            padding: 20,
            overflowX: 'auto',
          }}>
            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                color: copied ? '#4f8ef7' : '#6B7280',
                fontFamily: F.mono,
                fontSize: 11,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'color 150ms ease',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <SyntaxCode />
          </div>
        </div>
      </div>
    </section>
  );
}
