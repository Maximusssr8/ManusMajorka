import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import ProductInput from '@/components/store-builder/ProductInput';
import BlueprintPreview from '@/components/store-builder/BlueprintPreview';
import ShopifyConnect from '@/components/store-builder/ShopifyConnect';
import PushSuccess from '@/components/store-builder/PushSuccess';

const STEPS = ['Product', 'Blueprint', 'Connect', 'Success'] as const;
const STEPS_DISPLAY = ['Choose Niche', 'Select Product', 'Customise', 'Launch'];
const gold = '#6366F1';
const syne = 'Syne, sans-serif';

export default function StoreBuilder() {
  const [step, setStep] = useState(1);
  const [blueprint, setBlueprint] = useState<Record<string, any> | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState('');
  const [pushResult, setPushResult] = useState<Record<string, any> | null>(null);
  // Track if we arrived here from Shopify OAuth callback (?connected=true)
  const [oauthConnected, setOauthConnected] = useState(false);
  const { session } = useAuth();

  // URL params for pre-filling from Winning Products
  const [urlProduct] = useState(() => new URLSearchParams(window.location.search).get('product') || '');
  const [urlNiche] = useState(() => new URLSearchParams(window.location.search).get('niche') || '');
  const [urlPrice] = useState(() => new URLSearchParams(window.location.search).get('price') || '');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setStep(3);
      setOauthConnected(true);
      window.history.replaceState({}, '', '/store-builder');
    }
    const oauthError = params.get('error');
    if (oauthError) {
      console.warn('[StoreBuilder] OAuth error:', oauthError);
    }
  }, []);

  const handleReset = () => {
    setStep(1);
    setBlueprint(null);
    setPushResult(null);
    setSelectedStoreName('');
    setOauthConnected(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080a0e', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Store Builder — Majorka</title>
      </Helmet>
      <style>{`
        @media (max-width: 640px) {
          .sb-topbar { padding: 12px 16px !important; }
          .sb-step-label { display: none !important; }
          .sb-content { padding: 24px 16px 80px !important; }
        }
      `}</style>
      {/* Top bar */}
      <div className="sb-topbar" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, color: gold, letterSpacing: '-0.02em' }}>
          🏪 Store Builder
        </span>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => {
            const n = i + 1;
            const isActive = step === n;
            const isDone = step > n;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? gold : isDone ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#080a0e' : isDone ? gold : '#52525b',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {isDone ? '✓' : n}
                </div>
                <span className="sb-step-label" style={{ fontSize: 12, color: isActive ? gold : '#52525b', display: window.innerWidth < 480 ? 'none' : 'inline' }}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="sb-content" style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          {STEPS_DISPLAY.map((stepLabel, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 80 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i <= (step - 1) ? '#6366F1' : '#F3F4F6',
                  color: i <= (step - 1) ? 'white' : '#9CA3AF',
                  fontSize: 14, fontWeight: 700,
                  boxShadow: i === (step - 1) ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                  transition: 'all 200ms',
                }}>
                  {i < (step - 1) ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: i === (step - 1) ? 600 : 400,
                  color: i <= (step - 1) ? '#6366F1' : '#9CA3AF',
                  whiteSpace: 'nowrap',
                }}>
                  {stepLabel}
                </span>
              </div>
              {i < STEPS_DISPLAY.length - 1 && (
                <div style={{
                  flex: 1, height: 2,
                  background: i < (step - 1) ? '#6366F1' : '#F3F4F6',
                  transition: 'background 300ms',
                  marginBottom: 28,
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <ProductInput
            session={session}
            initialProduct={urlProduct}
            initialNiche={urlNiche}
            initialPrice={urlPrice}
            onComplete={(input, bp) => {
              setBlueprint(bp);
              setSelectedStoreName(bp.storeNameOptions?.[0] || input.productName);
              setStep(2);
            }}
          />
        )}
        {step === 2 && blueprint && (
          <BlueprintPreview
            blueprint={blueprint}
            selectedStoreName={selectedStoreName}
            onSelectStoreName={setSelectedStoreName}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ShopifyConnect
            blueprint={blueprint}
            selectedStoreName={selectedStoreName}
            session={session}
            initialConnected={oauthConnected}
            onPushComplete={result => { setPushResult(result); setStep(4); }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && pushResult && (
          <PushSuccess result={pushResult} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
