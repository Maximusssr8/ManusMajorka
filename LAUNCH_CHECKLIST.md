# Majorka Launch Checklist

Everything in this file is **external work** that cannot be done from code — it requires logging into a vendor dashboard. Work through top to bottom; nothing below this line is optional for a real launch.

## 1. Rotate leaked secrets (CRITICAL)

The following keys were previously hardcoded in git history and must be rotated before going live:

| Vendor | What to rotate | Where |
|---|---|---|
| Supabase | `SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → Reset service_role key |
| RapidAPI | AliExpress API key | RapidAPI Dashboard → Apps → your app → Regenerate |
| Pexels | API key | Pexels Dashboard → Your API Key → Regenerate |

After rotating, update Vercel env vars (section 3) with the new values.

## 2. Create Stripe products

In Stripe Dashboard → Products:

1. **Builder plan** — AU$99/month, recurring. Copy the Price ID (`price_...`). Set `STRIPE_BUILDER_PRICE_ID` in Vercel.
2. **Scale plan** — AU$199/month, recurring. Copy the Price ID. Set `STRIPE_SCALE_PRICE_ID` in Vercel.

Make sure the account is in **Live mode**, not Test, and that `STRIPE_SECRET_KEY` is the `sk_live_...` key.

## 3. Vercel environment variables

Paste each of these in Vercel → Project → Settings → Environment Variables. Mark all as **Production** (and **Preview** if you want preview deploys to work end to end).

### Required (app refuses to start without these — see `server/lib/validateEnv.ts`)

```
SUPABASE_URL=https://ievekuazsjbdrltsdksn.supabase.co
VITE_SUPABASE_URL=https://ievekuazsjbdrltsdksn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<rotated value from section 1>
VITE_SUPABASE_ANON_KEY=<from Supabase dashboard>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
```

### Required for checkout

```
STRIPE_BUILDER_PRICE_ID=price_...  # from section 2
STRIPE_SCALE_PRICE_ID=price_...    # from section 2
```

### Required for admin panel

```
ADMIN_USER_ID=c2ee80e9-1b1b-4988-bea5-8f5278e6d25e
ADMIN_EMAIL=maximusmajorka@gmail.com
```

### Optional (features degrade without these)

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
APIFY_API_TOKEN=apify_api_...
SENTRY_DSN=https://...@sentry.io/...
RAPIDAPI_KEY=<rotated>
PEXELS_API_KEY=<rotated>
CRON_SECRET=<random string>
```

## 4. Run the `usage_counters` migration on Supabase

Apply `supabase/migrations/20260411_usage_counters.sql` against production:

```bash
# Option A: Supabase CLI (preferred)
supabase db push

# Option B: paste into Supabase SQL Editor and run
cat supabase/migrations/20260411_usage_counters.sql | pbcopy
```

Verify:

```bash
curl -s "$SUPABASE_URL/rest/v1/usage_counters?select=count" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: count=exact" -I | grep content-range
```

Should return `content-range: 0-0/0` (empty table is fine).

## 5. Stripe webhook endpoint

In Stripe Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://majorka.io/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET` (section 3).

## 6. Post-deploy smoke test

After `vercel --prod --yes`:

1. Landing page loads at `majorka.io`
2. Sign up with a throwaway email
3. Click upgrade → Stripe Checkout opens with AUD pricing
4. Use Stripe test card in test mode, or real card in live mode
5. Webhook flips user to `active` / `builder`
6. `/app` loads without upgrade wall
7. Generate an ad brief → check `usage_counters` row incremented
8. Hit `/app/admin` as admin user → admin panel renders
