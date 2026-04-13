export function welcomeEmailHTML(name: string): string {
  const firstName = name.split(' ')[0] || 'there';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:32px"><span style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:#d4af37">majorka</span></div>
  <h1 style="font-family:'Syne',sans-serif;font-size:28px;font-weight:700;color:#ededed;margin:0 0 16px">Welcome to Majorka, ${firstName}!</h1>
  <p style="font-size:15px;color:#888;line-height:1.7;margin:0 0 24px">You now have 7 days of full Builder access — no credit card needed. Here's how to make the most of it:</p>
  <div style="background:#0f0f0f;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:24px">
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start"><div style="width:28px;height:28px;border-radius:50%;background:rgba(212,175,55,0.15);color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">1</div><div><div style="font-size:14px;color:#ededed;font-weight:600;margin-bottom:2px">Find your first winning product</div><div style="font-size:13px;color:#888">Browse 3,700+ AI-scored products → filter by Hot Now or Score 90+</div></div></div>
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start"><div style="width:28px;height:28px;border-radius:50%;background:rgba(212,175,55,0.15);color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">2</div><div><div style="font-size:14px;color:#ededed;font-weight:600;margin-bottom:2px">Generate ad copy in seconds</div><div style="font-size:13px;color:#888">Click "Create Ad" on any product → get Meta + TikTok copy instantly</div></div></div>
    <div style="display:flex;gap:12px;align-items:flex-start"><div style="width:28px;height:28px;border-radius:50%;background:rgba(212,175,55,0.15);color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">3</div><div><div style="font-size:14px;color:#ededed;font-weight:600;margin-bottom:2px">Push to Shopify & launch</div><div style="font-size:13px;color:#888">Push products directly to your Shopify store with one click</div></div></div>
  </div>
  <a href="https://www.majorka.io/app" style="display:inline-block;background:#3B82F6;color:white;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 16px rgba(59,130,246,0.3)">Open your dashboard →</a>
  <p style="font-size:12px;color:#555;margin-top:32px;line-height:1.6">You're receiving this because you signed up for Majorka. <a href="https://www.majorka.io" style="color:#d4af37;text-decoration:none">majorka.io</a> · Gold Coast, Australia</p>
</div></body></html>`;
}
