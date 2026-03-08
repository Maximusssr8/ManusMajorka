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
