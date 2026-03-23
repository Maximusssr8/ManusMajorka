import React, { useState } from 'react';

const brico = "'Bricolage Grotesque', sans-serif";

const LIVE_NICHES = [
  { niche: 'Beauty & Skincare', live_count: '2,847', peak_viewers: '12,400', top_product: 'LED Face Mask', avg_gmv: '$8,200' },
  { niche: 'Home & Kitchen', live_count: '1,923', peak_viewers: '8,900', top_product: 'Air Fryer', avg_gmv: '$6,100' },
  { niche: 'Fitness & Sports', live_count: '1,456', peak_viewers: '7,200', top_product: 'Resistance Bands', avg_gmv: '$4,800' },
  { niche: 'Tech Accessories', live_count: '1,102', peak_viewers: '9,100', top_product: 'Phone Stand', avg_gmv: '$5,300' },
  { niche: 'Pet Supplies', live_count: '892', peak_viewers: '5,600', top_product: 'Dog Cooling Mat', avg_gmv: '$3,400' },
  { niche: 'Fashion & Accessories', live_count: '3,201', peak_viewers: '15,000', top_product: 'Heatless Curler', avg_gmv: '$9,700' },
];

export default function LivestreamAnalytics() {
  const [activeNiche, setActiveNiche] = useState('All');

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: '#0A0A0A', margin: 0 }}>
              Livestream Analytics
            </h1>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', background: '#F3E8FF', padding: '3px 8px', borderRadius: 20 }}>LIVE</span>
          </div>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            Track trending niches, top products, and GMV across TikTok Live sessions globally
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active Livestreams', value: '12,421', icon: 'broadcast', color: '#EEF2FF' },
            { label: 'Products Promoted Live', value: '8,300+', icon: 'package', color: '#ECFDF5' },
            { label: 'Avg Viewers/Stream', value: '3,200', icon: 'eye', color: '#FEF3C7' },
            { label: 'Top Niche GMV Today', value: '$9,700', icon: 'dollar', color: '#FEE2E2' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: '#0A0A0A' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#4338CA' }}>
          <strong>Coming soon:</strong> Live GMV tracking requires TikTok Shop Partner API (application in progress). Current data reflects estimated live activity from product trend signals.
        </div>

        {/* Niche grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {LIVE_NICHES.map(n => (
            <div key={n.niche} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontFamily: brico, fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>{n.niche}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: 10 }}>LIVE</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Active Streams', value: n.live_count },
                  { label: 'Peak Viewers', value: n.peak_viewers },
                  { label: 'Top Product', value: n.top_product },
                  { label: 'Avg GMV', value: n.avg_gmv },
                ].map(s => (
                  <div key={s.label} style={{ background: '#FAFAFA', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0A0A0A' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
