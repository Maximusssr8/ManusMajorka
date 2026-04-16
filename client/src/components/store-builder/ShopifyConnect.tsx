import { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { markOnboardingStep } from '@/lib/onboarding';

const gold = '#4f8ef7';
const syne = "'Syne', sans-serif";

export default function ShopifyConnect({
  blueprint,
  selectedStoreName,
  session,
  initialConnected = false,
  onPushComplete,
  onBack,
}: {
  blueprint: Record<string, any> | null;
  selectedStoreName: string;
  session: any;
  initialConnected?: boolean;
  onPushComplete: (result: Record<string, any>) => void;
  onBack: () => void;
}) {
  const [shopDomain, setShopDomain] = useState('');
  const [connected, setConnected] = useState(initialConnected);
  const [connectedShop, setConnectedShop] = useState('');
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState('');

  // On mount: if we arrived from OAuth callback OR have a session, check connection status
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/shopify/status', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then((d: any) => {
        if (d.connected) {
          setConnected(true);
          setConnectedShop(d.shop || '');
          markOnboardingStep('connected_shopify', session?.user?.id).catch(() => {});
        } else if (initialConnected) {
          // OAuth just completed but status API not updated yet — keep showing connected
          setConnected(true);
        }
      })
      .catch(() => {
        // Status check failed — if we came from OAuth, trust the param
        if (initialConnected) setConnected(true);
      });
  }, [session, initialConnected]);

  const handleConnect = () => {
    const domain = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!domain.endsWith('.myshopify.com')) {
      setError('Enter a valid .myshopify.com domain');
      return;
    }
    setError('');
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`;
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/shopify/disconnect', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
    } catch {}
    setConnected(false);
    setConnectedShop('');
  };

  const handlePush = async () => {
    setPushing(true);
    setError('');
    try {
      const res = await fetch('/api/store-builder/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ brief: blueprint?.brief, selectedStoreName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as any).error || 'Push failed');
      markOnboardingStep('pushed_to_shopify', session?.user?.id).catch(() => {});
      toast.success('Pushed to Shopify! 🚀');
      onPushComplete(data);
    } catch (e: any) {
      const msg = e.message?.includes('No Shopify connection')
        ? 'Please connect your Shopify store first.'
        : e.message?.includes('Unauthorized')
          ? 'Session expired — please sign in again.'
          : e.message || "Couldn't push to Shopify — try again. If this keeps happening, email support@majorka.io.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPushing(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
        Connect Your Store
      </h2>
      <p style={{ color: '#94A3B8', marginBottom: 32, fontSize: 15 }}>
        Connect your Shopify store to push the blueprint live in one click.
      </p>

      {connected ? (
        <div style={{
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.18)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: '#CBD5E1', fontSize: 14 }}>
              {connectedShop ? `Connected to ${connectedShop}` : 'Shopify store connected ✓'}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
            Shopify Store Domain
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={shopDomain}
              onChange={e => setShopDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="mystore.myshopify.com"
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 8,
                border: '1px solid #F0F0F0',
                background: 'rgba(255,255,255,0.03)', color: '#CBD5E1',
                fontSize: 14, outline: 'none', minHeight: 44,
              }}
              onFocus={e => (e.target.style.borderColor = gold)}
              onBlur={e => (e.target.style.borderColor = '#F0F0F0')}
            />
            <button
              onClick={handleConnect}
              style={{
                padding: '12px 18px', borderRadius: 8, border: 'none',
                background: gold, color: '#FAFAFA', cursor: 'pointer',
                fontFamily: syne, fontWeight: 700, whiteSpace: 'nowrap', minHeight: 44,
              }}
            >
              Connect →
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
            You'll be redirected to Shopify to authorise access, then returned here.
          </p>
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1, padding: 14, borderRadius: 8,
            border: '1px solid #F0F0F0',
            background: 'transparent', color: '#94A3B8',
            cursor: 'pointer', fontFamily: syne, fontWeight: 600,
          }}
        >
          ← Back
        </button>
        <button
          onClick={handlePush}
          disabled={!connected || pushing}
          style={{
            flex: 2, padding: 14, borderRadius: 8, border: 'none',
            background: connected ? gold : 'rgba(79,142,247,0.15)',
            color: connected ? '#FAFAFA' : '#9CA3AF',
            cursor: connected && !pushing ? 'pointer' : 'not-allowed',
            fontFamily: syne, fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            minHeight: 50,
          }}
        >
          {pushing
            ? <><Loader2 size={16} className="animate-spin" /> Pushing to Shopify...</>
            : 'Push to Store →'}
        </button>
      </div>
    </div>
  );
}
