import { useEffect, useState } from 'react';
import { useParams } from 'wouter';

const brico = "'Bricolage Grotesque', sans-serif";

export default function SharedReport() {
  const params = useParams<{ slug: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reports/${params.slug}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setReport(d); })
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#94A3B8', fontSize: 14 }}>Loading report...</div>;
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 12 }}>
      <div style={{ fontSize: 48 }}>{'\u{1F50D}'}</div>
      <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 18, color: '#F8FAFC' }}>Report not found</div>
      <div style={{ fontSize: 14, color: '#9CA3AF' }}>{error}</div>
      <a href="/" style={{ fontSize: 13, color: '#3B82F6', fontWeight: 600 }}>Try Majorka free \u2192</a>
    </div>
  );

  const products = report?.products || [];

  return (
    <div style={{ background: '#05070F', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#0d0d10', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: '#3B82F6' }}>Majorka</div>
        <a href="/signup" style={{ height: 34, padding: '0 16px', background: '#3B82F6', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          Get free access \u2192
        </a>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 24, color: '#F8FAFC', marginBottom: 4 }}>{report.title}</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>
          {products.length} products \u00B7 {report.region_code} market \u00B7 Expires {new Date(report.expires_at).toLocaleDateString()}
        </p>

        {products.map((p: any, i: number) => (
          <div key={i} style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 14 }}>
              {p.image_url && <img src={p.image_url} alt={p.product_title} loading="lazy" style={{ width: 80, height: 80, objectFit: 'cover' as const, borderRadius: 8 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: '#F8FAFC', marginBottom: 6 }}>{p.product_title}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                  {p.winning_score && <div style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>Score: {p.winning_score}/100</div>}
                  {p.profit_margin && <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Margin: {p.profit_margin}%</div>}
                  {p.est_monthly_revenue_aud && <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>~${p.est_monthly_revenue_aud}/mo</div>}
                  {p.aliexpress_url && <a href={p.aliexpress_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>View Supplier \u2192</a>}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 16, padding: '32px 24px', textAlign: 'center' as const, marginTop: 32 }}>
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: '#F8FAFC', marginBottom: 8 }}>Want more product insights?</div>
          <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>Majorka finds winning products before your competitors. Free to try.</div>
          <a href="/signup" style={{ display: 'inline-block', height: 44, lineHeight: '44px', padding: '0 24px', background: '#3B82F6', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Start free \u2192
          </a>
        </div>
        <div style={{ textAlign: 'center' as const, marginTop: 16, fontSize: 11, color: '#9CA3AF' }}>Powered by Majorka \u00B7 majorka.io</div>
      </div>
    </div>
  );
}
