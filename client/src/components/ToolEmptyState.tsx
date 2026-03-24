/**
 * ToolEmptyState — shown when a tool page has no results yet.
 * Provides a helpful prompt with an example to get started.
 */

import { Sparkles } from 'lucide-react';
import { createElement } from 'react';

interface ToolEmptyStateProps {
  toolName: string;
  toolDescription: string;
  toolIcon: any;
  examplePrompt: string;
  onTryExample: () => void;
}

export default function ToolEmptyState({
  toolName,
  toolDescription,
  toolIcon,
  examplePrompt,
  onTryExample,
}: ToolEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      {/* Icon with pulse */}
      <div className="relative mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          {createElement(toolIcon, { size: 28, style: { color: '#6366F1' } })}
        </div>
        <div
          className="absolute inset-0 rounded-2xl animate-ping"
          style={{
            background: 'rgba(99,102,241,0.06)',
            animationDuration: '3s',
            animationIterationCount: 'infinite',
          }}
        />
      </div>

      {/* Text */}
      <h3
        className="text-lg font-bold mb-2"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A' }}
      >
        Ready when you are
      </h3>
      <p className="text-sm mb-6 max-w-sm" style={{ color: '#6B7280', lineHeight: 1.6 }}>
        {toolDescription}
      </p>

      {/* Example prompt chip */}
      <button
        onClick={onTryExample}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
        style={{
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.15)',
          cursor: 'pointer',
          color: '#0A0A0A',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
          e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
          e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
        }}
      >
        <Sparkles size={13} style={{ color: '#6366F1', flexShrink: 0 }} />
        <span className="text-sm">
          Try this: <span style={{ color: '#6366F1' }}>&ldquo;{examplePrompt}&rdquo;</span>
        </span>
      </button>
    </div>
  );
}
