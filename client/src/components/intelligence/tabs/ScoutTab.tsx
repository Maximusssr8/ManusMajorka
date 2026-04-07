import React from 'react';

export function ScoutTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center" style={{ background: '#080808' }}>
      <div className="text-5xl mb-2">🔭</div>
      <h3 className="text-xl font-semibold text-white/80" style={{fontFamily:'var(--font-display)'}}>Scout</h3>
      <p className="text-sm text-white/40 max-w-xs">AI-powered product scouting is in development.</p>
      <span className="mt-4 px-3 py-1 text-xs rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">Coming Soon</span>
    </div>
  );
}
