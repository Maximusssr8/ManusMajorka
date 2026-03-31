# Stripe Webhook Verification

Webhook URL: https://www.majorka.io/api/stripe/webhook
Test: GET https://www.majorka.io/api/stripe/webhook-test (admin only)

## Steps to verify on Stripe Dashboard:
1. Go to https://dashboard.stripe.com/webhooks
2. Confirm webhook endpoint: https://www.majorka.io/api/stripe/webhook
3. Confirm these events are subscribed:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_failed
4. Click "Send test webhook" -> checkout.session.completed
5. Check Vercel logs for successful processing

## Webhook Secret:
- Stored in Vercel env var: STRIPE_WEBHOOK_SECRET
- The secret shown in Stripe Dashboard starts with: whsec_
