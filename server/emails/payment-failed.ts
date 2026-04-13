export function paymentFailedHTML(name: string): string {
  const firstName = name.split(' ')[0] || 'there';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:32px"><span style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:#d4af37">majorka</span></div>
  <h1 style="font-family:'Syne',sans-serif;font-size:28px;font-weight:700;color:#ededed;margin:0 0 16px">Payment issue, ${firstName}</h1>
  <p style="font-size:15px;color:#888;line-height:1.7;margin:0 0 24px">We couldn't process your latest payment. Your access will remain active for a few days while we retry, but please update your payment method to avoid interruption.</p>
  <div style="background:#0f0f0f;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:20px;margin-bottom:24px">
    <div style="font-size:14px;color:#fbbf24;font-weight:600;margin-bottom:8px">Action required</div>
    <div style="font-size:13px;color:#888;line-height:1.6">Update your card in Settings → Billing, or contact your bank if the card was declined.</div>
  </div>
  <a href="https://www.majorka.io/app/settings" style="display:inline-block;background:#3B82F6;color:white;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none">Update payment method →</a>
  <p style="font-size:12px;color:#555;margin-top:32px">Need help? <a href="mailto:support@majorka.io" style="color:#d4af37;text-decoration:none">support@majorka.io</a> · <a href="https://www.majorka.io" style="color:#d4af37;text-decoration:none">majorka.io</a></p>
</div></body></html>`;
}
