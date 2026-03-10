import { lazy, Suspense, createElement } from "react";
import { useLocation } from "wouter";
import { getToolByPath, stages } from "@/lib/tools";
import { Loader2 } from "lucide-react";

// Lazy-loaded — only needed for tools without a dedicated page
const AIToolChat = lazy(() => import("@/components/AIToolChat"));

// Lazy-loaded tool pages — each becomes its own chunk
const WebsiteGenerator = lazy(() => import("./WebsiteGenerator"));
const MetaAdsPack = lazy(() => import("./MetaAdsPack"));
const BrandDNA = lazy(() => import("./BrandDNA"));
const MarketIntelligence = lazy(() => import("./MarketIntelligence"));
const ProductDiscovery = lazy(() => import("./ProductDiscovery"));
const CompetitorBreakdown = lazy(() => import("./CompetitorBreakdown"));
const TrendRadar = lazy(() => import("./TrendRadar"));
const NicheScorer = lazy(() => import("./NicheScorer"));
const KeywordMiner = lazy(() => import("./KeywordMiner"));
const AudienceProfiler = lazy(() => import("./AudienceProfiler"));
const CopywriterTool = lazy(() => import("./CopywriterTool"));
const EmailSequences = lazy(() => import("./EmailSequences"));
const AdsStudio = lazy(() => import("./AdsStudio"));
const SupplierFinder = lazy(() => import("./SupplierFinder"));
const MarketMap = lazy(() => import("./MarketMap"));
const FinancialModeler = lazy(() => import("./FinancialModeler"));
const ScalingPlaybook = lazy(() => import("./ScalingPlaybook"));
const StoreAuditor = lazy(() => import("./StoreAuditor"));
const AnalyticsDecoder = lazy(() => import("./AnalyticsDecoder"));
const ExpansionPlanner = lazy(() => import("./ExpansionPlanner"));
const ProjectManager = lazy(() => import("./ProjectManager"));
const AutomationBuilder = lazy(() => import("./AutomationBuilder"));
const ValidateTool = lazy(() => import("./ValidateTool"));
const LaunchPlanner = lazy(() => import("./LaunchPlanner"));
const AIChat = lazy(() => import("./AIChat"));
const MyProducts = lazy(() => import("./MyProducts"));
const ProductHub = lazy(() => import("./ProductHub"));
const StageLanding = lazy(() => import("./StageLanding"));
const InsightsPage = lazy(() => import("./InsightsPage"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: "#080a0e" }}>
      <Loader2 size={20} className="animate-spin" style={{ color: "#d4af37" }} />
    </div>
  );
}

// Map stage landing paths to their stage names
const STAGE_PATHS: Record<string, string> = {
  "/app/research": "Research",
  "/app/validate": "Validate",
  "/app/build": "Build",
  "/app/launch": "Launch",
  "/app/optimize": "Optimize",
  "/app/scale": "Scale",
};

// Route path → lazy component mapping
const TOOL_ROUTES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "/app/website-generator": WebsiteGenerator,
  "/app/meta-ads": MetaAdsPack,
  "/app/brand-dna": BrandDNA,
  "/app/market-intel": MarketIntelligence,
  "/app/product-discovery": ProductDiscovery,
  "/app/competitor-breakdown": CompetitorBreakdown,
  "/app/trend-radar": TrendRadar,
  "/app/niche-scorer": NicheScorer,
  "/app/keyword-miner": KeywordMiner,
  "/app/audience-profiler": AudienceProfiler,
  "/app/copywriter": CopywriterTool,
  "/app/email-sequences": EmailSequences,
  "/app/ads-studio": AdsStudio,
  "/app/supplier-finder": SupplierFinder,
  "/app/market-map": MarketMap,
  "/app/financial-modeler": FinancialModeler,
  "/app/scaling-playbook": ScalingPlaybook,
  "/app/store-auditor": StoreAuditor,
  "/app/analytics-decoder": AnalyticsDecoder,
  "/app/expansion-planner": ExpansionPlanner,
  "/app/project-manager": ProjectManager,
  "/app/automation-builder": AutomationBuilder,
  "/app/validate": ValidateTool,
  "/app/launch-planner": LaunchPlanner,
  "/app/ai-chat": AIChat,
  "/app/my-products": MyProducts,
};

export default function ToolPage() {
  const [location] = useLocation();
  const tool = getToolByPath(location);

  // Wrap in page transition animation + Suspense for lazy loading
  const page = (el: React.ReactElement) => (
    <Suspense fallback={<LazyFallback />}>
      <div key={location} className="page-enter h-full">{el}</div>
    </Suspense>
  );

  // Route dedicated tool pages via lookup
  const LazyComponent = TOOL_ROUTES[location];
  if (LazyComponent) return page(<LazyComponent />);

  // Product hub (dynamic path)
  if (location.startsWith("/app/product-hub/")) return page(<ProductHub />);

  // Stage landing pages (/app/research, /app/validate, etc.)
  const stageName = STAGE_PATHS[location];
  if (stageName) {
    const stageData = stages.find((s) => s.stage === stageName);
    if (stageData) return page(<StageLanding stage={stageData} />);
  }

  // Insights page
  if (location === "/app/insights") return page(<InsightsPage />);

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-full page-enter" style={{ background: "#0a0b0d" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔧</div>
          <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
            Tool not found
          </h2>
          <p className="text-sm" style={{ color: "rgba(240,237,232,0.4)" }}>This tool doesn't exist yet.</p>
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
      toolIcon={createElement(tool.icon, { className: "w-4 h-4" })}
      systemPrompt={tool.systemPrompt}
      placeholder={`Ask ${tool.label.toLowerCase()}...`}
      showHTMLPreview={false}
      examplePrompts={tool.examplePrompts}
    />
  );
}
