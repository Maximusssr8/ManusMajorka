const gold = '#6366F1';
const syne = 'Syne, sans-serif';
const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12, padding: 20,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#52525b',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  marginBottom: 10, fontFamily: syne, display: 'block',
};

export default function BlueprintPreview({ blueprint, selectedStoreName, onSelectStoreName, onNext, onBack }: {
  blueprint: Record<string, any>;
  selectedStoreName: string;
  onSelectStoreName: (n: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { brief, storeNameOptions, themeRecommendation, appStack } = blueprint;
  return (
    <div>
      <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Your Blueprint</h2>
      <p style={{ color: '#71717a', marginBottom: 32, fontSize: 15 }}>Review your brand strategy. Select a store name and connect Shopify to go live.</p>

      {/* Store name picker */}
      <div style={{ marginBottom: 24 }}>
        <span style={labelStyle}>Store Name</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(storeNameOptions || [selectedStoreName]).map((n: string) => (
            <label key={n} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${selectedStoreName === n ? gold : 'rgba(255,255,255,0.08)'}`,
              background: selectedStoreName === n ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
            }}>
              <input type="radio" checked={selectedStoreName === n} onChange={() => onSelectStoreName(n)} style={{ accentColor: gold }} />
              <span style={{ fontWeight: 600, color: '#f0ede8' }}>{n}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Hero copy preview */}
      {brief && (
        <div style={{ ...card, marginBottom: 20 }}>
          <span style={labelStyle}>Brand Copy</span>
          <p style={{ fontFamily: syne, fontSize: 18, fontWeight: 700, color: '#f0ede8', marginBottom: 6 }}>{brief.heroHeadline}</p>
          <p style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 10, lineHeight: 1.6 }}>{brief.heroSubheadline}</p>
          <p style={{ color: '#71717a', fontSize: 13, fontStyle: 'italic' }}>"{brief.tagline}"</p>
        </div>
      )}

      {/* Colour swatches */}
      {brief?.colourPalette && (
        <div style={{ marginBottom: 20 }}>
          <span style={labelStyle}>Colour Palette</span>
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries(brief.colourPalette as Record<string, string>).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: v, border: '2px solid rgba(255,255,255,0.12)', boxShadow: `0 0 12px ${v}40` }} />
                <span style={{ fontSize: 10, color: '#52525b', fontFamily: "'DM Mono', monospace" }}>{v}</span>
                <span style={{ fontSize: 10, color: '#3f3f46' }}>{k}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme recommendation */}
      {themeRecommendation && (
        <div style={{ ...card, marginBottom: 20 }}>
          <span style={labelStyle}>Recommended Theme</span>
          <p style={{ fontWeight: 600, color: '#f0ede8', marginBottom: 4 }}>{themeRecommendation.name}</p>
          <p style={{ color: '#71717a', fontSize: 13, lineHeight: 1.55 }}>{themeRecommendation.reason}</p>
        </div>
      )}

      {/* App stack */}
      {appStack && (
        <div style={{ marginBottom: 32 }}>
          <span style={labelStyle}>Recommended Apps</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(appStack as Array<{ icon: string; name: string; reason: string }>).map(app => (
              <div key={app.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', ...card }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{app.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, color: '#f0ede8', marginBottom: 2, fontSize: 14 }}>{app.name}</p>
                  <p style={{ color: '#71717a', fontSize: 13, lineHeight: 1.5 }}>{app.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={{ flex: 1, padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', cursor: 'pointer', fontFamily: syne, fontWeight: 600 }}>
          ← Back
        </button>
        <button onClick={onNext} style={{ flex: 2, padding: 14, borderRadius: 8, border: 'none', background: gold, color: '#080a0e', cursor: 'pointer', fontFamily: syne, fontWeight: 700, fontSize: 15 }}>
          Connect Shopify & Push →
        </button>
      </div>
    </div>
  );
}
