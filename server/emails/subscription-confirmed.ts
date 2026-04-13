export function subscriptionConfirmedHTML(name: string, plan: string): string {
  const firstName = name.split(' ')[0] || 'there';
  const planLabel = plan === 'scale' ? 'Scale' : 'Builder';
  const price = plan === 'scale' ? '$199' : '$99';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:32px"><span style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:#d4af37">majorka</span></div>
  <h1 style="font-family:'Syne',sans-serif;font-size:28px;font-weight:700;color:#ededed;margin:0 0 16px">You're on ${planLabel}, ${firstName}!</h1>
  <p style="font-size:15px;color:#888;line-height:1.7;margin:0 0 24px">Your ${planLabel} plan (${price} AUD/mo) is now active. You have full access to everything Majorka offers.</p>
  <div style="background:#0f0f0f;border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:20px;margin-bottom:24px">
    <div style="font-size:14px;color:#22c55e;font-weight:600;margin-bottom:8px">Payment confirmed</div>
    <div style="font-size:13px;color:#888;line-height:1.6">Plan: ${planLabel} · ${price} AUD/month · Next billing in 30 days</div>
  </div>
  <div style="font-size:14px;color:#ededed;line-height:2;margin-bottom:24px">
    <div>✅ 3,700+ AI-scored products</div>
    <div>✅ AI ad copy for Meta + TikTok</div>
    <div>✅ Store Builder with 20 themes</div>
    <div>✅ Push-to-Shopify</div>
    ${plan === 'scale' ? '<div>✅ Unlimited API access (10K/day)</div><div>✅ Priority support + Slack</div>' : '<div>✅ API access (1K/day)</div>'}
  </div>
  <a href="https://www.majorka.io/app" style="display:inline-block;background:#3B82F6;color:white;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 16px rgba(59,130,246,0.3)">Go to dashboard →</a>
  <p style="font-size:12px;color:#555;margin-top:32px">Manage your subscription in <a href="https://www.majorka.io/app/settings" style="color:#d4af37;text-decoration:none">Settings</a> · <a href="https://www.majorka.io" style="color:#d4af37;text-decoration:none">majorka.io</a></p>
</div></body></html>`;
}
