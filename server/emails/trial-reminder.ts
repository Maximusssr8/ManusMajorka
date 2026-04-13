export function trialReminderHTML(name: string, daysLeft: number): string {
  const firstName = name.split(' ')[0] || 'there';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:32px"><span style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:#d4af37">majorka</span></div>
  <h1 style="font-family:'Syne',sans-serif;font-size:28px;font-weight:700;color:#ededed;margin:0 0 16px">${firstName}, your trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}</h1>
  <p style="font-size:15px;color:#888;line-height:1.7;margin:0 0 24px">After your trial, you'll lose access to:</p>
  <div style="background:#0f0f0f;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:24px">
    <div style="font-size:14px;color:#ededed;line-height:2">
      <div>❌ 3,700+ AI-scored winning products</div>
      <div>❌ AI ad copy generation (Meta + TikTok)</div>
      <div>❌ Store Builder with 20 themes</div>
      <div>❌ Push-to-Shopify integration</div>
      <div>❌ Developer API access</div>
      <div>❌ TikTok Shop Leaderboard</div>
    </div>
  </div>
  <p style="font-size:15px;color:#888;line-height:1.7;margin:0 0 24px">Lock in founding member pricing before it increases:</p>
  <div style="display:flex;gap:12px;margin-bottom:24px">
    <div style="flex:1;background:#0f0f0f;border:1px solid #1a1a1a;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Builder</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:#ededed">$99<span style="font-size:13px;color:#888">/mo</span></div>
    </div>
    <div style="flex:1;background:#0f0f0f;border:1px solid #d4af37;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:11px;color:#d4af37;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Scale</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:#ededed">$199<span style="font-size:13px;color:#888">/mo</span></div>
    </div>
  </div>
  <a href="https://www.majorka.io/pricing" style="display:inline-block;background:#3B82F6;color:white;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 16px rgba(59,130,246,0.3)">Upgrade now →</a>
  <p style="font-size:12px;color:#555;margin-top:32px">30-day money-back guarantee · Cancel anytime · <a href="https://www.majorka.io" style="color:#d4af37;text-decoration:none">majorka.io</a></p>
</div></body></html>`;
}
