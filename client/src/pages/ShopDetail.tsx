import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';
import Sparkline from '@/components/Sparkline';
import { useLocation, useParams } from 'wouter';

const C = { bg: '#FAFAFA', surface: '#FFFFFF', border: '#E5E7EB', gold: '#4f8ef7', text: '#0A0A0A', muted: 'rgba(55,65,81,0.5)' };

interface ShopDetailData {
  id: string;
  shop_name: string;
  shop_domain: string;
  niche: string;
  shop_type: string;
  est_revenue_aud: number;
  revenue_trend: number[];
  growth_rate_pct: number;
  items_sold_est: number;
  avg_unit_price_aud: number;
  best_selling_products: { name: string; imageUrl: string }[];
  affiliate_revenue_aud: number;
  ad_spend_est_aud: number;
  founded_year: number;
  similar_shops: { id: string; shop_name: string; niche: string; est_revenue_aud: number; growth_rate_pct: number; shop_type: string }[];
}

interface Analysis {
  why_succeeding: string[];
  weaknesses: string[];
  competing_angle: string;
  ad_spend_range: string;
  copy_strategy_score: number;
  recommended_products: string[];
  summary: string;
}

export default function ShopDetail() {
  const params = useParams() as { id: string };
  const [, navigate] = useLocation();
  const [shop, setShop] = useState<ShopDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/app/shops'); return; }
      const res = await fetch(`/api/shops/${params.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { navigate('/app/shops'); return; }
      const data = await res.json();
      setShop(data);
      setLoading(false);
    })();
  }, [params.id]);

  const generateAnalysis = async () => {
    setAnalysing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/shops/analyse/${params.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setAnalysis(data.analysis);
    setAnalysing(false);
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>;
  if (!shop) return null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <Helmet><title>{shop.shop_name} — Shop Intelligence — Majorka</title></Helmet>

      <button onClick={() => navigate('/app/shops')} style={{ marginBottom: 20, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back to Shop Intelligence
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* LEFT */}
        <div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: `hsl(${shop.shop_name.charCodeAt(0) * 7 % 360},40%,25%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: C.text, flexShrink: 0 }}>
                {shop.shop_name[0]}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: C.text }}>{shop.shop_name}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{shop.shop_domain}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(79,142,247,0.1)', color: C.gold }}>{shop.niche}</span>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.03)', color: C.muted, textTransform: 'uppercase' }}>{shop.shop_type}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>Est. {shop.founded_year}</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: C.gold }}>
              ${shop.est_revenue_aud?.toLocaleString()} AUD
              <span style={{ fontSize: 14, fontWeight: 400, color: C.muted, marginLeft: 8 }}>/ month</span>
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>Revenue Trend (7 weeks)</div>
            <Sparkline data={shop.revenue_trend || []} width={600} height={120} color={C.gold} strokeWidth={2.5} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Items Sold/Mo', value: (shop.items_sold_est || 0).toLocaleString() },
              { label: 'Avg Unit Price', value: `$${shop.avg_unit_price_aud} AUD` },
              { label: 'Growth Rate', value: `${shop.growth_rate_pct > 0 ? '+' : ''}${shop.growth_rate_pct}%`, color: shop.growth_rate_pct >= 0 ? '#4f8ef7' : '#ef4444' },
              { label: 'Ad Spend Est.', value: `$${(shop.ad_spend_est_aud || 0).toLocaleString()}/mo` },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: color || C.text, fontFamily: "'Syne', sans-serif" }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>Best Selling Products</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {(shop.best_selling_products || []).map((p, i) => (
                <div key={i} style={{ background: '#0d0d10', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 100, objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ padding: '10px', fontSize: 12, color: C.text, fontWeight: 600 }}>{p.name}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate(`/app/website-generator?niche=${encodeURIComponent(shop.niche)}&fromDatabase=true`)}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: C.gold, border: 'none', color: '#FAFAFA', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}
          >
            Build a Competing Store →
          </button>
        </div>

        {/* RIGHT */}
        <div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: C.text, marginBottom: 12 }}>AI Store Analysis</div>
            {!analysis ? (
              <button onClick={generateAnalysis} disabled={analysing}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'rgba(79,142,247,0.1)', border: `1px solid rgba(79,142,247,0.25)`, color: C.gold, fontSize: 14, fontWeight: 700, cursor: analysing ? 'not-allowed' : 'pointer', fontFamily: "'Syne', sans-serif" }}>
                {analysing ? 'Analysing...' : 'Generate Analysis'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: C.muted, marginBottom: 8 }}>Why It's Succeeding</div>
                  {analysis.why_succeeding.map((point, i) => (
                    <div key={i} style={{ fontSize: 13, color: C.text, padding: '6px 0', borderBottom: i < analysis.why_succeeding.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#4f8ef7', flexShrink: 0 }}>✓</span> {point}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: C.muted, marginBottom: 8 }}>Weaknesses / Gaps</div>
                  {analysis.weaknesses.map((w, i) => (
                    <div key={i} style={{ fontSize: 13, color: C.text, padding: '6px 0', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#ef4444', flexShrink: 0 }}>!</span> {w}
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(79,142,247,0.06)', border: `1px solid rgba(79,142,247,0.2)`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: C.gold, marginBottom: 6 }}>Your Competing Angle</div>
                  <div style={{ fontSize: 13, color: C.text }}>{analysis.competing_angle}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: '#0d0d10', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>Ad Spend Range</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 4 }}>{analysis.ad_spend_range}</div>
                  </div>
                  <div style={{ background: '#0d0d10', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>Copy Score</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.gold, fontFamily: "'Syne', sans-serif", marginTop: 4 }}>{analysis.copy_strategy_score}/10</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{analysis.summary}</div>
              </div>
            )}
          </div>

          {(shop.similar_shops || []).length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14, fontFamily: "'Syne', sans-serif" }}>Similar Shops</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shop.similar_shops.map(s => (
                  <div key={s.id} onClick={() => navigate(`/app/shops/${s.id}`)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0d0d10', borderRadius: 10, cursor: 'pointer', border: `1px solid ${C.border}` }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(79,142,247,0.3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = C.border}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.shop_name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.shop_type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>${(s.est_revenue_aud / 1000).toFixed(0)}k</div>
                      <div style={{ fontSize: 11, color: s.growth_rate_pct >= 0 ? '#4f8ef7' : '#ef4444' }}>{s.growth_rate_pct > 0 ? '+' : ''}{s.growth_rate_pct}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
