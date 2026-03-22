/**
 * DropshippingAustralia — SEO landing page targeting "dropshipping Australia"
 * Route: /dropshipping-australia
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const C = {
  bg: '#080a0e',
  card: '#0d0f14',
  elevated: '#131318',
  border: 'rgba(255,255,255,0.06)',
  text: '#f5f5f5',
  secondary: '#94949e',
  muted: '#52525b',
  gold: '#6366F1',
  goldDim: 'rgba(99,102,241,0.08)',
  goldBorder: 'rgba(99,102,241,0.2)',
};

const syne = 'Syne, sans-serif';
const dmSans = 'DM Sans, sans-serif';

const TRENDING_PRODUCTS = [
  { name: 'LED Face Mask (Photon Therapy)', revenue: '$24,200/day', margin: '68%', trend: '↑ 340%' },
  { name: 'Posture Corrector Belt', revenue: '$18,500/day', margin: '72%', trend: '↑ 210%' },
  { name: 'Car Seat Neck Pillow (AU-spec)', revenue: '$12,800/day', margin: '65%', trend: '↑ 185%' },
  { name: 'Portable Blender (USB-C)', revenue: '$9,400/day', margin: '61%', trend: '↑ 290%' },
  { name: 'Smart Sleep Mask', revenue: '$7,100/day', margin: '74%', trend: '↑ 160%' },
];

const FAQS = [
  {
    q: 'Is dropshipping legal in Australia?',
    a: 'Yes, dropshipping is completely legal in Australia. You operate as a standard online retailer — you take orders, a supplier ships the product, and you keep the margin. You must comply with Australian Consumer Law (ACL), which means honouring refund and return rights. As long as you\'re transparent with customers and pay your taxes, it\'s fully legal.',
  },
  {
    q: 'How much can you make dropshipping in Australia?',
    a: 'Australian dropshippers typically earn between $2,000–$30,000/month depending on their niche, ad spend, and product selection. Beginners often hit $3k–$5k/month within 90 days of their first winning product. Experienced operators using AI product research tools like Majorka regularly generate $20k–$50k/month in revenue.',
  },
  {
    q: 'What are the best products to dropship in Australia?',
    a: 'The best-performing dropshipping products in Australia in 2025 are: LED beauty devices (LED face masks, red light therapy), posture and wellness products, pet accessories, home organisation products, and outdoor/fitness gear suited to the Australian climate. Products with a retail price of $40–$120 AUD tend to convert best.',
  },
  {
    q: 'Do I need an ABN to dropship in Australia?',
    a: 'You don\'t legally need an ABN to start dropshipping, but you\'ll need one once your annual turnover exceeds $75,000 AUD (the GST registration threshold). Most serious dropshippers register an ABN early to look professional, open a business bank account, and claim business expenses. Registering is free at abr.business.gov.au.',
  },
  {
    q: 'How does TikTok Shop work for Australian dropshippers?',
    a: 'TikTok Shop AU launched in 2024 and allows Australian creators and sellers to sell products directly inside the TikTok app. Dropshippers can list products, partner with TikTok creators for commission-based promotion, and fulfil orders via AliExpress, Zendrop, or local AU suppliers. Majorka tracks TikTok Shop AU trending products in real-time.',
  },
  {
    q: 'What\'s the best platform for dropshipping in Australia?',
    a: 'Shopify is the dominant platform for Australian dropshippers due to its integration with AliExpress, Zendrop, AutoDS, and payment gateways like Afterpay and Stripe AU. TikTok Shop AU is rapidly growing as a second channel. Most successful AU dropshippers use Shopify as their primary store with TikTok as a traffic source.',
  },
  {
    q: 'How long does shipping take for AU dropshipping?',
    a: 'Shipping times vary: AliExpress standard shipping to Australia is 15–25 days. AliExpress Premium/ePacket is 7–14 days. Zendrop AU-warehoused products ship in 3–7 days. Local AU suppliers ship in 1–3 business days. Using Majorka\'s Supplier Intelligence tool, you can find AU-local or fast-ship suppliers for any niche.',
  },
  {
    q: 'How is Majorka different from other product research tools?',
    a: 'Majorka is the only product intelligence platform built specifically for Australian dropshippers. Unlike US-focused tools (Minea, Dropispy, Sell The Trend), Majorka analyses TikTok Shop AU, Amazon AU, eBay AU, and AliExpress AU data simultaneously. We surface products with AU-specific demand signals, AU-compliant suppliers (240V, AU plug, AU sizing), and pre-built ad angles for the AU audience.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${open ? C.goldBorder : C.border}`,
        borderRadius: 12,
        marginBottom: 12,
        transition: 'border-color 0.2s',
        cursor: 'pointer',
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>{q}</h3>
        <span style={{ color: C.gold, fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 20px 18px', color: C.secondary, fontSize: 14, lineHeight: 1.7, fontFamily: dmSans }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function DropshippingAustralia() {
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
        title="Dropshipping Australia 2025 — Find Winning Products with AI | Majorka"
        description="The #1 AI platform for Australian dropshippers. Find winning products, source suppliers, and build stores in minutes. Join 2,400+ AU sellers."
        path="/dropshipping-australia"
      />

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,10,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 900, fontSize: 15, color: '#000' }}>M</div>
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
            🇦🇺 Built for Australian Dropshippers
          </div>
          <h1 style={{ fontFamily: syne, fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            The Smartest Way to<br />
            <span style={{ background: `linear-gradient(135deg, ${C.gold}, #A5B4FC)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Dropship in Australia</span> in 2025
          </h1>
          <p style={{ color: C.secondary, fontSize: 'clamp(15px, 2vw, 18px)', maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.65 }}>
            Majorka is the <strong style={{ color: C.text }}>AI-powered product intelligence platform</strong> built exclusively for Australian dropshippers. Find winning products, source AU-ready suppliers, and launch profitable stores — faster than your competition.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', fontFamily: syne, fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 12, textDecoration: 'none', boxShadow: `0 0 40px rgba(99,102,241,0.3)` }}>
              Start Finding Products Free →
            </Link>
            <Link href="/winning-products-australia" style={{ background: 'transparent', color: C.text, fontFamily: syne, fontWeight: 600, fontSize: 15, padding: '16px 30px', borderRadius: 12, textDecoration: 'none', border: `1px solid ${C.border}` }}>
              See Top 47 Products
            </Link>
          </div>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>No credit card required · 2,400+ AU sellers · Free tier forever</p>
        </section>

        {/* ── STATS STRIP ── */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 80 }}>
          {[
            { label: 'AU ecommerce market', value: '$13B+', note: '2025 estimate' },
            { label: 'Smartphone penetration', value: '88%', note: 'AU consumers' },
            { label: 'TikTok Shop AU launched', value: '2024', note: 'New sales channel' },
            { label: 'AU dropshippers on Majorka', value: '2,400+', note: 'Active sellers' },
          ].map((s) => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: syne, fontWeight: 900, fontSize: 28, color: C.gold, marginBottom: 4 }}>{s.value}</div>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{s.note}</div>
            </div>
          ))}
        </section>

        {/* ── WHY AUSTRALIA ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Why Australia is the <span style={{ color: C.gold }}>Best Market</span> for Dropshipping
          </h2>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.7, maxWidth: 800, marginBottom: 32 }}>
            Australia punches well above its weight as a dropshipping market. With <strong style={{ color: C.text }}>$13 billion in ecommerce revenue</strong>, high disposable income, and one of the world's highest smartphone penetration rates at <strong style={{ color: C.text }}>88%</strong>, Australian consumers are primed to buy online. Here's why smart dropshippers are targeting AU:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: '💰', title: 'High Average Order Value', body: 'Australian consumers spend more per online transaction than US or UK shoppers. Average Shopify AU order values are $95–$140 AUD, giving strong margins even with ad costs.' },
              { icon: '📱', title: 'TikTok Shop AU (2024)', body: 'TikTok Shop launched in Australia in 2024, creating a brand-new sales channel for video-native product discovery. Early movers are capturing massive organic reach before saturation.' },
              { icon: '🚢', title: 'Improving Shipping Infrastructure', body: 'AU-focused fulfilment centres from Zendrop, AutoDS, and local 3PLs now offer 3–7 day delivery to major AU cities, solving the historically problematic shipping time issue.' },
              { icon: '🏆', title: 'Less Competition Than US/UK', body: 'Most product research tools are US-centric. By targeting AU-specific demand with AU-focused tools like Majorka, you face dramatically less competition on winning products.' },
              { icon: '📊', title: 'Strong Consumer Protection', body: 'Australia\'s ACL (Australian Consumer Law) provides clear guidelines. Once you understand the rules (returns, warranties), you can build trust-led stores that convert at 3–5%.' },
              { icon: '🌏', title: 'Gateway to Asia-Pacific', body: 'An AU Shopify store is a natural launch pad for NZ, Singapore, and SEA markets. AU traffic quality is also favoured by Meta and Google algorithms for lookalike audience scaling.' },
            ].map((f) => (
              <div key={f.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 24px', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: C.secondary, fontSize: 13, lineHeight: 1.65 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW MAJORKA WORKS ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            How <span style={{ color: C.gold }}>Majorka</span> Works
          </h2>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.7, maxWidth: 700, marginBottom: 36 }}>
            From finding a product to making your first AU sale in 5 steps:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { step: '01', title: 'Discover Trending Products', body: 'Majorka\'s AI scans TikTok Shop AU, AliExpress AU trending, Amazon AU bestsellers, and eBay AU hot picks every 6 hours. You see what\'s gaining traction before it peaks.' },
              { step: '02', title: 'Validate with Real AU Revenue Data', body: 'See estimated daily revenue, sell-through rate, and AU demand signals for every product. No more guessing — data-backed decisions from day one.' },
              { step: '03', title: 'Find AU-Ready Suppliers', body: 'Majorka\'s Supplier Intelligence matches you with suppliers offering AU-compliant products (240V electrical, AU plug, AU sizing) with fast AU shipping options.' },
              { step: '04', title: 'Generate AU-Targeted Ad Creative', body: 'Get AI-generated Meta ad copy, TikTok hooks, and email sequences pre-written for the Australian audience — including AU slang, local references, and AUD pricing.' },
              { step: '05', title: 'Launch & Scale with Confidence', body: 'Import products directly to your Shopify store, launch with our pre-built AU ad campaigns, and use Majorka\'s Store Health Score to continuously optimise for AU conversions.' },
            ].map((s) => (
              <div key={s.step} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ fontFamily: syne, fontWeight: 900, fontSize: 32, color: C.goldBorder.replace('0.2', '0.4'), flexShrink: 0, lineHeight: 1 }}>{s.step}</div>
                <div>
                  <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRENDING PRODUCTS ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Top 5 Trending AU <span style={{ color: C.gold }}>Dropshipping Products</span> Right Now
          </h2>
          <p style={{ color: C.secondary, fontSize: 14, marginBottom: 28 }}>Updated daily. Revenue estimates based on AU TikTok Shop + Amazon AU + Shopify data.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: dmSans, fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Product', 'Est. AU Revenue', 'Avg Margin', 'Trend'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: C.muted, fontFamily: syne, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRENDING_PRODUCTS.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '14px 16px', color: C.text, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '14px 16px', color: C.gold, fontWeight: 700 }}>{p.revenue}</td>
                    <td style={{ padding: '14px 16px', color: '#4ade80' }}>{p.margin}</td>
                    <td style={{ padding: '14px 16px', color: '#60a5fa', fontWeight: 600 }}>{p.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link href="/winning-products-australia" style={{ color: C.gold, fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: syne }}>
              See all 47 winning products → 
            </Link>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Dropshipping Australia <span style={{ color: C.gold }}>FAQ</span>
          </h2>
          <p style={{ color: C.secondary, fontSize: 14, marginBottom: 28 }}>Everything you need to know about dropshipping in Australia in 2025.</p>
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} {...faq} />
          ))}
        </section>

        {/* ── INTERNAL LINKS ── */}
        <section style={{ marginBottom: 60, padding: '32px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }}>
          <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: C.secondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>📚 Related Resources</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'TikTok Shop Australia 2025 Guide', href: '/tiktok-shop-australia' },
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
            Ready to Find Your First <span style={{ color: C.gold }}>Winning Product</span>?
          </h2>
          <p style={{ color: C.secondary, fontSize: 16, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
            Join 2,400+ Australian dropshippers already using Majorka to find $10k/month products. Start free — no credit card needed.
          </p>
          <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', fontFamily: syne, fontWeight: 800, fontSize: 17, padding: '18px 48px', borderRadius: 14, textDecoration: 'none', display: 'inline-block', boxShadow: `0 0 50px rgba(99,102,241,0.35)` }}>
            Start Finding Products Free →
          </Link>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 14 }}>Free tier: 10 product searches/day · No credit card · Cancel anytime</p>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 12 }}>
          © 2026 Majorka · <Link href="/privacy" style={{ color: C.muted }}>Privacy</Link> · <Link href="/terms" style={{ color: C.muted }}>Terms</Link> · Made in Australia 🇦🇺
        </p>
      </footer>
    </div>
  );
}
