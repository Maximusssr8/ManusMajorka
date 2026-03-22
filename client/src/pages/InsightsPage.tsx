import { ChevronRight, Lightbulb } from 'lucide-react';
import React, { createElement } from 'react';
import { useLocation } from 'wouter';
import { allTools } from '@/lib/tools';

/** Curated insight-related tool IDs with section grouping */
const INSIGHT_SECTIONS = [
  {
    title: 'Analytics & Performance',
    color: '#8b5cf6',
    toolIds: ['analytics-decoder', 'cro-advisor', 'store-auditor'],
  },
  {
    title: 'Financial Insights',
    color: '#f59e0b',
    toolIds: ['financial-modeler', 'unit-economics', 'profit-maximizer', 'pricing-optimizer'],
  },
  {
    title: 'Market Intelligence',
    color: '#3b82f6',
    toolIds: ['market-intel', 'competitor-breakdown', 'trend-radar', 'market-map', 'niche-scorer'],
  },
  {
    title: 'Growth & Strategy',
    color: '#ec4899',
    toolIds: ['scaling-playbook', 'expansion-planner', 'ad-optimizer', 'retention-engine'],
  },
];

export default function InsightsPage() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="h-full overflow-auto"
      style={{
        background: '#0a0b0d',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.1) transparent',
      }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}
            >
              <Lightbulb size={16} />
            </div>
            <div>
              <h1
                className="text-2xl font-black"
                style={{
                  fontFamily: 'Syne, sans-serif',
                  color: '#f0ede8',
                  letterSpacing: '-0.02em',
                }}
              >
                Insights
              </h1>
            </div>
          </div>
          <p className="text-sm mt-2" style={{ color: 'rgba(240,237,232,0.45)' }}>
            Analyse your business, decode your data, and uncover growth opportunities with these
            tools.
          </p>
        </div>

        {/* Sections */}
        {INSIGHT_SECTIONS.map((section) => {
          const tools = section.toolIds
            .map((id) => allTools.find((t) => t.id === id))
            .filter(Boolean);

          if (tools.length === 0) return null;

          return (
            <div key={section.title} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: section.color }} />
                <h2
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ fontFamily: 'Syne, sans-serif', color: section.color }}
                >
                  {section.title}
                </h2>
                <span className="text-xs" style={{ color: 'rgba(240,237,232,0.25)' }}>
                  {tools.length} tools
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tools.map((tool) => {
                  if (!tool) return null;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setLocation(tool.path)}
                      className="text-left rounded-xl p-4 transition-all duration-150 group"
                      style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.borderColor = `${section.color}40`;
                        el.style.background = `${section.color}08`;
                        el.style.transform = 'translateY(-2px)';
                        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.borderColor = 'rgba(255,255,255,0.07)';
                        el.style.background = 'rgba(255,255,255,0.025)';
                        el.style.transform = 'none';
                        el.style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `${section.color}18`,
                            color: section.color,
                          }}
                        >
                          {createElement(tool.icon, { size: 16 })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-bold mb-1"
                            style={{
                              fontFamily: 'Syne, sans-serif',
                              color: '#f0ede8',
                            }}
                          >
                            {tool.label}
                          </div>
                          <div
                            className="text-xs leading-relaxed"
                            style={{ color: 'rgba(240,237,232,0.45)' }}
                          >
                            {tool.description}
                          </div>
                        </div>
                        <ChevronRight
                          size={14}
                          className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity"
                          style={{ color: section.color }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
