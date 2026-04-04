import React from 'react';

export function ScoutTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ background: '#080808' }}>
      <div className="text-4xl">🔍</div>
      <h3 className="text-lg font-medium text-white">AI Scout — Coming Soon</h3>
      <p className="text-sm text-center max-w-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
        AI-powered product discovery launching soon. Use the Database tab to browse curated winning products.
      </p>
    </div>
  );
}
