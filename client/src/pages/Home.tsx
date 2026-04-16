// Majorka — Landing Page v2 (Academy-inspired redesign)
//
// Academy design patterns applied across all landing sections:
// - Monospace eyebrows: font-mono, 10px, uppercase, 0.12em tracking, cobalt
// - Two-tone headings: Syne bold, #E0E0E0 primary + #9CA3AF or #4f8ef7 secondary
// - Cards: bg #0d1117, border rgba(79,142,247,0.08), rounded-2xl (16px), p-6/p-7
// - Section rhythm: py-20 (80px) consistent padding, border-t border-white/5
// - Body text: DM Sans, 14-16px, #9CA3AF, leading-relaxed
// - CTAs: GoldButton (cobalt fill, black text, glow shadow) + GhostButton (glass)
// - Color: cobalt #4f8ef7 used sparingly — eyebrows, CTAs, accents only
// - Max width: 1152px (max-w-6xl equivalent) with 20px side padding

import { useEffect, useState } from 'react';
import { SEO } from '@/components/SEO';
import { LT, F } from '@/lib/landingTokens';

// v2 section components
import { LaunchBar, LAUNCH_BAR_HEIGHT } from '@/components/landing/v2/LaunchBar';
import { Nav } from '@/components/landing/v2/Nav';
import { Hero } from '@/components/landing/v2/Hero';
import { MomentumTicker } from '@/components/landing/v2/MomentumTicker';
import { StatsBar } from '@/components/landing/v2/StatsBar';
import { FeatureTabs } from '@/components/landing/v2/FeatureTabs';
import { ComparisonTable } from '@/components/landing/v2/ComparisonTable';
import { SocialProof } from '@/components/landing/v2/SocialProof';
import { ApiStrip } from '@/components/landing/v2/ApiStrip';
import { Pricing } from '@/components/landing/v2/Pricing';
import { FAQ } from '@/components/landing/v2/FAQ';
import { Footer } from '@/components/landing/v2/Footer';

// ── Global CSS — Academy-inspired ───────────────────────────────────────────
const GLOBAL_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body { background: #04060f; margin: 0; padding: 0; }
body { font-family: ${F.body}; color: #E0E0E0; -webkit-font-smoothing: antialiased; }
::selection { background: rgba(79,142,247,0.15); color: #fff; }

/* Safety: never hide section content */
[data-majorka-landing] section { opacity: 1 !important; }

/* Button hover states — Academy GoldButton/GhostButton patterns */
.mj-cta-primary:hover { transform: scale(1.02); filter: brightness(1.05); }
.mj-cta-ghost:hover { border-color: rgba(255,255,255,0.25) !important; background: rgba(255,255,255,0.06) !important; }

/* Card hover — Academy ValueProps hover */
.mj-testimonial-card:hover { border-color: rgba(79,142,247,0.18) !important; }

/* Footer hovers */
.mj-footer-social:hover { color: #4f8ef7 !important; }
.mj-footer-link:hover { color: #E0E0E0 !important; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

a { color: inherit; }
button { font-family: inherit; }

/* Desktop defaults */
.mj-nav-mobile { display: none !important; }

/* ── Mobile <=900px ──────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .mj-nav-links { display: none !important; }
  .mj-nav-cta-desk { display: none !important; }
  .mj-nav-mobile { display: flex !important; }
  .mj-h2 { font-size: 28px !important; }
  .mj-section { padding: 64px 20px !important; }
  .mj-pricing-grid { grid-template-columns: 1fr !important; }
  .mj-social-grid { grid-template-columns: 1fr !important; }
  .mj-footer-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }
}

/* ── Mobile <=768px ──────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .mj-hero-h1 { font-size: 36px !important; }
  .mj-hero-mockup { transform: none !important; }
  .mj-hero-mockup-wrap { perspective: none !important; }
  .mj-hero-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .mj-hero-grid > :nth-child(3) { display: none !important; }
  .mj-stats-row { grid-template-columns: repeat(2, 1fr) !important; }
  .mj-stats-cell { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
  .mj-feature-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
  .mj-feature-tablist {
    flex-direction: row !important;
    overflow-x: auto !important;
    white-space: nowrap !important;
    -webkit-overflow-scrolling: touch;
  }
  .mj-feature-tablist button {
    border-left: none !important;
    border-bottom: 2px solid transparent !important;
    flex-shrink: 0 !important;
  }
  .mj-feature-tablist button[aria-selected='true'] {
    border-bottom-color: #4f8ef7 !important;
    border-left-color: transparent !important;
  }
}

/* ── Narrow mobile <=420px ───────────────────────────────────────────────── */
@media (max-width: 420px) {
  body { font-size: 14px; }
  .mj-footer-grid { grid-template-columns: 1fr !important; }
}
`;

export default function Home() {
  const [barVisible, setBarVisible] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  // Detect if launch bar is visible to offset nav.
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('majorka_launch_bar_dismissed_v4') === '1';
      if (!dismissed) {
        setBarVisible(true);
        setBarHeight(LAUNCH_BAR_HEIGHT);
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div data-majorka-landing="" style={{ minHeight: '100vh', background: '#04060f' }}>
      <SEO
        title="Majorka \u2014 Find winning dropshipping products before they peak | AU \u00B7 US \u00B7 UK"
        description="AI product intelligence for AU, US and UK dropshippers. Millions of products scored for demand, margin, and market fit. Early access now open."
      />
      <style>{GLOBAL_CSS}</style>

      <LaunchBar />
      <Nav topOffset={barVisible ? LAUNCH_BAR_HEIGHT : 0} />

      <main id="main-content" style={{ paddingTop: barVisible ? LAUNCH_BAR_HEIGHT : 0 }}>
        {/* [1] Hero */}
        <Hero />

        {/* [1.5] Momentum Ticker */}
        <MomentumTicker />

        {/* [2] Stats Bar */}
        <StatsBar />

        {/* [2.5] API Strip */}
        <ApiStrip />

        {/* [3] Product Feature Tabs */}
        <FeatureTabs />

        {/* [4] Comparison Table */}
        <ComparisonTable />

        {/* [5] Social Proof */}
        <SocialProof />

        {/* [6] Pricing */}
        <Pricing />

        {/* [7] FAQ */}
        <FAQ />
      </main>

      {/* [8] Footer */}
      <Footer />
    </div>
  );
}
