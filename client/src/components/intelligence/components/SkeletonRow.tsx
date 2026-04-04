import React from 'react';

export function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td className="px-4 py-3.5"><div className="w-6 h-3 rounded animate-pulse mx-auto" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg animate-pulse flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-3 rounded animate-pulse w-1/2" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
      </td>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-3 rounded animate-pulse mt-1.5 w-2/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </td>
      ))}
      <td className="px-4 py-3.5">
        <div className="flex gap-1.5">
          <div className="h-8 flex-1 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-8 w-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-8 w-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </td>
    </tr>
  );
}
