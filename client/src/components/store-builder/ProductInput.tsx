import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const NICHES = [
  'Fashion & Apparel',
  'Activewear & Gym',
  'Swimwear & Beach',
  'Beauty & Skincare',
  'Hair Care',
  'Nails & Cosmetics',
  'Health & Wellness',
  'Supplements & Nutrition',
  'Home Decor',
  'Kitchen & Dining',
  'Bedroom & Bath',
  'Baby & Kids',
  'Toys & Games',
  'Pets & Animals',
  'Tech Accessories',
  'Phone Cases & Protection',
  'Outdoor & Camping',
  'Fishing & Hunting',
  'Surf & Snow',
  'Automotive & Car Accessories',
  'Jewellery & Accessories',
  'Watches',
  'Art & Prints',
  'Stationery & Office',
  'General / Mixed Niche',
];
const gold = '#6366F1';
const syne = 'Syne, sans-serif';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
  color: '#f0ede8', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
};

export default function ProductInput({ onComplete, session, initialProduct, initialNiche, initialPrice }: {
  onComplete: (input: Record<string, string>, blueprint: Record<string, any>) => void;
  session: any;
  initialProduct?: string;
  initialNiche?: string;
  initialPrice?: string;
}) {
  const [productName, setProductName] = useState(initialProduct || '');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState(() => {
    if (!initialNiche) return 'General / Mixed Niche';
    const exact = NICHES.find(n => n === initialNiche);
    if (exact) return exact;
    const partial = NICHES.find(n => n.toLowerCase().includes(initialNiche.toLowerCase()));
    return partial || 'General / Mixed Niche';
  });
  const [pricePoint, setPricePoint] = useState(initialPrice || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!productName.trim()) { setError('Product name is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/store-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ productName, productDescription: description, niche, pricePoint }),
      });
      if (!res.ok) throw new Error(((await res.json()) as any).error || 'Generation failed');
      const bp = await res.json();
      onComplete({ productName, description, niche, pricePoint }, bp);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>What are you selling?</h2>
      <p style={{ color: '#71717a', marginBottom: 32, fontSize: 15 }}>Tell us about your product and we'll build the complete launch blueprint.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Product Name *</label>
          <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. LED Desk Lamp with Wireless Charger" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Description <span style={{ color: '#52525b' }}>(optional but improves quality)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe your product, its key benefits, and who it's for..." rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Niche</label>
            <select value={niche} onChange={e => setNiche(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Price Point (AUD)</label>
            <input value={pricePoint} onChange={e => setPricePoint(e.target.value)} placeholder="49.95" type="number" min="0" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}

        <button onClick={handleGenerate} disabled={loading} style={{
          padding: '14px 24px', borderRadius: 8, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? 'rgba(99,102,241,0.3)' : gold,
          color: '#080a0e', fontFamily: syne, fontWeight: 700, fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading ? 0.7 : 1, minHeight: 50,
        }}>
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Generating Blueprint...</>
            : 'Generate Blueprint →'}
        </button>
      </div>
    </div>
  );
}
