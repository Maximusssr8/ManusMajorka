import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const brico = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

const POSTS = [
  {
    slug: 'best-dropshipping-products-march-2026',
    title: 'Best Dropshipping Products — March 2026',
    excerpt: 'Our AI tracked 131 trending products across 7 global markets this month. These are the top performers by demand score, margin potential, and TikTok traction.',
    category: 'Trending',
    readTime: '5 min read',
    date: 'Mar 20, 2026',
    badge: '🔥 New',
  },
  {
    slug: 'how-to-find-winning-products-tiktok',
    title: 'How to Find Winning Products on TikTok in 2026',
    excerpt: 'TikTok Shop is generating thousands of viral product moments every week. Here\'s the exact method top sellers use to mine trend signals before they go mainstream.',
    category: 'Research',
    readTime: '7 min read',
    date: 'Mar 14, 2026',
    badge: '',
  },
  {
    slug: 'aliexpress-vs-cj-dropshipping-2026',
    title: 'AliExpress vs CJ Dropshipping 2026: Full Comparison',
    excerpt: 'A data-driven breakdown of shipping times, margins, product range, and automation support. Which supplier wins for each product type in 2026.',
    category: 'Suppliers',
    readTime: '8 min read',
    date: 'Mar 8, 2026',
    badge: '',
  },
  {
    slug: 'how-to-find-winning-products-2026',
    title: 'How to Find Winning Products in 2026 (AI-First Method)',
    excerpt: 'The research playbook has changed. Here\'s how serious dropshippers use AI scoring, competitor intelligence, and demand signals to find winners before everyone else.',
    category: 'Strategy',
    readTime: '6 min read',
    date: 'Feb 28, 2026',
    badge: '',
  },
  {
    slug: 'profit-margins-dropshipping-guide',
    title: 'Dropshipping Profit Margins: What to Aim for in 2026',
    excerpt: 'Most beginners get margin wrong. This guide covers realistic margin targets by category, how to calculate break-even CPA, and when to walk away from a product.',
    category: 'Finance',
    readTime: '9 min read',
    date: 'Feb 15, 2026',
    badge: '',
  },
];

export default function Blog() {
  return (
    <div style={{ minHeight: '100vh', background: '#05070F', fontFamily: dm }}>
      <SEO
        title="Blog — Majorka"
        description="Ecommerce insights, product research guides, and dropshipping strategies. Learn how to find winning products and scale your online store."
        path="/blog"
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
            <Link href="/sign-up" style={{ background: '#6366F1', color: 'white', borderRadius: 8, padding: '7px 16px', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', borderRadius: 20, padding: '4px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Blog</span>
          <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#818CF8', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>Content Coming Soon</span>
        </div>
        <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px, 5vw, 48px)', color: '#F8FAFC', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Ecommerce Intelligence.<br />Built for Sellers.
        </h1>
        <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Product research guides, supplier comparisons, and market insights to help you sell smarter.
        </p>
      </div>

      {/* Posts */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
          {POSTS.map((post, idx) => (
            <article key={post.slug} style={{ background: '#0d0d10', borderRadius: 16, border: `1px solid ${idx === 0 ? '#C7D2FE' : '#E5E7EB'}`, padding: '28px 32px', transition: 'box-shadow 200ms, transform 200ms', position: 'relative' as const }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
              {/* Coming soon badge */}
              <div style={{ position: 'absolute' as const, top: 20, right: 24, fontSize: 10, fontWeight: 700, color: '#9CA3AF', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Coming Soon</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', borderRadius: 6, padding: '2px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{post.category}</span>
                {post.badge && <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', borderRadius: 6, padding: '2px 8px' }}>{post.badge}</span>}
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{post.date}</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>·</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{post.readTime}</span>
              </div>
              <h2 style={{ fontFamily: brico, fontWeight: 700, fontSize: 20, color: '#F8FAFC', marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{post.title}</h2>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, marginBottom: 20 }}>{post.excerpt}</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#9CA3AF', cursor: 'default' }}>
                Full article coming soon →
              </div>
            </article>
          ))}
        </div>

        {/* Coming soon */}
        <div style={{ textAlign: 'center', marginTop: 48, padding: '32px', background: '#0d0d10', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
          <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 18, color: '#F8FAFC', marginBottom: 8 }}>More guides coming soon</div>
          <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>Weekly product research, supplier insights, and market data — straight to your inbox.</p>
          <Link href="/sign-up" style={{ background: '#6366F1', color: 'white', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
            Join Majorka →
          </Link>
        </div>
      </div>
    </div>
  );
}
