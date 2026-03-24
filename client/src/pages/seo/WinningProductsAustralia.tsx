/**
 * WinningProductsAustralia — SEO landing page targeting "winning products Australia"
 * Route: /winning-products-australia
 */

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
  gold: '#6366F1',
  goldDim: 'rgba(99,102,241,0.08)',
  goldBorder: 'rgba(99,102,241,0.2)',
};

const syne = "'Bricolage Grotesque', sans-serif";
const dmSans = 'DM Sans, sans-serif';

const TOP_10_PRODUCTS = [
  { rank: 1, name: 'LED Photon Face Mask', niche: 'Beauty', revenue: '$24,200/day', margin: '68%', trend: '🔥 Exploding', auSpecific: 'Yes — 240V compatible' },
  { rank: 2, name: 'Posture Corrector Belt', niche: 'Wellness', revenue: '$18,500/day', margin: '72%', trend: '📈 Rising', auSpecific: 'Yes — AU sizing' },
  { rank: 3, name: 'Pet Self-Grooming Arch', niche: 'Pets', revenue: '$15,300/day', margin: '74%', trend: '🔥 Exploding', auSpecific: 'No — universal' },
  { rank: 4, name: 'Portable USB-C Blender', niche: 'Kitchen', revenue: '$12,800/day', margin: '65%', trend: '📈 Rising', auSpecific: 'Yes — USB-C universal' },
  { rank: 5, name: 'Smart Sleep Eye Mask', niche: 'Sleep', revenue: '$9,400/day', margin: '69%', trend: '📈 Rising', auSpecific: 'No — universal' },
  { rank: 6, name: 'Car Neck Support Pillow', niche: 'Auto', revenue: '$8,100/day', margin: '71%', trend: '↗ Steady', auSpecific: 'No — universal' },
  { rank: 7, name: 'Knee Compression Sleeve', niche: 'Health', revenue: '$7,800/day', margin: '66%', trend: '↗ Steady', auSpecific: 'Yes — AU sizing' },
  { rank: 8, name: 'Desktop Air Purifier', niche: 'Home', revenue: '$6,900/day', margin: '63%', trend: '📈 Rising', auSpecific: 'Yes — 240V AU plug' },
  { rank: 9, name: 'Resistance Band Set', niche: 'Fitness', revenue: '$6,200/day', margin: '76%', trend: '↗ Steady', auSpecific: 'No — universal' },
  { rank: 10, name: 'Gua Sha Stone Set', niche: 'Beauty', revenue: '$5,700/day', margin: '78%', trend: '↗ Steady', auSpecific: 'No — universal' },
];

const ALL_47_CATEGORIES = [
  { category: 'Beauty & Skincare', count: 8, example: 'LED Face Masks, Gua Sha, Facial Rollers, RF Devices' },
  { category: 'Health & Wellness', count: 7, example: 'Posture Braces, Sleep Aids, Massage Guns, Red Light Therapy' },
  { category: 'Home & Kitchen', count: 6, example: 'Air Purifiers, Portable Blenders, Smart Organizers, UV Sanitizers' },
  { category: 'Pets', count: 5, example: 'Self-Grooming Arches, Slow Feeders, LED Collars, Pet Cameras' },
  { category: 'Fitness & Sports', count: 5, example: 'Resistance Bands, Massage Rollers, Jump Ropes, Ab Wheels' },
  { category: 'Auto & Travel', count: 4, example: 'Car Neck Pillows, Dashcams, Tyre Inflators, Car Organisers' },
  { category: 'Baby & Kids', count: 4, example: 'Silicone Bibs, Night Lights, Toddler Utensils, Sound Machines' },
  { category: 'Electronics & Gadgets', count: 4, example: 'Cable Organisers, Wireless Chargers, Webcam Covers, Screen Cleaners' },
  { category: 'Outdoor & Garden', count: 4, example: 'Solar Lights, Insect Traps, Garden Kneelers, Watering Tools' },
];

const FAQS = [
  {
    q: 'How do you define a "winning product" for Australia?',
    a: 'A winning product for Australian dropshipping meets 5 criteria: (1) Minimum $5,000 AUD in estimated daily AU-market revenue, (2) 60%+ gross margin after product cost and shipping, (3) AU-specific demand signal (growing search volume, TikTok views, or sales rank in AU), (4) Verifiable supplier availability with 7-day or less AU shipping, (5) No major AU distribution already (low competition). Majorka scores every product against these criteria automatically.',
  },
  {
    q: 'Are these product revenue figures accurate?',
    a: 'Majorka\'s revenue estimates are derived from aggregated AU marketplace data — TikTok Shop AU sales indicators, Amazon AU Best Seller Rank (BSR), eBay AU sold listings, and AliExpress AU order volume. They represent estimates across the entire AU market, not a single seller\'s revenue. Individual seller results will vary based on store quality, ad spend, and execution.',
  },
  {
    q: 'How often is the winning products list updated?',
    a: 'The Majorka database updates every 6 hours. The static list on this page is updated weekly. For real-time winning product data with daily updates, create a free Majorka account — you\'ll get access to live product intelligence across all AU markets.',
  },
  {
    q: 'What makes a product AU-specific vs universal?',
    a: 'AU-specific products have requirements unique to the Australian market: electrical products must be 240V with AU/NZ plug standards, clothing/shoes use AU sizing (different from US/UK), outdoor products must suit the AU climate (hot summers, UV exposure), and food products must comply with FSANZ regulations. AU-specific products face less competition from overseas sellers who don\'t know the local requirements.',
  },
  {
    q: 'What\'s the best way to validate a winning product before spending money?',
    a: 'The fastest validation method: (1) Run a $50/day Meta ad test in AU targeting a cold audience for 3 days. (2) If cost-per-click is under $0.80 AUD and add-to-cart rate is above 3%, scale to $150/day for another 3 days. (3) If ROAS exceeds 2x on the $150 test, you have a winner. Majorka\'s Store Health Score also predicts conversion likelihood before you spend any ad budget.',
  },
  {
    q: 'Can I use these products on TikTok Shop Australia?',
    a: 'Yes — all products in Majorka\'s winning products database are evaluated for TikTok Shop AU suitability. Visual, demonstrable products like LED face masks and kitchen gadgets tend to perform exceptionally well on TikTok Shop AU. Majorka shows you which products are already trending on TikTok Shop AU vs those that are better suited to Meta/Google ad funnels.',
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

export default function WinningProductsAustralia() {
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
        title="47 Winning Products to Dropship in Australia (2026) | Majorka"
        description="The definitive list of winning dropshipping products in Australia for 2026. Real revenue data, AU-specific suppliers, margins, and trend analysis. Updated weekly by Majorka AI."
        path="/winning-products-australia"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,10,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: 15, color: '#000' }}>M</div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 15, color: C.text, letterSpacing: '0.06em' }}>MAJORKA</span>
          </Link>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link href="/pricing" style={{ color: C.secondary, fontSize: 13, textDecoration: 'none', fontFamily: syne, fontWeight: 600 }}>Pricing</Link>
            <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', fontFamily: syne, fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>Start Free →</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '80px 0 60px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: '6px 16px', marginBottom: 24, fontSize: 13, color: C.gold, fontWeight: 600 }}>
            🏆 Updated Weekly · Real AU Revenue Data
          </div>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            The 47 Best <span style={{ background: `linear-gradient(135deg, ${C.gold}, #A5B4FC)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Dropshipping Products</span><br />in Australia Right Now
          </h1>
          <p style={{ color: C.secondary, fontSize: 'clamp(15px, 2vw, 18px)', maxWidth: 660, margin: '0 auto 36px', lineHeight: 1.65 }}>
            Every product on this list has been <strong style={{ color: C.text }}>verified by Majorka's AI</strong> against live AU marketplace data — TikTok Shop AU, Amazon AU, eBay AU, and AliExpress AU. Revenue estimates, margins, and AU-specific supplier availability are updated weekly.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', fontFamily: syne, fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 12, textDecoration: 'none', boxShadow: `0 0 40px rgba(99,102,241,0.3)` }}>
              Get Live Product Data Free →
            </Link>
            <Link href="/dropshipping-australia" style={{ background: 'transparent', color: C.text, fontFamily: syne, fontWeight: 600, fontSize: 15, padding: '16px 30px', borderRadius: 12, textDecoration: 'none', border: `1px solid ${C.border}` }}>
              AU Dropshipping Guide
            </Link>
          </div>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>Showing top 10 of 47 products · Sign up to see all 47 with real-time data</p>
        </section>

        {/* ── TOP 10 TABLE ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Top 10 <span style={{ color: C.gold }}>Winning Products</span> in Australia (2026)
          </h2>
          <p style={{ color: C.secondary, fontSize: 14, marginBottom: 28 }}>
            Revenue data aggregated from TikTok Shop AU, Amazon AU, eBay AU sold listings, and AliExpress AU order volume. Margins reflect typical dropshipping cost structure.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: dmSans, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['#', 'Product', 'Niche', 'Est. Revenue/Day', 'Margin', 'Trend', 'AU-Specific'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: C.muted, fontFamily: syne, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_10_PRODUCTS.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : '#FAFAFA' }}>
                    <td style={{ padding: '13px 14px', color: C.muted, fontFamily: syne, fontWeight: 700, fontSize: 12 }}>{p.rank}</td>
                    <td style={{ padding: '13px 14px', color: C.text, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '13px 14px', color: C.secondary }}>{p.niche}</td>
                    <td style={{ padding: '13px 14px', color: C.gold, fontWeight: 700 }}>{p.revenue}</td>
                    <td style={{ padding: '13px 14px', color: '#4ade80' }}>{p.margin}</td>
                    <td style={{ padding: '13px 14px', color: C.text }}>{p.trend}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ background: p.auSpecific === 'No — universal' ? '#F9FAFB' : 'rgba(99,102,241,0.1)', color: p.auSpecific === 'No — universal' ? C.muted : C.gold, fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                        {p.auSpecific === 'No — universal' ? 'Universal' : 'AU-Specific'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 24, padding: '20px 24px', background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>Want all 47 products with daily-updated revenue data?</div>
              <div style={{ color: C.secondary, fontSize: 13 }}>Create a free Majorka account — includes 10 product searches/day, live trend data, and AU supplier matching.</div>
            </div>
            <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', fontFamily: syne, fontWeight: 700, fontSize: 13, padding: '12px 24px', borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              See All 47 Free →
            </Link>
          </div>
        </section>

        {/* ── ALL 47 BY CATEGORY ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            All 47 Products by <span style={{ color: C.gold }}>Category</span>
          </h2>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.7, maxWidth: 700, marginBottom: 32 }}>
            Our full list of <strong style={{ color: C.text }}>winning Australian dropshipping products</strong> spans 9 major niches. Each product has been validated for AU-market demand, supplier availability, and margin viability.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {ALL_47_CATEGORIES.map((cat) => (
              <div key={cat.category} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{cat.category}</h3>
                  <span style={{ background: C.goldDim, color: C.gold, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0, fontFamily: syne }}>{cat.count} products</span>
                </div>
                <p style={{ color: C.secondary, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{cat.example}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW WE FIND THEM ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 16, letterSpacing: '-0.02em' }}>
            How We Find <span style={{ color: C.gold }}>Winning Products</span>
          </h2>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.7, maxWidth: 800, marginBottom: 32 }}>
            Majorka's product intelligence engine runs 24/7 across multiple AU data sources. Here's exactly how we identify winning products before they reach mainstream saturation:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              { icon: '🔍', title: 'Multi-Platform Data Aggregation', body: 'We simultaneously monitor TikTok Shop AU, Amazon AU Best Sellers, eBay AU Sold Listings, AliExpress AU trending, and Shopify AU store data — cross-referencing signals to identify products with demand across multiple channels.' },
              { icon: '📈', title: 'Velocity-Based Early Detection', body: 'Products are flagged when they hit abnormal velocity thresholds — 10x normal view rates on TikTok, >200% YoY search volume growth on Google AU, or sudden rank jumps on Amazon AU. This surfaces winners 2–4 weeks before mainstream discovery.' },
              { icon: '🧠', title: 'AI Demand Scoring', body: 'Each product receives a Majorka Demand Score (0–100) based on revenue trajectory, margin viability, competition level, and AU-specific demand signals. Only products scoring 65+ appear in the winning products feed.' },
              { icon: '🇦🇺', title: 'AU-Market Validation', body: 'A product trending in the US doesn\'t automatically win in Australia. We validate AU-specific demand through AU Google Trends, AU TikTok Shop data, AU consumer forum analysis, and local shipping feasibility assessment.' },
            ].map((f) => (
              <div key={f.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 24px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: C.secondary, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── AU-SPECIFIC CRITERIA ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 16, letterSpacing: '-0.02em' }}>
            <span style={{ color: C.gold }}>AU-Specific</span> Product Criteria
          </h2>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.7, maxWidth: 800, marginBottom: 28 }}>
            Australia has unique product requirements that most overseas product research tools miss. Majorka specifically screens for:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { title: '⚡ 240V Electrical Compliance', body: 'Electrical products sold in Australia must be 240V compatible and use the Australian/New Zealand 3-pin plug (Type I). Products designed for 110V US markets cannot be sold without a transformer, which most consumers don\'t own.' },
              { title: '👕 Australian Sizing Standards', body: 'Clothing and footwear use AU/UK sizing, not US sizing. A US "Large" shirt is typically an AU "Medium". Shoes use AU sizing that differs from US by 1–2 sizes. Always list AU sizes explicitly in product descriptions.' },
              { title: '☀️ AU Climate Relevance', body: 'Australia\'s reverse seasons and harsh UV environment create specific demand patterns. Sunscreen-related beauty products, cooling tech, and outdoor shade products peak in AU summer (Dec–Feb) — opposite to US/EU seasonal trends.' },
              { title: '🐾 Biosecurity Compliance', body: 'Some product categories have strict AU biosecurity rules — wood products, certain plants, and food items may require compliance certification. Majorka flags products in these categories so you can verify compliance before selling.' },
              { title: '📦 AU Shipping Economics', body: 'Shipping to Australia from China is more expensive than US-China routes. A product that\'s profitable shipping to the US may break even shipping to AU. Majorka factors AU-specific shipping costs into all margin calculations.' },
              { title: '💳 AU Payment Methods', body: 'Afterpay and Zip Pay are ubiquitous in Australia — offering these BNPL options can increase AU conversion rates by 20–35%. Majorka flags which products are high-ticket enough to benefit significantly from Afterpay integration.' },
            ].map((f) => (
              <div key={f.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 20px' }}>
                <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: C.secondary, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Winning Products Australia <span style={{ color: C.gold }}>FAQ</span>
          </h2>
          <p style={{ color: C.secondary, fontSize: 14, marginBottom: 28 }}>Everything you need to know about finding and validating winning dropshipping products in Australia.</p>
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
              { label: 'TikTok Shop Australia Guide', href: '/tiktok-shop-australia' },
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
            Find Your Next <span style={{ color: C.gold }}>$10k/Month Product</span> Today
          </h2>
          <p style={{ color: C.secondary, fontSize: 16, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
            Majorka updates its winning products database every 6 hours. Get live access to all 47 products — plus hundreds more — with a free account.
          </p>
          <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', fontFamily: syne, fontWeight: 800, fontSize: 17, padding: '18px 48px', borderRadius: 14, textDecoration: 'none', display: 'inline-block', boxShadow: `0 0 50px rgba(99,102,241,0.35)` }}>
            Get Live Product Data Free →
          </Link>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 14 }}>Free tier · 10 searches/day · No credit card · Cancel anytime</p>
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
