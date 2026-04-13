/**
 * Email service — sends transactional emails via Resend.
 * All functions are fire-and-forget (try/catch, never crash the caller).
 */

import { Resend } from 'resend';
import { welcomeEmailHTML } from '../emails/welcome';
import { trialReminderHTML } from '../emails/trial-reminder';
import { trialExpiredHTML } from '../emails/trial-expired';
import { paymentFailedHTML } from '../emails/payment-failed';
import { subscriptionConfirmedHTML } from '../emails/subscription-confirmed';

const FROM = 'Majorka <noreply@majorka.io>';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) return false;
    await resend.emails.send({ from: FROM, to: [to], subject: 'Welcome to Majorka — your 7-day trial is live', html: welcomeEmailHTML(name) });
    return true;
  } catch { return false; }
}

export async function sendTrialReminderEmail(to: string, name: string, daysLeft: number): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) return false;
    await resend.emails.send({ from: FROM, to: [to], subject: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your Majorka trial`, html: trialReminderHTML(name, daysLeft) });
    return true;
  } catch { return false; }
}

export async function sendTrialExpiredEmail(to: string, name: string): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) return false;
    await resend.emails.send({ from: FROM, to: [to], subject: 'Your Majorka trial has ended — upgrade to keep access', html: trialExpiredHTML(name) });
    return true;
  } catch { return false; }
}

export async function sendPaymentFailedEmail(to: string, name: string): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) return false;
    await resend.emails.send({ from: FROM, to: [to], subject: 'Payment issue on your Majorka account', html: paymentFailedHTML(name) });
    return true;
  } catch { return false; }
}

export async function sendSubscriptionConfirmedEmail(to: string, name: string, plan: string): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) return false;
    const planLabel = plan === 'scale' ? 'Scale' : 'Builder';
    await resend.emails.send({ from: FROM, to: [to], subject: `You're on Majorka ${planLabel} — full access unlocked`, html: subscriptionConfirmedHTML(name, plan) });
    return true;
  } catch { return false; }
}
