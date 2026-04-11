import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const syne = "'Syne', 'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', 'Inter', sans-serif";

const VALUES = [
  { title: 'Real data only', body: 'Every metric traces back to a real AliExpress / TikTok Shop source. No invented benchmarks.' },
  { title: 'Speed matters', body: 'Trend windows are short. We ship from insight to action in hours, not days.' },
  { title: 'AU-first, global-ready', body: 'We surface opportunities across 7 markets but tune everything for Australian operators.' },
  { title: 'Access for all', body: 'Enterprise-grade data at independent-seller prices — starting at $99 AUD/month.' },
];

const TEAM = [
  {
    name: 'Maximus Ryan',
    role: 'Founder · Product',
    bio: 'Built Majorka after six years running his own AU Shopify stores. Focuses on the research stack and AI scoring.',
    initials: 'MR',
  },
  {
    name: 'The Majorka Crew',
    role: 'Engineering · Data · Ops',
    bio: 'A small Gold Coast team shipping weekly across the product. Reach out and you\'ll likely talk to the person who built whatever you\'re using.',
    initials: 'MJ',
  },
];

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: dm, color: '#ededed' }}>
      <SEO
        title="About Majorka — AI Ecommerce Intelligence"
        description="Majorka is an AU-first AI ecommerce intelligence platform. Built by operators, for operators."
        path="/about"
      />

      {/* Dark nav matching main site */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1a1a1a', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/majorka-logo.jpg" alt="Majorka" width={30} height={30} style={{ borderRadius: 6 }} />
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: '#d4af37', letterSpacing: '-0.01em' }}>majorka</span>
          </a>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>Home</a>
            <a href="/blog" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>Blog</a>
            <a href="/pricing" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
            <Link href="/sign-up" style={{ background: '#3B82F6', color: 'white', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>About Majorka</span>
        </div>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 56px)', color: '#ededed', marginBottom: 20, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Intelligence-grade data,<br /><span style={{ color: '#d4af37' }}>built for operators</span>.
        </h1>
        <p style={{ fontSize: 18, color: '#888', lineHeight: 1.7, maxWidth: 620, margin: '0 auto' }}>
          Majorka was built because the tools big brands use to spot trends and source products were never made accessible to independent ecommerce sellers. We&rsquo;re changing that from Gold Coast, Australia.
        </p>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 56px' }}>
        <div style={{ background: '#0f0f0f', borderRadius: 8, border: '1px solid #1a1a1a', padding: '40px 48px' }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 26, color: '#ededed', marginBottom: 16, letterSpacing: '-0.01em' }}>What we&rsquo;re building</h2>
          <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.75, marginBottom: 16 }}>
            Majorka is an AI-powered product intelligence platform. We ingest real TikTok Shop data, AliExpress supply signals, and market trend indicators — then score, rank, and surface products with genuine commercial potential.
          </p>
          <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.75, marginBottom: 16 }}>
            Beyond discovery, we give sellers the tools to move fast: a store builder that goes from zero to live in under an hour, a competitive intel layer, AI ad copy and creative, and the only KaloData-style TikTok Shop leaderboard tuned for Australian operators.
          </p>
          <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.75 }}>
            It&rsquo;s the full stack — from &ldquo;I found a product&rdquo; to &ldquo;I&rsquo;m making sales&rdquo; — in one platform.
          </p>
        </div>
      </div>

      {/* Team */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 56px' }}>
        <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: '#ededed', marginBottom: 20, letterSpacing: '-0.01em' }}>The team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {TEAM.map((member) => (
            <div key={member.name} style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #8a6e1f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: 16, color: '#080808' }}>
                  {member.initials}
                </div>
                <div>
                  <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: '#ededed' }}>{member.name}</div>
                  <div style={{ fontSize: 12, color: '#d4af37', fontWeight: 600 }}>{member.role}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 56px' }}>
        <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: '#ededed', marginBottom: 20, letterSpacing: '-0.01em' }}>What we stand for</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {VALUES.map((v) => (
            <div key={v.title} style={{ background: '#0f0f0f', borderRadius: 8, border: '1px solid #1a1a1a', padding: '20px' }}>
              <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: '#d4af37', marginBottom: 8, letterSpacing: '-0.005em' }}>{v.title}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{v.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: '#0f0f0f', borderRadius: 8, border: '1px solid #1a1a1a', padding: '48px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 100%, rgba(59,130,246,0.12), transparent 60%)', pointerEvents: 'none' }} />
          <h2 style={{ position: 'relative', fontFamily: syne, fontWeight: 800, fontSize: 28, color: '#ededed', marginBottom: 12, letterSpacing: '-0.01em' }}>Ready to find your next winner?</h2>
          <p style={{ position: 'relative', fontSize: 15, color: '#888', marginBottom: 28, lineHeight: 1.6 }}>Start free. No credit card required.</p>
          <Link href="/sign-up" style={{ position: 'relative', display: 'inline-block', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', borderRadius: 6, padding: '12px 28px', fontWeight: 600, fontSize: 14, textDecoration: 'none', boxShadow: '0 10px 32px rgba(59,130,246,0.4), 0 0 0 1px rgba(212,175,55,0.3)' }}>
            Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
}
