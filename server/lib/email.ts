import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPlaybook(to: string, playbookContent: string) {
  return resend.emails.send({
    from: 'Majorka AI <hello@majorka.ai>',
    to,
    subject: 'Your Majorka Playbook 🚀',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #080a0e; color: #fff;">
        <h1 style="color: #d4af37; font-size: 28px; margin-bottom: 8px;">Your Majorka Playbook</h1>
        <p style="color: #9ca3af; margin-bottom: 32px;">Here's your personalised ecommerce playbook from Majorka AI.</p>
        <div style="background: #0d1117; border: 1px solid #1f2937; border-radius: 12px; padding: 24px;">
          <pre style="color: #e5e7eb; white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.6;">${playbookContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">Majorka AI · <a href="https://manus-majorka.vercel.app" style="color: #d4af37;">manus-majorka.vercel.app</a></p>
        <p style="color: #6b7280; font-size: 11px;">You received this because you requested your playbook. <a href="#" style="color: #6b7280;">Unsubscribe</a></p>
      </div>
    `,
  });
}
