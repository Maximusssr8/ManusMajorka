# Stripe Integration Checklist
_Audited: 2026-03-17_

## Code Status

| Item | Status | Notes |
|------|--------|-------|
| POST /api/stripe/webhook exists | ✅ DONE | Registered in api/_server.ts + server/_core/index.ts |
| webhook handles checkout.session.completed | ✅ DONE | Writes to user_subscriptions |
| webhook handles customer.subscription.updated | ✅ DONE | Updates plan/status |
| webhook handles customer.subscription.deleted | ✅ DONE | Sets status = cancelled |
| upsertSubscription writes correct fields | ✅ DONE | user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end |
| requireSubscription reads from user_subscriptions | ✅ FIXED (2026-03-17) | Was broken — read from wrong table |
| Pricing page wired to /api/stripe/checkout-session | ✅ DONE | With loading state and redirect |
| Checkout success redirect | ✅ DONE | Returns to /app with session |
| STRIPE_SECRET_KEY in Vercel | ✅ SET | ⚠️ Currently sk_test_ (TEST MODE) |
| STRIPE_WEBHOOK_SECRET in Vercel | ✅ SET | Needs update for live endpoint |
| STRIPE_PUBLISHABLE_KEY in Vercel | ✅ SET | ⚠️ Currently test key |
| STRIPE_PRO_PRICE_ID in Vercel | ✅ SET | ⚠️ Needs live price ID |

## ⚠️ MANUAL ACTIONS REQUIRED (Stripe Dashboard)

### 1. Switch to Live Mode

Go to https://dashboard.stripe.com → Switch to Live mode (top-left toggle).

Update these in Vercel Dashboard → majorka project → Environment Variables:
- `STRIPE_SECRET_KEY` → Replace with live key starting with `sk_live_`
- `STRIPE_PUBLISHABLE_KEY` → Replace with live key starting with `pk_live_`
- `STRIPE_PRO_PRICE_ID` → Get from Stripe Dashboard → Products → Your product → Pricing → Copy price ID (starts with `price_`)

### 2. Register Webhook Endpoint

Go to https://dashboard.stripe.com/webhooks → Add endpoint:
- URL: `https://majorka.io/api/stripe/webhook`
- Events to listen to:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- After creating: Copy the webhook signing secret
- Update Vercel: `STRIPE_WEBHOOK_SECRET` → paste the new `whsec_` value

### 3. Create user_subscriptions table in Supabase

Run in Supabase Dashboard → SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text DEFAULT 'free',
  status text DEFAULT 'inactive',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 4. Redeploy after env var changes

After updating all Vercel env vars, trigger a redeploy:
`vercel --prod --force`

## What Happens After Payment (Flow)

1. User clicks "Get Started" on Pricing page
2. POST /api/stripe/checkout-session → creates Stripe Checkout session
3. User completes payment on Stripe hosted page
4. Stripe fires `checkout.session.completed` webhook
5. webhook handler calls upsertSubscription → writes to Supabase `user_subscriptions`
6. User redirected to /app?success=true
7. requireSubscription middleware reads user_subscriptions → allows access to premium features
