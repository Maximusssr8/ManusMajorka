import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface NumberTickerProps {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function NumberTicker({
  end,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.5,
  className,
}: NumberTickerProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <span ref={ref} className={className}>
      {inView ? (
        <CountUp
          end={end}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          duration={duration}
          useEasing
        />
      ) : (
        `${prefix}0${suffix}`
      )}
    </span>
  );
}
