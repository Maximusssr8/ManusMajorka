/**
 * RelatedTools — suggests 3 related tools at the bottom of each tool page.
 */

import { createElement } from 'react';
import { useLocation } from 'wouter';
import { stages, type ToolDef } from '@/lib/tools';

// Map of tool ID to related tool IDs
const RELATED_TOOLS_MAP: Record<string, string[]> = {
  'product-discovery': ['trend-radar', 'niche-scorer', 'competitor-breakdown'],
  'competitor-breakdown': ['market-map', 'product-discovery', 'niche-scorer'],
  'trend-radar': ['product-discovery', 'supplier-finder', 'niche-scorer'],
  'market-map': ['competitor-breakdown', 'niche-scorer', 'audience-profiler'],
  'niche-scorer': ['product-discovery', 'unit-economics', 'trend-radar'],
  'supplier-finder': ['supplier-risk', 'unit-economics', 'product-discovery'],
  'keyword-miner': ['seo-optimizer', 'product-discovery', 'competitor-breakdown'],
  'unit-economics': ['pricing-optimizer', 'financial-modeler', 'niche-scorer'],
  'supplier-risk': ['supplier-finder', 'unit-economics', 'validation-plan'],
  'validation-plan': ['demand-tester', 'unit-economics', 'product-discovery'],
  'demand-tester': ['validation-plan', 'meta-ads', 'unit-economics'],
  'pricing-optimizer': ['unit-economics', 'financial-modeler', 'competitor-breakdown'],
  'audience-profiler': ['meta-ads', 'copywriter', 'brand-dna'],
  'website-generator': ['brand-dna', 'copywriter', 'seo-optimizer'],
  'creative-studio': ['ads-studio', 'meta-ads', 'brand-dna'],
  'brand-dna': ['website-generator', 'copywriter', 'creative-studio'],
  copywriter: ['brand-dna', 'email-sequences', 'meta-ads'],
  'email-sequences': ['copywriter', 'retention-engine', 'automation-builder'],
  'store-auditor': ['cro-advisor', 'seo-optimizer', 'analytics-decoder'],
  'collection-builder': ['website-generator', 'brand-dna', 'pricing-optimizer'],
  'seo-optimizer': ['keyword-miner', 'copywriter', 'website-generator'],
  'meta-ads': ['ads-studio', 'tiktok-ads', 'audience-profiler'],
  'ads-studio': ['meta-ads', 'creative-studio', 'tiktok-ads'],
  'tiktok-ads': ['ads-studio', 'meta-ads', 'influencer-brief'],
  'google-ads': ['keyword-miner', 'meta-ads', 'seo-optimizer'],
  'launch-checklist': ['meta-ads', 'email-sequences', 'website-generator'],
  'influencer-brief': ['tiktok-ads', 'creative-studio', 'brand-dna'],
  'market-intel': ['competitor-breakdown', 'trend-radar', 'analytics-decoder'],
  'analytics-decoder': ['cro-advisor', 'ad-optimizer', 'market-intel'],
  'cro-advisor': ['store-auditor', 'analytics-decoder', 'pricing-optimizer'],
  'retention-engine': ['email-sequences', 'automation-builder', 'cro-advisor'],
  'ad-optimizer': ['meta-ads', 'analytics-decoder', 'ads-studio'],
  'profit-maximizer': ['unit-economics', 'pricing-optimizer', 'financial-modeler'],
  'ai-chat': ['product-discovery', 'scaling-playbook', 'financial-modeler'],
  'project-manager': ['launch-checklist', 'scaling-playbook', 'automation-builder'],
  'scaling-playbook': ['financial-modeler', 'expansion-planner', 'ad-optimizer'],
  'automation-builder': ['email-sequences', 'project-manager', 'retention-engine'],
  'expansion-planner': ['scaling-playbook', 'market-map', 'financial-modeler'],
  'financial-modeler': ['unit-economics', 'profit-maximizer', 'scaling-playbook'],
};

function getRelatedTools(toolId: string): ToolDef[] {
  const allTools = stages.flatMap((s) => s.tools);
  const relatedIds = RELATED_TOOLS_MAP[toolId] || [];
  if (relatedIds.length === 0) {
    // Fallback: pick 3 random tools from different stages
    return allTools.filter((t) => t.id !== toolId).slice(0, 3);
  }
  return relatedIds.map((id) => allTools.find((t) => t.id === id)).filter(Boolean) as ToolDef[];
}

function getStageColor(toolId: string): string {
  for (const s of stages) {
    if (s.tools.some((t) => t.id === toolId)) return s.color;
  }
  return '#d4af37';
}

interface RelatedToolsProps {
  currentToolId: string;
}

export default function RelatedTools({ currentToolId }: RelatedToolsProps) {
  const [, setLocation] = useLocation();
  const related = getRelatedTools(currentToolId);

  if (related.length === 0) return null;

  return (
    <div
      className="border-t px-5 py-4 flex-shrink-0"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: 'rgba(240,237,232,0.3)', fontFamily: 'Syne, sans-serif' }}
      >
        Related Tools
      </div>
      <div className="flex gap-2">
        {related.map((tool) => {
          const color = getStageColor(tool.id);
          return (
            <button
              key={tool.id}
              onClick={() => setLocation(tool.path)}
              className="flex-1 text-left rounded-xl p-3 transition-all group"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`;
                (e.currentTarget as HTMLButtonElement).style.background = `${color}08`;
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.025)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: `${color}15`, color }}
                >
                  {createElement(tool.icon, { size: 10 })}
                </div>
                <div
                  className="text-xs font-bold"
                  style={{ fontFamily: 'Syne, sans-serif', color: '#f0ede8' }}
                >
                  {tool.label}
                </div>
              </div>
              <div
                className="text-xs leading-snug"
                style={{ color: 'rgba(240,237,232,0.35)', fontSize: 10 }}
              >
                {tool.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
