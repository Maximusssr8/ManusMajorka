import { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

const gold = '#d4af37';
const syne = 'Syne, sans-serif';

export default function ShopifyConnect({ blueprint, selectedStoreName, session, onPushComplete, onBack }: {
  blueprint: Record<string, any> | null;
  selectedStoreName: string;
  session: any;
  onPushComplete: (result: Record<string, any>) => void;
  onBack: () => void;
}) {
  const [shopDomain, setShopDomain] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState('');
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/shopify/status', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then((d: any) => { if (d.connected) { setConnected(true); setConnectedShop(d.shop); } })
      .catch(() => {});
  }, [session]);

  const handleConnect = () => {
    const domain = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!domain.endsWith('.myshopify.com')) { setError('Enter a valid .myshopify.com domain'); return; }
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`;
  };

  const handleDisconnect = async () => {
    await fetch('/api/shopify/disconnect', { method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
    setConnected(false); setConnectedShop('');
  };

  const handlePush = async () => {
    setPushing(true); setError('');
    try {
      const res = await fetch('/api/shopify/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ brief: blueprint?.brief, selectedStoreName }),
      });
      if (!res.ok) throw new Error(((await res.json()) as any).error || 'Push failed');
      onPushComplete(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPushing(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Connect Your Store</h2>
      <p style={{ color: '#71717a', marginBottom: 32, fontSize: 15 }}>Connect your Shopify store to push the blueprint live in one click.</p>

      {connected ? (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: '#f0ede8', fontSize: 14 }}>Connected to {connectedShop}</span>
          </div>
          <button onClick={handleDisconnect} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
            Disconnect
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Shopify Store Domain</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={shopDomain}
              onChange={e => setShopDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="mystore.myshopify.com"
              style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f0ede8', fontSize: 14, outline: 'none', minHeight: 44 }}
              onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button onClick={handleConnect} style={{ padding: '12px 18px', borderRadius: 8, border: 'none', background: gold, color: '#080a0e', cursor: 'pointer', fontFamily: syne, fontWeight: 700, whiteSpace: 'nowrap', minHeight: 44 }}>
              Connect →
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#52525b', marginTop: 6 }}>You'll be redirected to Shopify to authorise access, then returned here.</p>
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={{ flex: 1, padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', cursor: 'pointer', fontFamily: syne, fontWeight: 600 }}>
          ← Back
        </button>
        <button onClick={handlePush} disabled={!connected || pushing} style={{
          flex: 2, padding: 14, borderRadius: 8, border: 'none',
          background: connected ? gold : 'rgba(212,175,55,0.15)',
          color: connected ? '#080a0e' : '#52525b',
          cursor: connected && !pushing ? 'pointer' : 'not-allowed',
          fontFamily: syne, fontWeight: 700, fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {pushing ? <><Loader2 size={16} className="animate-spin" /> Pushing to Shopify...</> : 'Push to Store →'}
        </button>
      </div>
    </div>
  );
}
