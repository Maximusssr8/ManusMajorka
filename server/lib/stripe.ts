/**
 * Stripe integration — checkout sessions and webhook handling.
 * Uses STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET from process.env.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error stripe will be available after pnpm install

import type { Express } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '../_core/supabase';
import { createSubscription, getSubscriptionByUserId, updateSubscriptionStatus } from '../db';

// ── Stripe client ──────────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }
  return _stripe;
}

// ── Checkout session ──────────────────────────────────────────────────────────

export interface CreateCheckoutOptions {
  userId: string;
  userEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession(opts: CreateCheckoutOptions): Promise<{ url: string }> {
  const stripe = getStripe();

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_PRO_PRICE_ID is not set');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: opts.userEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url:
      opts.successUrl ?? `${process.env.VITE_APP_URL ?? 'https://majorka.ai'}/app?success=1`,
    cancel_url: opts.cancelUrl ?? `${process.env.VITE_APP_URL ?? 'https://majorka.ai'}/account`,
    metadata: {
      userId: opts.userId,
    },
    subscription_data: {
      metadata: {
        userId: opts.userId,
      },
    },
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return { url: session.url };
}

// ── Webhook handling ──────────────────────────────────────────────────────────

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function handleWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) {
        console.warn('[Stripe] checkout.session.completed: missing userId in metadata');
        return;
      }

      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      // Retrieve subscription details for period dates
      let periodStart = new Date();
      let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days

      if (subscriptionId) {
        try {
          const stripe = getStripe();
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          periodStart = new Date(stripeSub.current_period_start * 1000);
          periodEnd = new Date(stripeSub.current_period_end * 1000);
        } catch (err) {
          console.warn('[Stripe] Failed to retrieve subscription:', err);
        }
      }

      const existing = await getSubscriptionByUserId(userId);
      if (existing) {
        // Update existing subscription to active
        await updateSubscriptionStatus(userId, 'active', periodEnd);
      } else {
        // Create new subscription record
        await createSubscription({
          userId,
          status: 'active',
          plan: 'pro',
          priceInCents: 9900, // $99 AUD
          currency: 'AUD',
          periodStart,
          periodEnd,
        });
      }

      console.log(`[Stripe] Subscription activated for user ${userId}`);
      break;
    }

    case 'customer.subscription.updated': {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.userId;
      if (!userId) return;

      const periodEnd = new Date(stripeSub.current_period_end * 1000);
      const status =
        stripeSub.status === 'active'
          ? 'active'
          : stripeSub.status === 'canceled'
            ? 'cancelled'
            : 'expired';

      await updateSubscriptionStatus(userId, status, periodEnd);
      console.log(`[Stripe] Subscription updated for user ${userId}: ${status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.userId;
      if (!userId) return;

      const periodEnd = new Date(stripeSub.current_period_end * 1000);
      await updateSubscriptionStatus(userId, 'cancelled', periodEnd);
      console.log(`[Stripe] Subscription cancelled for user ${userId}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (!subId) return;
      console.warn(`[Stripe] Payment failed for subscription ${subId}`);
      // Could update status here if needed
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
}

// ── Express route registration ───────────────────────────────────────────────

export function registerStripeRoutes(app: Express) {
  // POST /api/stripe/checkout-session
  app.post('/api/stripe/checkout-session', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.slice(7);
      const {
        data: { user },
        error,
      } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

      const { url } = await createCheckoutSession({
        userId: user.id,
        userEmail: user.email,
        successUrl: `${req.headers.origin ?? 'https://manus-majorka.vercel.app'}/app?success=1`,
        cancelUrl: `${req.headers.origin ?? 'https://manus-majorka.vercel.app'}/account`,
      });
      res.json({ url });
    } catch (err: any) {
      console.error('[stripe] checkout error:', err);
      res.status(500).json({ error: err.message ?? 'Stripe error' });
    }
  });

  // POST /api/stripe/webhook (for future use)
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    res.json({ received: true });
  });
}
