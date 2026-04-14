import { renderLayout, esc } from './_layout';
import type { RenderedEmail } from './welcome';

export interface PaymentConfirmedData {
  firstName?: string;
  planName: string;
  amount: string; // e.g. "$199.00 AUD"
  invoiceId?: string;
  nextBillingDate?: string; // ISO or formatted
  dashboardUrl?: string;
}

export function renderPaymentConfirmed(data: PaymentConfirmedData): RenderedEmail {
  const name = data.firstName?.trim() || 'there';
  const planName = data.planName || 'Majorka';
  const dashboardUrl = data.dashboardUrl || 'https://majorka.io/app';
  const invoiceId = data.invoiceId || '—';
  const nextBilling = data.nextBillingDate || '—';

  const subject = `Payment received — welcome to ${planName}`;

  const body = `
    <h1 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.2;margin:0 0 16px 0;color:#f5f5f5;">
      Welcome to ${esc(planName)}, ${esc(name)}.
    </h1>
    <p style="margin:0 0 24px 0;">
      Payment received. Your full ${esc(planName)} toolkit is unlocked right now.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#0d0d0d;border:1px solid #1a1a1a;border-radius:10px;margin:0 0 20px 0;">
      <tr>
        <td style="padding:16px 20px;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:13px;color:#cfcfcf;">
          <div style="padding:4px 0;color:#8a8a8a;">PLAN &nbsp;·&nbsp; <span style="color:#f5f5f5;">${esc(planName)}</span></div>
          <div style="padding:4px 0;color:#8a8a8a;">AMOUNT &nbsp;·&nbsp; <span style="color:#d4af37;">${esc(data.amount)}</span></div>
          <div style="padding:4px 0;color:#8a8a8a;">INVOICE &nbsp;·&nbsp; <span style="color:#f5f5f5;">${esc(invoiceId)}</span></div>
          <div style="padding:4px 0;color:#8a8a8a;">NEXT BILLING &nbsp;·&nbsp; <span style="color:#f5f5f5;">${esc(nextBilling)}</span></div>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#a3a3a3;">
      Manage billing anytime from Settings → Billing.
    </p>
  `;

  const html = renderLayout({
    subject,
    preheader: `Payment received — your ${planName} plan is active.`,
    body,
    cta: { href: dashboardUrl, label: `Explore ${planName} Features` },
  });

  return { subject, html };
}
