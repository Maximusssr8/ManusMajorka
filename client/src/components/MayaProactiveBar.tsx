/**
 * MayaProactiveBar — Context-aware suggestion bar that floats above the mobile tab bar
 * or at the bottom of tool pages on desktop. Shows Maya's proactive suggestions.
 */
import { useState } from 'react';
import { useLocation } from 'wouter';

const PAGE_SUGGESTIONS: Record<string, { text: string; tool: string; params?: any }[]> = {
  '/app/winning-products': [
    { text: 'Find suppliers for top product', tool: 'suppliers', params: { query: '' } },
    { text: 'Build a store for this product', tool: 'website-generator' },
    { text: 'Calculate profit margin', tool: 'profit-calculator' },
  ],
  '/app/suppliers': [
    { text: 'Check if this product is saturated', tool: 'saturation-checker' },
    { text: 'Build a store for this product', tool: 'website-generator' },
  ],
  '/app/saturation-checker': [
    { text: 'Find suppliers for this product', tool: 'suppliers' },
    { text: 'See winning products in this niche', tool: 'winning-products' },
  ],
  '/app/website-generator': [
    { text: 'Find suppliers for this product', tool: 'suppliers' },
    { text: 'Calculate your profit margin', tool: 'profit-calculator' },
  ],
  '/app/profit-calculator': [
    { text: 'Find suppliers for this product', tool: 'suppliers' },
    { text: 'Check market saturation', tool: 'saturation-checker' },
  ],
};

export default function MayaProactiveBar() {
  const [location, setLocation] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const suggestions = PAGE_SUGGESTIONS[location];
  if (!suggestions || dismissed) return null;

  const handleSuggestion = (tool: string, params?: any) => {
    if (params) {
      sessionStorage.setItem(`maya_prefill_${tool}`, JSON.stringify(params));
    }
    setLocation(`/app/${tool}`);
  };

  const handleAskMaya = () => {
    setLocation('/app/ai-chat');
  };

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(8,10,14,0.95)',
        borderTop: '1px solid rgba(59,130,246,0.2)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '10px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* Maya label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 800,
              color: '#FAFAFA',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              flexShrink: 0,
            }}
          >
            M
          </div>
          <span
            style={{
              fontSize: 11,
              color: 'rgba(59,130,246,0.7)',
              fontWeight: 700,
              fontFamily: "'Bricolage Grotesque', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            💡 Maya suggests:
          </span>
        </div>

        {/* Suggestion chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(s.tool, s.params)}
              style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: 12,
                color: '#3B82F6',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.16)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
              }}
            >
              {s.text} →
            </button>
          ))}

          {/* Ask Maya button */}
          <button
            onClick={handleAskMaya}
            style={{
              background: 'transparent',
              border: '1px solid #F0F0F0',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 12,
              color: '#9CA3AF',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9CA3AF';
              e.currentTarget.style.borderColor = '#F0F0F0';
            }}
          >
            Ask Maya anything
          </button>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#D1D5DB',
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 4px',
            flexShrink: 0,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#6B7280')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#D1D5DB')}
          title="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
