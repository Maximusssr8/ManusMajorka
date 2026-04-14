import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const brico = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: '#05070F', fontFamily: dm }}>
      <SEO
        title="About Majorka — AI Ecommerce Intelligence"
        description="Majorka is an AI-powered ecommerce intelligence platform helping sellers find winning products, build stores, and scale their businesses."
        path="/about"
      />
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #ECECEC', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <img src="/majorka-logo.jpg" alt="Majorka" width={30} height={30} style={{ borderRadius: 7 }} />
            <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 16, color: '#0F172A' }}>Majorka</span>
          </a>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/" style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'none' }}>← Home</a>
            <Link href="/sign-up" style={{ background: '#d4af37', color: 'white', borderRadius: 8, padding: '7px 16px', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,175,55,0.08)', borderRadius: 20, padding: '4px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#d4af37', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>About Majorka</span>
        </div>
        <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px, 5vw, 52px)', color: '#F8FAFC', marginBottom: 20, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          We believe every seller deserves<br />intelligence-grade data.
        </h1>
        <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
          Majorka was built because the tools that big brands and professional buyers use to spot trends and source products were never made accessible to independent ecommerce sellers. We're changing that.
        </p>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 56px' }}>
        <div style={{ background: '#0d0d10', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '40px 48px' }}>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 26, color: '#F8FAFC', marginBottom: 16, letterSpacing: '-0.01em' }}>What we're building</h2>
          <p style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.75, marginBottom: 20 }}>
            Majorka is an AI-powered product intelligence platform. We ingest real TikTok Shop data, AliExpress supply signals, and market trend indicators to surface products with genuine commercial potential — scored, ranked, and ready to act on.
          </p>
          <p style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.75, marginBottom: 20 }}>
            Beyond discovery, we give sellers the tools to move fast: a store builder that goes from zero to live in under an hour, a competitive intel layer that shows what's working in any niche, and an AI creative suite for ad copy, hooks, and product descriptions.
          </p>
          <p style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.75 }}>
            It's the full stack — from "I found a product" to "I'm making sales" — in one platform.
          </p>
        </div>
      </div>

      {/* Values */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 56px' }}>
        <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 24, color: '#F8FAFC', marginBottom: 24, letterSpacing: '-0.01em' }}>What we stand for</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { icon: '📊', title: 'Real data only', body: 'Every metric traces back to a real source. No made-up scores or invented benchmarks.' },
            { icon: '⚡', title: 'Speed matters', body: 'Trend windows are short. Our platform is built to get you from insight to action in hours, not days.' },
            { icon: '🌍', title: 'Global by default', body: 'Winning products cross borders. We surface opportunities across markets, not just one geography.' },
            { icon: '🔓', title: 'Access for all', body: 'Enterprise-grade data intelligence shouldn\'t cost enterprise prices. We price for independent sellers.' },
          ].map(v => (
            <div key={v.title} style={{ background: '#0d0d10', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{v.icon}</div>
              <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: '#F8FAFC', marginBottom: 8 }}>{v.title}</div>
              <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{v.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, #d4af37, #d4af37)', borderRadius: 20, padding: '48px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 28, color: 'white', marginBottom: 12, letterSpacing: '-0.01em' }}>Ready to find your next winner?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 28, lineHeight: 1.6 }}>Start free. No credit card required.</p>
          <Link href="/sign-up" style={{ display: 'inline-block', background: '#0d0d10', color: '#d4af37', borderRadius: 10, padding: '14px 36px', fontWeight: 700, fontSize: 16, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Get Started Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
