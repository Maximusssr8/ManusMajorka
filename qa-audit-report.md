# Majorka QA Audit — 13 March 2026

> Auditor: Claude Code (brutal mode). No sugarcoating. Broken = 0. Half-working = low score.

---

## SECTION 1: AUTH — Score: 40/100

### What Works
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local` ✓
- `AuthProvider` handles session persistence via localStorage (`majorka-auth` key) ✓
- `onAuthStateChange` + `getSession()` with 3s deadline fallback ✓
- Hash-based OAuth token recovery (`#access_token=...`) implemented ✓
- Google OAuth via `signInWithOAuth` with `redirectTo: window.location.origin/app` ✓
- `ProtectedRoute` component wraps all `/app/*` routes ✓
- Magic link + email/password sign-up both implemented ✓

### What's Broken
- **CRITICAL: `SUPABASE_SERVICE_ROLE_KEY` is NOT set in `.env.local`**
- `server/_core/supabase.ts → getSupabaseAdmin()` throws: _"Supabase env vars (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured."_
- `server/_core/context.ts` calls `getSupabaseAdmin().auth.getUser(token)` — this THROWS, caught by catch block, sets `user = null`
- Result: ALL `protectedProcedure` tRPC endpoints return `{ "code": "UNAUTHORIZED", "message": "Please login (10001)" }` for every logged-in user
- CONFIRMED via curl: `GET /api/trpc/subscription.get` with any Bearer token → `UNAUTHORIZED`
- CONFIRMED via curl: `GET /api/trpc/products.list` → `UNAUTHORIZED`

### Exact Errors
```
TRPCError: Please login (10001)
  at server/_core/trpc.ts:17:11
  code: "UNAUTHORIZED", httpStatus: 401
```
```
Error thrown in getSupabaseAdmin():
"Supabase env vars (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured."
```

### Missing env var
```
SUPABASE_SERVICE_ROLE_KEY=<not set>
```

---

## SECTION 2: ONBOARDING — Score: 55/100

### What Works
- `/onboarding` route returns 200 (SPA serves HTML, React Router handles it) ✓
- `ProtectedRoute` wraps onboarding — unauthenticated users redirected to `/sign-in` ✓
- Multi-step onboarding page exists with: niche selection, goals, budget, referral source ✓
- Falls back to `localStorage` key `majorka_onboarded` to track completion state ✓
- Onboarding _triggers_ a `trpc.profile.update.useMutation()` call to save to DB ✓

### What's Broken
- **`trpc.profile.update` is a `protectedProcedure`** — due to missing `SUPABASE_SERVICE_ROLE_KEY`, this mutation ALWAYS returns UNAUTHORIZED ❌
- Onboarding data is never actually saved to the database — user has to redo it every session ❌
- Two separate onboarding flows exist (`OnboardingModal` in Dashboard and `Onboarding.tsx` page) — they are NOT in sync. `OnboardingModal` has 4 steps, `Onboarding.tsx` has a different 4 steps. Confusing UX ❌
- `OnboardingModal.tsx` also calls `trpc.profile.get` and `trpc.userProfile.upsert` — both protected, both fail ❌

### Score Notes
The page renders and localStorage flag works, so you won't be stuck in an infinite onboarding loop. But nothing persists to the database. 55/100 because it at least renders and doesn't crash.

---

## SECTION 3: DASHBOARD — Score: 35/100

### What Works
- Dashboard renders without crashing ✓
- Tool grid displays all tools with correct labels and icons ✓
- Tool search/filter works (client-side) ✓
- Recently Used tools (localStorage) work ✓
- `Launch Kit` CTA card renders ✓
- Stage-based tool categories display correctly ✓

### What's Broken / Hardcoded

**Hardcoded stat card changes — always shows these values regardless of reality:**
```tsx
change="+12%"  // Active Products — always ❌
change="+8%"   // Tools Today — always ❌
change="+24%"  // AI Requests — always ❌
change="+5%"   // Revenue — always ❌
```

**Hardcoded sparklines — fake static data, not real user activity:**
```tsx
const SPARKLINES = [
  [{ v: 2 }, { v: 3 }, { v: 2 }, { v: 4 }, ...],  // ❌ FAKE
  ...
]
```

**Hardcoded social proof badge:**
```tsx
<CountUp start={0} end={47} duration={1.2} />  // "47 sellers joined this week" — ALWAYS 47 ❌
```

**Hardcoded progress tracker — first step always "done", rest always empty:**
```tsx
{["Research", "Brand", "Copy", "Launch"].map((step, idx) => (
  style={{ background: idx === 0 ? "#10b981" : "rgba(255,255,255,0.06)" }}  // ❌
))}
```

**Stats pulled from localStorage, not DB:**
- `toolsToday` → `localStorage.getItem("majorka_tools_today")` ❌
- `aiCount` → `localStorage.getItem("majorka_ai_count")` ❌

**Revenue stat is fake:**
```tsx
const revenuePotential = totalRevenue > 0 ? totalRevenue : productCount * 49;  // ❌ productCount * $49 is made-up
```

**All tRPC queries on dashboard fail due to SERVICE_ROLE_KEY:**
- `trpc.products.list.useQuery` → UNAUTHORIZED ❌
- `trpc.storefront.getOrders.useQuery` → UNAUTHORIZED ❌
- `trpc.subscription.get.useQuery` → UNAUTHORIZED ❌

### API Test
```bash
GET /api/trpc/dashboard.getStats → 404 (no such endpoint)
GET /api/trpc/subscription.get → 401 UNAUTHORIZED
GET /api/trpc/products.list → 401 UNAUTHORIZED
```

---

## SECTION 4: ALL AI TOOLS

All tools tested via `POST /api/chat`. Auth is optional on this endpoint — works without auth but has no conversation memory (SERVICE_ROLE_KEY missing prevents history saving).

| Tool | Responds | AU-Specific | First 100 chars of response | Score |
|------|----------|-------------|---------------------------|-------|
| AI Chat | ✅ Y | ✅ Y | `G'day! Let's cut through the noise and look at what's actually working in Australia right now:` | 82/100 |
| Product Discovery | ✅ Y | ✅ Y | `# Posture Corrector - AU Market Analysis 🇦🇺 ## **Pricing & Margins** **Selling Price Range (AUD):**` | 85/100 |
| Website Generator | ✅ Y | ✅ Y | `{"headline": "Pure Supplements. Nothing You Don't Need.", ...TGA-compliant, Afterpay, AusPost...}` | 80/100 |
| Meta Ads | ✅ Y | ✅ Y | `# Posture Corrector — AU Women 30-50 @ A$49 **MARKET SIGNAL:** Solid mid-tier positioning...` | 88/100 |
| Validate | ✅ Y | ✅ Y | `# **Posture Corrector | AU Market Analysis** ## **📊 FULL COGS BREAKDOWN (AUD)**` | 90/100 |
| Copywriter | ✅ Y | ✅ Y | `# Stand Taller. Feel Lighter. Look Confident — In Just 20 Minutes a Day` | 88/100 |
| Email Sequences | ✅ Y | ✅ Y | `# 5-Email Welcome Sequence | AU Fitness Store ## **Email 1: Welcome + 10% Off** Subject: ...Afterpay` | 87/100 |
| Supplier Finder | ✅ Y | ✅ Y | `# Resistance Bands Sourcing to Australia ## Top Alibaba/1688 Suppliers **1. Nantong Juli Sports**` | 85/100 |
| Keyword Miner | ✅ Y | ✅ Y | `# Resistance Bands - Australia SEO Analysis ## 1. PRIMARY KEYWORDS (AU Monthly Search Volume Estimates)` | 83/100 |
| TikTok Builder | ✅ Y | ✅ Y | `# TikTok Slideshow Script: Posture Corrector (AU Faceless) **POST TIME:** 7:00 PM AEST` | 85/100 |
| Audience Profiler | ✅ Y | ✅ Y | `# AU Gym Enthusiast Audience Profile 🇦🇺 ## Demographics **Age Range:** 25-42 (core sweet spot: 28-35)` | 86/100 |

**AI Tools Notes:**
- ✅ ALL 11 tools respond successfully
- ✅ ALL are strongly AU-specific (AUD, Afterpay, AusPost, TGA, AEST, etc.)
- ⚠️ Website Generator takes ~33 seconds to respond — will likely hit timeout in real users' browsers
- ⚠️ Conversation memory is BROKEN — SUPABASE_SERVICE_ROLE_KEY missing means `saveMessage()` fails silently. Every chat session starts fresh.
- ⚠️ `/api/chat` is publicly accessible without auth — any non-user can hammer the AI endpoint and run up Anthropic bills
- ❌ `toolName: "website-generator"` returned empty string on first quick test (33s timeout) — users on slow connections will see blank screen

**AI Tools Average Score: 85/100** (tools themselves work well; infrastructure issues are the problem)

---

## SECTION 5: FRONTEND CODE AUDIT

### TypeScript
```
pnpm run check → EXIT CODE: 0 ✅ (No TypeScript errors)
```

### TODO / FIXME / Placeholders Found

```
client/src/lib/tools.ts:678      | Units/month for $5K AUD profit | XXX units |  ❌ UNFILLED TEMPLATE
client/src/lib/tools.ts:679      | Units/month for $10K AUD profit | XXX units | ❌ UNFILLED TEMPLATE
client/src/pages/ValidateTool.tsx:24  | Units/month for $5K AUD profit | XXX units |  ❌ SAME BUG
client/src/pages/ValidateTool.tsx:25  | Units/month for $10K AUD profit | XXX units | ❌ SAME BUG
client/src/pages/WebsiteGenerator.tsx:756   ABN: XX XXX XXX XXX  ❌ FAKE ABN in template
client/src/pages/WebsiteGenerator.tsx:1710  ABN: XX XXX XXX XXX  ❌ FAKE ABN in footer preview
client/src/components/Map.tsx:141    mapId: "DEMO_MAP_ID"  ❌ Google Maps demo ID
client/src/pages/store/StoreSetup.tsx:169   placeholder="act_XXXXXXXXXXXXXXX"  ⚠️ (acceptable, just a placeholder hint)
```

### Other Issues
- `DemoWidget.tsx` exists — unclear if it's used in production UI or development only. Has `DEMO_STYLES` constant.
- `ComponentShowcase.tsx` page exists in production codebase — likely dev-only but accessible via direct URL

---

## SECTION 6: SERVER HEALTH

```bash
curl http://localhost:3000/app/onboarding → 200 OK (SPA HTML) ✅
curl http://localhost:3000/api/trpc/ -I → 204 No Content ✅
Server process: running ✅
No /api/health endpoint: minor issue (⚠️)
```

### Critical Server Issues
1. **`SUPABASE_SERVICE_ROLE_KEY` missing** — cascading failure across ALL authenticated features ❌
2. **`/api/chat` has no auth gate** — unauthenticated users can call Claude API freely ❌ (security + cost risk)
3. **`/api/chat` conversation history broken** — `saveMessage()` fails silently when service role key missing ❌

---

## SECTION 7: MOBILE/RESPONSIVE AUDIT

### What Works
- `html, body { overflow-x: hidden; }` ✓
- `overflow-x: hidden` also set at line 141 of `index.css` ✓
- No problematic fixed pixel widths in business logic components
- All `min-w-[...]` usages are from shadcn/ui dropdown/select components — all contextually appropriate (8rem, 12rem)
- Dashboard uses `grid-cols-2 sm:grid-cols-4`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — correct ✓
- Mobile logo breakpoint (`lg:hidden`) in sign-in flow ✓

### Minor Issues
- Right sidebar (280px fixed width) in Dashboard is `hidden md:block` — collapses on mobile ✓ (acceptable)
- No issues requiring action

**Mobile Score: 80/100**

---

## FINAL SCORE: 52/100

### Score Breakdown
| Section | Score |
|---------|-------|
| Auth | 40/100 |
| Onboarding | 55/100 |
| Dashboard | 35/100 |
| AI Tools | 85/100 |
| Frontend Code | 75/100 |
| Server Health | 40/100 |
| Mobile/Responsive | 80/100 |
| **OVERALL** | **52/100** |

---

## 🔴 THE BRUTAL SUMMARY

The AI tools work brilliantly — every single one responds, they're genuinely AU-specific, and the content quality is legitimately good. That's probably 70% of the product's value. But everything that requires a logged-in user is effectively dead on arrival: **`SUPABASE_SERVICE_ROLE_KEY` is missing from `.env.local`**, which means the server cannot validate any JWT token, which means every `protectedProcedure` returns UNAUTHORIZED, which means products, subscriptions, saved outputs, profile data, onboarding saves — all of it fails silently. The dashboard is wallpapered with hardcoded fake data ("+12%" change indicators that never change, a "47 sellers joined this week" counter that's always 47, sparklines pulled from a static array, revenue estimated at `productCount × $49`). Users who sign in, try to save a product, check their subscription, or onboard properly will hit a wall of UNAUTHORIZED errors — none of which surface as user-facing error messages. The AI chat works because it doesn't require auth, but conversation history is also broken (saves fail silently). One env var fix (`SUPABASE_SERVICE_ROLE_KEY`) would unblock the authentication cascade. The fake dashboard data needs to be replaced with real queries. Until both are fixed, this is a demo with a login screen bolted on.

---

## 🔥 TOP 3 CRITICAL ISSUES

1. **`SUPABASE_SERVICE_ROLE_KEY` not in `.env.local`** — Server-side auth broken. All protectedProcedure endpoints UNAUTHORIZED. Fix: Add key to .env.local (and Vercel env vars for prod).

2. **Dashboard is full of fake/hardcoded data** — Stat changes (+12%, +8%, +24%, +5%), sparklines, seller count badge, progress tracker, revenue estimate — none of it is real. Users are being shown fabricated metrics.

3. **AI chat has no auth gate** — `POST /api/chat` accepts requests from anyone without a token. Zero auth. Anyone can hammer Claude Sonnet API without signing up, running up Anthropic charges with no accountability.

---

*Generated: 2026-03-13 | Auditor: Claude Code (harsh mode)*
