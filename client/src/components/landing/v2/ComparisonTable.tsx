// Cost of Inaction — "7 hours vs 10 minutes" timeline comparison.
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { LT, F, S } from '@/lib/landingTokens';
import { EyebrowPill, H2, Section } from './shared';

/* ── timeline data ─────────────────────────────────────────── */

interface TimelineItem {
  time: string;
  lines: string[];
  duration?: string;
}

const WITHOUT: readonly TimelineItem[] = [
  { time: '6:00 AM', lines: ['Open AliExpress. Start scrolling.', 'Browse 200+ listings manually.'], duration: 'Time: 2 hours' },
  { time: '8:00 AM', lines: ['Try to estimate demand.', 'No velocity data. No market split.', 'Guess which country wants it.'], duration: 'Time: 1 hour' },
  { time: '9:00 AM', lines: ['Write ad copy from scratch.', 'Test 5 hooks. Rewrite 3 times.'], duration: 'Time: 3 hours' },
  { time: '12:00 PM', lines: ['Check if competitors already sell it.', 'Search Shopify stores manually.'], duration: 'Time: 1 hour' },
  { time: '1:00 PM', lines: ['ONE product researched.', 'No idea if it\u2019ll actually sell.'] },
];

const WITH: readonly TimelineItem[] = [
  { time: '6:00 AM', lines: ['Open Majorka. Browse scored products.', 'Filter by AU market, >85 score.'], duration: 'Time: 5 minutes' },
  { time: '6:05 AM', lines: ['Click product. AI Brief generates.', 'Target audience, hooks, platform recs.'], duration: 'Time: 3 seconds' },
  { time: '6:06 AM', lines: ['Generate Meta ad copy.', '4 formats. Ready to launch.'], duration: 'Time: 10 seconds' },
  { time: '6:07 AM', lines: ['Check price alerts. See trends.', 'Know what\u2019s moving before it peaks.'], duration: 'Time: 2 minutes' },
  { time: '6:10 AM', lines: ['DONE. Product validated.', 'Data-backed. Ready to sell.'] },
];

/* ── fade-up hook ──────────────────────────────────────────── */

function useFadeUp<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── sub-components ────────────────────────────────────────── */

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function TimelineCard({
  title,
  dotColor,
  accentColor,
  items,
  summaryBig,
  summaryLine,
  summaryCost,
  leftBorder,
}: {
  title: string;
  dotColor: string;
  accentColor: string;
  items: readonly TimelineItem[];
  summaryBig: string;
  summaryLine: string;
  summaryCost: string;
  leftBorder?: boolean;
}) {
  const ref = useFadeUp<HTMLDivElement>();

  const cardStyle: CSSProperties = {
    background: LT.bgCard,
    border: `1px solid ${LT.border}`,
    borderRadius: 16,
    padding: 32,
    opacity: 0,
    transform: 'translateY(16px)',
    transition: 'opacity 400ms ease, transform 400ms ease',
    ...(leftBorder ? { borderLeft: `3px solid ${accentColor}` } : {}),
  };

  return (
    <div ref={ref} style={cardStyle}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Dot color={dotColor} />
        <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: LT.text }}>{title}</span>
      </div>

      {/* timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
            {/* vertical connector */}
            {i < items.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: 36,
                  top: 20,
                  bottom: 0,
                  borderLeft: `1px dotted ${LT.border}`,
                }}
              />
            )}
            {/* time label */}
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 13,
                color: '#6b7280',
                minWidth: 72,
                flexShrink: 0,
                paddingTop: 2,
                lineHeight: 1.5,
              }}
            >
              {item.time}
            </div>
            {/* description */}
            <div style={{ paddingBottom: 20, flex: 1 }}>
              {item.lines.map((line, j) => (
                <div
                  key={j}
                  style={{
                    fontFamily: F.body,
                    fontSize: 14,
                    color: j === 0 ? LT.text : LT.textMute,
                    lineHeight: 1.55,
                  }}
                >
                  {line}
                </div>
              ))}
              {item.duration && (
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 13,
                    color: accentColor,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {item.duration}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* summary */}
      <div
        style={{
          borderTop: `1px solid ${LT.border}`,
          marginTop: 8,
          paddingTop: 20,
        }}
      >
        <div style={{ fontFamily: F.body, fontSize: 24, fontWeight: 700, color: accentColor }}>{summaryBig}</div>
        <div style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, marginTop: 4 }}>{summaryLine}</div>
        <div style={{ fontFamily: F.mono, fontSize: 14, color: accentColor, marginTop: 8 }}>{summaryCost}</div>
      </div>
    </div>
  );
}

/* ── main export ───────────────────────────────────────────── */

export function ComparisonTable() {
  const punchRef = useFadeUp<HTMLDivElement>();
  const closerRef = useFadeUp<HTMLDivElement>();

  return (
    <Section id="compare" style={{ background: LT.bg, padding: '96px 24px' }}>
      {/* header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <EyebrowPill style={{ fontSize: 11 }}>The Real Cost</EyebrowPill>
        </div>
        <H2 style={{ margin: '0 auto', maxWidth: 700 }}>
          Every day without Majorka is a day your competitors get ahead.
        </H2>
      </div>

      {/* two-column grid */}
      <div
        className="mj-cost-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          maxWidth: 1000,
          margin: '0 auto',
        }}
      >
        <TimelineCard
          title="Manual Research"
          dotColor="#ef4444"
          accentColor="#ef4444"
          items={WITHOUT}
          summaryBig="7+ hours"
          summaryLine="on ONE product. No data. No confidence."
          summaryCost="Estimated cost: $210 of your time"
        />
        <TimelineCard
          title="Majorka"
          dotColor={LT.cobalt}
          accentColor={LT.cobalt}
          items={WITH}
          summaryBig="10 minutes"
          summaryLine="Data-backed decision. Confidence to launch."
          summaryCost="Cost: $166/month (less than ONE hour of your time)"
          leftBorder
        />
      </div>

      {/* punchline card */}
      <div
        ref={punchRef}
        style={{
          background: '#0a0d14',
          border: `1px solid ${LT.border}`,
          borderRadius: 12,
          padding: '24px 48px',
          maxWidth: 700,
          margin: '48px auto 0',
          textAlign: 'center',
          opacity: 0,
          transform: 'translateY(16px)',
          transition: 'opacity 400ms ease, transform 400ms ease',
        }}
      >
        <p
          style={{
            fontFamily: F.body,
            fontSize: 17,
            color: LT.text,
            lineHeight: 1.7,
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          While you&rsquo;re manually scrolling AliExpress,
          <br />
          a Majorka user already found, validated,
          <br />
          and started selling the winning product.
        </p>
      </div>

      {/* closer */}
      <div
        ref={closerRef}
        style={{
          textAlign: 'center',
          marginTop: 24,
          opacity: 0,
          transform: 'translateY(16px)',
          transition: 'opacity 400ms ease 100ms, transform 400ms ease 100ms',
        }}
      >
        <p style={{ fontFamily: F.body, fontSize: 15, color: LT.textMute, margin: 0, lineHeight: 1.7 }}>
          The question isn&rsquo;t whether Majorka is worth $166/month.
          <br />
          It&rsquo;s how much the delay is costing you.
        </p>
      </div>

      {/* responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .mj-cost-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Section>
  );
}
