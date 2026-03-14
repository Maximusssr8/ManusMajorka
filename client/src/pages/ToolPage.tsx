import { createElement, lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import AIToolChat from '@/components/AIToolChat';
import MayaProactiveBar from '@/components/MayaProactiveBar';
import { useProduct } from '@/contexts/ProductContext';
import { type ActivityEntry, getActivityLog, getRelativeTime, logActivity } from '@/lib/activity';
import { injectProductIntelligence } from '@/lib/buildToolPrompt';
import { capture } from '@/lib/posthog';
import { getToolByPath, stages } from '@/lib/tools';

// Lazy-load all tool page components for code splitting
const WebsiteGenerator = lazy(() => import('./WebsiteGenerator'));
const MetaAdsPack = lazy(() => import('./MetaAdsPack'));
const BrandDNA = lazy(() => import('./BrandDNA'));
const MarketIntelligence = lazy(() => import('./MarketIntelligence'));
const ProductDiscovery = lazy(() => import('./ProductDiscovery'));
const CompetitorBreakdown = lazy(() => import('./CompetitorBreakdown'));
const TrendRadar = lazy(() => import('./TrendRadar'));
const NicheScorer = lazy(() => import('./NicheScorer'));
const KeywordMiner = lazy(() => import('./KeywordMiner'));
const AudienceProfiler = lazy(() => import('./AudienceProfiler'));
const CopywriterTool = lazy(() => import('./CopywriterTool'));
const EmailSequences = lazy(() => import('./EmailSequences'));
const AdsStudio = lazy(() => import('./AdsStudio'));
const SupplierFinder = lazy(() => import('./SupplierFinder'));
const MarketMap = lazy(() => import('./MarketMap'));
const FinancialModeler = lazy(() => import('./FinancialModeler'));
const ScalingPlaybook = lazy(() => import('./ScalingPlaybook'));
const StoreAuditor = lazy(() => import('./StoreAuditor'));
const AnalyticsDecoder = lazy(() => import('./AnalyticsDecoder'));
const ExpansionPlanner = lazy(() => import('./ExpansionPlanner'));
const ProjectManager = lazy(() => import('./ProjectManager'));
const AutomationBuilder = lazy(() => import('./AutomationBuilder'));
const ValidateTool = lazy(() => import('./ValidateTool'));
const LaunchPlanner = lazy(() => import('./LaunchPlanner'));
const AIChat = lazy(() => import('./AIChat'));
const MyProducts = lazy(() => import('./MyProducts'));
const ProductHub = lazy(() => import('./ProductHub'));
const StageLanding = lazy(() => import('./StageLanding'));
const InsightsPage = lazy(() => import('./InsightsPage'));
const LaunchKit = lazy(() => import('./LaunchKit'));
const AdSpy = lazy(() => import('./AdSpy'));
const TikTokSlideshow = lazy(() => import('./TikTokSlideshow'));
const History = lazy(() => import('./History'));
const StoreSetup = lazy(() => import('./store/StoreSetup'));
const StoreProducts = lazy(() => import('./store/StoreProducts'));
const StoreOrders = lazy(() => import('./store/StoreOrders'));
const WinningProducts = lazy(() => import('./WinningProducts'));
const ProfitCalculator = lazy(() => import('./ProfitCalculator'));
const StoreSpy = lazy(() => import('./StoreSpy'));
const SaturationChecker = lazy(() => import('./SaturationChecker'));
const MarketDashboard = lazy(() => import('./MarketDashboard'));
const CreatorIntelligence = lazy(() => import('./CreatorIntelligence'));
const VideoIntelligence = lazy(() => import('./VideoIntelligence'));
const CompetitorSpyPage = lazy(() => import('./CompetitorSpy'));
const TrendSignals = lazy(() => import('./TrendSignals'));
const SupplierIntelligence = lazy(() => import('./SupplierIntelligence'));

// Map stage landing paths to their stage names
const STAGE_PATHS: Record<string, string> = {
  '/app/research': 'Research',
  '/app/validate': 'Validate',
  '/app/build': 'Build',
  '/app/launch': 'Launch',
  '/app/optimize': 'Optimize',
  '/app/scale': 'Scale',
};

function ToolLoadingFallback() {
  return (
    <div className="h-full flex items-center justify-center" style={{ background: '#0a0b0d' }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-black animate-pulse"
          style={{
            background: 'rgba(212,175,55,0.15)',
            color: '#d4af37',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          M
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                background: '#d4af37',
                opacity: 0.5,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ToolPage() {
  const [location, setLocation] = useLocation();
  const tool = getToolByPath(location);
  const { activeProduct } = useProduct();

  useEffect(() => {
    // Redirect /app/dashboard → /app (the real dashboard home)
    if (location === '/app/dashboard') {
      setLocation('/app');
      return;
    }
    logActivity({ type: 'tool_opened', label: tool?.label ?? location });
    if (tool) capture('tool_opened', { tool: tool.id });
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for prefill from cross-tool navigation (e.g. Product Discovery → Validate)
  const [prefill] = useState<string | null>(() => {
    const stored = localStorage.getItem('majorka_validate_prefill');
    if (stored) {
      localStorage.removeItem('majorka_validate_prefill');
      return stored;
    }
    return null;
  });

  // Pages that get the Maya proactive bar
  const MAYA_BAR_PAGES = new Set([
    '/app/winning-products',
    '/app/suppliers',
    '/app/saturation-checker',
    '/app/website-generator',
    '/app/profit-calculator',
  ]);

  // Wrap in page transition animation + Suspense
  const page = (el: React.ReactElement) => (
    <Suspense fallback={<ToolLoadingFallback />}>
      <div key={location} className="page-enter h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          {el}
        </div>
        {MAYA_BAR_PAGES.has(location) && <MayaProactiveBar />}
      </div>
    </Suspense>
  );

  // History page
  if (location === '/app/history') return page(<History />);

  // Settings — handled by SettingsProfile via App.tsx route
  if (location === '/app/settings') {
    const SettingsProfile = lazy(() => import('./SettingsProfile'));
    return page(<SettingsProfile />);
  }

  // Route dedicated tool pages
  if (location === '/app/website-generator') return page(<WebsiteGenerator />);
  if (location === '/app/meta-ads') return page(<MetaAdsPack />);
  if (location === '/app/brand-dna') return page(<BrandDNA />);
  if (location === '/app/market-intel') return page(<MarketIntelligence />);
  if (location === '/app/product-discovery') return page(<ProductDiscovery />);
  if (location === '/app/competitor-breakdown') return page(<CompetitorBreakdown />);
  if (location === '/app/trend-radar') return page(<TrendRadar />);
  if (location === '/app/niche-scorer') return page(<NicheScorer />);
  if (location === '/app/keyword-miner') return page(<KeywordMiner />);
  if (location === '/app/audience-profiler') return page(<AudienceProfiler />);
  if (location === '/app/copywriter') return page(<CopywriterTool />);
  if (location === '/app/email-sequences') return page(<EmailSequences />);
  if (location === '/app/ads-studio') return page(<AdsStudio />);
  if (location === '/app/supplier-finder') return page(<SupplierFinder />);
  if (location === '/app/market-map') return page(<MarketMap />);
  if (location === '/app/financial-modeler') return page(<FinancialModeler />);
  if (location === '/app/scaling-playbook') return page(<ScalingPlaybook />);
  if (location === '/app/store-auditor') return page(<StoreAuditor />);
  if (location === '/app/analytics-decoder') return page(<AnalyticsDecoder />);
  if (location === '/app/expansion-planner') return page(<ExpansionPlanner />);
  if (location === '/app/project-manager') return page(<ProjectManager />);
  if (location === '/app/automation-builder') return page(<AutomationBuilder />);
  if (location === '/app/validate') return page(<ValidateTool />);
  if (location === '/app/launch-planner') return page(<LaunchPlanner />);
  if (location === '/app/ai-chat') return page(<AIChat />);
  if (location === '/app/my-products') return page(<MyProducts />);
  if (location.startsWith('/app/product-hub/')) return page(<ProductHub />);

  // Stage landing pages (/app/research, /app/validate, etc.)
  const stageName = STAGE_PATHS[location];
  if (stageName) {
    const stageData = stages.find((s) => s.stage === stageName);
    if (stageData) return page(<StageLanding stage={stageData} />);
  }

  // Insights page
  if (location === '/app/insights') return page(<InsightsPage />);
  if (location === '/app/launch-kit') return page(<LaunchKit />);
  if (location === '/app/ad-spy') return page(<AdSpy />);
  if (location === '/app/winning-products') return page(<WinningProducts />);
  if (location === '/app/profit-calculator') return page(<ProfitCalculator />);
  if (location === '/app/store-spy') return page(<StoreSpy />);
  if (location === '/app/saturation-checker') return page(<SaturationChecker />);
  if (location === '/app/market') return page(<MarketDashboard />);
  if (location === '/app/creators') return page(<CreatorIntelligence />);
  if (location === '/app/videos') return page(<VideoIntelligence />);
  if (location === '/app/competitor-spy') return page(<CompetitorSpyPage />);
  if (location === '/app/trend-signals') return page(<TrendSignals />);
  if (location === '/app/suppliers') return page(<SupplierIntelligence />);
  if (location === '/app/tiktok') return page(<TikTokSlideshow />);
  if (location === '/app/store/setup') return page(<StoreSetup />);
  if (location === '/app/store/products') return page(<StoreProducts />);
  if (location === '/app/store/orders') return page(<StoreOrders />);

  if (!tool) {
    return (
      <div
        className="flex items-center justify-center h-full page-enter"
        style={{ background: '#0a0b0d' }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🔧</div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ fontFamily: 'Syne, sans-serif', color: '#f0ede8' }}
          >
            Tool not found
          </h2>
          <p className="text-sm" style={{ color: 'rgba(240,237,232,0.4)' }}>
            This tool doesn't exist yet.
          </p>
        </div>
      </div>
    );
  }

  return page(
    <AIToolChat
      key={tool.id}
      toolId={tool.id}
      toolName={tool.label}
      toolDescription={tool.description}
      toolIcon={createElement(tool.icon, { className: 'w-4 h-4' })}
      systemPrompt={injectProductIntelligence(tool.systemPrompt, activeProduct)}
      placeholder={`Ask ${tool.label.toLowerCase()}...`}
      showHTMLPreview={false}
      examplePrompts={tool.examplePrompts}
      initialMessage={prefill ?? undefined}
    />
  );
}
