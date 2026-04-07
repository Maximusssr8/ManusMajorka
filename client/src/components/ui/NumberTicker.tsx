import { useCountUp } from '../../hooks/useCountUp';

export function NumberTicker({
  value,
  duration = 1200,
  prefix = '',
  suffix = '',
  decimals = 0,
  delay = 0,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
}) {
  const current = useCountUp(value, duration, delay);
  const formatted = current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
