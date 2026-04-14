import type { ReactElement } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

const GOLD = '#d4af37';
const display = "'Syne', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

const ITEMS = [
  {
    name: 'Sarah M.',
    city: 'Melbourne, AU',
    quote:
      'Found a $47 AOV product on day three, launched with Majorka’s ad brief and hit $8k revenue the first fortnight.',
  },
  {
    name: 'James T.',
    city: 'Sydney, AU',
    quote:
      'The AU market split data is what I was missing from Minea. Majorka finally tells me if a trend is already cooked here.',
  },
  {
    name: 'Priya K.',
    city: 'Perth, AU',
    quote:
      'Maya wrote my first three ads. Two of them printed money before I even finished my store’s about page.',
  },
] as const;

export function Testimonials(): ReactElement {
  const reduced = useReducedMotion() ?? false;
  return (
    <section style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: '0.12em', marginBottom: 10 }}>
          OPERATORS
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
          First sale inside seven days.
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
        }}
      >
        {ITEMS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            style={{
              background: '#111',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
              {[0, 1, 2, 3, 4].map((n) => (
                <Star key={n} size={14} fill={GOLD} color={GOLD} strokeWidth={0} />
              ))}
            </div>
            <p style={{ fontFamily: sans, fontSize: 15, lineHeight: 1.55, color: '#ededed', margin: 0 }}>
              “{t.quote}”
            </p>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: '#ededed' }}>{t.name}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#8a8a8f' }}>{t.city}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
