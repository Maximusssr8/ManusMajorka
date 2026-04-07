import { Eye } from 'lucide-react';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

export default function AppSpy() {
  return (
    <div style={{
      padding: '80px 32px',
      maxWidth: 720,
      margin: '0 auto',
      textAlign: 'center',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 14,
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6366F1',
        margin: '0 auto 24px',
      }}>
        <Eye size={28} />
      </div>
      <div style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: '#6366F1',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>Scale plan only</div>
      <h1 style={{
        fontFamily: display,
        fontWeight: 700,
        fontSize: 36,
        color: '#ededed',
        letterSpacing: '-0.03em',
        margin: '0 0 16px',
      }}>Competitor Spy — Coming Soon</h1>
      <p style={{
        fontFamily: sans,
        fontSize: 16,
        color: '#71717a',
        lineHeight: 1.6,
        margin: 0,
        maxWidth: 520,
        marginInline: 'auto',
      }}>
        Enter any Shopify domain and get the full playbook — estimated revenue, top SKUs, ad spend signals, tech stack, and price-change history.
      </p>
    </div>
  );
}
