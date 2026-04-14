import type { ReactElement } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Database, PieChart, Sparkles, Megaphone, Store, Users } from 'lucide-react';

const GOLD = '#d4af37';
const display = "'Syne', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

const FEATURES = [
  { icon: Database, title: 'Product Intelligence', body: '3,715 AliExpress winners scored by trend velocity, saturation and AU-market fit — updated every six hours.' },
  { icon: PieChart, title: 'Market Split', body: 'See exactly where demand is: AU, US, UK, CA, NZ and more. Pick the market with headroom before you launch.' },
  { icon: Sparkles, title: 'AI Briefs', body: 'Maya generates angle, audience and creative directions from a single product URL.' },
  { icon: Megaphone, title: 'Ads Manager', body: 'One-click Meta ad creative, hook variations and launch-ready copy tuned for 3-second stopping power.' },
  { icon: Store, title: 'Store Builder', body: 'Shopify-ready landing pages with copy, images and upsells generated straight from your product pick.' },
  { icon: Users, title: 'Creator Matrix', body: 'Matched creators by niche, platform and price tier — so your first UGC test ships the same day.' },
] as const;

export function Features(): ReactElement {
  const reduced = useReducedMotion() ?? false;
  return (
    <section style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: '0.12em', marginBottom: 10 }}>
          FEATURES
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
          Everything you need to pick, prove and push a winner.
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
        }}
      >
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              whileHover={reduced ? undefined : { y: -4, borderColor: GOLD, boxShadow: '0 12px 32px -12px rgba(212,175,55,0.4)' }}
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 22,
                transition: 'border-color 200ms, box-shadow 200ms',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(212,175,55,0.12)',
                  color: GOLD,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
              <div
                style={{
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#ededed',
                  marginBottom: 6,
                }}
              >
                {f.title}
              </div>
              <p style={{ fontFamily: sans, fontSize: 13.5, lineHeight: 1.55, color: '#a1a1aa', margin: 0 }}>
                {f.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
