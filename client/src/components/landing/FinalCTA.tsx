import type { ReactElement } from 'react';
import { Link } from 'wouter';
import { motion, useReducedMotion } from 'framer-motion';

const GOLD = '#d4af37';
const display = "'Syne', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";

export function FinalCTA(): ReactElement {
  const reduced = useReducedMotion() ?? false;
  return (
    <section style={{ padding: '96px 20px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
      <motion.h2
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{
          fontFamily: display,
          fontWeight: 800,
          fontSize: 'clamp(32px,5vw,52px)',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          color: '#ededed',
          marginBottom: 24,
        }}
      >
        Ready to find your next winning product?
      </motion.h2>

      <Link
        href="/sign-up"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '16px 28px',
          background: `linear-gradient(135deg,${GOLD} 0%,#f4d77a 50%,${GOLD} 100%)`,
          color: '#111',
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 16,
          borderRadius: 12,
          textDecoration: 'none',
          boxShadow: '0 12px 48px -12px rgba(212,175,55,0.6), 0 0 0 1px rgba(212,175,55,0.4)',
        }}
      >
        Start Your 7-Day Free Trial
      </Link>

      <p style={{ marginTop: 20, fontFamily: sans, fontSize: 13, color: '#8a8a8f' }}>
        No credit card · Cancel anytime · AU, US &amp; UK data
      </p>
    </section>
  );
}
