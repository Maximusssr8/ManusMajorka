import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({ value, max, size = 140, stroke = 10, label, sublabel }: ProgressRingProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const inView = useInView(ref, { once: true });
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(79,142,247,0.1)"
            strokeWidth={stroke}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#4f8ef7"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={inView ? { strokeDashoffset: circ * (1 - pct) } : { strokeDashoffset: circ }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-semibold tabular-nums text-[#E0E0E0]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {value}
            <span className="text-[#9CA3AF] text-xl">/{max}</span>
          </span>
          {sublabel ? <span className="mt-1 text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF]">{sublabel}</span> : null}
        </div>
      </div>
      {label ? <div className="mt-3 text-sm text-[#9CA3AF]">{label}</div> : null}
    </div>
  );
}
