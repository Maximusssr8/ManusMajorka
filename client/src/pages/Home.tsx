import { lazy, Suspense, type ReactElement } from 'react';
import { SEO } from '@/components/SEO';
import { StickyLaunchBar } from '@/components/landing/StickyLaunchBar';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';

const LiveDemo = lazy(() =>
  import('@/components/landing/LiveDemo').then((m) => ({ default: m.LiveDemo })),
);
const Pricing = lazy(() =>
  import('@/components/landing/Pricing').then((m) => ({ default: m.Pricing })),
);
const Testimonials = lazy(() =>
  import('@/components/landing/Testimonials').then((m) => ({ default: m.Testimonials })),
);
const FAQ = lazy(() =>
  import('@/components/landing/FAQ').then((m) => ({ default: m.FAQ })),
);
const FinalCTA = lazy(() =>
  import('@/components/landing/FinalCTA').then((m) => ({ default: m.FinalCTA })),
);

const FALLBACK: ReactElement = <div style={{ minHeight: 300 }} />;

const GLOBAL_CSS = `
html, body { background: #080808; color: #ededed; }
body { font-family: 'DM Sans', system-ui, sans-serif; }
*::selection { background: rgba(212,175,55,0.3); color: #fff; }
`;

export default function Home(): ReactElement {
  return (
    <>
      <SEO
        title="Majorka — Find Winning AliExpress Products Before Anyone Else"
        description="Real-time AliExpress trend data, AI market analysis and ad generation for AU, US & UK dropshippers. 7 days free. No credit card."
        path="/"
      />
      <style>{GLOBAL_CSS}</style>

      <StickyLaunchBar />

      <main style={{ background: '#080808', color: '#ededed', minHeight: '100vh' }}>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <Features />

        <Suspense fallback={FALLBACK}>
          <LiveDemo />
        </Suspense>
        <Suspense fallback={FALLBACK}>
          <Pricing />
        </Suspense>
        <Suspense fallback={FALLBACK}>
          <Testimonials />
        </Suspense>
        <Suspense fallback={FALLBACK}>
          <FAQ />
        </Suspense>
        <Suspense fallback={FALLBACK}>
          <FinalCTA />
        </Suspense>
      </main>
    </>
  );
}
