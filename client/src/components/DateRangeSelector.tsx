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
          className={value === o.value ? 'filter-chip-active' : 'filter-chip-inactive'}
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
