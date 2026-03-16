/**
 * Stripe integration — checkout sessions, customer portal, subscription management, webhook handling.
 * Uses STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET from process.env.
 * ALL functions gracefully return null/false if STRIPE_SECRET_KEY is not set.
 */
import type { Express } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '../_core/supabase';

// ── Stripe client ──────────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// ── Checkout session ──────────────────────────────────────────────────────────

export interface CreateCheckoutOptions {
  userId: string;
  userEmail?: string;
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession(opts: CreateCheckoutOptions): Promise<{ url: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const priceId = opts.priceId ?? process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) return null;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: opts.userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: opts.successUrl ?? 'https://majorka.io/app?upgraded=true',
    cancel_url: opts.cancelUrl ?? 'https://majorka.io/pricing',
    client_reference_id: opts.userId,
    metadata: { userId: opts.userId },
    subscription_data: { metadata: { userId: opts.userId } },
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return { url: session.url };
}

// ── Customer portal ───────────────────────────────────────────────────────────

export async function createCustomerPortal(
  customerId: string,
  returnUrl?: string
): Promise<{ url: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl ?? 'https://majorka.io/app/billing',
  });
  return { url: session.url };
}

// ── Subscription status ───────────────────────────────────────────────────────

export interface SubscriptionStatus {
  plan: string;
  status: string;
  periodEnd: string | null;
  stripeCustomerId: string | null;
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('user_subscriptions')
    .select('plan, status, current_period_end, stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!data) {
    return { plan: 'free', status: 'active', periodEnd: null, stripeCustomerId: null };
  }
  return {
    plan: data.plan ?? 'free',
    status: data.status ?? 'active',
    periodEnd: data.current_period_end ?? null,
    stripeCustomerId: data.stripe_customer_id ?? null,
  };
}

// ── Upsert subscription in Supabase ──────────────────────────────────────────

async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: string;
  status: string;
  currentPeriodEnd?: Date;
}) {
  const sb = getSupabaseAdmin();
  await sb.from('user_subscriptions').upsert(
    {
      user_id: data.userId,
      stripe_customer_id: data.stripeCustomerId ?? null,
      stripe_subscription_id: data.stripeSubscriptionId ?? null,
      plan: data.plan,
      status: data.status,
      current_period_end: data.currentPeriodEnd?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

// ── Webhook handling ──────────────────────────────────────────────────────────

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return null;
  const stripe = getStripe();
  if (!stripe) return null;
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function handleWebhook(rawBody: Buffer, signature: string): Promise<boolean> {
  const event = constructWebhookEvent(rawBody, signature);
  if (!event) return false;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      if (!userId) {
        console.warn('[Stripe] checkout.session.completed: missing userId in metadata');
        return true;
      }

      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id;

      let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      if (subscriptionId) {
        try {
          const stripe = getStripe()!;
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          periodEnd = new Date(stripeSub.current_period_end * 1000);
        } catch (err) {
          console.warn('[Stripe] Failed to retrieve subscription:', err);
        }
      }

      await upsertSubscription({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: periodEnd,
      });

      console.info(`[Stripe] Subscription activated for user ${userId}`);
      break;
    }

    case 'customer.subscription.updated': {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.userId;
      if (!userId) break;

      const periodEnd = new Date(stripeSub.current_period_end * 1000);
      const status =
        stripeSub.status === 'active' ? 'active'
        : stripeSub.status === 'canceled' ? 'cancelled'
        : 'expired';

      await upsertSubscription({
        userId,
        stripeSubscriptionId: stripeSub.id,
        plan: status === 'active' ? 'pro' : 'free',
        status,
        currentPeriodEnd: periodEnd,
      });
      console.info(`[Stripe] Subscription updated for user ${userId}: ${status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.userId;
      if (!userId) break;

      const periodEnd = new Date(stripeSub.current_period_end * 1000);
      await upsertSubscription({
        userId,
        stripeSubscriptionId: stripeSub.id,
        plan: 'free',
        status: 'cancelled',
        currentPeriodEnd: periodEnd,
      });
      console.info(`[Stripe] Subscription cancelled for user ${userId}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (!subId) break;
      console.warn(`[Stripe] Payment failed for subscription ${subId}`);
      break;
    }

    default:
  }

  return true;
}

// ── Express route registration ───────────────────────────────────────────────

export function registerStripeRoutes(app: Express) {
  // POST /api/stripe/checkout-session
  app.post('/api/stripe/checkout-session', async (req, res) => {
    if (!isStripeConfigured()) {
      return res.status(503).json({ configured: false, error: 'Payment processing launching soon' });
    }
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.slice(7);
      const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

      const { priceId, successUrl, cancelUrl } = req.body ?? {};
      const result = await createCheckoutSession({
        userId: user.id,
        userEmail: user.email,
        priceId,
        successUrl: successUrl ?? 'https://majorka.io/app?upgraded=true',
        cancelUrl: cancelUrl ?? 'https://majorka.io/pricing',
      });
      if (!result) return res.status(503).json({ configured: false });
      res.json(result);
    } catch (err: any) {
      console.error('[stripe] checkout error:', err);
      res.status(500).json({ error: err.message ?? 'Stripe error' });
    }
  });

  // POST /api/stripe/customer-portal
  app.post('/api/stripe/customer-portal', async (req, res) => {
    if (!isStripeConfigured()) {
      return res.status(503).json({ configured: false, error: 'Payment processing launching soon' });
    }
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
      const token = authHeader.slice(7);
      const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

      const subStatus = await getSubscriptionStatus(user.id);
      if (!subStatus.stripeCustomerId) {
        return res.status(400).json({ error: 'No active subscription found' });
      }

      const result = await createCustomerPortal(
        subStatus.stripeCustomerId,
        req.body?.returnUrl ?? 'https://majorka.io/app/billing'
      );
      if (!result) return res.status(503).json({ configured: false });
      res.json(result);
    } catch (err: any) {
      console.error('[stripe] portal error:', err);
      res.status(500).json({ error: err.message ?? 'Stripe error' });
    }
  });

  // GET /api/stripe/subscription-status
  app.get('/api/stripe/subscription-status', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
      const token = authHeader.slice(7);
      const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

      const status = await getSubscriptionStatus(user.id);
      res.json({
        plan: status.plan,
        status: status.status,
        periodEnd: status.periodEnd,
        stripeConfigured: isStripeConfigured(),
      });
    } catch (err: any) {
      console.error('[stripe] status error:', err);
      res.status(500).json({ error: err.message ?? 'Error' });
    }
  });

  // POST /api/stripe/webhook
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing Stripe signature header' });
    }
    try {
      await handleWebhook(req.body as Buffer, signature);
      res.json({ received: true });
    } catch (err: any) {
      console.error('[Stripe webhook] Error:', err.message);
      res.status(400).json({ error: err.message });
    }
  });
}
