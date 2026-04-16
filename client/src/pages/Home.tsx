// Majorka — Landing Page v2
// Cobalt-blue (#4f8ef7) SaaS feel. Codex/Linear grade.
// Design tokens: /client/src/lib/landingTokens.ts (single source of truth).
// 9 sections: [0] Nav, [1] Hero, [2] Stats, [3] Features, [4] Compare,
//             [5] Social Proof, [6] Pricing, [7] FAQ, [8] Footer.

import { useEffect, useState } from 'react';
import { SEO } from '@/components/SEO';
import { LT, F, MAX } from '@/lib/landingTokens';

// v2 section components
import { LaunchBar, LAUNCH_BAR_HEIGHT } from '@/components/landing/v2/LaunchBar';
import { Nav } from '@/components/landing/v2/Nav';
import { Hero } from '@/components/landing/v2/Hero';
import { StatsBar } from '@/components/landing/v2/StatsBar';
import { FeatureTabs } from '@/components/landing/v2/FeatureTabs';
import { ComparisonTable } from '@/components/landing/v2/ComparisonTable';
import { SocialProof } from '@/components/landing/v2/SocialProof';
import { Pricing } from '@/components/landing/v2/Pricing';
import { FAQ } from '@/components/landing/v2/FAQ';
import { Footer } from '@/components/landing/v2/Footer';

// ── Global CSS — responsive, safety net, hover states ────────────────────────
const GLOBAL_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body { background: ${LT.bg}; margin: 0; padding: 0; }
body { font-family: ${F.body}; color: ${LT.text}; -webkit-font-smoothing: antialiased; }
::selection { background: ${LT.cobaltTint}; color: #fff; }

/* Safety: never hide section content */
[data-majorka-landing] section { opacity: 1 !important; }

/* Button hover states */
.mj-cta-primary:hover { transform: scale(1.02); filter: brightness(1.05); }
.mj-cta-ghost:hover { border-color: rgba(255,255,255,0.5) !important; }

/* Card hover */
.mj-testimonial-card:hover { border-color: rgba(79,142,247,0.4) !important; }

/* Footer hovers */
.mj-footer-social:hover { color: ${LT.cobalt} !important; }
.mj-footer-link:hover { color: ${LT.text} !important; }

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

/* ── Mobile ≤900px ──────────────────────────────────────────────────────── */
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

/* ── Mobile ≤768px ──────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .mj-hero-h1 { font-size: 44px !important; }
  .mj-hero-mockup { transform: none !important; }
  .mj-hero-mockup-wrap { perspective: none !important; }
  .mj-hero-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .mj-hero-grid > :nth-child(3) { display: none !important; }
  .mj-stats-row { grid-template-columns: repeat(2, 1fr) !important; }
  .mj-stats-cell { border-right: none !important; border-bottom: 1px solid ${LT.border} !important; }
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
    border-bottom-color: ${LT.cobalt} !important;
    border-left-color: transparent !important;
  }
}

/* ── Narrow mobile ≤420px ───────────────────────────────────────────────── */
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
    <div data-majorka-landing="" style={{ minHeight: '100vh', background: LT.bg }}>
      <SEO
        title="Majorka — Find winning dropshipping products before they peak | AU · US · UK"
        description="AI product intelligence for AU, US and UK dropshippers. 4,155+ products scored for demand, margin, and market fit. 7-day free trial."
      />
      <style>{GLOBAL_CSS}</style>

      <LaunchBar />
      <Nav topOffset={barVisible ? LAUNCH_BAR_HEIGHT : 0} />

      <main id="main-content" style={{ paddingTop: barVisible ? LAUNCH_BAR_HEIGHT : 0 }}>
        {/* [1] Hero */}
        <Hero />

        {/* [2] Stats Bar */}
        <StatsBar />

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
