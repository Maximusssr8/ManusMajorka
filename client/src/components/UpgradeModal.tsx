import { X, Zap, Check } from 'lucide-react';
import { Link } from 'wouter';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  reason?: string;
  scaleOnly?: boolean;
}

export default function UpgradeModal({ isOpen, onClose, feature, reason, scaleOnly }: UpgradeModalProps) {
  if (!isOpen) return null;

  const SCALE_FEATURES = [
    'Unlimited product & market searches',
    'Unlimited Competitor Shop Spy',
    'Unlimited Ads Studio generations',
    'Niche Signal Tracking',
    'API Access',
    'Priority Support',
    'Unlimited Store Builder',
    'Unlimited Alerts',
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#0d0d10', borderRadius: 20, padding: 32,
        maxWidth: 480, width: '100%', position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8,
          width: 32, height: 32, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={16} color="#6B7280" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {scaleOnly ? 'Scale Plan Required' : 'Limit Reached'}
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              {reason || (feature ? `You've hit the limit for ${feature}` : 'Upgrade to continue')}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 10 }}>Scale includes everything:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SCALE_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} color="#3B82F6" />
                <span style={{ fontSize: 13, color: '#CBD5E1' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <Link href="/sign-up?plan=scale" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 48, borderRadius: 12, fontWeight: 700, fontSize: 15,
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          color: 'white', textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
        }}>
          Upgrade to Scale — $199/month
        </Link>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#9CA3AF' }}>
          14-day money back guarantee
        </div>
      </div>
    </div>
  );
}
