// FAQ v2 — accordion with +/- toggles, clean height transition.
import { useState } from 'react';
import { LT, F } from '@/lib/landingTokens';
import { EyebrowPill, H2, Sub, Section } from './shared';
import { useInViewFadeUp } from '@/components/landing/useInViewFadeUp';

const QUESTIONS = [
  {
    q: 'Which countries does Majorka cover?',
    a: 'Majorka covers Australia, the United States and the United Kingdom as first-class markets. Every product is scored independently in each market so you can target where momentum is building.',
  },
  {
    q: 'Where does the product data come from?',
    a: 'We aggregate live order data from AliExpress and TikTok Shop across AU, US and UK. The pipeline refreshes every 6 hours. Every count is a real, observed number — no estimates.',
  },
  {
    q: 'How fresh is the data?',
    a: 'Our pipeline runs every 6 hours. Order velocity, prices, and stock levels are refreshed automatically. You can see the last-updated timestamp on every product card.',
  },
  {
    q: 'How do I get started?',
    a: 'Sign up for early access — no credit card required. You get full Builder-tier access to explore the platform. Cancel anytime with one click.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. One click in settings, no questions, no retention calls. Prorated refunds for annual plans within 30 days of purchase.',
  },
  {
    q: 'Do I need a Shopify account to start?',
    a: 'Not to start. You can research products, generate briefs and ads without one. When you are ready to launch, Store Builder outputs a Shopify-importable JSON for any new or existing Shopify store.',
  },
] as const;

function AccordionItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${LT.border}`,
        padding: '20px 0',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontFamily: F.display,
            fontSize: 19,
            fontWeight: 600,
            color: LT.text,
            lineHeight: 1.3,
          }}
        >
          {q}
        </span>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 18,
            color: LT.textMute,
            flexShrink: 0,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          {open ? '−' : '+'}
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? 400 : 0,
          transition: 'max-height 200ms ease',
        }}
      >
        <p
          style={{
            fontFamily: F.body,
            fontSize: 16,
            lineHeight: 1.7,
            color: LT.textMute,
            margin: '12px 0 0',
            paddingRight: 40,
          }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const fadeUp = useInViewFadeUp();

  return (
    <Section id="faq">
      <div ref={fadeUp.ref} style={{ ...fadeUp.style, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <EyebrowPill>FAQ</EyebrowPill>
          </div>
          <H2 style={{ margin: '0 auto' }}>Frequently asked questions</H2>
          <Sub style={{ margin: '12px auto 0' }}>Everything you need to know before getting started.</Sub>
        </div>

        <div>
          {QUESTIONS.map((item, i) => (
            <AccordionItem
              key={i}
              q={item.q}
              a={item.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
