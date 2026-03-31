import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
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
