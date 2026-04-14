import React from 'react';

export interface WizardStep {
  id: string;
  label: string;
  hint?: string;
}

interface StepIndicatorProps {
  steps: WizardStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}

/**
 * Deerflow/Minea-style bold step indicator.
 * Horizontal progress with numbered circles, active glow, and click-to-jump
 * for already-completed steps. Uses Majorka design tokens.
 */
export default function StepIndicator({ steps, currentIndex, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const active = i === currentIndex;
          const done = i < currentIndex;
          const clickable = (done || active) && Boolean(onStepClick);
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => clickable && onStepClick?.(i)}
                disabled={!clickable}
                className={`group flex items-center gap-3 min-w-0 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={[
                    'flex items-center justify-center rounded-full transition-all duration-200',
                    'w-9 h-9 text-sm font-bold',
                    active
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_0_0_4px_rgba(99,102,241,0.2),0_8px_24px_-4px_rgba(99,102,241,0.6)]'
                      : done
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-white/[0.04] text-white/40 border border-white/[0.08]',
                  ].join(' ')}
                  style={{ fontFamily: "'Nohemi', 'Bricolage Grotesque', sans-serif" }}
                >
                  {done ? '✓' : i + 1}
                </span>
                <div className="hidden md:flex flex-col text-left min-w-0">
                  <span
                    className={`text-xs uppercase tracking-wider ${active ? 'text-indigo-300' : done ? 'text-white/60' : 'text-white/30'}`}
                    style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em' }}
                  >
                    Step {i + 1}
                  </span>
                  <span
                    className={`text-sm font-semibold truncate ${active || done ? 'text-white' : 'text-white/40'}`}
                    style={{ fontFamily: "'Nohemi', 'Bricolage Grotesque', sans-serif" }}
                  >
                    {step.label}
                  </span>
                </div>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] rounded-full transition-all duration-300 ${
                    done ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-white/[0.06]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
