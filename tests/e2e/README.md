# Majorka E2E Tests

## Run all tests
```bash
pnpm test:e2e
```

## Run specific suite
```bash
npx playwright test tests/e2e/02-product-research.spec.ts
```

## View HTML report
```bash
npx playwright show-report tests/e2e/report
```

## Prerequisites
Dev server must be running at `http://127.0.0.1:3000` before running tests:
```bash
cd ~/ManusMajorka && PORT=3000 pnpm run dev
```

## Test suites
1. **01-auth** — Landing page, OAuth button, route protection, localStorage mock validation
2. **02-product-research** — API endpoint existence, product-discovery/validate/supplier-finder tools
3. **03-meta-ads** — Meta ads API endpoint, JSON structure, rate limiting behaviour
4. **04-pricing** — 3 tiers visible, Starter CTA text, AUD pricing indicators
5. **05-onboarding** — 5-step wizard loads, niche cards visible, skip works, dashboard greeting

## Notes
- Auth tests use localStorage mock (validates injection; server-side Supabase SSR still requires cookie session)
- Tool tests verify API endpoint existence and response structure (rate-limited in CI — returns 429, not 5xx)
- Rate-limit test verifies 429 errors are structured correctly (not 5xx crashes)
- Dev server must be running at localhost:3000 — uses IPv4 `127.0.0.1` (not `localhost` which may resolve to IPv6)
- server/lib/affiliate.ts `/api/stats/users` has a try/catch for DB fallback (fix applied during test setup)
