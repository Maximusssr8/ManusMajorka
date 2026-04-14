import { Resend } from 'resend';
import { renderWelcome, type WelcomeData } from './emailTemplates/welcome';
import { renderTrialReminder, type TrialReminderData } from './emailTemplates/trialReminder';
import { renderTrialExpired, type TrialExpiredData } from './emailTemplates/trialExpired';
import { renderPaymentConfirmed, type PaymentConfirmedData } from './emailTemplates/paymentConfirmed';
import { renderPaymentFailed, type PaymentFailedData } from './emailTemplates/paymentFailed';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic alert email — prefers Resend, falls back to Postmark, honest failure
// if neither is configured. Used by /api/cron/check-alerts.
// ─────────────────────────────────────────────────────────────────────────────

export type EmailProvider = 'resend' | 'postmark' | 'none';

export interface SendEmailResult {
  ok: boolean;
  provider: EmailProvider;
  id?: string;
  reason?: 'no_provider' | 'send_failed';
  error?: string;
}

export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.POSTMARK_API_KEY) return 'postmark';
  return 'none';
}

const FROM_ADDRESS = 'Majorka Alerts <alerts@majorka.io>';

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendViaResend(to: string, subject: string, html: string): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) return { ok: false, provider: 'none', reason: 'no_provider' };
  try {
    const result = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
    if (result && 'error' in result && result.error) {
      return { ok: false, provider: 'resend', reason: 'send_failed', error: String(result.error) };
    }
    const id = (result as { data?: { id?: string } })?.data?.id;
    return { ok: true, provider: 'resend', id };
  } catch (err: unknown) {
    return {
      ok: false,
      provider: 'resend',
      reason: 'send_failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendViaPostmark(to: string, subject: string, html: string): Promise<SendEmailResult> {
  const token = process.env.POSTMARK_API_KEY;
  if (!token) return { ok: false, provider: 'none', reason: 'no_provider' };
  try {
    const resp = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify({
        From: FROM_ADDRESS,
        To: to,
        Subject: subject,
        HtmlBody: html,
        MessageStream: 'outbound',
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { ok: false, provider: 'postmark', reason: 'send_failed', error: `${resp.status} ${text}` };
    }
    const json = (await resp.json()) as { MessageID?: string };
    return { ok: true, provider: 'postmark', id: json?.MessageID };
  } catch (err: unknown) {
    return {
      ok: false,
      provider: 'postmark',
      reason: 'send_failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * sendAlertEmail — resilient alert delivery.
 * Retries 3× with exponential backoff (250ms, 500ms, 1000ms).
 * Returns an honest result object; callers must NOT assume success.
 */
export async function sendAlertEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  if (provider === 'none') {
    console.warn('[email] sendAlertEmail: no provider configured (set RESEND_API_KEY or POSTMARK_API_KEY)');
    return { ok: false, provider: 'none', reason: 'no_provider' };
  }

  const send = provider === 'resend' ? sendViaResend : sendViaPostmark;
  let lastResult: SendEmailResult = { ok: false, provider, reason: 'send_failed' };
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await send(to, subject, html);
    if (result.ok) return result;
    lastResult = result;
    if (attempt < 2) await sleep(250 * Math.pow(2, attempt));
  }
  console.error('[email] sendAlertEmail failed after 3 attempts:', lastResult.error);
  return lastResult;
}

export async function sendPlaybook(to: string, playbookContent: string) {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not configured — skipping playbook email');
    return null;
  }
  return resend.emails.send({
    from: 'Majorka AI <hello@majorka.io>',
    to,
    subject: 'Your Majorka Playbook',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #080a0e; color: #fff;">
        <h1 style="color: #d4af37; font-size: 28px; margin-bottom: 8px;">Your Majorka Playbook</h1>
        <p style="color: #9ca3af; margin-bottom: 32px;">Here's your personalised ecommerce playbook from Majorka AI.</p>
        <div style="background: #0d1117; border: 1px solid #1f2937; border-radius: 12px; padding: 24px;">
          <pre style="color: #e5e7eb; white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.6;">${playbookContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">Majorka AI · <a href="https://www.majorka.io" style="color: #d4af37;">majorka.io</a></p>
        <p style="color: #6b7280; font-size: 11px;">You received this because you requested your playbook. <a href="#" style="color: #6b7280;">Unsubscribe</a></p>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactional dispatcher — one surface for all templated emails.
// Prefers Resend, falls back to Postmark, returns honest result object.
// ─────────────────────────────────────────────────────────────────────────────

const TRANSACTIONAL_FROM = 'Majorka <hello@majorka.io>';

export type TransactionalTemplate =
  | { template: 'welcome'; data: WelcomeData }
  | { template: 'trial_reminder'; data: TrialReminderData }
  | { template: 'trial_expired'; data: TrialExpiredData }
  | { template: 'payment_confirmed'; data: PaymentConfirmedData }
  | { template: 'payment_failed'; data: PaymentFailedData };

export type TemplateName = TransactionalTemplate['template'];

function renderTemplate(t: TransactionalTemplate): { subject: string; html: string } {
  switch (t.template) {
    case 'welcome':           return renderWelcome(t.data);
    case 'trial_reminder':    return renderTrialReminder(t.data);
    case 'trial_expired':     return renderTrialExpired(t.data);
    case 'payment_confirmed': return renderPaymentConfirmed(t.data);
    case 'payment_failed':    return renderPaymentFailed(t.data);
  }
}

async function sendViaResendFrom(
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) return { ok: false, provider: 'none', reason: 'no_provider' };
  try {
    const result = await resend.emails.send({ from, to, subject, html });
    if (result && 'error' in result && result.error) {
      return { ok: false, provider: 'resend', reason: 'send_failed', error: String(result.error) };
    }
    const id = (result as { data?: { id?: string } })?.data?.id;
    return { ok: true, provider: 'resend', id };
  } catch (err: unknown) {
    return {
      ok: false,
      provider: 'resend',
      reason: 'send_failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendViaPostmarkFrom(
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  const token = process.env.POSTMARK_API_KEY;
  if (!token) return { ok: false, provider: 'none', reason: 'no_provider' };
  try {
    const resp = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify({
        From: from,
        To: to,
        Subject: subject,
        HtmlBody: html,
        MessageStream: 'outbound',
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { ok: false, provider: 'postmark', reason: 'send_failed', error: `${resp.status} ${text}` };
    }
    const json = (await resp.json()) as { MessageID?: string };
    return { ok: true, provider: 'postmark', id: json?.MessageID };
  } catch (err: unknown) {
    return {
      ok: false,
      provider: 'postmark',
      reason: 'send_failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * sendTransactional — dispatch a templated Majorka email.
 * Uses Resend if RESEND_API_KEY set, else Postmark, else returns no_provider.
 * Retries once (network resilience) and returns an honest SendEmailResult.
 */
export async function sendTransactional(
  to: string,
  spec: TransactionalTemplate,
): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  if (provider === 'none') {
    console.warn('[email] sendTransactional: no provider (set RESEND_API_KEY or POSTMARK_API_KEY)');
    return { ok: false, provider: 'none', reason: 'no_provider' };
  }

  const { subject, html } = renderTemplate(spec);
  const send = provider === 'resend' ? sendViaResendFrom : sendViaPostmarkFrom;

  let lastResult: SendEmailResult = { ok: false, provider, reason: 'send_failed' };
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await send(TRANSACTIONAL_FROM, to, subject, html);
    if (result.ok) return result;
    lastResult = result;
    if (attempt === 0) await sleep(300);
  }
  console.error(`[email] sendTransactional(${spec.template}) failed:`, lastResult.error);
  return lastResult;
}

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] Skipping welcome email — RESEND_API_KEY not set');
    return null;
  }

  const firstName = name?.trim().split(' ')[0] || 'there';

  return resend.emails.send({
    from: 'Max from Majorka <hello@majorka.io>',
    to,
    subject: `Welcome to Majorka, ${firstName}`,
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,sans-serif"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><div style="margin-bottom:32px"><span style="font-size:28px;font-weight:900;color:#6366F1;font-family:sans-serif">Majorka</span></div><h1 style="color:#0A0A0A;font-size:28px;font-weight:800;margin:0 0 16px;line-height:1.3">Welcome aboard, ${firstName}</h1><p style="color:#6B7280;font-size:16px;line-height:1.7;margin:0 0 24px">You now have access to trending products, profit calculators, competitor intelligence, and AI-powered tools — all in one place.</p><p style="color:#6B7280;font-size:16px;line-height:1.7;margin:0 0 32px">Here's where to start:<br><br>1. <strong style="color:#0A0A0A">Browse Products</strong> — find a winner in your niche<br>2. <strong style="color:#0A0A0A">Run the Profit Calc</strong> — confirm margins before committing<br>3. <strong style="color:#0A0A0A">Build your store</strong> — AI-generated in under 7 minutes</p><a href="https://www.majorka.io/app" style="display:inline-block;padding:14px 28px;background:#6366F1;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700">Go to Dashboard</a><p style="color:#9CA3AF;font-size:13px;margin-top:40px;line-height:1.6">You're receiving this because you signed up for Majorka.<br><a href="https://www.majorka.io" style="color:#9CA3AF">majorka.io</a></p></div></body></html>`,
  });
}
