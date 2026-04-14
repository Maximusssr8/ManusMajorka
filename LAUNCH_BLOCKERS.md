# Launch Blockers — 2026-04-14

## Status: HOLD on push (technical verification PASSES, but branch divergence blocks merge)

## Summary

Local `main` passed every technical and wiring check in the launch audit:

- `npx tsc --noEmit`: 0 errors
- `pnpm run build`: clean
- `node scripts/build-api.mjs`: clean exit
- `console.log` in `client/src`: 0
- Banned colors/fonts (indigo|purple|#6366|#4F46|#818C|Nohemi|Bricolage) in `client/src`: 0
- `TODO|FIXME` in `client/src`: 0
- Bundle secret scan: only false positives (`ask-user-about-supersession-threat` in emacs-lisp.js syntax dictionary)
- All critical routes wired in `client/src/App.tsx`
- All required server routers mounted in `api/_server.ts` (products, ai, alerts, stripe, auth, revenue, academy, user, weeklyDigest, stores, pipeline, cron)
- `vercel.json` crons include apify-pipeline, check-alerts, check-trials, weekly-digest, snapshot-history (no CJ refs)
- `scripts/apply-migrations.ts` updated this session to register all 13 migrations (chat-history, revenue, trials, academy-progress, product-views, stores added).

Local HEAD: `25afa0d feat: Majorka launch ready — full platform verified`

## Blocker: Branch divergence with 99 commits upstream

When pushing, `origin/main` was discovered to be 99 commits ahead of my local branch, including a parallel launch-audit commit:

```
d265b30 fix: launch audit — purge indigo from 20 files + fix routing + cleanup
98eedc4 feat: AliExpress URL → Store → Shopify pipeline + launch audit fixes
fc9124b feat: Resend email system + Shopify sync fixes + product import + Store Builder audit
3c8492f fix(P0): stale chunks crash signup + homepage scroll + ad briefs markdown
... (95 more)
```

Local has 13 mobile-responsive commits that are NOT in the remote:

```
25afa0d feat: Majorka launch ready — full platform verified  (this session)
0ca9cb6 feat(mobile): Pricing plan stack + feature card-stack
f3fb437 feat(mobile): Onboarding full-width wizard + sticky CTA
787c82c feat(mobile): Admin tables overflow + KPI stack
5c632f6 feat(mobile): Settings tabs scroll + form max-width
ca9c90b feat(mobile): AdsStudio two-panel stack + saved-sets sheet
f5a5895 feat(mobile): landing page auto-fit grids + responsive hero
0a1aeee feat(mobile): Maya chat + modals + global mobile safety net
56dc0c6 feat(mobile): Home + Store Builder + Revenue responsive sweep
ec0ee97 feat(mobile): Products page + detail drawer responsive sweep
...
```

## What I Tried

1. `git pull --rebase origin main` — 99-commit rebase failed at commit 3 with conflict in `client/src/pages/app/Home.tsx` and other files. Aborted.
2. `git pull --no-rebase origin main` (merge) — conflicts in ~30 files across client + server + config:
   - client: Home.tsx, Products.tsx, AdsStudio.tsx, StoreBuilder, store/*, tools/ROASCalculator, styles/components.css
   - server: stripe.ts, video-scraper.ts, requireAuth.ts, ai.ts, alerts.ts, auth.ts, cron.ts, products.ts
   - config: vercel.json, vite.config.ts
   Aborted.

## Why I Did Not Force-Push

Force-pushing `25afa0d` over `origin/main` would erase 99 upstream commits including another agent's parallel launch audit (purge indigo, fix routing, Resend emails, AliExpress pipeline, P0 signup fixes, whitelist fix). That work is almost certainly required for launch and erasing it would be catastrophic.

Per audit scope: "No feature additions. No architectural changes." Resolving 30-file cross-cutting merge conflicts across server route handlers is architectural reconciliation, not a verification fix — outside scope and risky without human review.

## Recommended Next Action (human in the loop)

Pick ONE of:

1. **Adopt remote as canonical.** `git reset --hard origin/main` locally (destroys the 13 mobile commits — recoverable from reflog). Then re-apply the migration registration edit from this session on top. Recommended if remote's launch audit is the source of truth.
2. **Cherry-pick local mobile commits onto remote.** `git checkout origin/main`, then `git cherry-pick ec0ee97..0ca9cb6 25afa0d`. Resolve conflicts per file with the operator who knows which side wins for each.
3. **Three-way merge with operator.** Redo `git merge origin/main`, resolve each of ~30 conflicts manually with the operator deciding precedence per file.

## Technical Verification Status (all PASS)

| Check | Result |
|---|---|
| tsc --noEmit | 0 errors |
| pnpm run build | clean |
| build-api.mjs | clean exit |
| console.log in client/src | 0 |
| banned colors/fonts | 0 |
| TODO/FIXME | 0 |
| secrets in bundle | 0 real hits |
| routes wired | all present |
| server routers mounted | all present |
| crons configured | all present |
| migrations registered | 13/13 after this session's fix |

## One-line Verdict

**Code is launch-ready on this branch. Merge/rebase with upstream `origin/main` (which has 99 parallel launch commits) is required before any push.**
