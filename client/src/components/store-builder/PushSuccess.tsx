import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const gold = '#d4af37';
const syne = "'Syne', sans-serif";

const STEP_LABELS = [
  { key: 'product', label: 'Product Created' },
  { key: 'theme',   label: 'Theme Updated' },
  { key: 'pages',   label: 'Pages Created' },
];

export default function PushSuccess({ result, onReset }: {
  result: Record<string, any>;
  onReset: () => void;
}) {
  const allSuccess = result?.success;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{allSuccess ? '🎉' : '⚠️'}</div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
        {allSuccess ? 'Store Launched!' : 'Partially Pushed'}
      </h2>
      <p style={{ color: '#94A3B8', marginBottom: 32, fontSize: 15 }}>
        {allSuccess ? 'Your blueprint has been pushed to Shopify successfully.' : 'Some steps completed. Check below for details.'}
      </p>

      {/* Step status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, textAlign: 'left' }}>
        {STEP_LABELS.map(s => {
          const ok = result?.steps?.[s.key]?.success;
          const err = result?.steps?.[s.key]?.error;
          return (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: ok ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${ok ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`,
              borderRadius: 10,
            }}>
              {ok
                ? <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                : <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />}
              <span style={{ fontWeight: 600, color: '#CBD5E1', fontSize: 14, flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 12, color: ok ? '#22c55e' : '#ef4444' }}>
                {ok ? '✓ Done' : err ? `✗ ${String(err).slice(0, 40)}` : '✗ Failed'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
        {result?.productUrl && (
          <a href={result.productUrl} target="_blank" rel="noopener noreferrer" style={{
            padding: '12px 18px', borderRadius: 8,
            border: `1px solid ${gold}`, color: gold, textDecoration: 'none',
            fontFamily: syne, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
          }}>
            <ExternalLink size={14} /> Shopify Admin
          </a>
        )}
        {result?.storeUrl && (
          <a href={result.storeUrl} target="_blank" rel="noopener noreferrer" style={{
            padding: '12px 18px', borderRadius: 8,
            border: 'none', background: gold, color: '#FAFAFA', textDecoration: 'none',
            fontFamily: syne, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
          }}>
            <ExternalLink size={14} /> Open Store
          </a>
        )}
      </div>

      <button onClick={onReset} style={{
        padding: '12px 24px', borderRadius: 8, border: '1px solid #F0F0F0',
        background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontFamily: syne, fontWeight: 600,
      }}>
        Build Another Store
      </button>
    </div>
  );
}
