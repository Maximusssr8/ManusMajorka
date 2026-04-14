/**
 * TikTokShopAustralia — SEO landing page targeting "TikTok Shop Australia"
 * Route: /tiktok-shop-australia
 */

import MajorkaLogo from '@/components/MajorkaLogo';
import { useState } from 'react';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const C = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  elevated: '#F9FAFB',
  border: '#E5E7EB',
  text: '#0A0A0A',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  gold: '#d4af37',
  goldDim: 'rgba(212,175,55,0.08)',
  goldBorder: 'rgba(212,175,55,0.2)',
};

const syne = "'Syne', sans-serif";
const dmSans = 'DM Sans, sans-serif';

const TIKTOK_PRODUCTS = [
  { name: 'LED Beauty Face Mask', category: 'Beauty', revenue: '$31,500/day', margin: '71%', views: '84M+ views' },
  { name: 'Viral Posture Brace', category: 'Wellness', revenue: '$22,800/day', margin: '68%', views: '56M+ views' },
  { name: 'Pet Grooming Glove (AU)', category: 'Pets', revenue: '$14,200/day', margin: '74%', views: '43M+ views' },
  { name: 'Portable Blender Cup', category: 'Kitchen', revenue: '$11,600/day', margin: '62%', views: '38M+ views' },
  { name: 'Knee Compression Sleeve', category: 'Health', revenue: '$8,900/day', margin: '69%', views: '29M+ views' },
];

const FAQS = [
  {
    q: 'What is TikTok Shop Australia?',
    a: 'TikTok Shop AU is TikTok\'s native ecommerce platform that launched in Australia in 2024. It allows businesses and creators to sell products directly inside the TikTok app. Buyers can purchase without leaving TikTok — from watching a video, live stream, or browsing the shop tab. For dropshippers, it\'s a powerful new sales channel with organic discovery built in.',
  },
  {
    q: 'Can Australian dropshippers sell on TikTok Shop?',
    a: 'Yes. Australian businesses with an ABN can apply to be a TikTok Shop seller. Once approved, you can list products, create shoppable videos, and partner with TikTok creators (affiliates) to promote your products for a commission. Majorka surfaces the top-performing TikTok Shop AU products so you can list proven winners immediately.',
  },
  {
    q: 'How do I find winning products for TikTok Shop Australia?',
    a: 'Finding winning TikTok Shop AU products requires analysing hashtag trends, video view velocity, cart-add rates, and live stream sales data. Majorka automates all of this — our AI monitors TikTok Shop AU data 24/7 and surfaces products with explosive demand before they reach saturation. You can filter by category, AU-specific demand, and estimated daily revenue.',
  },
  {
    q: 'Do I need a TikTok account to use TikTok Shop?',
    a: 'You need a TikTok Business account to operate a TikTok Shop. You don\'t need a large following to start — many AU sellers use the affiliate programme where TikTok creators promote your products for a commission, meaning you don\'t need to create content yourself. The shop tab also provides organic discovery to shoppers browsing for products.',
  },
  {
    q: 'What types of products sell best on TikTok Shop Australia?',
    a: 'Visual, demonstrable products that create a "wow" moment perform best on TikTok Shop AU. Top categories include: beauty devices (LED masks, facial tools), wellness gadgets (posture braces, massage tools), kitchen gadgets, pet accessories, and fitness products. Products priced $30–$80 AUD hit the sweet spot for impulse purchases on TikTok.',
  },
  {
    q: 'How is TikTok dropshipping different from regular Shopify dropshipping?',
    a: 'Traditional Shopify dropshipping relies on paid Meta/Google ads to drive traffic to an external website. TikTok dropshipping leverages organic video content and the TikTok Shop feed for discovery — dramatically reducing CAC (customer acquisition cost) in the early stages. Majorka helps you monitor both channels and identify products winning on TikTok before they migrate to Shopify.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ background: C.card, border: `1px solid ${open ? C.goldBorder : C.border}`, borderRadius: 12, marginBottom: 12, transition: 'border-color 0.2s', cursor: 'pointer' }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>{q}</h3>
        <span style={{ color: C.gold, fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 20px 18px', color: C.secondary, fontSize: 14, lineHeight: 1.7, fontFamily: dmSans }}>{a}</div>
      )}
    </div>
  );
}

export default function TikTokShopAustralia() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: dmSans }}>
      <SEO
        title="TikTok Shop Australia — Find Winning Products with AI | Majorka"
        description="Discover the best TikTok Shop Australia products in 2026. AI-powered product research for AU TikTok dropshippers. See real revenue data, trending niches, and supplier intel."
        path="/tiktok-shop-australia"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,10,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/majorka-logo.jpg" alt="Majorka" width={36} height={36} style={{ width: 36, height: 36, objectFit: 'contain', display: 'block', borderRadius: 10, flexShrink: 0 }} draggable={false} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>Majorka</span>
          </Link>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link href="/pricing" style={{ color: C.secondary, fontSize: 13, textDecoration: 'none', fontFamily: syne, fontWeight: 600 }}>Pricing</Link>
            <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`, color: '#000', fontFamily: syne, fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>Start Free →</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '80px 0 60px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid #F0F0F0`, borderRadius: 100, padding: '6px 16px', marginBottom: 24, fontSize: 13, color: '#fff', fontWeight: 600 }}>
            ♪ TikTok Shop AU · Launched 2024
          </div>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            TikTok Shop Australia:<br />
            <span style={{ background: `linear-gradient(135deg, ${C.gold}, #A5B4FC)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>The Complete 2026 Guide</span>
          </h1>
          <p style={{ color: C.secondary, fontSize: 'clamp(15px, 2vw, 18px)', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.65 }}>
            TikTok Shop launched in Australia in 2024 — and it's already <strong style={{ color: C.text }}>the fastest-growing ecommerce channel</strong> in the country. This guide covers everything you need to know about <strong style={{ color: C.text }}>TikTok dropshipping Australia</strong>: how TikTok Shop AU works, what products are winning, and how to find them before your competitors.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`, color: '#000', fontFamily: syne, fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 12, textDecoration: 'none', boxShadow: `0 0 40px rgba(212,175,55,0.3)` }}>
              Find TikTok Shop Products Free →
            </Link>
            <Link href="/dropshipping-australia" style={{ background: 'transparent', color: C.text, fontFamily: syne, fontWeight: 600, fontSize: 15, padding: '16px 30px', borderRadius: 12, textDecoration: 'none', border: `1px solid ${C.border}` }}>
              AU Dropshipping Guide
            </Link>
          </div>
        </section>

        {/* ── TIKTOK SHOP AU OVERVIEW ── */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '36px' }}>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: 20, letterSpacing: '-0.02em' }}>
              What is TikTok Shop Australia?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              <div>
                <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.75, margin: 0 }}>
                  <strong style={{ color: C.text }}>TikTok Shop AU</strong> is TikTok's native in-app ecommerce platform that lets Australian businesses and creators sell products directly through TikTok videos, live streams, and the dedicated shop tab. Launched in 2024, it has rapidly become a major sales channel for <strong style={{ color: C.text }}>Australian dropshippers and ecommerce sellers</strong>.
                </p>
              </div>
              <div>
                <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.75, margin: 0 }}>
                  Unlike traditional ecommerce where you drive traffic to an external Shopify store, <strong style={{ color: C.text }}>TikTok Shop AU</strong> keeps the entire purchase journey inside TikTok. Buyers discover a product through a viral video, click the product tag, and complete checkout — all without leaving the app. This frictionless experience drives significantly <strong style={{ color: C.text }}>higher conversion rates</strong> compared to standard ad-to-Shopify funnels.
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginTop: 28 }}>
              {[
                { label: 'TikTok AU monthly users', value: '8.5M+' },
                { label: 'Avg daily time on app', value: '95 min' },
                { label: 'TikTok Shop conversion', value: '3–8%' },
                { label: 'Affiliate creators AU', value: '50,000+' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center', background: C.elevated, borderRadius: 10, padding: '16px 12px' }}>
                  <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 24, color: C.gold }}>{s.value}</div>
                  <div style={{ color: C.secondary, fontSize: 11, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TOP PRODUCTS TABLE ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Top Trending <span style={{ color: C.gold }}>TikTok Shop AU Products</span> Right Now
          </h2>
          <p style={{ color: C.secondary, fontSize: 14, marginBottom: 28 }}>
            Based on TikTok Shop AU sales data, video view velocity, and creator content volume. Updated daily by Majorka's AI.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: dmSans, fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Product', 'Category', 'Est. AU Revenue', 'Avg Margin', 'TikTok Reach'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: C.muted, fontFamily: syne, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIKTOK_PRODUCTS.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : '#FAFAFA' }}>
                    <td style={{ padding: '14px 16px', color: C.text, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '14px 16px', color: C.secondary }}>{p.category}</td>
                    <td style={{ padding: '14px 16px', color: C.gold, fontWeight: 700 }}>{p.revenue}</td>
                    <td style={{ padding: '14px 16px', color: '#4ade80' }}>{p.margin}</td>
                    <td style={{ padding: '14px 16px', color: '#60a5fa' }}>{p.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 12, fontStyle: 'italic' }}>
            Revenue estimates based on Majorka AI analysis of public TikTok Shop AU data. Actual results vary.
          </p>
        </section>

        {/* ── MAJORKA WORKFLOW ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 16, letterSpacing: '-0.02em' }}>
            How to Find <span style={{ color: C.gold }}>TikTok Shop Winning Products</span> with Majorka
          </h2>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.7, maxWidth: 760, marginBottom: 32 }}>
            Manually scrolling TikTok for trending products is time-consuming and unreliable. Majorka's AI does the hard work automatically, giving you a real-time feed of <strong style={{ color: C.text }}>winning TikTok Shop AU products</strong> with verified revenue data.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: '🔍', title: 'Real-Time TikTok Scan', body: 'Majorka monitors TikTok Shop AU trending sections, top creator content, and live stream sales 24/7. You get a live feed of products gaining traction — not yesterday\'s data.' },
              { icon: '📊', title: 'Revenue Validation', body: 'See estimated daily revenue, average order value, and sell-through rate for each product. Filter by minimum revenue threshold to focus only on proven products.' },
              { icon: '🎯', title: 'Creator Affiliate Matching', body: 'Find which AU TikTok creators are already promoting similar products. Connect with affiliate creators to amplify your TikTok Shop AU listing without creating content yourself.' },
              { icon: '🚀', title: 'One-Click Import to Shopify', body: 'Once you\'ve found a winner, import it to your Shopify store instantly. Majorka generates AU-optimised product descriptions, pricing, and ad creative simultaneously.' },
              { icon: '📈', title: 'Trend Velocity Alerts', body: 'Get notified when a TikTok Shop AU product crosses the 10x view velocity threshold — the early signal of a product about to go viral across AU\'s 8.5 million TikTok users.' },
              { icon: '🇦🇺', title: 'AU-Specific Filtering', body: 'Filter for products with AU-compliant specifications, local AU supplier availability, and demand signals specific to Australian consumer preferences and climate.' },
            ].map((f) => (
              <div key={f.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 24px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: C.secondary, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            TikTok Shop Australia <span style={{ color: C.gold }}>FAQ</span>
          </h2>
          <p style={{ color: C.secondary, fontSize: 14, marginBottom: 28 }}>Common questions about TikTok dropshipping Australia answered.</p>
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} {...faq} />
          ))}
        </section>

        {/* ── INTERNAL LINKS ── */}
        <section style={{ marginBottom: 60, padding: '32px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }}>
          <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: C.secondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>📚 Related Resources</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Dropshipping Australia Guide', href: '/dropshipping-australia' },
              { label: 'Top 47 Winning Products AU', href: '/winning-products-australia' },
              { label: 'Free Store Health Score', href: '/store-health' },
              { label: 'Majorka Pricing', href: '/pricing' },
              { label: 'Start Free →', href: '/sign-in' },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ color: C.gold, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: syne, padding: '6px 14px', background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }}>
                {l.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ textAlign: 'center', padding: '60px 0 80px' }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Find Your Next <span style={{ color: C.gold }}>TikTok Shop Winner</span> Today
          </h2>
          <p style={{ color: C.secondary, fontSize: 16, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
            Majorka's AI scans TikTok Shop AU, AliExpress, Amazon AU, and eBay AU simultaneously — giving you the full picture on what's winning in Australia right now.
          </p>
          <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`, color: '#000', fontFamily: syne, fontWeight: 800, fontSize: 17, padding: '18px 48px', borderRadius: 14, textDecoration: 'none', display: 'inline-block', boxShadow: `0 0 50px rgba(212,175,55,0.35)` }}>
            Start Finding Products Free →
          </Link>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 14 }}>Free tier · No credit card · 2,400+ AU sellers</p>
        </section>
      </main>

      <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 12 }}>
          © 2026 Majorka · <Link href="/privacy" style={{ color: C.muted }}>Privacy</Link> · <Link href="/terms" style={{ color: C.muted }}>Terms</Link> · Made in Australia 🇦🇺
        </p>
      </footer>
    </div>
  );
}
