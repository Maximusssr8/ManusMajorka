// Placeholder for /docs and /changelog — routes exist so footer links don't 404.
// Replace with real content when docs + changelog ship.

import { Link } from 'wouter';
import { SEO } from '@/components/SEO';
import { LT, F, S, R } from '@/lib/landingTokens';

interface DocsPlaceholderProps {
  kind?: 'docs' | 'changelog';
}

export default function DocsPlaceholder({ kind = 'docs' }: DocsPlaceholderProps) {
  const isDocs = kind === 'docs';
  const title = isDocs ? 'API Docs' : 'Changelog';
  const blurb = isDocs
    ? 'The public API is in preview. Early-access customers get endpoints for products, scoring, briefs and ad copy. Email support for credentials.'
    : 'Release notes ship here. For now, follow along in product — every improvement lands as a subtle in-app note.';

  return (
    <div style={{
      minHeight: '100vh',
      background: LT.bg,
      color: LT.text,
      fontFamily: F.body,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: S.md,
    }}>
      <SEO
        title={`${title} — Majorka`}
        description={blurb}
        path={isDocs ? '/docs' : '/changelog'}
      />
      <div style={{
        maxWidth: 560,
        width: '100%',
        textAlign: 'center',
        padding: S.xl,
        background: LT.bgCard,
        border: `1px solid ${LT.border}`,
        borderRadius: R.card,
      }}>
        <div style={{
          fontFamily: F.mono,
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: LT.gold,
          marginBottom: S.sm,
        }}>
          Coming soon
        </div>
        <h1 style={{
          fontFamily: F.display,
          fontSize: 40,
          fontWeight: 700,
          margin: `0 0 ${S.sm}px`,
          color: LT.text,
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h1>
        <p style={{
          fontFamily: F.body,
          fontSize: 16,
          color: LT.textMute,
          lineHeight: 1.6,
          margin: `0 0 ${S.lg}px`,
        }}>
          {blurb}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="mailto:support@majorka.io"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 20px',
              background: LT.gold,
              color: LT.bg,
              fontFamily: F.body,
              fontWeight: 700,
              fontSize: 14,
              borderRadius: R.button,
              textDecoration: 'none',
              minHeight: 44,
            }}
          >
            Email support@majorka.io
          </a>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 20px',
              background: 'transparent',
              color: LT.text,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 14,
              border: `1px solid ${LT.border}`,
              borderRadius: R.button,
              textDecoration: 'none',
              minHeight: 44,
            }}
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
