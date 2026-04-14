import React from 'react';
import { SHIMMER_CSS } from './PageSkeleton';

interface TableRowSkeletonProps {
  columns?: number;
}

/**
 * TableRowSkeleton — single row of a table list while data is loading.
 */
export function TableRowSkeleton({ columns = 5 }: TableRowSkeletonProps): React.ReactElement {
  const cols: number[] = Array.from({ length: columns }, (_, i) => i);
  return (
    <tr role="status" aria-label="Loading row">
      <td colSpan={columns} style={{ padding: 0 }}>
        <style>{SHIMMER_CSS}</style>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 12,
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {cols.map((c) => (
            <div key={c} className="mkr-shimmer" style={{ height: 14, borderRadius: 4 }} />
          ))}
        </div>
      </td>
    </tr>
  );
}

export default TableRowSkeleton;
