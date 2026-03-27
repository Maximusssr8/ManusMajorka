/**
 * DateRangeSelector — pill-button date range picker for Majorka analytics pages
 */

export type Range = DateRange;
export type DateRange = 'all' | '7d' | '30d' | '90d';

const OPTIONS: { label: string; value: DateRange }[] = [
  { label: 'All Time', value: 'all' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

export function DateRangeSelector({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: value === o.value ? 600 : 400,
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
            transition: 'all 150ms',
            background: value === o.value ? '#EEF2FF' : 'white',
            color: value === o.value ? '#6366F1' : '#6B7280',
            border: `1px solid ${value === o.value ? '#C7D2FE' : '#E5E7EB'}`,
          }}
          onMouseEnter={(e) => {
            if (value !== o.value) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#C7D2FE';
              (e.currentTarget as HTMLButtonElement).style.color = '#6366F1';
            }
          }}
          onMouseLeave={(e) => {
            if (value !== o.value) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
              (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
            }
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function getDateRangeStart(range: DateRange): Date {
  const now = new Date();
  if (range === 'all') { now.setFullYear(2020); return now; }
  if (range === '7d') { now.setDate(now.getDate() - 7); return now; }
  if (range === '30d') { now.setDate(now.getDate() - 30); return now; }
  now.setDate(now.getDate() - 90);
  return now;
}
