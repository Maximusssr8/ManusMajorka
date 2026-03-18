import { lazy, Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const ProfitCalculator = lazy(() => import('./ProfitCalculator'));
const SupplierDirectory = lazy(() => import('./SupplierDirectory'));

type TabKey = 'profit' | 'suppliers';

const C = { bg: '#080a0e', surface: '#111118', border: '#1e1e1e', gold: '#d4af37', text: '#f0ede8', muted: 'rgba(240,237,232,0.5)' };

export default function ProfitSuppliers() {
  const [tab, setTab] = useState<TabKey>('profit');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('niche') || p.get('product') || p.get('q')) {
      setTab('suppliers');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet><title>Profit & Suppliers | Majorka</title></Helmet>
      <div style={{ padding: '24px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: C.text, margin: 0, marginBottom: 4 }}>Profit & Suppliers</h1>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, marginBottom: 20 }}>Calculate margins and find AU-ready suppliers</p>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {(['profit', 'suppliers'] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? C.gold : 'rgba(255,255,255,0.04)',
              color: tab === t ? '#080a0e' : C.muted,
              fontFamily: 'Syne, sans-serif',
            }}>
              {t === 'profit' ? 'Profit Calculator' : 'Suppliers'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'profit' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <ProfitCalculator />
          </Suspense>
        )}
        {tab === 'suppliers' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <SupplierDirectory />
          </Suspense>
        )}
      </div>
    </div>
  );
}
