import { useState, type ReactElement } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const GOLD = '#d4af37';
const display = "'Syne', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

const ITEMS = [
  {
    q: 'Is the trial really free?',
    a: 'Yes. Seven days, no credit card required. You get full access to product intelligence, Maya AI and Store Builder — cancel any time before day seven and you pay nothing.',
  },
  {
    q: 'What data does Majorka use?',
    a: 'Live AliExpress orders, review velocity, search demand and category saturation. Refreshed every six hours on Builder and hourly on Scale.',
  },
  {
    q: 'Does it work for Australia?',
    a: 'Majorka is AU-native. Every product is scored against AU buyer behaviour, shipping timelines and marketplace saturation — plus full US, UK, CA and NZ coverage.',
  },
  {
    q: 'What makes it different from Minea?',
    a: 'Minea tells you what’s running on Facebook ads. Majorka tells you what’s already selling — by market, by margin, by creator angle — then generates your store and creative for you.',
  },
  {
    q: 'How often is data updated?',
    a: 'Every six hours on the Builder plan. Every hour on Scale. New products are added daily by our ingestion pipeline.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Any time, self-serve, in your billing settings. No email tickets, no retention calls. 30-day money-back guarantee on your first paid month.',
  },
] as const;

export function FAQ(): ReactElement {
  const reduced = useReducedMotion() ?? false;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section style={{ padding: '80px 20px', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: '0.12em', marginBottom: 10 }}>
          FAQ
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
          Everything you’ll ask before signing up.
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              style={{
                background: '#111',
                border: isOpen ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '18px 20px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ededed',
                  fontFamily: sans,
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span>{item.q}</span>
                {isOpen ? <Minus size={18} color={GOLD} /> : <Plus size={18} color="#a1a1aa" />}
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key="body"
                    initial={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        padding: '0 20px 20px',
                        fontFamily: sans,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: '#a1a1aa',
                      }}
                    >
                      {item.a}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
