import type { ReactElement } from 'react';

const mono = "'JetBrains Mono', ui-monospace, monospace";
const sans = "'DM Sans', system-ui, sans-serif";

const CHIPS: readonly string[] = [
  '3,715 Products',
  'Real-time Data',
  'AU Market Native',
  '7-Day Free Trial',
];

export function SocialProof(): ReactElement {
  return (
    <section
      style={{
        padding: '32px 20px',
        maxWidth: 1200,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          color: '#8a8a8f',
          marginBottom: 14,
          letterSpacing: '0.01em',
        }}
      >
        Trusted by dropshippers in Sydney · Melbourne · London · New York · Auckland
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {CHIPS.map((c) => (
          <span
            key={c}
            style={{
              padding: '6px 14px',
              background: '#111',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
              fontFamily: mono,
              fontSize: 11,
              color: '#ededed',
              letterSpacing: '0.04em',
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}
