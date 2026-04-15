/**
 * Stripe integration — checkout sessions, customer portal, subscription management, webhook handling.
 * Uses STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET from process.env.
 * ALL functions gracefully return null/false if STRIPE_SECRET_KEY is not set.
 */
import type { Express } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '../_core/supabase';
import { sendTransactional } from './email';

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

// ── Plan → live Price ID mapping ──────────────────────────────────────────────

export function planToPriceId(plan: string): string | null {
  const map: Record<string, string | undefined> = {
    pro:     process.env.STRIPE_BUILDER_PRICE_ID, // legacy pro → builder
    builder: process.env.STRIPE_BUILDER_PRICE_ID,
    scale:   process.env.STRIPE_SCALE_PRICE_ID,
  };
  return map[plan.toLowerCase()] ?? process.env.STRIPE_BUILDER_PRICE_ID ?? null;
}

// ── Checkout session ──────────────────────────────────────────────────────────

export interface CreateCheckoutOptions {
  userId: string;
  userEmail?: string;
  /** Either a Stripe price ID (price_...) or a plan name (pro/builder/scale) */
  priceId?: string;
  plan?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession(opts: CreateCheckoutOptions): Promise<{ url: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  // Resolve price ID: accept plan name or direct price ID; plan name takes priority
  let priceId: string | null = null;
  if (opts.plan) {
    priceId = planToPriceId(opts.plan);
  } else if (opts.priceId?.startsWith('price_')) {
    priceId = opts.priceId;
  } else if (opts.priceId) {
    // Treat non-price_ value as a plan name fallback
    priceId = planToPriceId(opts.priceId) ?? opts.priceId;
  }
  priceId = priceId ?? process.env.STRIPE_PRO_PRICE_ID ?? null;
  if (!priceId) return null;

  // Look up existing Stripe customer by email to avoid duplicates
  let customerId: string | undefined;
  if (opts.userEmail) {
    try {
      const existing = await stripe.customers.list({ email: opts.userEmail, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({
          email: opts.userEmail,
          metadata: { userId: opts.userId },
        });
        customerId = created.id;
      }
    } catch (err) {
      console.warn('[Stripe] Customer lookup failed, proceeding without customer ID:', err);
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: opts.successUrl ?? 'https://majorka.io/dashboard?upgraded=true',
    cancel_url: opts.cancelUrl ?? 'https://majorka.io/pricing',
    client_reference_id: opts.userId,
    metadata: { userId: opts.userId },
    subscription_data: { metadata: { userId: opts.userId } },
  };

  if (customerId) {
    sessionParams.customer = customerId;
  } else if (opts.userEmail) {
    sessionParams.customer_email = opts.userEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
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
    return { plan: '', status: 'inactive', periodEnd: null, stripeCustomerId: null };
  }
  return {
    plan: data.plan ?? '',
    status: data.status ?? 'inactive',
    periodEnd: data.current_period_end ?? null,
    stripeCustomerId: data.stripe_customer_id ?? null,
  };
}

// ── Upsert subscription in Supabase ──────────────────────────────────────────

async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: string | null;
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

// ── Price ID → Plan name mapping ─────────────────────────────────────────────
function priceIdToPlan(priceId: string | undefined | null): string {
  if (!priceId) return 'builder';
  const map: Record<string, string> = {
    [process.env.STRIPE_PRO_PRICE_ID     ?? '']: 'builder', // legacy pro → builder
    [process.env.STRIPE_BUILDER_PRICE_ID ?? '']: 'builder',
    [process.env.STRIPE_SCALE_PRICE_ID   ?? '']: 'scale',
  };
  // Remove empty-string key so unknown prices fall through cleanly
  delete map[''];
  return map[priceId] ?? 'builder';
}

// ── Email notification helpers ───────────────────────────────────────────────

async function resolveUserEmail(userId: string): Promise<{ email: string; firstName?: string } | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.auth.admin.getUserById(userId);
    const email = data?.user?.email;
    if (!email) return null;
    const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const rawName = (meta.full_name ?? meta.name ?? meta.first_name ?? '') as string;
    const firstName = typeof rawName === 'string' ? rawName.trim().split(' ')[0] : undefined;
    return { email, firstName };
  } catch {
    return null;
  }
}

function formatAmount(amountCents: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amountCents !== 'number') return '';
  const ccy = (currency ?? 'aud').toUpperCase();
  return `$${(amountCents / 100).toFixed(2)} ${ccy}`;
}

function planDisplayName(plan: string): string {
  if (plan === 'scale') return 'Scale';
  if (plan === 'builder') return 'Builder';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export async function handleWebhook(rawBody: Buffer, signature: string): Promise<boolean> {
  const event = constructWebhookEvent(rawBody, signature);
  if (!event) return false;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Prefer client_reference_id (set at checkout creation), fall back to metadata
      const userId = session.client_reference_id || session.metadata?.userId;
      if (!userId) {
        console.warn('[Stripe] checkout.session.completed: missing userId — skipping');
        return true;
      }

      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id;

      let plan = 'builder';
      let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (subscriptionId) {
        try {
          const stripe = getStripe()!;
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          periodEnd = new Date(stripeSub.current_period_end * 1000);
          const priceId = stripeSub.items.data[0]?.price?.id;
          plan = priceIdToPlan(priceId);
          console.info(`[Stripe] checkout.session.completed: priceId=${priceId} → plan=${plan}`);
        } catch (err) {
          console.warn('[Stripe] Failed to retrieve subscription details:', err);
        }
      }

      await upsertSubscription({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: 'active',
        currentPeriodEnd: periodEnd,
      });

      console.info(`[Stripe] Subscription activated: user=${userId} plan=${plan}`);

      // Fire payment-confirmed email (first payment).
      try {
        const user = await resolveUserEmail(userId);
        if (user) {
          const amount = formatAmount(session.amount_total ?? null, session.currency);
          await sendTransactional(user.email, {
            template: 'payment_confirmed',
            data: {
              firstName: user.firstName,
              planName: planDisplayName(plan),
              amount,
              invoiceId: typeof session.invoice === 'string' ? session.invoice : session.invoice?.id,
              nextBillingDate: periodEnd.toISOString().slice(0, 10),
            },
          });
        }
      } catch (err) {
        console.warn('[Stripe] payment_confirmed email dispatch failed:', err);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as Stripe.Subscription | null)?.id;
      if (!subId) break;
      try {
        const stripe = getStripe()!;
        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const userId = stripeSub.metadata?.userId;
        if (!userId) break;
        const priceId = stripeSub.items.data[0]?.price?.id;
        const plan = priceIdToPlan(priceId);
        const user = await resolveUserEmail(userId);
        if (!user) break;
        await sendTransactional(user.email, {
          template: 'payment_confirmed',
          data: {
            firstName: user.firstName,
            planName: planDisplayName(plan),
            amount: formatAmount(invoice.amount_paid, invoice.currency),
            invoiceId: invoice.id,
            nextBillingDate: new Date(stripeSub.current_period_end * 1000).toISOString().slice(0, 10),
          },
        });
      } catch (err) {
        console.warn('[Stripe] invoice.paid email dispatch failed:', err);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.userId;
      if (!userId) {
        console.warn('[Stripe] subscription.updated: no userId in metadata — skipping');
        break;
      }

      const priceId = stripeSub.items.data[0]?.price?.id;
      const periodEnd = new Date(stripeSub.current_period_end * 1000);
      const isActive = stripeSub.status === 'active';
      const status = isActive ? 'active'
        : stripeSub.status === 'canceled' ? 'cancelled' : 'expired';
      const plan = isActive ? priceIdToPlan(priceId) : '';

      await upsertSubscription({
        userId,
        stripeSubscriptionId: stripeSub.id,
        plan,
        status,
        currentPeriodEnd: periodEnd,
      });
      console.info(`[Stripe] Subscription updated: user=${userId} plan=${plan} status=${status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.userId;
      if (!userId) {
        console.warn('[Stripe] subscription.deleted: no userId in metadata — skipping');
        break;
      }

      const periodEnd = new Date(stripeSub.current_period_end * 1000);
      await upsertSubscription({
        userId,
        stripeSubscriptionId: stripeSub.id,
        plan: null,
        status: 'cancelled',
        currentPeriodEnd: periodEnd,
      });
      console.info(`[Stripe] Subscription cancelled: user=${userId}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as any)?.id;
      if (!subId) break;

      // Look up userId from the subscription metadata
      try {
        const stripe = getStripe()!;
        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const userId = stripeSub.metadata?.userId;
        if (userId) {
          const sb = getSupabaseAdmin();
          await sb.from('user_subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);
          console.warn(`[Stripe] Payment failed → past_due for user=${userId} sub=${subId}`);

          // Fire payment-failed email with Stripe portal link.
          try {
            const user = await resolveUserEmail(userId);
            if (user) {
              const priceId = stripeSub.items.data[0]?.price?.id;
              const plan = priceIdToPlan(priceId);
              let portalUrl = 'https://majorka.io/app/billing';
              try {
                const customerId =
                  typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer?.id;
                if (customerId) {
                  const portal = await createCustomerPortal(customerId, 'https://majorka.io/app/billing');
                  if (portal?.url) portalUrl = portal.url;
                }
              } catch { /* fall back to static billing page */ }
              await sendTransactional(user.email, {
                template: 'payment_failed',
                data: {
                  firstName: user.firstName,
                  planName: planDisplayName(plan),
                  amount: formatAmount(invoice.amount_due, invoice.currency),
                  portalUrl,
                  reason: 'Card declined or expired',
                },
              });
            }
          } catch (err) {
            console.warn('[Stripe] payment_failed email dispatch failed:', err);
          }
        } else {
          console.warn(`[Stripe] invoice.payment_failed: no userId in subscription metadata for ${subId}`);
        }
      } catch (err) {
        console.error('[Stripe] invoice.payment_failed handler error:', err);
      }
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

      const { priceId, plan, successUrl, cancelUrl } = req.body ?? {};
      const result = await createCheckoutSession({
        userId: user.id,
        userEmail: user.email,
        priceId,
        plan,  // plan name (builder/scale) takes priority over raw priceId
        successUrl: successUrl ?? 'https://majorka.io/dashboard?upgraded=true',
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

  // NOTE: POST /api/stripe/webhook is registered BEFORE express.json() in api/_server.ts
  // with express.raw() middleware. Do NOT re-register it here.
}
