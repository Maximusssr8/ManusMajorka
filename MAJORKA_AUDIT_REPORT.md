# Majorka Security & Code Quality Audit
*Generated: 2026-03-13 16:50 AEST*

## Executive Summary

### Semgrep Security Scan
- Total findings: 7
- 🔴 ERROR: 1
- 🟡 WARNING: 6

### Critical Issues (must fix before launch)

**[WARNING] client/src/pages/LearnHub.tsx:242**
Rule: `typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml`
Issue: Detection of dangerouslySetInnerHTML from non-constant definition. This can inadvertently expose users to cross-site scripting (XSS) attacks if this comes from user-provided input. If you have to use 

**[WARNING] client/src/pages/MetaAdsPack.tsx:157**
Rule: `javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization`
Issue: `priceMatch.replace` method will only replace the first occurrence when used with a string argument ("$"). If this method is used for escaping of dangerous data then there is a possibility for a bypas

**[WARNING] client/src/pages/Pricing.tsx:255**
Rule: `javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization`
Issue: `plan.price.replace` method will only replace the first occurrence when used with a string argument ("$"). If this method is used for escaping of dangerous data then there is a possibility for a bypas

**[WARNING] client/src/pages/Pricing.tsx:264**
Rule: `javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization`
Issue: `plan.price.replace` method will only replace the first occurrence when used with a string argument ("$"). If this method is used for escaping of dangerous data then there is a possibility for a bypas

**[WARNING] client/src/pages/Pricing.tsx:398**
Rule: `javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization`
Issue: `plan.price.replace` method will only replace the first occurrence when used with a string argument ("$"). If this method is used for escaping of dangerous data then there is a possibility for a bypas

**[WARNING] client/src/pages/Pricing.tsx:400**
Rule: `javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization`
Issue: `plan.price.replace` method will only replace the first occurrence when used with a string argument ("$"). If this method is used for escaping of dangerous data then there is a possibility for a bypas

**[ERROR] client/src/pages/Storefront.tsx:38**
Rule: `javascript.browser.security.insecure-document-method.insecure-document-method`
Issue: User controlled data in methods like `innerHTML`, `outerHTML` or `document.write` is an anti-pattern that can lead to XSS vulnerabilities

### All Findings by File
- `client/src/pages/Pricing.tsx`: 4 issues
- `client/src/pages/LearnHub.tsx`: 1 issues
- `client/src/pages/MetaAdsPack.tsx`: 1 issues
- `client/src/pages/Storefront.tsx`: 1 issues

## Biome Code Quality

Biome v2.4.6 installed (replaces ESLint + Prettier). Config in `biome.json`.

**Initial scan:** 1061 errors, 390 warnings across 209 files  
**After auto-fix:** 697 errors, 339 warnings — **207 files auto-fixed**

Run with:
```bash
npx @biomejs/biome check client/src/ server/
```

## Manual Security Checks

### Hardcoded Secrets
✅ No hardcoded API keys or secrets found. All tokens/keys reference `process.env` or `import.meta.env`.

### Routes Without Explicit Auth Middleware
🟡 Several Express routes detected without visible auth middleware in the grep pattern:
- `server//_core/chat.ts` — `/api/chat` and `/api/chat/history` (have internal auth via token extraction)
- `server//_core/index.ts` — `/api/agent-log` (appears unprotected — review needed)
- `server//lib/affiliate.ts` — `/api/stats/users` (public stats endpoint — verify intended)
- `server//lib/tools-api.ts` — `/api/tools/*` (tool endpoints — confirm subscription check)

### Console.log Statements
🟡 5 console.log calls in production code — remove before launch.

### Supabase Direct DB Calls (non-admin client)
🟡 Several calls in `server//_core/chat.ts` and `server//lib/tools-api.ts` use non-admin Supabase client — these rely on RLS being correctly configured. Verify RLS policies are in place.

## Recommended Fix Order

### 🔴 Critical (fix before launch)
1. **XSS — Storefront.tsx:38** — User-controlled data in `innerHTML` — sanitize with DOMPurify
2. **XSS — LearnHub.tsx:242** — `dangerouslySetInnerHTML` from non-constant — validate/sanitize source
3. Verify `/api/agent-log` endpoint has proper auth — currently appears unprotected

### 🟡 Important (fix within 1 week)
4. `Pricing.tsx` + `MetaAdsPack.tsx` — Use `replaceAll()` or regex for `$` replacement (5 occurrences)
5. Add auth middleware to tool API routes if not already checked internally
6. Remove 5 `console.log` statements from production code
7. Review non-admin Supabase queries and confirm RLS coverage

### 🟢 Nice-to-have (technical debt)
8. Resolve remaining 697 Biome errors (mostly TypeScript `any`, unused vars)
9. Organise imports across 209 files
10. Code formatting consistency (already partially fixed by auto-fix)

## Quick Commands

```bash
# Run security scan
semgrep --config=auto server/ client/src/ --json > SEMGREP_REPORT.json

# Run linter
npx @biomejs/biome check client/src/ server/

# Auto-fix safe issues  
npx @biomejs/biome check --write client/src/ server/

# Check specific file
npx @biomejs/biome check client/src/pages/Storefront.tsx
```

## Notes
- Biome v2.4.6 installed — replaces ESLint + Prettier, config in `biome.json`
- Semgrep auto config used — no API key needed
- Re-run audit before each major release
