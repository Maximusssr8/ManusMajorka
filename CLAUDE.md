# MAJORKA AI — Claude Code Context File

## Project Overview

Majorka is an AI-powered ecommerce operating system built by Max Scutella. It provides 20+ specialized AI tools across 5 business stages (Research, Validate, Build, Launch, Optimize) for business owners. This is the main product repo.

## Repo

- GitHub: Maximusssr8/ManusMajorka
- Branch: main
- Deploy target: Vercel

## Architecture

Monorepo with three main directories:

```
client/          React 19 SPA (Vite)
server/          Express.js API (tRPC + streaming chat)
shared/          Shared types and constants
api/             Vercel serverless entrypoint
drizzle/         Database schema and migrations
```

### Client (`/client/src/`)
- `App.tsx` — wouter router + theme/error providers
- `main.tsx` — tRPC + React Query setup with auth token injection
- `pages/` — 25+ pages; Dashboard.tsx is the main hub routing to tools via `/:tool`
- `components/` — AIChatBox (streaming chat), 40+ shadcn/ui components
- `lib/tools.ts` — Tool definitions (id, label, systemPrompt, examplePrompts)
- `contexts/ThemeContext.tsx` — Dark/light mode
- `_core/hooks/` — useAuth, useDocumentTitle

### Server (`/server/`)
- `_core/index.ts` — Express entry (auto port detection, Vite dev setup)
- `_core/trpc.ts` — tRPC router with publicProcedure, protectedProcedure, adminProcedure
- `_core/context.ts` — Auth middleware (Bearer token → Supabase getUser → profile upsert)
- `_core/chat.ts` — POST /api/chat (Claude streaming with conversation memory)
- `routers.ts` — Main appRouter (auth, subscription, products, savedOutputs, profile, memory, taskPlan, research)
- `db.ts` — Drizzle database helpers (70+ functions)
- `lib/anthropic.ts` — Claude client + BASE_SYSTEM_PROMPT

### Shared (`/shared/`)
- `types.ts` — Re-exports from Drizzle schema
- `const.ts` — Error messages

## Tech Stack

- **Frontend**: React 19 + Vite 7 + Tailwind CSS v4
- **Routing**: wouter (lightweight, patched v3.7.1)
- **API**: tRPC 11 + React Query (Superjson transformer)
- **Backend**: Express.js
- **Database**: PostgreSQL via Supabase + Drizzle ORM 0.44
- **Auth**: Supabase Auth (JWT Bearer tokens)
- **AI**: Anthropic Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **Web Search**: Tavily API
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Animations**: Framer Motion
- **Payments**: Stripe (infrastructure ready)
- **Deployment**: Vercel (serverless)
- **Package Manager**: pnpm

## Database Schema (Drizzle)

Defined in `drizzle/schema.ts`:

| Table | Purpose |
|-------|---------|
| `profiles` | User identity (UUID PK, name, email, role) |
| `subscriptions` | Plan tracking (status, plan, period dates) |
| `products` | User product tracking (name, niche, status across 6 stages) |
| `savedOutputs` | Tool results linked to products |
| `userProfiles` | AI personalization context (business, niche, budget, revenue) |
| `conversationMemory` | Per-tool chat history (auto-trimmed to 20 messages) |
| `taskPlanProgress` | Workflow step tracking |

RLS policies in `drizzle/rls-policies.sql`.

## Key Routes

### Client (wouter)
- `/` — Landing page
- `/login`, `/sign-in` — Auth
- `/app` — Dashboard (default)
- `/app/:tool` — Tool-specific view
- `/app/product-hub/:id` — Product detail
- `/app/settings` — Settings
- `/account` — Billing/subscription

### Server (Express + tRPC)
- `/api/trpc` — All tRPC procedures
- `/api/chat` — POST streaming Claude responses
- `/api/scrape` — Product URL scraper

## AI Chat System

- Streaming endpoint at `/api/chat` (line-delimited JSON: `0:"text"`, `d:{}`, `e:{}`)
- Loads last 10 messages from conversationMemory per tool
- Injects user context string (business name, niche, revenue, etc.)
- Each tool has a custom systemPrompt defined in `client/src/lib/tools.ts`
- Conversation memory auto-trims to 20 messages

## Auth Flow

1. Client sends Bearer token via Authorization header
2. Server validates with `supabase.auth.getUser(token)`
3. Auto-upserts profile to profiles table on first login
4. tRPC procedures check `ctx.user` (null = unauthenticated)

## Design System

- **Background**: #080a0e (dark)
- **Gold accent**: #d4af37
- **Fonts**: Syne (headings) + DM Sans (body)
- **Style**: minimalist dark luxury

## Development

```bash
pnpm install               # Install dependencies
pnpm run dev               # Start dev server (tsx watch + Vite)
pnpm run build             # Production build (Vite + esbuild)
pnpm run check             # TypeScript type checking
pnpm run test              # Run tests (Vitest)
pnpm run db:push           # Push Drizzle migrations
pnpm run format            # Prettier formatting
```

### Path Aliases
- `@/` → `client/src/`
- `@shared/` → `shared/`

## Environment Variables

**Required** (see `.env.example`):
- `VITE_SUPABASE_URL` — Supabase project URL (public)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key (server only)
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — Claude API key
- `TAVILY_API_KEY` — Web search API key

**Optional**:
- `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` — External tool backend
- `FIRECRAWL_API_KEY` — Website scraping
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` — S3 storage

## Rules — Read Before Writing Anything

- Always read and summarise existing files before making changes
- Never change navigation, routing, or auth logic unless explicitly told to
- Never overwrite working features — confirm before replacing anything
- Preserve the design system on all new components
- Always confirm your plan before executing changes
- When adding a new tool, define it in `client/src/lib/tools.ts` following the existing pattern
- Database changes go through Drizzle schema (`drizzle/schema.ts`) then `pnpm run db:push`
- Use protectedProcedure for authenticated endpoints, adminProcedure for admin-only

## Business Context

- **Owner**: Max Scutella (Gold Coast, Australia)
- **Other active projects**: Bellagio GC Airbnb, Eastern European Tech Talent Platform, Private Wealth Exchange, e-commerce store

## End of Session

Always finish with a handoff summary: TASK COMPLETED / OUTPUTS / NEXT ACTIONS / OPEN ITEMS
