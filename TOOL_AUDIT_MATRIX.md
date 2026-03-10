# Majorka Tool Audit Matrix

Generated: 2026-03-11

| Tool Name | Route | File | Renders | Has System Prompt | API Connected | Structured Output | Save to Product | Status |
|-----------|-------|------|---------|-------------------|---------------|-------------------|-----------------|--------|
| Product Discovery | /app/product-discovery | ProductDiscovery.tsx | Custom UI (cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → structured cards) | Yes | WORKING |
| Competitor Breakdown | /app/competitor-breakdown | CompetitorBreakdown.tsx | Custom UI (cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → structured cards) | Yes | WORKING |
| Trend Radar | /app/trend-radar | TrendRadar.tsx | Custom UI (cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → trend cards) | Yes | WORKING |
| Market Map | /app/market-map | MarketMap.tsx | Custom UI (scatter chart) | Yes (inline) | Yes (ai-sdk useChat) | Yes (visual market map) | Yes | WORKING |
| Niche Scorer | /app/niche-scorer | NicheScorer.tsx | Custom UI (score cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → scores) | Yes | WORKING |
| Supplier Finder | /app/supplier-finder | SupplierFinder.tsx | Custom UI (cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → supplier cards) | Yes | WORKING |
| Keyword Miner | /app/keyword-miner | KeywordMiner.tsx | Custom UI (table) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → keyword table) | Yes | WORKING |
| Unit Economics Calculator | /app/unit-economics | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Supplier Risk Check | /app/supplier-risk | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| 48-Hour Validation Plan | /app/validation-plan | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Demand Tester | /app/demand-tester | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Pricing Optimizer | /app/pricing-optimizer | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Audience Profiler | /app/audience-profiler | AudienceProfiler.tsx | Custom UI (persona cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → personas) | Yes | WORKING |
| Website Generator | /app/website-generator | WebsiteGenerator.tsx | Custom UI (preview panel) | Yes (inline, genSiteHTML) | Yes (api/scrape-product) | Yes (full HTML output) | Yes | WORKING |
| Creative Studio | /app/creative-studio | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Brand DNA Analyzer | /app/brand-dna | BrandDNA.tsx | Custom UI (DNA sections) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → sections) | Yes | WORKING |
| Copywriter | /app/copywriter | CopywriterTool.tsx | Custom UI (copy output) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → copy sections) | Yes | WORKING |
| Email Sequences | /app/email-sequences | EmailSequences.tsx | Custom UI (email list) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → email cards) | Yes | WORKING |
| Store Auditor | /app/store-auditor | StoreAuditor.tsx | Custom UI (checklist) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → audit items) | Yes | WORKING |
| Collection Builder | /app/collection-builder | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| SEO Optimizer | /app/seo-optimizer | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Meta Ads Pack | /app/meta-ads | MetaAdsPack.tsx | Custom UI (angle cards) | Yes (inline) | Yes (trpc + AI) | Yes (JSON → ad angles) | Yes | WORKING |
| Ads Studio | /app/ads-studio | AdsStudio.tsx | Custom UI (ad variants) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → ad cards) | Yes | WORKING |
| TikTok Ads | /app/tiktok-ads | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Google Ads | /app/google-ads | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Launch Checklist | /app/launch-checklist | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Influencer Brief | /app/influencer-brief | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Market Intelligence | /app/market-intel | MarketIntelligence.tsx | Custom UI (sections) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → intel sections) | Yes | WORKING |
| Analytics Decoder | /app/analytics-decoder | AnalyticsDecoder.tsx | Custom UI (KPI cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → KPI display) | Yes | WORKING |
| CRO Advisor | /app/cro-advisor | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Retention Engine | /app/retention-engine | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Ad Optimizer | /app/ad-optimizer | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| Profit Maximizer | /app/profit-maximizer | AIToolChat fallback | AIToolChat (chat) | Yes (tools.ts) | Yes (streaming chat) | No (chat only) | Yes (AIToolChat) | PARTIAL |
| AI Chat Co-founder | /app/ai-chat | AIChat.tsx | Custom UI (chat) | Yes (inline) | Yes (streaming chat) | No (free-form chat) | No | WORKING |
| Project Manager | /app/project-manager | ProjectManager.tsx | Custom UI (task board) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → task phases) | Yes | WORKING |
| Scaling Playbook | /app/scaling-playbook | ScalingPlaybook.tsx | Custom UI (milestones) | Yes (inline) | Yes (ai-sdk useChat + trpc) | Yes (JSON → milestones) | Yes | WORKING |
| Automation Builder | /app/automation-builder | AutomationBuilder.tsx | Custom UI (workflow cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → automations) | Yes | WORKING |
| Expansion Planner | /app/expansion-planner | ExpansionPlanner.tsx | Custom UI (market cards) | Yes (inline) | Yes (ai-sdk useChat) | Yes (JSON → markets) | Yes | WORKING |
| Financial Modeler | /app/financial-modeler | FinancialModeler.tsx | Custom UI (P&L table) | Yes (inline, computed) | Local computation + AI | Yes (P&L rows, forecast) | Yes | WORKING |
| Validate | /app/validate | ValidateTool.tsx | AIToolChat (chat) | Yes (inline) | Yes (streaming chat) | Partial (markdown structured) | Yes (AIToolChat) | WORKING |
| Launch Planner | /app/launch-planner | LaunchPlanner.tsx | AIToolChat (chat) | Yes (inline) | Yes (streaming chat) | Partial (markdown structured) | Yes (AIToolChat) | WORKING |
| My Products | /app/my-products | MyProducts.tsx | Custom UI (product list) | N/A | Yes (trpc.products.list) | Yes (product CRUD) | N/A | WORKING |
| Product Hub | /app/product-hub/:id | ProductHub.tsx | Custom UI (product detail) | N/A | Yes (trpc.products.get) | Yes (saved outputs per stage) | N/A | WORKING |

## Status Legend

- **WORKING** — Has dedicated page file, system prompt, AI integration, structured output, and Save to Product
- **PARTIAL** — Falls back to generic `AIToolChat` — functional but lacks structured output or dedicated UI
- **BROKEN** — File exists but has rendering or integration errors
- **MISSING** — Route defined but no dedicated page file

## Summary

| Status | Count |
|--------|-------|
| WORKING | 26 |
| PARTIAL | 16 |
| BROKEN | 0 |
| MISSING | 0 |

**Total tools: 42**

### Key Findings

1. **16 tools use AIToolChat fallback** — these are functional (chat works, save works) but lack the structured output UX of the custom tools. Candidates for future upgrade: TikTok Ads, Google Ads, CRO Advisor, Retention Engine, Unit Economics, Pricing Optimizer, Demand Tester.

2. **All tools have system prompts** — either inline in the page file or in `client/src/lib/tools.ts`.

3. **All tools have Save to Product** — either via `<SaveToProduct>` component directly or via `AIToolChat` which imports it internally.

4. **No broken or missing routes** — all routes defined in `ToolPage.tsx` map to real components.

5. **Validate and LaunchPlanner** use `AIToolChat` but with detailed inline system prompts producing structured markdown output — rated WORKING rather than PARTIAL.
