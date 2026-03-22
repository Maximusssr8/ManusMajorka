import { lazy, Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const MetaAdsPack = lazy(() => import('./MetaAdsPack'));
const CopywriterTool = lazy(() => import('./CopywriterTool'));
const BrandDNA = lazy(() => import('./BrandDNA'));

type TabKey = 'ads' | 'copy' | 'brand';

const C = { bg: '#080a0e', surface: '#111118', border: '#1e1e1e', gold: '#6366F1', text: '#f0ede8', muted: 'rgba(240,237,232,0.5)' };

export default function GrowthTools() {
  const [tab, setTab] = useState<TabKey>('ads');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('hook') || p.get('niche')) {
      setTab('ads');
      // Don't clear — MetaAdsPack may read these params
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet><title>Growth Tools | Majorka</title></Helmet>
      <div style={{ padding: '24px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: C.text, margin: 0, marginBottom: 4 }}>Growth Tools</h1>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, marginBottom: 20 }}>Write ads, copy, and brand voice — powered by AI</p>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {(['ads', 'copy', 'brand'] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? C.gold : 'rgba(255,255,255,0.04)',
              color: tab === t ? '#080a0e' : C.muted,
              fontFamily: 'Syne, sans-serif',
            }}>
              {t === 'ads' ? 'Ad Studio' : t === 'copy' ? 'Copy Studio' : 'Brand DNA'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'ads' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading Ad Studio...</div>}>
            <MetaAdsPack />
          </Suspense>
        )}
        {tab === 'copy' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading Copy Studio...</div>}>
            <CopywriterTool />
          </Suspense>
        )}
        {tab === 'brand' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading Brand DNA...</div>}>
            <BrandDNA />
          </Suspense>
        )}
      </div>
    </div>
  );
}
