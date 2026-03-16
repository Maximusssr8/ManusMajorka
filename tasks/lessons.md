# Lessons Learned

Hard-won lessons from building Majorka. Read before touching anything DB-related.

---

## Supabase Migrations — Never Use Direct Postgres

**Problem:** Supabase DB host (`db.ievekuazsjbdrltsdksn.supabase.co`) is IPv6-only.
Both local Mac (no IPv6 route) and Vercel (IPv4 only) cannot reach it directly.
`DATABASE_URL` postgres connections always fail with `connect ECONNREFUSED`.

**What we tried that failed:**
- Direct `postgres://` connection via `pg` or `postgres` npm package → ECONNREFUSED
- Supavisor pooler (`aws-0-ap-southeast-2.pooler.supabase.com`) → "Tenant or user not found"
- URL-encoding the password (`Romania1992%21Chicken.`) → still fails
- Explicit pooler config object → still can't reach
- `exec_sql` RPC → not enabled on this project (`PGRST202`)

**The working pattern:**
```ts
// Use Supabase REST API with service role key — always works
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if table exists
const check = await fetch(`${supabaseUrl}/rest/v1/my_table?limit=1`, {
  headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
});
// check.ok → table exists

// For DDL (CREATE TABLE etc): use Supabase Dashboard → SQL Editor
// https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new
```

**Rule:** Never attempt `DATABASE_URL` / direct postgres connections in this project.
All DB operations → Supabase REST API (`/rest/v1/`) with service role key.
DDL (schema changes) → Supabase Dashboard SQL Editor, run manually.

**Env var names (both exist, prefer service role):**
- `VITE_SUPABASE_URL` — public anon URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role (full access)
- `VITE_SUPABASE_ANON_KEY` — anon key (RLS-restricted)
- `DATABASE_URL` — set in Vercel but unusable (IPv6 only)

---

## Shopify Push Route URL

The push endpoint is at `/api/store-builder/push`, NOT `/api/shopify/push`.
- `/api/shopify/*` → `server/routes/shopify.ts` (OAuth only)
- `/api/store-builder/*` → `server/routes/store-builder.ts` (generate + push)

---

## Vercel Env Var Naming

`SUPABASE_URL` does NOT exist in Vercel — only `VITE_SUPABASE_URL`.
Always use: `process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL`

---

## SSE Streaming (Website Generator)

- Use `res.write()` in a loop, never `res.json()` for streaming endpoints
- Final event must be `data: {"type":"complete","html":"...","manifest":{...}}\n\n`
- Progress format: `data: {"progress":N,"message":"...","type":"progress"}\n\n`
- Client must handle `EventSource` or manual `fetch` + stream reader

---

## Cookie Auth for Shopify OAuth State

- State cookie: `httpOnly: true, secure: prod-only, sameSite: 'lax', maxAge: 600_000`
- `secure: process.env.NODE_ENV === 'production'` — allows testing locally
- Cookie is set in `server/routes/shopify.ts`, NOT `server/lib/shopify.ts`
