/**
 * /guarantee — The Majorka Promise.
 *
 * Hero: "Find a winning product in 30 days. Or it's free."
 * Sections: How it works · Winning-product definition · Eligibility fine-print ·
 *           How to claim · CTA to /sign-up.
 * Design: landingTokens — bg #080808, gold #d4af37, Syne headings, DM Sans body.
 */
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Search, BarChart3, Rocket, Shield, Mail, CheckCircle2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { LT, F, S, R, MAX } from '@/lib/landingTokens';

interface StatsOverview {
  weeklyOrdersMin?: number;
  marginMin?: number;
  suppliersMin?: number;
}

const FALLBACK_STATS: Required<StatsOverview> = {
  weeklyOrdersMin: 100,
  marginMin: 30,
  suppliersMin: 3,
};

function Hero() {
  return (
    <section
      style={{
        padding: `${S.xxxl}px 24px ${S.xl}px`,
        textAlign: 'center',
        maxWidth: MAX,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          background: LT.goldTint,
          border: `1px solid ${LT.gold}`,
          borderRadius: R.badge,
          fontFamily: F.body,
          fontSize: 12,
          fontWeight: 600,
          color: LT.gold,
          letterSpacing: '0.05em',
          marginBottom: S.md,
        }}
      >
        <Shield size={14} /> THE MAJORKA PROMISE
      </div>
      <h1
        style={{
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 'clamp(40px, 8vw, 80px)',
          lineHeight: 1.05,
          letterSpacing: '-2px',
          color: LT.text,
          marginBottom: S.sm,
        }}
      >
        The Majorka Promise
      </h1>
      <h2
        style={{
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 'clamp(20px, 3.5vw, 30px)',
          letterSpacing: '-0.5px',
          color: LT.gold,
          maxWidth: 820,
          margin: '0 auto',
          lineHeight: 1.3,
        }}
      >
        Find a winning product in 30 days. Or it's free.
      </h2>
      <p
        style={{
          fontFamily: F.body,
          fontSize: 16,
          color: LT.textMute,
          maxWidth: 620,
          margin: `${S.md}px auto 0`,
          lineHeight: 1.6,
        }}
      >
        We back our platform with a 30-day money-back guarantee. Use Majorka,
        follow the workflow, and if you don't surface a product that meets our
        winning-product criteria — we refund every cent.
      </p>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Search',
      body:
        'Filter 3,700+ AliExpress winners by AU margin, ship speed, orders/week, and niche velocity.',
    },
    {
      icon: BarChart3,
      title: 'Analyse',
      body:
        'Score every candidate on demand, competition, supplier reliability, and AU-GST-adjusted profit.',
    },
    {
      icon: Rocket,
      title: 'Launch',
      body:
        'One-click Store Builder + Ads Studio briefs. Go live the same day you find the product.',
    },
  ];
  return (
    <section style={{ padding: `${S.xl}px 24px`, maxWidth: MAX, margin: '0 auto' }}>
      <div
        className="mkg-steps-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: S.md,
        }}
      >
        {steps.map(({ icon: Icon, title, body }, idx) => (
          <div
            key={title}
            style={{
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: R.card,
              padding: S.md,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto',
                borderRadius: '50%',
                background: LT.goldTint,
                border: `1px solid ${LT.gold}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: S.sm,
              }}
            >
              <Icon size={24} color={LT.gold} />
            </div>
            <div
              style={{
                fontFamily: F.body,
                fontSize: 11,
                fontWeight: 700,
                color: LT.textDim,
                letterSpacing: '0.1em',
                marginBottom: 6,
              }}
            >
              STEP {idx + 1}
            </div>
            <h3
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 22,
                color: LT.text,
                marginBottom: 8,
                letterSpacing: '-0.5px',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontFamily: F.body,
                fontSize: 14,
                color: LT.textMute,
                lineHeight: 1.6,
              }}
            >
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WinningDefinition({ stats }: { stats: Required<StatsOverview> }) {
  const rows: Array<{ label: string; value: string }> = [
    {
      label: 'Weekly orders',
      value: `≥ ${stats.weeklyOrdersMin.toLocaleString('en-AU')}`,
    },
    { label: 'Estimated margin (AU-GST adjusted)', value: `≥ ${stats.marginMin}%` },
    {
      label: 'Verified suppliers',
      value: `≥ ${stats.suppliersMin}`,
    },
  ];
  return (
    <section style={{ padding: `${S.xl}px 24px`, maxWidth: 820, margin: '0 auto' }}>
      <h2
        style={{
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 'clamp(26px, 4vw, 38px)',
          color: LT.text,
          textAlign: 'center',
          letterSpacing: '-1px',
          marginBottom: S.sm,
        }}
      >
        What counts as a winning product?
      </h2>
      <p
        style={{
          fontFamily: F.body,
          fontSize: 15,
          color: LT.textMute,
          textAlign: 'center',
          maxWidth: 600,
          margin: `0 auto ${S.md}px`,
          lineHeight: 1.6,
        }}
      >
        We don't hide behind vague language. A winning product, for the purposes
        of this guarantee, is any product surfaced in Majorka that meets all
        three criteria below.
      </p>
      <div
        style={{
          background: LT.bgCard,
          border: `1px solid ${LT.border}`,
          borderRadius: R.card,
          overflow: 'hidden',
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${LT.border}`,
              gap: 16,
            }}
          >
            <span
              style={{ fontFamily: F.body, fontSize: 15, color: LT.text, fontWeight: 500 }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontFamily: F.display,
                fontSize: 20,
                fontWeight: 800,
                color: LT.gold,
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Eligibility() {
  const rules = [
    '10+ logins during your trial',
    '5+ product searches during your trial',
    '3+ saved products during your trial',
  ];
  return (
    <section style={{ padding: `${S.xl}px 24px`, maxWidth: 820, margin: '0 auto' }}>
      <div
        style={{
          background: LT.bgElevated,
          border: `1px solid ${LT.border}`,
          borderRadius: R.card,
          padding: `${S.md}px ${S.md}px`,
        }}
      >
        <h3
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 22,
            color: LT.text,
            letterSpacing: '-0.5px',
            marginBottom: 12,
          }}
        >
          Eligibility
        </h3>
        <p
          style={{
            fontFamily: F.body,
            fontSize: 14,
            color: LT.textMute,
            lineHeight: 1.7,
            marginBottom: 16,
          }}
        >
          The guarantee protects operators who genuinely use the platform. It
          isn't a drive-by refund channel. To qualify, your account must show:
        </p>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {rules.map((r) => (
            <li
              key={r}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: F.body,
                fontSize: 14,
                color: LT.text,
              }}
            >
              <CheckCircle2 size={16} color={LT.gold} /> {r}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowToClaim() {
  return (
    <section style={{ padding: `${S.xl}px 24px`, maxWidth: 820, margin: '0 auto' }}>
      <h2
        style={{
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 'clamp(26px, 4vw, 38px)',
          color: LT.text,
          textAlign: 'center',
          letterSpacing: '-1px',
          marginBottom: S.md,
        }}
      >
        How to claim
      </h2>
      <div
        style={{
          background: LT.bgCard,
          border: `1px solid ${LT.border}`,
          borderRadius: R.card,
          padding: S.md,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {[
          {
            icon: Mail,
            title: 'Email support',
            body: 'Send us a note at hello@majorka.io from the email on your account.',
          },
          {
            icon: CheckCircle2,
            title: '14-day response',
            body: 'We review every claim personally within 14 days.',
          },
          {
            icon: Shield,
            title: 'Full refund',
            body: 'If your account meets the eligibility criteria, we refund your subscription in full. No questions asked.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: LT.goldTint,
                border: `1px solid ${LT.gold}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={LT.gold} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 16,
                  color: LT.text,
                  marginBottom: 4,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontFamily: F.body,
                  fontSize: 14,
                  color: LT.textMute,
                  lineHeight: 1.6,
                }}
              >
                {body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section
      style={{
        padding: `${S.xl}px 24px ${S.xxxl}px`,
        maxWidth: 820,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 'clamp(28px, 5vw, 44px)',
          color: LT.text,
          letterSpacing: '-1px',
          marginBottom: S.sm,
        }}
      >
        Ready to find your winner?
      </h2>
      <p
        style={{
          fontFamily: F.body,
          fontSize: 15,
          color: LT.textMute,
          marginBottom: S.md,
        }}
      >
        Start your free trial. The 30-day clock begins on your first paid day —
        not before.
      </p>
      <Link
        href="/sign-up"
        style={{
          display: 'inline-block',
          background: LT.gold,
          color: LT.bg,
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: '0.02em',
          padding: '16px 36px',
          borderRadius: R.button,
          textDecoration: 'none',
          boxShadow: '0 0 36px rgba(212,175,55,0.35)',
        }}
      >
        Start Your Free Trial →
      </Link>
      <div
        style={{
          marginTop: 16,
          fontFamily: F.body,
          fontSize: 13,
          color: LT.textDim,
        }}
      >
        <Link href="/pricing" style={{ color: LT.textMute, textDecoration: 'none' }}>
          ← Back to pricing
        </Link>
      </div>
    </section>
  );
}

export default function Guarantee() {
  const [stats, setStats] = useState<Required<StatsOverview>>(FALLBACK_STATS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/products/stats-overview')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        if (cancelled || !d || typeof d !== 'object') return;
        const record = d as Record<string, unknown>;
        const next: Required<StatsOverview> = { ...FALLBACK_STATS };
        if (typeof record.weeklyOrdersMin === 'number') {
          next.weeklyOrdersMin = record.weeklyOrdersMin;
        }
        if (typeof record.marginMin === 'number') {
          next.marginMin = record.marginMin;
        }
        if (typeof record.suppliersMin === 'number') {
          next.suppliersMin = record.suppliersMin;
        }
        setStats(next);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        background: LT.bg,
        color: LT.text,
        minHeight: '100vh',
        fontFamily: F.body,
      }}
    >
      <SEO
        title="The Majorka Promise — 30-Day Winning Product Guarantee"
        description="Find a winning product in 30 days with Majorka. Or it's free. Full money-back guarantee on eligible accounts."
        path="/guarantee"
      />
      <Hero />
      <HowItWorks />
      <WinningDefinition stats={stats} />
      <Eligibility />
      <HowToClaim />
      <CTA />
    </div>
  );
}
