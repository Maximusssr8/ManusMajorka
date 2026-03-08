# Majorka Project TODO

## Foundation
- [x] Initialise project scaffold (web-db-user)
- [x] Read and analyse Majorka Menu HTML (403KB)
- [x] Database schema: subscriptions table
- [x] Server routers: subscription procedures
- [x] Upload Majorka Menu HTML to CDN

## Landing Page
- [x] Hero section (headline, subheadline, CTA)
- [x] Feature highlights grid (AI tools, website builder, ads studio, chat, insights)
- [x] Social proof / testimonials section
- [x] Pricing section (single plan $99/month)
- [x] Footer with nav links
- [x] App preview iframe with lock overlay

## Auth & Subscription Gate
- [x] Manus OAuth login flow
- [x] Subscription status check on protected routes
- [x] Grant access after subscription activation
- [x] Redirect unauthenticated users to login

## Protected Dashboard
- [x] Route /dashboard — requires auth + active subscription
- [x] Embed full Majorka Menu HTML in iframe (CDN-hosted)
- [x] postMessage mk_access_granted to iframe after subscription verified
- [x] Subscription gate UI (shown when user is logged in but not subscribed)

## Subscription Management
- [x] /account page — view plan, status, billing info
- [x] Activate subscription button
- [x] Cancel subscription flow with confirmation dialog

## Tests
- [x] Subscription router unit tests (6 tests)
- [x] Auth logout test (1 test)
- [x] All 7 tests passing

## Polish
- [x] Fix pre-existing scaffold TS errors (Markdown, AIChatBox, ComponentShowcase)
- [x] Dark gold theme (CSS variables, Syne + DM Mono fonts via Google Fonts)
- [x] Responsive nav bar on all pages

## Bug Fixes & Enhancements
- [x] Diagnosed website generator error in Majorka Menu (T.text undefined issue)
- [x] Integrated 21st Dev geometric hero component into home page
- [x] Remove absolute positioned CTA button overlay from hero section
- [x] Patch Majorka Menu HTML: add null checks for T.text in buildWebsiteRunner

## Phase 2: Replace Broken Website Generator & Build Native Tools
- [x] Build native Website Generator component with AI SDK v6 + Shopify prompt
- [x] Integrate DashboardLayout into Dashboard.tsx
- [x] Update DashboardLayout sidebar menuItems for Majorka tools
- [x] Build Meta Ads Pack tool page with AIChatBox
- [x] Build Brand DNA Analyzer tool page with AIChatBox
- [x] Build Market Intelligence tool page with AIChatBox
- [x] Build AI Chat tool page with AIChatBox
- [x] Wire up routing for all tool pages in App.tsx
- [x] Integrate DashboardLayout into Dashboard with subscription gate
- [x] All tests passing (1 test, 0 errors)
- [x] TypeScript clean (0 errors)

## Phase 3: Full App Restoration & Paywall Removal

### CRITICAL
- [x] Restore full app shell with persistent left sidebar navigation
- [x] Build 50+ AI tool pages organized by stage (Research, Validate, Build, Launch, Optimize, Scale)
- [x] Restore sidebar with section groupings and active/hover states
- [x] Remove all subscription gates and paywalls — make everything accessible without payment/sign-in
- [x] Change "Get Access — $99/month" to "Enter Majorka" / "Launch App" — go directly into app

### Landing Page Fixes
- [x] Fix hero subheadline to Majorka-specific copy
- [ ] Remove "Made with Manus" badge — platform-level, manage in Settings UI
- [x] Remove AI-generated testimonials — replaced with "Early Access" / "Join the Waitlist" section
- [x] Update pricing section to "Free during beta" ($0 with crossed-out $99)

### Tool Stages & Pages (39 total tools)
- [x] Research stage (7): Product Discovery, Competitor Breakdown, Trend Radar, Market Map, Niche Scorer, Supplier Finder, Keyword Miner
- [x] Validate stage (6): Unit Economics Calculator, Supplier Risk Check, 48-Hour Validation Plan, Demand Tester, Pricing Optimizer, Audience Profiler
- [x] Build stage (8): Website Generator, Creative Studio, Brand DNA Analyzer, Copywriter, Email Sequences, Store Auditor, Collection Builder, SEO Optimizer
- [x] Launch stage (6): Meta Ads Pack, Ads Studio, TikTok Ads, Google Ads, Launch Checklist, Influencer Brief
- [x] Optimize stage (6): Market Intelligence, Analytics Decoder, CRO Advisor, Retention Engine, Ad Optimizer, Profit Maximizer
- [x] Scale stage (6): AI Chat Co-founder, Project Manager, Scaling Playbook, Automation Builder, Expansion Planner, Financial Modeler

## Phase 4: UI Overhaul & Tool Rebuilds
- [x] Add RadialOrbitalTimeline (21st Dev) to landing page
- [x] Rebuild Website Generator: URL import, theme/layout/colour pickers, live preview, export HTML
- [x] Rebuild Meta Ads Pack: product context, 5 angle cards, 48-hr plan, copy-all buttons

## Phase 5: Fix AI Chat & Restore Original UI
- [x] Diagnose and fix /api/chat endpoint (messages format mismatch — 400 error)
- [x] Restore original Majorka top-nav UI (Dashboard, Research, Validate, Build, Website, Launch, Optimize, Scale, Insights, AI Chat)
- [x] Rebuild Website Generator with original clean left-panel / right-preview layout
- [x] Fix MetaAdsPack AI generation (useEffect timing bug — waitingForResponse guard)
- [x] Verify Meta Ads Pack works end-to-end (5 angles, 48-hr plan, copy buttons)

## Phase 6: 21st Dev Components
- [x] Create TextShimmer component (text-shimmer.tsx)
- [x] Create AgentPlan component (agent-plan.tsx)
- [x] Create SignInFlow with CanvasRevealEffect (sign-in-flow.tsx) — Three.js/React Three Fiber WebGL shader
- [x] Integrate TextShimmer into hero headline and dashboard welcome header
- [x] Integrate AgentPlan into the dashboard as "Your Launch Workflow" section
- [x] Wire SignInFlow to the /login route

## Phase 7: Specialized Tool UIs
- [x] Build Brand DNA Analyzer: structured JSON output with personality, audience, visual identity, taglines
- [x] Build Market Intelligence: competitor analysis, opportunity gaps, pricing intel, entry strategy
- [x] Wire Brand DNA to /app/brand-dna in ToolPage.tsx
- [x] Wire Market Intelligence to /app/market-intel in ToolPage.tsx

## Phase 8: Full Rebuild — Structured UIs, Tavily Integration, Landing Page Fixes

### FIX 1: Website Generator (Critical)
- [x] Add Tavily API key secret and create server-side scrape endpoint
- [x] Replace fake URL import with real Tavily extract scraping (title, description, features, images, price)
- [x] Upgrade landing page HTML: Hero, Benefits/Features, Social Proof, Guarantee badge, CTA
- [x] Add "Export as Shopify Liquid" button outputting usable Shopify section code
- [x] AI Refine mode already exists (chat panel)

### FIX 2: Meta Ads Pack (Critical)
- [x] Add product URL import field with Tavily scraping
- [x] Add interactive 48-hr checklist with progress counter
- [x] All copy buttons verified working

### FIX 3: Structured UIs for Chat-Only Tools
- [x] Product Discovery: filters form + card output (name, margin, competition, trend, supplier)
- [x] Competitor Breakdown: URL/brand input + Tavily scrape + structured analysis output
- [x] Trend Radar: Tavily web search for real trends + structured cards
- [x] Niche Scorer: niche input → scorecard with ratings (Competition, Margin, Trend, Barrier, Overall)
- [x] Keyword Miner: product/niche input → formatted keyword table with intent tags
- [x] Audience Profiler: structured form → visual customer avatar card
- [x] Copywriter: structured form (product, tone, audience, type) → formatted output with copy buttons
- [x] Email Sequences: output as visual flow (Email 1-5) with subject lines, body, CTAs
- [x] Ads Studio: form input → 3 platforms × 3 variants with hooks, copy, visual briefs
- [x] Supplier Finder: structured supplier cards with MOQ, lead times, search terms

### FIX 4: Tavily Integration for Research Tools
- [x] Create server-side Tavily helper (server/tavily.ts)
- [x] Add research.search tRPC procedure
- [x] Add research.extract tRPC procedure for URL scraping
- [x] Wire Trend Radar to Tavily search
- [x] Wire Competitor Breakdown to Tavily extract
- [x] Wire Product Discovery to Tavily search
- [x] Wire Supplier Finder to Tavily search

### FIX 5: Navigation & UX
- [x] Fix nav dropdowns: hover-open behavior (onMouseEnter/onMouseLeave on wrapper div)
- [x] Fix MetaAdsPack route path (/app/meta-ads not /app/meta-ads-pack)

### FIX 6: Landing Page Bugs
- [x] Fix waitlist/pricing contradiction — removed waitlist section, kept pricing card only
- [x] Removed unused imports (toast, trpc, useState, Input, CheckCircle)

### FIX 7: Design Polish
- [x] All tool pages use consistent Syne font for headings
- [x] All generation features have loading states (spinner + animated icon)
- [x] All tools have empty state guides with emoji + description

## Phase 9: Landing Page Review Fixes
- [x] Confirmed hero subheadline is already correct (not the template placeholder)
- [x] Confirmed pricing is already free beta ($0, no credit card)
- [x] Confirmed no fake testimonials exist
- [x] Added "How It Works" section (3 steps: Paste product → Pick tools → Launch)
- [x] Added "Value Comparison" table (Majorka vs hiring individually — $4,800–$15,000/mo vs free)
- [x] Added FAQ accordion section (6 questions: Shopify, beginners, AI model, free beta, export, vs ChatGPT)
- [x] Added nav anchor links: Features · How It Works · Pricing · FAQ · Sign In · Get Access
- [x] Added footer anchor links: Features · How It Works · Pricing · FAQ · Launch App
- [x] Final CTA button added below FAQ section

## Phase 10: Full Rebuild — Remaining Gaps (COMPLETED)

- [x] Build Market Map tool: interactive 2×2 Price vs Quality grid with competitor dots, opportunity zone, insights panel
- [x] Wire Market Map to /app/market-map in ToolPage.tsx
- [x] Add examplePrompts field to ToolDef interface in tools.ts
- [x] Add 3 example prompts to all 24 AIToolChat tools
- [x] Add examplePrompts prop to AIToolChat component and render as clickable chips in empty state
- [x] Pass examplePrompts from tool definition to AIToolChat in ToolPage.tsx
- [x] Fix landing page stage pills: replaced static pills with interactive StageTabsSection (click to see tool grid per stage)
- [x] TypeScript: 0 errors | Tests: 1 passing

## Phase 11: 21Dev Colour Theme

- [x] Apply 21Dev :root light theme (white background, zinc borders, #0a0a0a foreground)
- [x] Apply 21Dev .dark theme (#0a0a0a background, #fafafa foreground, zinc-800 borders)
- [x] Apply 21Dev chart colours (orange, teal, amber, purple, rose)
- [x] Apply 21Dev sidebar variables (sidebar, sidebar-primary #1d4ed8 in dark)
- [x] Preserve Syne + DM Sans fonts in @layer base
- [x] Preserve existing @theme inline block and container/flex utilities
- [x] TypeScript: 0 errors | HMR: hot updated /src/index.css confirmed

## Phase 12: Premium Rebuild V2

### BUG 1: Nav Overflow (Critical)
- [x] Convert top nav to collapsible sidebar with hamburger toggle on mobile
- [x] Ensure all 9 nav sections + AI Chat are always reachable

### BUG 2: Website Generator Scraping
- [x] Fix Tavily extract to pull real product title, description, features, price, images
- [x] Auto-fill brand name and sell price from scraped data
- [x] Add Tavily search fallback when extract fails (AliExpress/Amazon block direct extraction)
- [x] Add fallback image search when no product images found
- [x] Ensure generated HTML has proper sections (Hero, Features, Social Proof, Guarantee, CTA)
- [x] Fix Shopify Liquid export to output real working section code

### BUG 3: Remaining Blank Chat Tools
- [x] Financial Modeler: structured form → P&L table, break-even, 6-month forecast
- [x] Scaling Playbook: structured form → milestone roadmap with KPIs and timeline
- [x] Store Auditor: URL input + Tavily scrape → scored audit report (SEO, Speed, Trust, UX, CRO, Mobile)
- [x] Analytics Decoder: metric inputs → KPI cards with benchmarks, insights, and actions
- [x] Expansion Planner: structured form → market cards with scores, entry strategy, readiness checklist
- [x] Project Manager: phased task board with interactive checkboxes and progress tracking
- [x] Automation Builder: workflow cards with triggers, actions, tools, and time saved

### UPGRADE 5: Tavily for Research Tools
- [x] Wire Tavily search into Trend Radar before AI generation (done in Phase 8)
- [x] Wire Tavily search into Competitor Breakdown (done in Phase 8)
- [x] Wire Tavily search into Market Intelligence (done in Phase 8)
- [x] Wire Tavily search into Product Discovery (done in Phase 8)
- [x] Wire Tavily search into Keyword Miner (done in Phase 8)

### UPGRADE 6: Multi-Product Project Management
- [x] Add products table to database schema
- [x] Add saved_outputs table to database schema
- [x] Build My Products page with create/edit/delete
- [x] Build Product Hub page showing saved outputs by stage
- [x] Add My Products link to sidebar nav
- [x] Wire routes in App.tsx and ToolPage.tsx
- [ ] Add "Save to Product" button on all tool output pages (deferr### UPGRADE 7: Beginner Onboarding
- [x] Welcome modal on first login (experience level + goal selection)
- [x] Personalised "Start Here" workflow — routes user to right tool based on goal
- [ ] Progress badges ("First Product Researched", "First Store### UPGRADE 8: Premium UX Polish
- [x] Dark/light mode toggle (in user dropdown menu)
- [x] Keyboard shortcuts (Cmd+B sidebar toggle, Cmd+Shift+L theme toggle)
- [x] Theme switchable enabled in App.tsx ThemeProvider
- [ ] Skeleton loading states on all tool outputs (most tools already have loading spinners)
- [ ] Copy buttons on every output block (already on structured tools)
- [ ] Export as PDF/TXT on major output pages (deferred)
- [ ] "Related tools" suggestions at bottom of each tool (deferred)
- [ ] Tooltips on all icon-only buttons (deferred)

### UPGRADE 9: Landing Page
- [x] Stage tab content already interactive (done in Phase 10)
- [x] Landing page already has How It Works, Value Comparison, FAQ, anchor nav (done in Phase 9)
- [ ] Update FAQ with new questions
- [ ] Add comparison table (Majorka vs VA vs ChatGPT vs individual tools)

### UPGRADE 10: Better Output Formatting
- [x] Upgraded mkPrompt with structured output rules (headings, tables, bold, numbered lists)
- [x] Added "Next Steps" section requirement, specificity rules, response length guidance
- [x] All 40+ tools now produce scannable, actionable output
- [ ] Ensure all outputs return structured JSON rendered as cards/tables

## Phase 13: Save to Product Buttons

- [x] Create reusable SaveToProduct component (product selector dropdown + save mutation)
- [x] Wire SaveToProduct into all 22 structured tool output pages
- [x] Handle edge cases: no products yet (show create prompt), already saved (show success)


## Phase 14: 21Dev Components Integration

- [x] Create SparklesCore lightweight particle effect component (canvas-based)
- [x] Create Dock macOS-style magnifying dock component
- [x] Create ChatInput composable component with auto-resize textarea
- [x] Create useTextareaResize hook for dynamic textarea height
- [x] Fix MetaAdsPack JSX fragment issue
- [x] TypeScript: 0 errors | Dev server: running cleanly
- [ ] Integrate Dock into Dashboard (quick tool access) — deferred
- [ ] Integrate ChatInput into AIToolChat component — deferred
- [ ] Integrate SparklesCore into landing page hero — deferred
- [ ] Create Header-3 responsive navigation component — deferred
- [ ] Create Hero-195 animated timeline component — deferred
- [ ] Create Compare before/after image slider component — deferred
