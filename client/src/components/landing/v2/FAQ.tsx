// FAQ v2 — Academy-style: monospace eyebrow, Syne heading, rounded-2xl cards,
// ChevronDown toggle (matching Academy FAQSection), cobalt accents.
import { useState } from 'react';
import { F } from '@/lib/landingTokens';
import { Eyebrow, H2, Section } from './shared';
import { useInViewFadeUp } from '@/components/landing/useInViewFadeUp';

const QUESTIONS = [
  {
    q: 'Which countries does Majorka cover?',
    a: 'Majorka covers Australia, the United States and the United Kingdom as first-class markets. Every product is scored independently in each market so you can target where momentum is building.',
  },
  {
    q: 'Where does the product data come from?',
    a: 'We aggregate live order data from AliExpress and TikTok Shop across AU, US and UK. The pipeline refreshes every 6 hours. Every count is a real, observed number \u2014 no estimates.',
  },
  {
    q: 'How fresh is the data?',
    a: 'Our pipeline runs every 6 hours. Order velocity, prices, and stock levels are refreshed automatically. You can see the last-updated timestamp on every product card.',
  },
  {
    q: 'How do I get started?',
    a: 'Sign up for early access \u2014 no credit card required. You get full Builder-tier access to explore the platform. Cancel anytime with one click.',
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
        background: '#0d1117',
        border: open ? '1px solid rgba(79,142,247,0.18)' : '1px solid rgba(79,142,247,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 200ms ease',
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
          padding: '18px 20px',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontFamily: F.body,
            fontSize: 15,
            fontWeight: 500,
            color: '#E0E0E0',
            lineHeight: 1.4,
          }}
        >
          {q}
        </span>
        <span
          style={{
            color: '#9CA3AF',
            flexShrink: 0,
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? 400 : 0,
          transition: 'max-height 250ms ease',
        }}
      >
        <p
          style={{
            fontFamily: F.body,
            fontSize: 14,
            lineHeight: 1.7,
            color: '#9CA3AF',
            margin: 0,
            padding: '0 20px 18px',
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
    <Section id="faq" style={{ padding: '80px 20px' }}>
      <div ref={fadeUp.ref} style={{ ...fadeUp.style, maxWidth: 760, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow center>FAQ {'\u00B7'} 6 questions</Eyebrow>
          <H2 style={{ margin: '0 auto' }}>
            Frequently asked questions.
            <br />
            <span style={{ color: '#9CA3AF' }}>Everything you need to know.</span>
          </H2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
