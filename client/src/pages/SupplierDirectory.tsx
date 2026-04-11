/**
 * SupplierDirectory — curated list of AU-friendly dropship & wholesale suppliers.
 * Static data, no API calls, filter by niche + type.
 */
import { useState, useEffect } from 'react';
import { ExternalLink, Truck, Package } from 'lucide-react';
import { SEO } from '@/components/SEO';

const C = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  gold: '#3B82F6',
  text: '#374151',
  muted: '#9CA3AF',
  sub: '#374151',
  green: '#10b981',
  card: '#FFFFFF',
};

interface Supplier {
  id: string;
  name: string;
  niche: string[];
  type: 'dropship' | 'wholesale' | 'print-on-demand' | 'platform';
  shipping_days_to_au: number;
  min_order_aud: number;
  quality_rating: number;
  url: string;
  notes: string;
  best_for: string[];
  au_warehouse: boolean;
  beginner_friendly: boolean;
}

const SUPPLIERS: Supplier[] = [
  { id: '1', name: 'CJDropshipping', niche: ['All'], type: 'dropship', shipping_days_to_au: 7, min_order_aud: 0, quality_rating: 4.2, url: 'https://cjdropshipping.com', notes: 'AU warehouse available. Best for fast shipping to Australian customers.', best_for: ['Fast shipping', 'AU warehouse', 'Wide product range'], au_warehouse: true, beginner_friendly: true },
  { id: '2', name: 'AliExpress', niche: ['All'], type: 'platform', shipping_days_to_au: 14, min_order_aud: 0, quality_rating: 3.8, url: 'https://aliexpress.com', notes: 'Largest product catalogue. Use AliExpress Standard Shipping for 10-14 day AU delivery.', best_for: ['Product sourcing', 'Price research', 'Testing products'], au_warehouse: false, beginner_friendly: true },
  { id: '3', name: 'Zendrop', niche: ['Health', 'Beauty', 'Home'], type: 'dropship', shipping_days_to_au: 10, min_order_aud: 0, quality_rating: 4.3, url: 'https://zendrop.com', notes: 'US-based but fast AU shipping. Automated fulfilment, Shopify integration built-in.', best_for: ['US + AU dropshipping', 'Shopify integration', 'Private label'], au_warehouse: false, beginner_friendly: true },
  { id: '4', name: 'Spocket', niche: ['Fashion', 'Home', 'Beauty'], type: 'dropship', shipping_days_to_au: 12, min_order_aud: 0, quality_rating: 4.1, url: 'https://spocket.co', notes: 'Focuses on US/EU suppliers. Good for premium positioning.', best_for: ['Premium products', 'Fast delivery from US/EU', 'Branded invoicing'], au_warehouse: false, beginner_friendly: true },
  { id: '5', name: 'Printful', niche: ['Fashion', 'Accessories', 'Home'], type: 'print-on-demand', shipping_days_to_au: 14, min_order_aud: 0, quality_rating: 4.5, url: 'https://printful.com', notes: 'Best POD quality in the market. No AU warehouse but reliable 10-14 day delivery.', best_for: ['Custom branding', 'T-shirts + hoodies', 'No inventory risk'], au_warehouse: false, beginner_friendly: true },
  { id: '6', name: 'Printify', niche: ['Fashion', 'Accessories', 'Home'], type: 'print-on-demand', shipping_days_to_au: 16, min_order_aud: 0, quality_rating: 4.0, url: 'https://printify.com', notes: 'Cheaper than Printful. Large product range. Quality varies by print partner.', best_for: ['Cost-effective POD', 'Large product variety', 'Bulk printing'], au_warehouse: false, beginner_friendly: true },
  { id: '7', name: 'Dropshipzone', niche: ['All'], type: 'dropship', shipping_days_to_au: 2, min_order_aud: 0, quality_rating: 4.4, url: 'https://dropshipzone.com.au', notes: 'Australian-based dropshipper. 24-48hr AU delivery. Premium positioning.', best_for: ['Fast AU delivery', 'No customs risk', 'AU-compliant products'], au_warehouse: true, beginner_friendly: true },
  { id: '8', name: 'Wiio', niche: ['Health', 'Beauty', 'Tech', 'Home'], type: 'dropship', shipping_days_to_au: 10, min_order_aud: 0, quality_rating: 4.2, url: 'https://wiio.io', notes: 'Product sourcing + fulfilment. Good for scaling winning products.', best_for: ['Scaling proven products', 'Quality control', 'Private label'], au_warehouse: false, beginner_friendly: false },
  { id: '9', name: 'AutoDS', niche: ['All'], type: 'platform', shipping_days_to_au: 12, min_order_aud: 0, quality_rating: 4.1, url: 'https://autods.com', notes: 'Automation platform. Connects to AliExpress, Amazon, Walmart for AU dropshipping.', best_for: ['Automation', 'Price monitoring', 'Multi-supplier management'], au_warehouse: false, beginner_friendly: false },
  { id: '10', name: 'DHgate', niche: ['Fashion', 'Tech', 'Accessories'], type: 'platform', shipping_days_to_au: 18, min_order_aud: 50, quality_rating: 3.6, url: 'https://dhgate.com', notes: 'Bulk orders. Good for buying inventory once you have a proven winner.', best_for: ['Bulk buying', 'Low unit costs', 'Accessories + fashion'], au_warehouse: false, beginner_friendly: false },
  { id: '11', name: 'Modalyst', niche: ['Fashion', 'Accessories'], type: 'dropship', shipping_days_to_au: 14, min_order_aud: 0, quality_rating: 4.0, url: 'https://modalyst.co', notes: 'Fashion-focused. US/EU brands. Higher price point but strong margins.', best_for: ['Premium fashion', 'Branded products', 'US/EU sourcing'], au_warehouse: false, beginner_friendly: false },
  { id: '12', name: 'BrandsGateway', niche: ['Fashion', 'Accessories'], type: 'wholesale', shipping_days_to_au: 5, min_order_aud: 500, quality_rating: 4.3, url: 'https://brandsgateway.com', notes: 'Authentic luxury brands at wholesale. High AOV, excellent margins.', best_for: ['Luxury fashion', 'High AOV stores', 'Branded inventory'], au_warehouse: false, beginner_friendly: false },
  { id: '13', name: 'Nihao Jewellery', niche: ['Fashion', 'Accessories'], type: 'dropship', shipping_days_to_au: 15, min_order_aud: 0, quality_rating: 4.1, url: 'https://www.nihaojewelry.com', notes: 'Jewellery-specific dropshipper. Huge range, low prices, good for fashion stores.', best_for: ['Jewellery', 'Accessories', 'Low MOQ'], au_warehouse: false, beginner_friendly: true },
  { id: '14', name: 'BigBuy', niche: ['Home', 'Toys', 'Tech', 'Sports'], type: 'wholesale', shipping_days_to_au: 10, min_order_aud: 100, quality_rating: 4.0, url: 'https://www.bigbuy.eu', notes: 'European wholesale. Good for unique products not saturated in AU market.', best_for: ['Unique EU products', 'Wholesale pricing', 'Home + lifestyle'], au_warehouse: false, beginner_friendly: false },
  { id: '15', name: 'Temu Wholesale', niche: ['All'], type: 'platform', shipping_days_to_au: 12, min_order_aud: 0, quality_rating: 3.5, url: 'https://temu.com', notes: 'Ultra-low prices. Quality inconsistent. Use for product research and price benchmarking.', best_for: ['Price benchmarking', 'Trend spotting', 'Low-cost testing'], au_warehouse: false, beginner_friendly: true },
  { id: '16', name: 'SaleHoo', niche: ['All'], type: 'platform', shipping_days_to_au: 14, min_order_aud: 0, quality_rating: 4.2, url: 'https://salehoo.com', notes: 'NZ-based supplier directory. Vetted suppliers, good for finding AU-friendly dropshippers.', best_for: ['Vetted suppliers', 'AU/NZ sourcing', 'Supplier research'], au_warehouse: false, beginner_friendly: true },
  { id: '17', name: 'Cosmetic Index AU', niche: ['Beauty'], type: 'wholesale', shipping_days_to_au: 3, min_order_aud: 200, quality_rating: 4.4, url: 'https://cosmeticindex.com.au', notes: 'Australian beauty wholesale. TGA-compliant products, fast local delivery.', best_for: ['TGA-compliant beauty', 'AU-made products', 'Skincare'], au_warehouse: true, beginner_friendly: false },
  { id: '18', name: 'Workout Locker', niche: ['Fitness'], type: 'wholesale', shipping_days_to_au: 3, min_order_aud: 300, quality_rating: 4.3, url: 'https://workoutlocker.com.au', notes: 'AU-based fitness equipment supplier. Fast delivery, no customs hassle.', best_for: ['Fitness equipment', 'AU delivery', 'B2B pricing'], au_warehouse: true, beginner_friendly: false },
  { id: '19', name: 'Pet Circle Wholesale', niche: ['Pets'], type: 'wholesale', shipping_days_to_au: 2, min_order_aud: 500, quality_rating: 4.6, url: 'https://petcircle.com.au', notes: "Australia's largest pet supplier. Vet-approved products, fast AU delivery.", best_for: ['Pet products', 'AU delivery', 'Quality-assured'], au_warehouse: true, beginner_friendly: false },
  { id: '20', name: 'Gelato', niche: ['Fashion', 'Home', 'Accessories'], type: 'print-on-demand', shipping_days_to_au: 7, min_order_aud: 0, quality_rating: 4.4, url: 'https://gelato.com', notes: 'Print-on-demand with AU print partners. Fastest POD delivery to AU customers.', best_for: ['Fast AU POD', 'Local printing', 'Sustainable shipping'], au_warehouse: true, beginner_friendly: true },
  { id: '21', name: 'Alibaba Gold Suppliers', niche: ['All'], type: 'wholesale', shipping_days_to_au: 20, min_order_aud: 500, quality_rating: 4.0, url: 'https://alibaba.com', notes: 'Factory-direct pricing. Best for scaling proven winners at lowest unit costs.', best_for: ['Factory pricing', 'Private label', 'Large volume'], au_warehouse: false, beginner_friendly: false },
  { id: '22', name: 'Faire', niche: ['Home', 'Fashion', 'Beauty'], type: 'wholesale', shipping_days_to_au: 14, min_order_aud: 300, quality_rating: 4.5, url: 'https://faire.com', notes: 'Wholesale marketplace for independent brands. Net 60 payment terms available.', best_for: ['Unique indie brands', 'Net 60 terms', 'Premium products'], au_warehouse: false, beginner_friendly: false },
  { id: '23', name: 'Eprolo', niche: ['Fashion', 'Home', 'Beauty'], type: 'dropship', shipping_days_to_au: 12, min_order_aud: 0, quality_rating: 3.9, url: 'https://eprolo.com', notes: 'Free dropshipping platform. Good Shopify integration. Branding options available.', best_for: ['Free to use', 'Shopify integration', 'Private label starter'], au_warehouse: false, beginner_friendly: true },
  { id: '24', name: 'Syncee', niche: ['Fashion', 'Home', 'Sports'], type: 'dropship', shipping_days_to_au: 14, min_order_aud: 0, quality_rating: 4.0, url: 'https://syncee.co', notes: 'B2B marketplace. AU suppliers available. Automated product sync.', best_for: ['AU suppliers', 'Product sync', 'Niche products'], au_warehouse: false, beginner_friendly: true },
  { id: '25', name: 'Wholesale Central AU', niche: ['Home', 'Gifts', 'Seasonal'], type: 'wholesale', shipping_days_to_au: 3, min_order_aud: 200, quality_rating: 4.1, url: 'https://wholesalecentral.com.au', notes: 'AU-based wholesale directory. Connect directly with local AU suppliers.', best_for: ['AU suppliers', 'Local sourcing', 'Seasonal products'], au_warehouse: true, beginner_friendly: false },
];

const ALL_NICHES = ['All', 'Health', 'Beauty', 'Home', 'Fashion', 'Fitness', 'Tech', 'Pets', 'Accessories'];
const ALL_TYPES = ['All', 'dropship', 'wholesale', 'print-on-demand', 'platform'];

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: C.gold, fontSize: 11 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span style={{ color: C.muted, marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

export default function SupplierDirectory() {
  const [niche, setNiche] = useState('All');
  const [type, setType] = useState('All');
  const [sortBy, setSortBy] = useState<'shipping' | 'rating'>('rating');

  const [searchQuery, setSearchQuery] = useState('');

  // Auto-select niche from URL params (e.g. from Trend Signals)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const nicheParam = p.get('niche');
    const productParam = p.get('product');
    if (nicheParam) {
      const match = ALL_NICHES.find(n => nicheParam.toLowerCase().includes(n.toLowerCase()));
      if (match) setNiche(match);
    }
    if (productParam) {
      setSearchQuery(productParam);
    }
    window.history.replaceState({}, '', '/app/suppliers');
  }, []);

  const filtered = SUPPLIERS
    .filter(s => niche === 'All' || s.niche.includes('All') || s.niche.includes(niche))
    .filter(s => type === 'All' || s.type === type)
    .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.niche.some(n => n.toLowerCase().includes(searchQuery.toLowerCase())) || s.notes.toLowerCase().includes(searchQuery.toLowerCase()) || s.best_for.some(b => b.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => sortBy === 'rating' ? b.quality_rating - a.quality_rating : a.shipping_days_to_au - b.shipping_days_to_au);

  const btnStyle = (active: boolean) => ({
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700 as const,
    fontFamily: "'Bricolage Grotesque', sans-serif",
    cursor: 'pointer' as const,
    border: `1px solid ${active ? C.gold : C.border}`,
    background: active ? 'rgba(59,130,246,0.12)' : C.surface,
    color: active ? C.gold : C.muted,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: '24px', background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'DM Sans, sans-serif' }}>
      <SEO title="Supplier Directory | Majorka" description="25 AU-vetted dropshipping suppliers with shipping times, quality ratings and AU warehouse badges." path="/app/suppliers" />
      <style>{`
        @media (max-width: 640px) {
          .supplier-cards-grid { grid-template-columns: 1fr !important; }
          .supplier-filters { gap: 6px !important; }
          .supplier-sort-row { margin-left: 0 !important; }
          .supplier-card { padding: 14px !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: C.text, marginBottom: 6 }}>
          Supplier Directory
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>
          25 AU-vetted suppliers · Updated March 2026 · Sorted by quality rating
        </p>
      </div>

      {/* Search */}
      {searchQuery && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: C.muted }}>Searching for:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{searchQuery}</span>
          <button onClick={() => setSearchQuery('')} style={{ fontSize: 11, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      {/* Filters */}
      <div className="supplier-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_NICHES.map(n => (
            <button key={n} style={btnStyle(niche === n)} onClick={() => setNiche(n)}>{n}</button>
          ))}
        </div>
        <div style={{ width: '100%', height: 0 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_TYPES.map(t => (
            <button key={t} style={btnStyle(type === t)} onClick={() => setType(t)}>
              {t === 'print-on-demand' ? 'Print on Demand' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <div className="supplier-sort-row" style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button style={btnStyle(sortBy === 'rating')} onClick={() => setSortBy('rating')}>Rating</button>
            <button style={btnStyle(sortBy === 'shipping')} onClick={() => setSortBy('shipping')}>Fastest AU Shipping</button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
        Showing {filtered.length} of {SUPPLIERS.length} suppliers
      </p>

      {/* Supplier cards */}
      <div className="supplier-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.map(s => (
          <div
            key={s.id}
            className="supplier-card"
            style={{
              background: C.card,
              border: `1px solid ${s.au_warehouse ? 'rgba(16,185,129,0.2)' : C.border}`,
              borderRadius: 12,
              padding: 16,
              position: 'relative',
            }}
          >
            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {s.beginner_friendly && (
                <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: C.gold, fontFamily: "'Bricolage Grotesque', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Beginner Friendly
                </span>
              )}
              {s.au_warehouse && (
                <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: C.green, fontFamily: "'Bricolage Grotesque', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  AU Warehouse
                </span>
              )}
              <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 4, background: C.surface, color: C.muted, fontFamily: "'Bricolage Grotesque', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.type === 'print-on-demand' ? 'POD' : s.type}
              </span>
            </div>

            {/* Name + rating */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", color: C.text, margin: 0 }}>{s.name}</h3>
              <StarRating rating={s.quality_rating} />
            </div>

            {/* Notes */}
            <p style={{ fontSize: 12, color: C.sub, marginBottom: 12, lineHeight: 1.5 }}>{s.notes}</p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Truck size={11} style={{ color: C.gold }} />
                <span style={{ color: C.muted }}>{s.shipping_days_to_au} days to AU</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Package size={11} style={{ color: C.gold }} />
                <span style={{ color: C.muted }}>MOQ: {s.min_order_aud === 0 ? 'None' : `$${s.min_order_aud} AUD`}</span>
              </div>
            </div>

            {/* Best for tags */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              {s.best_for.map(tag => (
                <span key={tag} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: C.gold,
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 7,
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
            >
              Visit {s.name} <ExternalLink size={11} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
