-- ─────────────────────────────────────────────────────────────────────────────
-- Trial reminders + transactional-email de-dup tracking.
-- Safe to run repeatedly (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Trial window tracking on user_subscriptions.
ALTER TABLE IF EXISTS public.user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS user_subscriptions_trial_ends_at_idx
  ON public.user_subscriptions (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- 2. email_sends — dedup log for transactional emails.
--    One row per (user_id, template) pair; cron re-send is a no-op.
CREATE TABLE IF NOT EXISTS public.email_sends (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL,
  email         TEXT        NOT NULL,
  template      TEXT        NOT NULL,
  provider      TEXT,
  provider_id   TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_sends_user_template_unique UNIQUE (user_id, template)
);

CREATE INDEX IF NOT EXISTS email_sends_sent_at_idx
  ON public.email_sends (sent_at DESC);

CREATE INDEX IF NOT EXISTS email_sends_template_idx
  ON public.email_sends (template);

-- RLS — server writes via SERVICE_ROLE so no public policies needed.
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
