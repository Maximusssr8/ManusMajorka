import { BarChart3 } from 'lucide-react';

export interface CaseStudyProps {
  title: string;
  description: string;
  metric: string;
  insight: string;
}

/**
 * Dark card with cobalt left-border accent. Used to highlight real-world
 * dropshipping case studies inside Academy lessons.
 */
export function CaseStudy({ title, description, metric, insight }: CaseStudyProps) {
  return (
    <div
      className="my-6 overflow-hidden rounded-2xl border-l-4"
      style={{
        borderLeftColor: '#4f8ef7',
        borderTop: '1px solid rgba(79,142,247,0.08)',
        borderRight: '1px solid rgba(79,142,247,0.08)',
        borderBottom: '1px solid rgba(79,142,247,0.08)',
        background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
      }}
    >
      <div className="p-5 sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7]">
          <BarChart3 size={12} />
          Case study
        </div>
        <h4
          className="mb-1.5 text-base font-semibold text-[#E0E0E0]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {title}
        </h4>
        <p className="mb-4 text-sm leading-relaxed text-[#9CA3AF]">{description}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <div className="flex-1">
            <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
              Key metric
            </div>
            <div
              className="text-lg font-bold tabular-nums text-[#E0E0E0]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {metric}
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
              Insight
            </div>
            <p className="text-sm leading-relaxed text-[#9CA3AF]">{insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
