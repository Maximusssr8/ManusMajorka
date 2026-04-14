import type { ReactElement } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, BarChart3, Rocket } from 'lucide-react';

const GOLD = '#d4af37';
const display = "'Syne', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

const STEPS = [
  {
    n: '01',
    icon: Search,
    title: 'Find',
    body: 'Scan 3,715 live AliExpress products with trend velocity, sold-count deltas and saturation filters.',
  },
  {
    n: '02',
    icon: BarChart3,
    title: 'Analyse',
    body: 'Maya AI breaks down market split, margins and creator matrix so you know who will buy and why.',
  },
  {
    n: '03',
    icon: Rocket,
    title: 'Launch',
    body: 'Generate ad briefs, a Shopify-ready store and Meta ad creative in under ten minutes.',
  },
] as const;

export function HowItWorks(): ReactElement {
  const reduced = useReducedMotion() ?? false;
  return (
    <section id="how" style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 11,
            color: GOLD,
            letterSpacing: '0.12em',
            marginBottom: 10,
          }}
        >
          HOW IT WORKS
        </div>
        <h2
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 'clamp(28px,4.5vw,42px)',
            color: '#ededed',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          From trend spotted to store launched — same day.
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 20,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))',
        }}
      >
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.n}
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: '#52525b',
                  marginBottom: 12,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(212,175,55,0.12)',
                  color: GOLD,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Icon size={22} strokeWidth={2} />
              </div>
              <div
                style={{
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: 22,
                  color: '#ededed',
                  marginBottom: 6,
                }}
              >
                {s.title}
              </div>
              <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.55, color: '#a1a1aa', margin: 0 }}>
                {s.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
