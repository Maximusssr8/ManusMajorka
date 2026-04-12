import { useState } from 'react';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const syne = "'Syne', 'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', 'Inter', sans-serif";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  status: 'published' | 'draft';
  body?: string;
}

const POSTS: Post[] = [
  {
    slug: 'best-dropshipping-products-march-2026',
    title: 'Best Dropshipping Products — March 2026',
    excerpt: 'The 7 highest-velocity AliExpress winners surfacing in Majorka this month, ranked by daily-orders growth across AU/US/UK.',
    category: 'Trending',
    readTime: '6 min read',
    date: 'Mar 20, 2026',
    status: 'published',
    body: `Every 6 hours Majorka pulls ~500 of the highest-volume listings on AliExpress, scores them with a velocity-weighted model, and pushes the winners to the Products tab. Below is what the top of the leaderboard looks like at the end of March 2026.

**1. Silicone Kitchen Organiser Set.** 12.4k orders in 30 days, AUD $18 retail. Hit the Australian home-reno TikTok niche hard — short-form content repeats the "before / after cupboard" template and reliably pulls 1–3M views per hook. Margin floor around 58%.

**2. LED Face Wand (Red-Light Therapy).** 9.8k orders, AUD $32 retail. Massive AU spike on the "skincare over 35" demo. Tolerable saturation because most sellers are on Shopify instead of TikTok Shop, so Majorka's AU operators still get first-mover pricing.

**3. Portable Neck Massager.** 7.1k orders, AUD $26 retail. Father's Day gifting keyword cluster is warming early. Velocity score crossed 80 for the first time this week.

**4. Pet Water Fountain With Filter.** 6.4k orders, AUD $34 retail. Evergreen pet winner that never really dies — Majorka has tracked 14 distinct creative angles on it in the last 90 days.

**5. Reusable Silicone Food Bag 6-Pack.** 5.9k orders, AUD $22 retail. AU single-use-plastic-ban tailwind. The product name matters: "Stasher clone" performs 2.3× better than generic "silicone bag."

**6. Magnetic Phone Mount (MagSafe-style).** 5.2k orders, AUD $19 retail. Post-iPhone 15 adoption wave, AU distracted-driving enforcement ramps in QLD/NSW this quarter.

**7. Mini Handheld Vacuum.** 4.8k orders, AUD $29 retail. Car-cleaning-satisfying TikTok format is still pulling — expect 30-day legs.

**How to use this list.** Don't just copy the product — copy the *angle*. Majorka surfaces the working hook, the niche, and the ad-creative library already attached to each winner. Click any of these in the Products tab to see the full brief.`,
  },
  {
    slug: 'how-to-find-winning-products-tiktok',
    title: 'How to Find Winning Products on TikTok in 2026',
    excerpt: 'The exact 4-step method Majorka users follow to catch viral TikTok Shop products before everyone else.',
    category: 'Research',
    readTime: '7 min read',
    date: 'Mar 14, 2026',
    status: 'published',
    body: `TikTok Shop became the single most volatile growth channel in Australian ecommerce in 2025, and the "wait for it on Ecomhunt" strategy is dead — by the time a product surfaces in a paid list, the creator pool has already consolidated and CPMs are 3× what they were at launch. Here is the 4-step method Majorka users run every morning to beat the curve.

**1. Start from the leaderboard, not from scrolling.** Open the TikTok Shop Leaderboard inside Majorka. It ranks every product by (winning score × 0.4 + log-velocity × 0.6), so fast-accelerating newcomers beat entrenched bestsellers. Filter by your niche and take the top 20.

**2. Sort by velocity, not by total orders.** A product with 500 orders added in the last 7 days is a better bet than one with 50,000 lifetime orders growing at 100/day. Majorka's velocity column exposes the 7-day slope directly — use it.

**3. Check the creator cohort.** Click any product and look at the "Creators" block. If you see 3+ micro-creators (<100k followers) posting organically in the last 48 hours, the product is early-phase. If every post is from a creator 1M+ being paid, you're late.

**4. Validate in the ads library.** Before spending a dollar, pull the ad-creative library for that product inside the Ads Studio. If 10+ live creatives exist and one of them has scaled for more than 14 days, the angle is confirmed — copy the hook format, not the exact creative.

That's the entire method. No "secret tool." The edge is running it daily and acting inside the 24-hour window.`,
  },
  {
    slug: 'aliexpress-vs-cj-dropshipping-2026',
    title: 'AliExpress vs CJ Dropshipping 2026: Full Comparison',
    excerpt: 'Shipping speed, margins, product range, and automation — the data-driven breakdown for AU operators.',
    category: 'Suppliers',
    readTime: '8 min read',
    date: 'Mar 8, 2026',
    status: 'published',
    body: `AliExpress and CJ Dropshipping solve overlapping problems, but they optimise for different stages of a seller's journey. Here is the honest breakdown Majorka compiled after tracking 14,000+ orders across both suppliers in Q1 2026.

**Shipping to Australia.** AliExpress via AliExpress Saver averages 11–18 days. CJ via their AU warehouse averages 4–7 days when the SKU is stocked locally, 12–16 days when it isn't. If you're running Meta ads on a product with a hot hook window, CJ local-stock is worth every extra cent.

**Margins.** AliExpress wins on raw unit cost for any product under AUD $25. Above that, CJ closes the gap because their per-unit shipping isn't marked up like ePacket's is. Rule of thumb: if your retail price is under AUD $30, AliExpress; above, compare both.

**Product range.** AliExpress still has ~10× the SKU count. CJ curates — they drop SKUs that don't move. This is a feature, not a bug: if it's on CJ, someone already proved it sells.

**Automation.** CJ wins on pure operator ergonomics. Their Shopify app handles orders, returns, and tracking far better than any AliExpress tool. Majorka integrates both — every product card shows live quotes from both suppliers when available.

**The honest recommendation.** Start on AliExpress to validate. The second you confirm a winner with a working ad, move fulfillment to CJ local-stock so your Meta click-to-delivery window fits inside 7 days. Your return rate will drop ~40% and your CPA will tighten because fewer chargebacks age your pixel.`,
  },
  {
    slug: 'how-to-find-winning-products-2026',
    title: 'How to Find Winning Products in 2026 (AI-First Method)',
    excerpt: 'The research playbook has changed. How serious dropshippers use AI scoring and demand signals.',
    category: 'Strategy',
    readTime: '6 min read',
    date: 'Apr 2026',
    status: 'draft',
  },
  {
    slug: 'profit-margins-dropshipping-guide',
    title: 'Dropshipping Profit Margins: What to Aim for in 2026',
    excerpt: 'Realistic margin targets by category, break-even CPA maths, and when to walk away.',
    category: 'Finance',
    readTime: '9 min read',
    date: 'Apr 2026',
    status: 'draft',
  },
];

function renderBody(body: string) {
  return body.split('\n\n').map((para, i) => {
    // Simple **bold** support
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} style={{ fontSize: 15, lineHeight: 1.7, color: '#a1a1aa', marginBottom: 16 }}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} style={{ color: '#ededed', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>,
        )}
      </p>
    );
  });
}

export default function Blog() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const published = POSTS.filter((p) => p.status === 'published');
  const drafts = POSTS.filter((p) => p.status === 'draft');

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: dm, color: '#ededed' }}>
      <SEO
        title="Blog — Majorka"
        description="Product research, supplier comparisons, and AU dropshipping playbooks from the Majorka team."
        path="/blog"
      />

      {/* Dark nav — matches main site */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1a1a1a', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/majorka-logo.jpg" alt="Majorka" width={30} height={30} style={{ borderRadius: 6 }} />
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: '#d4af37', letterSpacing: '-0.01em' }}>majorka</span>
          </a>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>Home</a>
            <a href="/pricing" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
            <a href="/about" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>About</a>
            <Link href="/sign-up" style={{ background: '#3B82F6', color: 'white', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '80px 24px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Blog</span>
        </div>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', color: '#ededed', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Ecommerce intelligence,<br /><span style={{ color: '#d4af37' }}>built for operators</span>.
        </h1>
        <p style={{ fontSize: 17, color: '#888', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
          Short, honest playbooks on finding winners, sourcing, and running ads in the AU/US/UK markets.
        </p>
      </div>

      {/* Published posts */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {published.map((post) => {
            const isOpen = openSlug === post.slug;
            return (
              <article
                key={post.slug}
                style={{
                  background: '#0f0f0f',
                  borderRadius: 8,
                  border: `1px solid ${isOpen ? 'rgba(212,175,55,0.35)' : '#1a1a1a'}`,
                  padding: '28px 32px',
                  transition: 'border-color 180ms, box-shadow 180ms',
                  boxShadow: isOpen ? '0 0 24px rgba(212,175,55,0.1)' : 'none',
                  cursor: isOpen ? 'default' : 'pointer',
                }}
                onClick={() => !isOpen && setOpenSlug(post.slug)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#d4af37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 4, padding: '2px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: 12, color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>{post.date}</span>
                  <span style={{ fontSize: 12, color: '#444' }}>·</span>
                  <span style={{ fontSize: 12, color: '#666' }}>{post.readTime}</span>
                </div>
                <h2 style={{ fontFamily: syne, fontWeight: 700, fontSize: 22, color: '#ededed', marginBottom: 10, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6, marginBottom: 18 }}>{post.excerpt}</p>

                {isOpen && post.body && (
                  <div style={{ marginTop: 20, paddingTop: 24, borderTop: '1px solid #1a1a1a' }}>
                    {renderBody(post.body)}
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenSlug(null); }}
                      style={{ marginTop: 16, background: 'transparent', border: '1px solid #1a1a1a', color: '#888', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}
                    >
                      Collapse
                    </button>
                  </div>
                )}
                {!isOpen && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#3B82F6' }}>
                    Read article →
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Drafts — flagged honestly, not as "coming soon" */}
        {drafts.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#666', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
              In draft — publishing soon
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {drafts.map((post) => (
                <div key={post.slug} style={{ background: '#0a0a0a', border: '1px solid #111', borderRadius: 6, padding: '14px 18px', opacity: 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#666', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{post.category}</span>
                    <span style={{ fontSize: 11, color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>{post.date}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#aaa', marginTop: 6 }}>{post.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 56, padding: '40px 32px', background: '#0f0f0f', borderRadius: 8, border: '1px solid #1a1a1a' }}>
          <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 20, color: '#ededed', marginBottom: 8 }}>
            Run Majorka like we run the blog.
          </div>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
            The tools behind every post are live inside the app. Try it free — no card required.
          </p>
          <Link href="/sign-up" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', borderRadius: 6, padding: '11px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block', boxShadow: '0 4px 20px rgba(59,130,246,0.35)' }}>
            Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
}
