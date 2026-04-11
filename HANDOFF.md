# Majorka Session Handoff — 2026-04-11

> This file captures the full state of the codebase after an intensive session.
> Use this to resume work in a fresh context without re-auditing.

---

## 1. EVERYTHING COMPLETED THIS SESSION

### Security (Cycles 1-3)
- Removed hardcoded Supabase SERVICE_ROLE_KEY from `server/lib/productPipeline.ts`
- Removed hardcoded RapidAPI key from `server/lib/productPipeline.ts`
- Removed hardcoded Pexels API key from `server/lib/productPipeline.ts`
- Removed hardcoded AliExpress APP_KEY + APP_SECRET from `server/lib/aliexpress.ts` and `server/routes/aliexpress.ts`
- Fixed JWT forgery in `server/middleware/requireSubscription.ts` — now uses `supabase.auth.getUser()` for cryptographic verification
- Subscription middleware fails closed (503) when service key missing
- Updated drizzle-orm 0.44.7 → 0.45.2 (SQL injection fix)
- Patched SSRF in `/api/proxy-image` — domain allowlist + HTTPS only
- Added `requireAuth` to 12+ previously unauthenticated endpoints: `/api/creators/outreach`, `/api/ad-spy/search`, `/api/competitor/products`, `/api/competitor/stores`, `/api/import-product`, `/api/images/pexels-search`, `/api/creators`, `/api/reports/generate`, `/api/videos`, `/api/trend-signals`, `/api/products/extract-url`, `/api/pexels/search`, `/api/aliexpress/test`
- Removed hardcoded migration secret fallback `'majorka-intel-2026'` — now fails closed
- Fixed `/api/import-product` JWT decode without verification → uses `requireAuth`
- Added subscription expiry check (`current_period_end`) to `requireSubscription`
- CJ products filtered by order count > 0 at API level
- Removed sensitive console.log from `server/lib/tiktokData.ts` (token length leak)
- Removed sensitive console.log from `server/lib/aliexpress.ts` (API keys)
- Removed `VITE_ADMIN_SECRET` from all client code (was exposed in DevTools)
- Removed `VITE_ADMIN_USER_ID` from all client code
- Created server-side admin check at `GET /api/auth/admin-check`
- Rewrote `useAdmin` hook to call server instead of checking client env vars
- Removed `adminAuth` middleware (required X-Admin-Token header that client no longer sends)
- Fixed `requireAdmin` middleware to read from `ADMIN_USER_ID` env var
- pnpm overrides: `fast-xml-parser>=5.3.5`, `axios>=1.15.0` (0 critical npm vulns)
- Rebuilt `api/index.serverless.js` after every security change

### Build & Types
- Fixed all TypeScript errors to 0 (was 15+)
- Fixed Framer Motion `ease` type errors in `client/src/lib/motion.ts`
- Fixed null guards in Products detail panel
- Fixed PromiseLike `.catch()` on Supabase upsert
- Fixed duplicate `price_aud` in MarketDashboard interface
- Fixed `_dark` undefined variable in Alerts.tsx
- Fixed `user_metadata` type in Dashboard.tsx
- Fixed `tool.wide` property check in Dashboard.tsx
- Removed `@builder.io/vite-plugin-jsx-loc` (Manus plugin, not needed)
- Removed NuqsAdapter (history patching conflicted with wouter router)
- Removed ALL manual chunk splitting except vendor-react (was causing TDZ crash)

### Theme & Design System
- Changed accent from indigo (#6366f1) to white (#ffffff) in dark mode
- Updated Tailwind v4 `@theme` block with new colors (this is what actually controls everything)
- Added `[data-theme='light']` CSS block with full light theme
- Updated fonts: `--font-display` to Syne, `--font-body` to DM Sans
- Removed all indigo (`#6366f1`) from: all `/pages/app/*.tsx`, all `/components/app/*.tsx`, `Home.tsx` (landing), `App.tsx`, `main.tsx`
- Removed indigo from CSS: `.glass-card--accent`, `.glass-card--interactive:hover`, `.app-glow` (display:none), `.aurora-bg` (display:none), `.aurora-blob-3` (display:none), border-beam, gradient-text
- Unified dark backgrounds: removed blue-tinted hex values (#0a0b0f, #0d0f14, #111118, #0a0a10, #1a2035, #0f1629) → pure neutral grays
- Created `ThemeToggle.tsx` component (animated Sun/Moon)
- Wired ThemeToggle into sidebar Nav.tsx
- Flash prevention script in `index.html`
- Landing page buttons: fixed white-on-white text (color: #fff → #080808 on white buttons)
- Landing page: unified all pill borderRadius from 999 to 6
- Established electric blue (#3B82F6) as primary accent for CTAs

### Features Built
- `server/lib/planLimits.ts` — Builder/Scale plan limits with `checkLimit()` utility
- `server/lib/usage.ts` — usage tracking (increment/get/getAll via Supabase REST)
- `server/lib/validateEnv.ts` — startup env validation (fails fast on missing required vars)
- `GET /api/usage/summary` — plan-aware usage endpoint
- `client/src/components/UsageSummary.tsx` — usage bars with 80% warning, upgrade CTA
- `client/src/pages/Academy.tsx` — 12 free lessons in 3 categories (public, no auth)
- `client/src/components/landing/ProductDemo.tsx` — animated 3-scene product demo
- `client/src/components/ShareViewButton.tsx` — copy current URL to clipboard
- `client/src/components/ThemeToggle.tsx` — dark/light toggle
- `client/src/lib/theme.ts` — theme getter/setter/toggle
- `client/src/hooks/useTheme.ts` — React hook for theme
- `client/src/lib/motion.ts` — Framer Motion animation presets
- `client/src/lib/perf.ts` — dev-mode render timing utility
- `client/src/components/ui/data-table.tsx` — TanStack Table generic component
- `scripts/qa-gate.mjs` — 3-agent QA gate (build health, visual audit, feature wire-up)
- `docs/shopify-themes-audit.md` — 40 themes catalogued for Store Builder
- Tiered rate limiting in `server/lib/ratelimit.ts` (builder vs scale limits)
- `requireSubscription` prop on ProtectedRoute — enabled on all 34 `/app/*` routes
- Usage increment wired to AI brief handlers + product search
- CommandPalette wired into App.tsx with Cmd+K toggle
- Improved system health check endpoint with Stripe/Supabase/Cron detail

### Pricing & Business
- Removed free/Explorer tier from pricing (only Builder + Scale)
- Removed all competitor names (Minea, KaloData, Ecomhunt, AutoDS)
- Comparison table headers → generic categories
- Scale pricing card: blue glow + "Most Popular" badge
- FAQ updated to not name competitors

### Dashboard Redesign
- Removed duplicate KPI grid
- Added dot grid background texture
- Gradient text title
- Status chip (pill with glowing green dot)
- Blue gradient CTA button
- KPI cards with accent glow, colored icon badges, staggered animation
- "AI curated" badge on Today's picks
- Blue tint table row hover
- Command panel wrapper for bottom section

---

## 2. EVERYTHING STILL PENDING

### Critical (blocks launch)
- **Stripe Price IDs not set**: `STRIPE_BUILDER_PRICE_ID` and `STRIPE_SCALE_PRICE_ID` must be created in Stripe Dashboard and added to Vercel
- **Secret rotation**: Supabase service_role key, RapidAPI key, Pexels key were in git history — MUST be rotated
- **Vercel env vars**: Several missing (see section 6)

### Pages needing redesign (user feedback says they look "cheap")
- **Products page** (`client/src/pages/app/Products.tsx`, ~2400 lines): filter tabs need color identity, thumbnails too small, no sorting indicators, detail panel needs hierarchy, trend chart shows placeholder
- **Analytics page** (`client/src/pages/app/Analytics.tsx`): no time-series chart, score distribution is flat boxes, page feels sparse
- **Creators page** (`client/src/pages/app/Creators.tsx`): generic layout, horizontal scroll UX poor, "Micro influencer" shown on every card
- **Maya AI page** (`client/src/pages/AIChat.tsx`): no brand personality, no suggested prompts, plain markdown responses
- **Ads Studio** (`client/src/pages/AdsStudio.tsx`): all panels same bg, empty center panel wastes space
- **Ad Briefs** (`client/src/pages/app/AdBriefs.tsx`): template cards are empty placeholders
- **Alerts** (`client/src/pages/app/Alerts.tsx`): two large empty boxes, no visual preview of what alerts look like
- **Store Builder** (`client/src/pages/store-builder/index.tsx`): emoji icons, no store preview mockup
- **Sidebar** (`client/src/components/app/Nav.tsx`): flat, no visual weight, active state needs glow

### Landing page issues
- Scroll animation section may appear as black void on some devices
- Hero floating cards need continuous animation
- Social proof bar too small
- Stats section needs count-up on scroll
- Comparison table: Majorka column needs highlight
- Global coverage cards need hover interactivity
- Testimonials need avatars and metrics
- Bottom CTA needs visual treatment

### Feature gaps
- ~900 indigo (#6366f1) references remain in legacy pages outside `/app/` (MetaAdsPack, Blog, MarketIntelligence, ShopIntelligence, SaturationChecker, MarketMap, store/StoreOrders)
- ScoreRing component still used in `client/src/pages/intelligence/FullDatabase.tsx`
- 13 images missing `loading="lazy"` in app pages
- `usage_counters` table not created in Supabase yet
- Academy needs expansion with training modules and guides
- No sparklines in KPI cards or product table
- Payment failed webhook sets `past_due` but doesn't block feature access

---

## 3. FEATURE STATUS

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ Working | Loads, CTA works, pricing visible. Visual polish needed. |
| Sign up (email) | ✅ Working | Supabase auth |
| Sign up (Google OAuth) | ✅ Working | Cross-domain redirect fix in place |
| Onboarding | ✅ Working | Collects niche, market, experience. Skip available. |
| Dashboard (Home) | ✅ Working | KPIs, table, today's picks, hot today all render |
| Products page | ✅ Working | Filters, search, detail drawer all functional |
| Store Builder | ✅ Working | AI generator, Shopify connect, store history |
| Ads Studio | ✅ Working | Generate ads, copy output, save creatives |
| Ad Briefs | ✅ Working | Generate briefs, template selection |
| Maya AI Chat | ✅ Working | Claude integration, chat history |
| Alerts | ⚠️ Partial | Page renders but empty states dominate |
| Analytics | ⚠️ Partial | KPIs + category chart work, no time-series |
| Creators | ⚠️ Partial | Data loads, templates work, UX needs work |
| Revenue | ✅ Working | Revenue tracking, stats display |
| Academy | ✅ Working | 12 lessons, public access, no auth needed |
| Subscription gating | ✅ Working | All /app/* routes gated, upgrade wall shows |
| Stripe checkout | ⚠️ Blocked | STRIPE_BUILDER_PRICE_ID not set in Vercel |
| Stripe webhooks | ✅ Working | Signature verified, 4 events handled |
| Admin panel | ✅ Working | Server-side auth, user list, system health |
| Command palette | ✅ Working | Cmd+K, navigation + filters |
| Theme toggle | ✅ Working | Dark/light, persists to localStorage |
| 404 page | ✅ Working | Branded, professional |
| Mobile sidebar | ✅ Working | Hamburger menu, slide-in overlay |
| Error boundaries | ✅ Working | App-level + route-level + Sentry |
| Rate limiting | ✅ Working | Upstash Redis, tiered per plan |
| Usage tracking | ✅ Working | AI briefs + search tracked |
| QA gate | ✅ Working | 3-agent check before deploy |

---

## 4. KNOWN REGRESSIONS / WATCH OUT FOR

1. **NuqsAdapter removed** — `nuqs` package is installed but the adapter was removed from main.tsx because it conflicted with wouter's router (caused black screen). If you want URL state sync, use `nuqs/adapters/react-router` after migrating from wouter.

2. **`@theme` block is king** — Tailwind v4's `@theme` block in `index.css` (line ~108) overrides ALL `:root` CSS variable definitions. Any design token changes MUST be made in the `@theme` block, not in `:root`. This was the root cause of multiple failed theme changes.

3. **Manual chunks removed** — `vite.config.ts` only has `vendor-react` as a manual chunk. All other vendor splitting is handled naturally by Rollup. Adding manual chunks back risks TDZ crashes (the recharts circular dependency issue).

4. **`validateEnv.ts` calls `process.exit(1)`** — If required env vars are missing, the server dies on startup. This is intentional but means the dev server won't start without `.env.local` having `SUPABASE_URL` (or `VITE_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, and `ANTHROPIC_API_KEY`.

5. **Admin detection is async** — `useAdmin()` makes an API call to `/api/auth/admin-check`. The admin link in the sidebar may flash briefly on load.

6. **Accent color conflict** — The prompt initially said gold (#d4af37), then was changed to white (#ffffff), then electric blue (#3B82F6) was added for CTAs. Currently: `--color-accent: #ffffff` in `@theme` (used by Tailwind classes like `text-accent`, `bg-accent`), and `#3B82F6` is used inline for CTAs/buttons. These should be unified in the next session.

---

## 5. DESIGN SYSTEM TOKENS

### @theme block (index.css ~line 108) — THIS IS THE SOURCE OF TRUTH
```css
--color-bg:      #080808;
--color-surface: #0d0d0d;
--color-raised:  #111111;
--color-card:    #0f0f0f;
--color-accent:  #ffffff;        /* White accent for Tailwind classes */
--color-accent-hover: #e5e5e5;
--color-accent-subtle: rgba(255,255,255,0.07);
--color-brand:   #ffffff;
--color-text:    #ededed;
--color-body:    #888888;
--color-muted:   #555555;
--color-green:   #22c55e;
--color-amber:   #f59e0b;
--color-red:     #ef4444;
--font-display:  'Syne', 'Bricolage Grotesque', sans-serif;
--font-body:     'DM Sans', 'Inter', sans-serif;
```

### Inline accent (for CTAs/buttons)
```
Electric blue: #3B82F6 / #2563EB (gradient)
Blue glow: rgba(59,130,246,0.3)
```

### Dark neutral ramp
```
#050505 — sidebar
#080808 — page background
#0a0a0a — alt background
#0d0d0d — surface
#0f0f0f — card
#111111 — elevated/raised
#1a1a1a — borders/interactive
```

### Light theme ([data-theme='light'])
```
--color-bg: #ffffff;
--color-accent: #000000;
--color-text: #0a0a0a;
```

### Typography
- **Display/Headings**: Syne (loaded via Google Fonts in index.html)
- **Body/UI**: DM Sans (loaded via Google Fonts)
- **Monospace/Numbers**: JetBrains Mono (loaded via Google Fonts)
- **Metrics**: Always use `font-mono tabular-nums`

### Spacing
- Cards: `p-5` (20px)
- Sections: `px-6 md:px-8` (24px / 32px)
- Between sections: `mb-6` to `mb-8`
- Card border radius: `rounded-md` (6px) or `rounded-lg` (8px), never `rounded-2xl`

---

## 6. VERCEL ENV VARS NEEDED

### Must be set (app won't work without these)
| Key | Value | Notes |
|-----|-------|-------|
| `SUPABASE_URL` | `https://ievekuazsjbdrltsdksn.supabase.co` | Server-side Supabase |
| `VITE_SUPABASE_URL` | `https://ievekuazsjbdrltsdksn.supabase.co` | Client-side Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase dashboard) | MUST BE ROTATED |
| `VITE_SUPABASE_ANON_KEY` | (from Supabase dashboard) | Public key |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Must be LIVE key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe webhook config |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | For Claude AI features |

### Must be created (features broken without these)
| Key | Value | Notes |
|-----|-------|-------|
| `STRIPE_BUILDER_PRICE_ID` | `price_...` | Create Builder product in Stripe ($99 AUD/mo) |
| `STRIPE_SCALE_PRICE_ID` | `price_...` | Create Scale product in Stripe ($199 AUD/mo) |
| `ADMIN_USER_ID` | `c2ee80e9-1b1b-4988-bea5-8f5278e6d25e` | For admin panel access |
| `ADMIN_EMAIL` | `maximusmajorka@gmail.com` | Admin email fallback |

### Optional (features degraded without)
| Key | Notes |
|-----|-------|
| `UPSTASH_REDIS_REST_URL` | Rate limiting (fails open without) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `APIFY_API_TOKEN` | Product scraping pipeline |
| `SENTRY_DSN` | Error tracking |
| `RAPIDAPI_KEY` | AliExpress data (MUST BE ROTATED) |
| `PEXELS_API_KEY` | Stock images (MUST BE ROTATED) |
| `CRON_SECRET` | Extra cron endpoint protection |

### Supabase table needed
```sql
CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric, period_start)
);
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON usage_counters FOR ALL USING (true) WITH CHECK (true);
```

---

## 7. SESSION END COMMIT

```
Commit: 7309df978cf342bdb3dbc70302ad29e05bc92317
Branch: main
Date: 2026-04-11
```

Total commits this session: ~55
