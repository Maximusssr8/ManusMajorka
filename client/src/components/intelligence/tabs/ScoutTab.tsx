import React from 'react';

export function ScoutTab() {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto', background: '#080808', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔭</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', marginBottom: 8, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        Scout — Coming Soon
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 24 }}>
        AI-powered product scouting based on your niche, margin targets, and competitor gaps. Available on Scale Plan.
      </div>
      <button style={{
        padding: '10px 24px', borderRadius: 8,
        background: 'rgba(99,102,241,0.12)', color: '#818CF8',
        border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
        fontSize: 14, fontWeight: 500, fontFamily: "'Inter', -apple-system, sans-serif",
        transition: 'all 150ms'
      }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
        }}
      >
        Notify me when available
      </button>
    </div>
  );
}
