import { renderLayout, esc } from './_layout';
import type { RenderedEmail } from './welcome';

export interface PaymentFailedData {
  firstName?: string;
  planName?: string;
  amount?: string;
  portalUrl?: string;
  reason?: string;
}

export function renderPaymentFailed(data: PaymentFailedData): RenderedEmail {
  const name = data.firstName?.trim() || 'there';
  const portalUrl = data.portalUrl || 'https://majorka.io/app/billing';
  const planName = data.planName || 'your plan';
  const amount = data.amount || '';
  const reason = data.reason || 'The card was declined or expired.';

  const subject = "We couldn't process your payment — quick fix inside";

  const amountLine = amount
    ? `<div style="padding:4px 0;color:#8a8a8a;">AMOUNT &nbsp;·&nbsp; <span style="color:#d4af37;">${esc(amount)}</span></div>`
    : '';

  const body = `
    <h1 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.2;margin:0 0 16px 0;color:#f5f5f5;">
      Hey ${esc(name)}, a payment issue.
    </h1>
    <p style="margin:0 0 20px 0;">
      We tried to charge your card for ${esc(planName)} and it didn't go through. Your account stays active for a short grace period while you update your method.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#0d0d0d;border:1px solid #3a1f1f;border-radius:10px;margin:0 0 20px 0;">
      <tr>
        <td style="padding:16px 20px;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:13px;color:#cfcfcf;">
          <div style="padding:4px 0;color:#8a8a8a;">STATUS &nbsp;·&nbsp; <span style="color:#ef4444;">PAYMENT FAILED</span></div>
          <div style="padding:4px 0;color:#8a8a8a;">PLAN &nbsp;·&nbsp; <span style="color:#f5f5f5;">${esc(planName)}</span></div>
          ${amountLine}
          <div style="padding:4px 0;color:#8a8a8a;">REASON &nbsp;·&nbsp; <span style="color:#f5f5f5;">${esc(reason)}</span></div>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#a3a3a3;">
      Updating your card takes 30 seconds via Stripe's secure portal.
    </p>
  `;

  const html = renderLayout({
    subject,
    preheader: "Payment failed — update your card to keep your Majorka access.",
    body,
    cta: { href: portalUrl, label: 'Update Payment Method' },
  });

  return { subject, html };
}
