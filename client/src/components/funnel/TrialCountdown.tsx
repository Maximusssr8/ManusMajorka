import { useState, type ReactElement } from 'react';
import { useLocation } from 'wouter';
import { Clock, Zap } from 'lucide-react';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';

const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

/**
 * TrialCountdown — pill in the top nav showing days/hours left on a trial.
 * Only rendered when status === 'trialing'. Click opens an upgrade modal.
 */
export function TrialCountdown(): ReactElement | null {
  const { status, daysRemaining, hoursRemaining } = useSubscriptionTier();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [, navigate] = useLocation();

  if (status !== 'trialing') return null;
  if (daysRemaining === null) return null;

  const isUrgent = daysRemaining <= 2;
  const color = isUrgent ? '#ef4444' : '#4f8ef7';
  const bg = isUrgent ? 'rgba(239,68,68,0.08)' : 'rgba(79,142,247,0.08)';
  const border = isUrgent ? 'rgba(239,68,68,0.3)' : 'rgba(79,142,247,0.3)';

  const labelFull = `${daysRemaining}d ${hoursRemaining ?? 0}h left`;
  const labelShort = `${daysRemaining}d`;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label={`Trial countdown: ${labelFull}. Click to upgrade.`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 28,
          minHeight: 28,
          padding: '0 10px',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 999,
          color,
          fontFamily: mono,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <Clock size={11} strokeWidth={2.5} />
        <span className="mkr-trial-full">{labelFull}</span>
        <span className="mkr-trial-short" style={{ display: 'none' }}>{labelShort}</span>
        <style>{`
          @media (max-width: 640px) {
            .mkr-trial-full { display: none !important; }
            .mkr-trial-short { display: inline !important; }
          }
        `}</style>
      </button>
      {modalOpen && <UpgradeModal onClose={() => setModalOpen(false)} onUpgrade={() => navigate('/pricing')} daysRemaining={daysRemaining} />}
    </>
  );
}

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => void;
  daysRemaining: number;
}

function UpgradeModal({ onClose, onUpgrade, daysRemaining }: UpgradeModalProps): ReactElement {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade from trial"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#111114',
          border: '1px solid rgba(79,142,247,0.3)',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 0 60px rgba(79,142,247,0.15)',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Zap size={18} strokeWidth={2.5} style={{ color: '#4f8ef7' }} />
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4f8ef7' }}>
            Trial \u2014 {daysRemaining} days left
          </span>
        </div>
        <h3 style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: '#ededed',
          letterSpacing: '-0.02em',
          margin: '0 0 12px',
        }}>Lock in your plan before the trial ends.</h3>
        <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 20px', lineHeight: 1.55 }}>
          When your trial expires, your product alerts pause, AI briefs stop, and Maya goes quiet. Pick a plan now \u2014 cancel any time.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onUpgrade}
            style={{
              flex: 1,
              height: 44,
              background: 'linear-gradient(135deg, #4f8ef7 0%, #f4d77a 50%, #4f8ef7 100%)',
              color: '#0d1117',
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            View plans &rarr;
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 44,
              padding: '0 16px',
              background: 'transparent',
              color: '#a1a1aa',
              fontWeight: 500,
              fontSize: 14,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
