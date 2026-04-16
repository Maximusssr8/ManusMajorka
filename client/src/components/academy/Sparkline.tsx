import { motion, useInView } from 'framer-motion';
import { useMemo, useRef } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  duration?: number;
}

export function Sparkline({
  data,
  width = 280,
  height = 64,
  stroke = '#4f8ef7',
  fill = 'rgba(79,142,247,0.12)',
  duration = 1.6,
}: SparklineProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  const { linePath, areaPath } = useMemo(() => {
    if (data.length === 0) return { linePath: '', areaPath: '' };
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const dx = data.length > 1 ? width / (data.length - 1) : 0;
    const points = data.map((v, i) => {
      const x = i * dx;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const line = `M ${points.join(' L ')}`;
    const area = `${line} L ${width},${height} L 0,${height} Z`;
    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  return (
    <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <motion.path
        d={areaPath}
        fill={fill}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: duration * 0.7, delay: duration * 0.3 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
