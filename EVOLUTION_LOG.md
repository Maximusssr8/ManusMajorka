# EVOLUTION LOG — Majorka

---

## AUDIT RESULTS — 2026-04-10 — CYCLE 1

### CRITICAL (fix immediately)

1. **server/lib/productPipeline.ts:15** — Hardcoded Supabase SERVICE_ROLE_KEY in source code. This key has full admin database access bypassing ALL RLS policies. Committed to git history. — Fix: Remove hardcoded key, use `process.env.SUPABASE_SERVICE_ROLE_KEY` only, throw if missing.

2. **server/lib/productPipeline.ts:12** — Hardcoded RapidAPI key (`72000f9eea...`) in source code. — Fix: Remove, use `process.env.RAPIDAPI_KEY` only.

3. **server/lib/productPipeline.ts:13** — Hardcoded Pexels API key (`EZjK9XGs...`) in source code. — Fix: Remove, use `process.env.PEXELS_API_KEY` only.

4. **server/middleware/requireSubscription.ts:43** — JWT payload decoded WITHOUT signature verification (`Buffer.from(token.split('.')[1], 'base64')`). Users can forge JWT claims (email, userId) to bypass subscription checks. The `requireAuth` middleware properly uses `supabase.auth.getUser()`, but `requireSubscription` does not. — Fix: Use `supabase.auth.getUser(token)` for proper cryptographic verification, matching `requireAuth` pattern.

5. **server/middleware/requireSubscription.ts:73-77** — When `SUPABASE_SERVICE_ROLE_KEY` is not set, middleware fails OPEN, granting `builder` plan access to anyone. — Fix: Fail closed (return 503) when service key is missing.

6. **drizzle-orm@0.44.7** — SQL injection vulnerability via improperly escaped SQL identifiers (GHSA-gpj5-g38j-94v9). Patched in >=0.45.2. — Fix: `pnpm update drizzle-orm`.

### WARNING (fix this cycle)

7. **client/src/components/ProductIntelligencePreview.tsx:6-8** — Hardcoded Supabase URL and anon key instead of using env vars. Anon keys are public by design, but hardcoding bypasses environment configuration. — Fix: Use `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.

8. **server/middleware/requireSubscription.ts:99-101** — On any DB error (not just "not found"), middleware fails open with `status: 'unknown'`. — Fix: Only fail open on transient network errors, fail closed on auth/permission errors.

9. **pnpm audit** — 49 total vulnerabilities: 3 critical, 16 high, 27 moderate, 3 low. Includes basic-ftp command injection via apify-client dependency. — Fix: `pnpm update` for direct deps, `pnpm audit --fix` where possible.

10. **App.tsx:90-120** — LoadingFallback uses `#060A12` background and `#6366F1` indigo, inconsistent with `#080808`/`#080a0e` used elsewhere in the app. — Fix: Standardize to `#080a0e` per CLAUDE.md design system.

11. **Multiple routes missing AppLayout wrapper** — `/admin/subscribers`, `/admin/leads`, `/admin`, `/app/product-search`, `/app/store/:subpage`, `/app/product-hub/:id` don't use `<AppLayout>` wrapper, causing no sidebar on these pages. — Fix: Wrap with `<AppLayout>`.

12. **No subscription gating on protected routes** — Routes like `/app/intelligence`, `/app/spy`, `/app/growth`, `/app/profit`, `/app/creators`, `/app/videos` check authentication but not subscription status. Free users can access paid features via direct URL. — Fix: Add server-side `requireSubscription` middleware to API endpoints backing these pages.

13. **Build output: 6 chunks over 600KB** — `index-C5hkzorR.js` is 1.6MB (526KB gzipped). Includes mermaid, cytoscape, charts. — Fix: Code-split heavy dependencies with dynamic imports.

14. **AlmostWonModal** — Gamification component imported in App.tsx. Against Bloomberg terminal design philosophy. — Fix: Remove component.

### SUGGESTION (fix if time)

15. **client/src/components/intelligence/ScoreRing.tsx** — Score ring visualization is gamification. Against design philosophy. — Fix: Replace with simple numeric badge.

16. **client/src/hooks/useCountUp.ts** — CountUp animation hook is gamification. — Fix: Replace with instant number display.

17. **client/src/components/StreakWidget.tsx** — Streak tracking is gamification. — Fix: Remove or replace with usage summary.

18. **window.location.replace** used for route redirects in App.tsx (lines 253-327) — Causes full page reload instead of client-side navigation. — Fix: Use wouter's `useLocation` hook for client-side redirects.

19. **client/src/components/SocialProofTicker.tsx** — Social proof ticker may be considered gamification depending on context. — Fix: Review and simplify.

20. **server/lib/rate-limit.ts vs server/lib/ratelimit.ts** — Two rate limiting files exist, potential duplication. — Fix: Consolidate.

Total: 6 Critical, 8 Warning, 6 Suggestion

---
