import { ChevronRight } from 'lucide-react';
import React, { createElement } from 'react';
import { useLocation } from 'wouter';
import type { StageGroup } from '@/lib/tools';

interface Props {
  stage: StageGroup;
}

export default function StageLanding({ stage }: Props) {
  const [, setLocation] = useLocation();

  return (
    <div
      className="h-full overflow-auto"
      style={{
        background: '#FAFAFA',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.1) transparent',
      }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stage header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: `${stage.color}90`, fontFamily: 'Syne, sans-serif' }}
            >
              Stage
            </span>
          </div>
          <h1
            className="text-2xl font-black mb-2"
            style={{
              fontFamily: 'Syne, sans-serif',
              color: '#f0ede8',
              letterSpacing: '-0.02em',
            }}
          >
            {stage.stage}
          </h1>
          <p className="text-sm" style={{ color: 'rgba(240,237,232,0.45)' }}>
            {stage.tools.length} tools available in this stage. Pick one to get started.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stage.tools.map((tool) => (
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
                el.style.borderColor = `${stage.color}40`;
                el.style.background = `${stage.color}08`;
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
                  style={{ background: `${stage.color}18`, color: stage.color }}
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
                  style={{ color: stage.color }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
