## Prompt Improver Context
- Stack: React 19 + Vite + Express + tRPC + Drizzle + Supabase + Wouter
- Design system: #080a0e bg, #d4af37 gold, Syne + DM Sans fonts
- AI: Vercel AI SDK + Anthropic claude-sonnet-4-6
- Deployment: Vercel (majorka.io)
- Database: Supabase (Postgres + Realtime)
- Automation: n8n + Apify (winning products pipeline)
- Analytics: PostHog
- Key routes: /app/winning-products, /app/website-generator, /app/product-discovery, /app/meta-ads, /pricing, /app/learn
- Auth: Supabase Google OAuth
- Never break existing Supabase RLS policies
- Never change the design system colours or fonts
- Always mobile responsive
- Always TypeScript strict — no any types
- Test every build with: pnpm run build && pnpm run check

## Architecture
- client/src/pages/ — all page components (lazy-loaded)
- client/src/components/ — shared components
- server/_core/ — Express API + tRPC router
- server/lib/ — services (memory, opik, affiliate, rate-limit, etc.)
- drizzle/schema.ts — database schema
- shared/ — shared types and market configs
- api/_server.ts — Vercel serverless entry
- api/index.serverless.js — built bundle (auto-generated, do not edit)

## Key Files
- client/src/pages/WinningProducts.tsx — live product feed (Supabase Realtime)
- client/src/pages/WebsiteGenerator.tsx — store builder with iframe preview
- client/src/pages/MetaAdsPack.tsx — Meta Ads copy generator
- server/_core/chat.ts — AI chat endpoint with SSE streaming
- server/lib/migrate-winning-products.ts — DB migration + seed
- shared/markets.ts — AU/US/EU/UK/ASIA/GLOBAL market configs

## Critical Rules
- Never use innerHTML with user-controlled data (XSS risk)
- All AI tool pages must send Authorization: Bearer token header
- supabase/auth: Site URL = https://www.majorka.io
- Serverless bundle: always run `node scripts/build-api.mjs` after server changes
- n8n workflows: running at localhost:5678
- Apify key: apify_api_Lpop2... (in .env.local)
