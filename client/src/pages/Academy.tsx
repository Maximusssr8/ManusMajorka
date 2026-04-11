import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, BookOpen, BarChart2, Store, Megaphone } from 'lucide-react';
import { SEO } from '@/components/SEO';

const CATEGORIES = [
  {
    id: 'research',
    label: 'Product Research',
    Icon: BarChart2,
    lessons: [
      { id: 'find-winners', title: 'How to find winning products before they peak', duration: '8 min', excerpt: 'Learn the signals that separate a viral product from noise — order velocity, trend timing, and market fit.' },
      { id: 'read-orders', title: 'Reading order data: what 1,000 orders really means', duration: '6 min', excerpt: 'Not all order counts are equal. Learn to interpret sold counts, review ratios, and estimate real revenue.' },
      { id: 'market-differences', title: 'AU vs US vs UK: why the same product performs differently', duration: '10 min', excerpt: 'Pricing, shipping times, and consumer behaviour vary by market. Here\'s how to adjust your strategy.' },
      { id: 'trend-velocity', title: 'Trend velocity explained: how scoring works', duration: '5 min', excerpt: 'Understand how products are scored and ranked to surface the highest-opportunity items.' },
    ],
  },
  {
    id: 'store',
    label: 'Store Building',
    Icon: Store,
    lessons: [
      { id: 'store-24h', title: 'Building a store that converts in 24 hours', duration: '12 min', excerpt: 'Step-by-step guide to launching a Shopify store optimised for AU dropshipping, fast.' },
      { id: 'descriptions', title: 'Writing product descriptions that sell', duration: '7 min', excerpt: 'Frameworks for writing copy that addresses objections and drives add-to-cart.' },
      { id: 'pricing-strategy', title: 'Pricing strategy for dropshipping margins', duration: '8 min', excerpt: 'How to set prices that cover ads, shipping, and returns while staying competitive.' },
      { id: 'shopify-vs-custom', title: 'Shopify vs custom store: which wins in 2026', duration: '6 min', excerpt: 'Honest comparison of platform options for different business stages.' },
    ],
  },
  {
    id: 'ads',
    label: 'Meta Ads',
    Icon: Megaphone,
    lessons: [
      { id: 'first-50', title: 'Your first $50 ad spend: what to test', duration: '9 min', excerpt: 'How to structure your first campaign to learn fast without wasting budget.' },
      { id: 'reading-roas', title: 'Reading ROAS: when to scale, when to kill', duration: '7 min', excerpt: 'The numbers that matter and the thresholds that separate profitable from losing.' },
      { id: 'creative-formats', title: 'Creative formats that work for dropshipping', duration: '8 min', excerpt: 'UGC, static, carousel, video — what actually converts for product ads in 2026.' },
      { id: 'retargeting', title: 'Retargeting your store visitors on a budget', duration: '6 min', excerpt: 'Simple retargeting setups that recover abandoned carts without complicated funnels.' },
    ],
  },
];

export default function Academy() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const filtered = activeCategory
    ? CATEGORIES.filter(c => c.id === activeCategory)
    : CATEGORIES;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <SEO title="Academy — Free Dropshipping Courses" description="Learn product research, store building, and Meta ads for dropshipping. Free courses from Majorka." />

      {/* Nav */}
      <nav style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', textDecoration: 'none' }}>
          Majorka
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/pricing" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>Pricing</Link>
          <Link to="/sign-in" style={{ fontSize: 14, padding: '6px 16px', borderRadius: 6, background: 'var(--accent)', color: 'var(--bg-base)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
          <BookOpen size={14} /> Free — no account required
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Learn to win with dropshipping
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          12 practical lessons on product research, store building, and Meta ads. Written by operators, not gurus.
        </p>
      </div>

      {/* Category filter */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px 32px', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid',
            background: !activeCategory ? 'var(--accent)' : 'transparent',
            color: !activeCategory ? 'var(--bg-base)' : 'var(--text-secondary)',
            borderColor: !activeCategory ? 'var(--accent)' : 'var(--border)',
          }}
        >All</button>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid',
              background: activeCategory === c.id ? 'var(--accent)' : 'transparent',
              color: activeCategory === c.id ? 'var(--bg-base)' : 'var(--text-secondary)',
              borderColor: activeCategory === c.id ? 'var(--accent)' : 'var(--border)',
            }}
          >{c.label}</button>
        ))}
      </div>

      {/* Lessons grid */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px 80px' }}>
        {filtered.map(category => (
          <div key={category.id} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <category.Icon size={16} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{category.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{category.lessons.length} lessons</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {category.lessons.map(lesson => (
                <div
                  key={lesson.id}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 20, cursor: 'pointer', transition: 'border-color 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{category.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{lesson.duration}</span>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>{lesson.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{lesson.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Free</span>
                    <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '60px 24px', textAlign: 'center', background: 'var(--bg-surface)' }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 400, margin: '0 auto 16px' }}>
          Ready to put this into practice? Majorka tracks 2,400+ winning products across AU, US, and UK markets.
        </p>
        <Link to="/pricing" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 6, background: 'var(--accent)', color: 'var(--bg-base)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          Start with Builder — $99/mo
        </Link>
      </div>
    </div>
  );
}
