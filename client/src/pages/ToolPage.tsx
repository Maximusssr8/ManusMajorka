import { useLocation } from "wouter";
import { getToolByPath } from "@/lib/tools";
import AIToolChat from "@/components/AIToolChat";
import WebsiteGenerator from "./WebsiteGenerator";
import MetaAdsPack from "./MetaAdsPack";
import BrandDNA from "./BrandDNA";
import MarketIntelligence from "./MarketIntelligence";
import ProductDiscovery from "./ProductDiscovery";
import CompetitorBreakdown from "./CompetitorBreakdown";
import TrendRadar from "./TrendRadar";
import NicheScorer from "./NicheScorer";
import KeywordMiner from "./KeywordMiner";
import AudienceProfiler from "./AudienceProfiler";
import CopywriterTool from "./CopywriterTool";
import EmailSequences from "./EmailSequences";
import AdsStudio from "./AdsStudio";
import SupplierFinder from "./SupplierFinder";
import MarketMap from "./MarketMap";
import FinancialModeler from "./FinancialModeler";
import ScalingPlaybook from "./ScalingPlaybook";
import StoreAuditor from "./StoreAuditor";
import AnalyticsDecoder from "./AnalyticsDecoder";
import ExpansionPlanner from "./ExpansionPlanner";
import ProjectManager from "./ProjectManager";
import AutomationBuilder from "./AutomationBuilder";
import MyProducts from "./MyProducts";
import ProductHub from "./ProductHub";
import { createElement } from "react";

export default function ToolPage() {
  const [location] = useLocation();
  const tool = getToolByPath(location);

  // Wrap in page transition animation
  const page = (el: React.ReactElement) => <div key={location} className="page-enter h-full">{el}</div>;

  // Route dedicated tool pages
  if (location === "/app/website-generator") return page(<WebsiteGenerator />);
  if (location === "/app/meta-ads") return page(<MetaAdsPack />);
  if (location === "/app/brand-dna") return page(<BrandDNA />);
  if (location === "/app/market-intel") return page(<MarketIntelligence />);
  if (location === "/app/product-discovery") return page(<ProductDiscovery />);
  if (location === "/app/competitor-breakdown") return page(<CompetitorBreakdown />);
  if (location === "/app/trend-radar") return page(<TrendRadar />);
  if (location === "/app/niche-scorer") return page(<NicheScorer />);
  if (location === "/app/keyword-miner") return page(<KeywordMiner />);
  if (location === "/app/audience-profiler") return page(<AudienceProfiler />);
  if (location === "/app/copywriter") return page(<CopywriterTool />);
  if (location === "/app/email-sequences") return page(<EmailSequences />);
  if (location === "/app/ads-studio") return page(<AdsStudio />);
  if (location === "/app/supplier-finder") return page(<SupplierFinder />);
  if (location === "/app/market-map") return page(<MarketMap />);
  if (location === "/app/financial-modeler") return page(<FinancialModeler />);
  if (location === "/app/scaling-playbook") return page(<ScalingPlaybook />);
  if (location === "/app/store-auditor") return page(<StoreAuditor />);
  if (location === "/app/analytics-decoder") return page(<AnalyticsDecoder />);
  if (location === "/app/expansion-planner") return page(<ExpansionPlanner />);
  if (location === "/app/project-manager") return page(<ProjectManager />);
  if (location === "/app/automation-builder") return page(<AutomationBuilder />);
  if (location === "/app/my-products") return page(<MyProducts />);
  if (location.startsWith("/app/product-hub/")) return page(<ProductHub />);

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

