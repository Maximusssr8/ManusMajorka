import { Link } from 'wouter';

const brico = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

const POSTS = [
  {
    slug: 'how-to-find-winning-products-2025',
    title: 'How to Find Winning Products in 2025 (Before Everyone Else Does)',
    excerpt: 'The dropshipping landscape has changed. Here\'s how top sellers use real TikTok Shop data and AI scoring to identify winners days before they go viral.',
    category: 'Strategy',
    readTime: '6 min read',
    date: 'Mar 18, 2025',
  },
  {
    slug: 'aliexpress-vs-cj-dropshipping',
    title: 'AliExpress vs CJ Dropshipping: Which Supplier Is Right for You?',
    excerpt: 'A data-driven comparison of the two most popular dropshipping suppliers — shipping times, margins, product range, and which works best for different store types.',
    category: 'Suppliers',
    readTime: '8 min read',
    date: 'Mar 10, 2025',
  },
  {
    slug: 'tiktok-shop-product-research',
    title: 'TikTok Shop Product Research: The Complete 2025 Guide',
    excerpt: 'TikTok Shop is generating thousands of viral product moments every week. Learn how to mine this data systematically to find your next store\'s hero product.',
    category: 'Research',
    readTime: '10 min read',
    date: 'Feb 28, 2025',
  },
];

export default function Blog() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: dm }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #ECECEC', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <img src="/majorka-logo.jpg" alt="Majorka" width={30} height={30} style={{ borderRadius: 7 }} />
            <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 16, color: '#0F172A' }}>Majorka</span>
          </a>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none' }}>← Home</a>
            <Link href="/sign-up" style={{ background: '#6366F1', color: 'white', borderRadius: 8, padding: '7px 16px', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', borderRadius: 20, padding: '4px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Blog</span>
        </div>
        <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px, 5vw, 48px)', color: '#0A0A0A', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Ecommerce Intelligence.<br />Built for Sellers.
        </h1>
        <p style={{ fontSize: 18, color: '#6B7280', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Product research guides, supplier comparisons, and market insights to help you sell smarter.
        </p>
      </div>

      {/* Posts */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
          {POSTS.map(post => (
            <article key={post.slug} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '28px 32px', transition: 'box-shadow 200ms, transform 200ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', borderRadius: 6, padding: '2px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{post.category}</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{post.date}</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>·</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{post.readTime}</span>
              </div>
              <h2 style={{ fontFamily: brico, fontWeight: 700, fontSize: 20, color: '#0A0A0A', marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{post.title}</h2>
              <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>{post.excerpt}</p>
              <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#6366F1', textDecoration: 'none' }}>
                Read article →
              </Link>
            </article>
          ))}
        </div>

        {/* Coming soon */}
        <div style={{ textAlign: 'center', marginTop: 48, padding: '32px', background: 'white', borderRadius: 16, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
          <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 18, color: '#0A0A0A', marginBottom: 8 }}>More guides coming soon</div>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>Get notified when we publish new ecommerce research and product insights.</p>
          <Link href="/sign-up" style={{ background: '#6366F1', color: 'white', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
            Get Early Access →
          </Link>
        </div>
      </div>
    </div>
  );
}
