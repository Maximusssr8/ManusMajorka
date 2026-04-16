import React from 'react';

export function ScoutTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center" style={{ background: '#04060f' }}>
      <div className="text-5xl mb-2">🔭</div>
      <h3 className="text-xl font-semibold text-white/80" style={{fontFamily:'var(--font-display)'}}>Scout</h3>
      <p className="text-sm text-white/40 max-w-xs">AI-powered product scouting is in development.</p>
      <span className="mt-4 px-3 py-1 text-xs rounded-full bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 text-[#6ba3ff]">Coming Soon</span>
    </div>
  );
}
