import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProductInput from '@/components/store-builder/ProductInput';
import BlueprintPreview from '@/components/store-builder/BlueprintPreview';
import ShopifyConnect from '@/components/store-builder/ShopifyConnect';
import PushSuccess from '@/components/store-builder/PushSuccess';

const STEPS = ['Product', 'Blueprint', 'Connect', 'Success'] as const;
const gold = '#d4af37';
const syne = 'Syne, sans-serif';

export default function StoreBuilder() {
  const [step, setStep] = useState(1);
  const [blueprint, setBlueprint] = useState<Record<string, any> | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState('');
  const [pushResult, setPushResult] = useState<Record<string, any> | null>(null);
  // Track if we arrived here from Shopify OAuth callback (?connected=true)
  const [oauthConnected, setOauthConnected] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      // OAuth callback completed — advance to Connect step and signal ShopifyConnect to show connected state
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
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, color: gold, letterSpacing: '-0.02em' }}>
          🏪 Store Builder
        </span>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {STEPS.map((s, i) => {
            const n = i + 1;
            const isActive = step === n;
            const isDone = step > n;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? gold : isDone ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#080a0e' : isDone ? gold : '#52525b',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {isDone ? '✓' : n}
                </div>
                <span style={{ fontSize: 12, color: isActive ? gold : '#52525b', display: window.innerWidth < 480 ? 'none' : 'inline' }}>
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
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>
        {step === 1 && (
          <ProductInput
            session={session}
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
