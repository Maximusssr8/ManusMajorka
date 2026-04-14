-- ─────────────────────────────────────────────────────────────────────────────
-- user_subscriptions — canonical subscription state for every authenticated user.
-- Populated by the Stripe webhook handler (checkout.session.completed,
-- customer.subscription.updated/deleted, invoice.payment_failed).
--
-- Fully idempotent: safe to re-run against existing databases.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id                UUID PRIMARY KEY,
  plan                   TEXT,
  status                 TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at          TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defensive ALTERs for pre-existing tables that may be missing newer columns.
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS plan                   TEXT,
  ADD COLUMN IF NOT EXISTS status                 TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at             TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_idx
  ON public.user_subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx
  ON public.user_subscriptions (status);

CREATE INDEX IF NOT EXISTS user_subscriptions_current_period_end_idx
  ON public.user_subscriptions (current_period_end)
  WHERE current_period_end IS NOT NULL;

-- RLS: read-own, writes via service role only.
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_subscriptions'
      AND policyname = 'user_subscriptions_select_own'
  ) THEN
    CREATE POLICY user_subscriptions_select_own
      ON public.user_subscriptions
      FOR SELECT
      USING (auth.uid()::text = user_id::text);
  END IF;
END $$;
