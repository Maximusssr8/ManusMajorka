# WebsiteGenerator.tsx — 7 Improvements

Work in ~/ManusMajorka. File: client/src/pages/WebsiteGenerator.tsx (3234 lines).
Do not break existing functionality. Build passes must remain clean.

---

## TASK 1 — Live Preview Panel (highest priority)

When the right panel is in its empty/idle state (no generated output yet), show a live skeleton preview that updates as the user types.

### Where the empty state currently renders:
Search for: `hasOutput ?` — when false, an empty state renders (lightning bolt icon, "Your store will appear here").

### What to build:
Replace the empty state with a `<LiveSkeletonPreview>` component defined in the same file (no separate file needed).

```tsx
// Add this state near line 1260 (after existing state declarations):
const [livePreviewNiche, setLivePreviewNiche] = useState('');
const [livePreviewStoreName, setLivePreviewStoreName] = useState('');

// Debounce updates: update livePreview state 400ms after user stops typing
// Add to the existing onChange handlers for storeName and niche inputs:
// storeName onChange: also call setLivePreviewStoreName(value) with 400ms debounce
// niche onChange: also call setLivePreviewNiche(value) with 400ms debounce
```

The LiveSkeletonPreview renders:
- A mini browser frame (rounded corners, dark bg)
- A nav bar skeleton with the store name (or "Your Store" placeholder)
- A hero section skeleton: headline text using the selected template's accent colour, two CTA button skeletons
- A "Products" row with 3 product card skeletons (grey boxes with shimmer animation)
- A "Testimonials" strip with 3 avatar + text skeletons
- The template's colour palette shown as 3 swatches at the bottom
- All uses the selected template's palette (bg colour, accent colour, text colour from WEBSITE_TEMPLATES)
- When `generating === true`: replace skeleton with a progress overlay (see Task 5)
- When `hasOutput === true`: hide and show the iframe instead (existing behaviour)

Add a CSS keyframes `@keyframes shimmer` using a pseudo-element or inline style string injected once.

The skeleton must look polished — use the template accent color for highlights, not generic grey.

---

## TASK 2 — Design Template Selection UX

Improve the template list (currently around line 2104).

### Changes:

**A) Gold left-border indicator on selected template:**
Change the selected template button style to add:
```
borderLeft: `3px solid #d4af37`
```
(instead of the current accent border on all sides)

**B) Colour palette dots:**
After the template name/description div, add 3 small colour circles (10px diameter, `border-radius: 50%`) showing `t.palette.bg`, `t.palette.accent`, `t.palette.text` — positioned at the end of the button (flex row, gap 3px).

**C) Auto-suggest based on niche:**
Add a `useEffect` that watches `niche` state. When niche changes and `generating === false` and the user hasn't manually selected a template (track with `userPickedTemplate` boolean state):
```
const NICHE_TEMPLATE_MAP: Record<string, string> = {
  beauty: 'bloom-beauty', skincare: 'bloom-beauty', cosmetics: 'bloom-beauty',
  fashion: 'gc-fashion', clothing: 'gc-fashion', apparel: 'gc-fashion', streetwear: 'gc-fashion',
  tech: 'tech-mono', gadgets: 'tech-mono', electronics: 'tech-mono',
  outdoor: 'coastal-au', lifestyle: 'coastal-au', sport: 'coastal-au', pets: 'coastal-au',
  luxury: 'premium-brand', premium: 'premium-brand', jewellery: 'premium-brand',
};
// Find the best match by checking if niche.toLowerCase() includes any key
```
When a match is found, call `setPremiumTemplateId(matchedId)` and show a small toast: `toast.success('Template auto-matched to your niche')` — but only show toast once per niche change (use a ref to track last auto-matched niche).

**D) Hover thumbnail preview:**
On hover of each template button, show a small popover/tooltip (position: absolute, right side, z-index 100) showing:
- Template name in large font
- 3 palette swatches
- A mini wireframe preview (just coloured rectangles representing nav/hero/products)
- Use `onMouseEnter`/`onMouseLeave` with a `hoveredTemplate` state (`string | null`)
- Popover should be positioned to the right of the template list

---

## TASK 3 — Product Import Flow (make it actually work end-to-end)

The existing `handleImport` (line 1359) calls `/api/scrape-product` and works. Improve it:

**A) Better loading state:**
Currently shows `…` in the button. Show:
```
{importing && <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.5)', marginTop: 4, display: 'block' }}>Analyzing product...</span>}
```

**B) Auto-fill fields after import:**
After a successful import, in the `setImportedProduct(...)` call, ALSO:
```typescript
// Auto-suggest store name from brand or product title
if (!storeName.trim()) {
  const suggested = data.brand 
    ? `${data.brand} AU`
    : finalTitle.split(' ').slice(0, 2).join(' ') + ' AU';
  setStoreName(suggested.slice(0, 40));
}
// Auto-detect niche from product title/description
if (!niche.trim()) {
  const productText = (finalTitle + ' ' + (data.description || '')).toLowerCase();
  const nicheDetect: [string, string][] = [
    ['skincare|moisturiser|serum|cleanser|toner', 'Skincare'],
    ['supplement|protein|vitamin|collagen|probiotic', 'Health Supplements'],
    ['gym|workout|fitness|leggings|activewear', 'Fitness'],
    ['pet|dog|cat|puppy|paw', 'Pet Accessories'],
    ['tech|gadget|usb|wireless|bluetooth|charger', 'Tech Gadgets'],
    ['home|kitchen|organis|storage|decor', 'Home & Living'],
    ['fashion|dress|shirt|shoes|bag|jewel', 'Fashion'],
    ['baby|toddler|infant|kid|child', 'Baby & Kids'],
    ['coffee|tea|brew|pour|espresso', 'Coffee & Tea'],
    ['outdoor|hiking|camping|trail|adventure', 'Outdoor & Adventure'],
  ];
  for (const [pattern, detected] of nicheDetect) {
    if (new RegExp(pattern).test(productText)) {
      setNiche(detected);
      break;
    }
  }
}
// Show toast with extracted data summary
toast.success(`Imported: ${finalTitle}${data.price ? ` · $${data.price} AUD` : ''}`);
```

**C) Supported sources list on error:**
When `importError` is set, show:
```
<div style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)', marginTop: 4 }}>
  Supported: AliExpress, Amazon AU, eBay AU, CJDropshipping, DHgate
</div>
```

**D) Confirmation card:**
After import succeeds, the existing `importedProduct` card already shows title + price. Add to it:
- Show the first 2 bullet features (from `importedProduct.features`) as small grey tags
- Show "✓ Store name auto-filled" and "✓ Niche detected" badges if those were auto-filled

---

## TASK 4 — Shopify Connect Integration in WebsiteGenerator

Add Shopify connect state and UI directly to WebsiteGenerator.

**A) Add state:**
```typescript
const [shopifyConnected, setShopifyConnected] = useState(false);
const [shopifyShop, setShopifyShop] = useState('');
const [shopifyPushing, setShopifyPushing] = useState(false);
const [shopifyPushResult, setShopifyPushResult] = useState<Record<string,any>|null>(null);
```

**B) Check connection on mount:**
```typescript
useEffect(() => {
  if (!session?.access_token) return;
  fetch('/api/shopify/status', { headers: { Authorization: `Bearer ${session.access_token}` } })
    .then(r => r.json())
    .then((d: any) => { if (d.connected) { setShopifyConnected(true); setShopifyShop(d.shop || ''); } })
    .catch(() => {});
}, [session]);
```

**C) Handle OAuth return (?shopify_connected=true):**
```typescript
useEffect(() => {
  const p = new URLSearchParams(window.location.search);
  if (p.get('shopify_connected') === 'true') {
    setShopifyConnected(true);
    toast.success('Shopify store connected!');
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

**D) Push to Shopify function:**
```typescript
const handleShopifyPush = useCallback(async () => {
  if (!shopifyConnected || !directHtml) return;
  setShopifyPushing(true);
  try {
    const res = await fetch('/api/store-builder/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({
        brief: {
          brandName: storeName || storeManifest?.brand_name || 'My Store',
          heroHeadline: storeManifest?.meta_title || storeName,
          tagline: tagline || niche,
          uniqueValueProp: niche,
          colourPalette: { primary: accentColor },
        },
        selectedStoreName: storeName || 'My Store',
      }),
    });
    const data = await res.json();
    setShopifyPushResult(data);
    if (data.success) toast.success('Store pushed to Shopify! 🎉');
    else toast.error('Push completed with some errors');
  } catch (e: any) {
    toast.error('Shopify push failed: ' + e.message);
  } finally {
    setShopifyPushing(false);
  }
}, [shopifyConnected, directHtml, session, storeName, tagline, niche, accentColor, storeManifest]);
```

**E) UI — Add Shopify button after Generate button (around line 2590):**

Find the Generate button area. After the generate button div (but before the genError div), add:

```tsx
{/* Shopify Connect / Push */}
<div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
  {shopifyConnected ? (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#22c55e', flex: 1 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
        {shopifyShop || 'Shopify connected'}
      </div>
      {hasOutput && (
        <button
          onClick={handleShopifyPush}
          disabled={shopifyPushing}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.08)', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: shopifyPushing ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 6, opacity: shopifyPushing ? 0.6 : 1 }}
        >
          {shopifyPushing ? <Loader2 size={11} className="animate-spin" /> : null}
          {shopifyPushing ? 'Pushing...' : '↑ Push to Shopify'}
        </button>
      )}
    </>
  ) : (
    <button
      onClick={() => { window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(prompt('Enter your .myshopify.com domain:') || '')}`; }}
      style={{ width: '100%', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(240,237,232,0.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
    >
      🔗 Connect Shopify store
    </button>
  )}
</div>
{shopifyPushResult && shopifyPushResult.success && (
  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', fontSize: 11 }}>
    <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>✓ Pushed to Shopify</div>
    {shopifyPushResult.storeUrl && <a href={shopifyPushResult.storeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>Open store →</a>}
  </div>
)}
```

**NOTE:** Replace the `prompt()` call with a proper inline domain input: a small `<input>` that appears when you click "Connect Shopify store", with a "Go" button that redirects to the OAuth URL. Use `shopifyDomainInput` state.

---

## TASK 5 — Generation Progress UX

The right panel already has some progress UI. Improve it substantially.

### Find current progress display (around line 3090):
```
{progressSteps.map((step, i) => {
```

### Replace the generating state empty panel:

When `generating === true` and `!hasOutput`, show a progress overlay instead of the skeleton:

```tsx
// Progress messages keyed by threshold
const PROGRESS_MESSAGES: Record<number, string> = {
  5: 'Fetching product images...',
  10: 'Building your brand brief...',
  15: 'Warming up the AI...',
  20: 'Writing your store copy...',
  30: 'Crafting the hero section...',
  50: 'Designing your layout...',
  70: 'Adding product pages...',
  90: 'Finishing touches...',
  98: 'Assembling final store...',
  100: 'Your store is ready! 🎉',
};

function getProgressMessage(progress: number): string {
  const keys = Object.keys(PROGRESS_MESSAGES).map(Number).sort((a, b) => b - a);
  for (const k of keys) { if (progress >= k) return PROGRESS_MESSAGES[k]; }
  return 'Starting...';
}
```

In the right panel, when generating and no output yet, render:
```tsx
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 40 }}>
  {/* Live skeleton preview behind a blur overlay */}
  <div style={{ width: '100%', maxWidth: 520, background: 'rgba(255,255,255,0.03)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
    {/* Mini progress bar */}
    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: '#d4af37', width: `${genProgress}%`, transition: 'width 0.6s ease', borderRadius: 2 }} />
    </div>
    {/* Progress content */}
    <div style={{ padding: '28px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#f0ede8', marginBottom: 8 }}>
        {genProgress}%
      </div>
      <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.6)', marginBottom: 20 }}>
        {getProgressMessage(genProgress)}
      </div>
      {/* Step checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
        {progressSteps.map((step, i) => {
          const isCurrent = !step.done && (i === 0 || progressSteps[i-1]?.done);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: step.done ? 'rgba(212,175,55,0.06)' : isCurrent ? 'rgba(212,175,55,0.03)' : 'transparent' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${step.done ? '#d4af37' : isCurrent ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: step.done ? '#d4af37' : 'transparent' }}>
                {step.done ? '✓' : ''}
              </div>
              <span style={{ fontSize: 12, color: step.done ? '#d4af37' : isCurrent ? 'rgba(240,237,232,0.8)' : 'rgba(240,237,232,0.35)' }}>{step.label}</span>
              {isCurrent && <Loader2 size={11} className="animate-spin" style={{ color: '#d4af37', marginLeft: 'auto' }} />}
            </div>
          );
        })}
      </div>
      {/* Elapsed time */}
      {genStartTime > 0 && (
        <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(240,237,232,0.3)', fontFamily: 'Syne, sans-serif' }}>
          Elapsed: {Math.round((Date.now() - genStartTime) / 1000)}s
        </div>
      )}
    </div>
  </div>
</div>
```

Also add a `useInterval` or `setInterval` (store ref) that updates a `[elapsedMs, setElapsedMs]` state every second while `generating === true`, so the elapsed time shown above is live.

When generation completes (`generating === false && hasOutput`), show a small fade-in animation on the iframe. Add `className` or inline style `animation: 'fadeIn 0.4s ease'` and inject the keyframe via a `<style>` tag at the top of the return.

Add "Generated in Xs" badge near the tab bar when output exists:
```tsx
{hasOutput && genStartTime > 0 && (
  <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(212,175,55,0.6)', fontFamily: 'Syne, sans-serif' }}>
    Generated in {Math.round((Date.now() - genStartTime) / 1000)}s
  </div>
)}
```

---

## TASK 6 — Quick Start Examples (make them work properly)

The existing quick-start buttons around line 2360 set niche+storeName+accentColor then call handleGenerate. Improve them:

**Replace the existing quick-start button array with these 4 examples:**
```typescript
const QUICK_EXAMPLES = [
  { emoji: '🧍', label: 'Posture Corrector', niche: 'Health', storeName: 'AlignAU', targetAudience: 'AU desk workers 25-45', tagline: 'Stand tall, feel great', price: '49.95', color: '#10b981', templateId: 'bondi-wellness', badge: 'Example' },
  { emoji: '💄', label: 'Glow LED Face Mask', niche: 'Beauty & Skincare', storeName: 'GlowMist AU', targetAudience: 'AU women 20-35', tagline: 'Clinic-grade glow at home', price: '79.95', color: '#ec4899', templateId: 'bloom-beauty', badge: 'Example' },
  { emoji: '🖥', label: 'Monitor Stand', niche: 'Home Office Tech', storeName: 'DeskPro AU', targetAudience: 'AU remote workers', tagline: 'Level up your workspace', price: '59.95', color: '#3b82f6', templateId: 'tech-mono', badge: 'Example' },
  { emoji: '🐕', label: 'Dog Harness', niche: 'Pet Accessories', storeName: 'TrailPaws AU', targetAudience: 'AU dog owners', tagline: 'Built for AU adventures', price: '39.95', color: '#f59e0b', templateId: 'au-pet-collective', badge: 'Example' },
] as const;
```

**Button render:**
```tsx
{QUICK_EXAMPLES.map((ex) => (
  <button key={ex.label}
    onClick={() => {
      setNiche(ex.niche);
      setStoreName(ex.storeName);
      setAccentColor(ex.color);
      setTargetAudience(ex.targetAudience);
      setTagline(ex.tagline);
      setPriceAUD(ex.price);
      setPremiumTemplateId(ex.templateId);
      setUserPickedTemplate(false);
      setQuickStartOpen(false);
      toast.success(`"${ex.label}" example loaded — generating…`);
      setTimeout(() => handleGenerate(), 200);
    }}
    style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.7)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ex.color; e.currentTarget.style.color = ex.color; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(240,237,232,0.7)'; }}
  >
    {ex.emoji} {ex.label}
    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(240,237,232,0.4)' }}>EXAMPLE</span>
  </button>
))}
```

Also add `targetAudience` setter — check that `setTargetAudience` exists (it should, line ~2411).

---

## TASK 7 — Store History (Supabase save)

After a store is generated (in `handleGenerate`, after `setDirectHtml(html)` is called), save it to Supabase.

**A) Add state:**
```typescript
const [savedStoreId, setSavedStoreId] = useState<string | null>(null);
```

**B) Save function (call from handleGenerate after setting directHtml):**
```typescript
// Save to generated_stores table
if (session?.access_token) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
    const { data: insertData } = await sb.from('generated_stores').insert({
      user_id: session.user?.id,
      store_name: storeName || manifest?.brand_name || niche,
      niche,
      template_id: premiumTemplateId,
      html_preview: html.slice(0, 5000), // first 5kb as preview
      manifest: manifest,
      created_at: new Date().toISOString(),
    }).select('id').single();
    if (insertData?.id) setSavedStoreId(insertData.id);
  } catch (e) {
    // Non-fatal: don't surface to user
    console.warn('[store-history] save failed:', e);
  }
}
```

**C) Run this SQL in Supabase (note: add as a comment in the code for Max to run):**
```sql
-- Run in Supabase SQL editor:
-- CREATE TABLE IF NOT EXISTS generated_stores (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
--   store_name text,
--   niche text,
--   template_id text,
--   html_preview text,
--   manifest jsonb,
--   created_at timestamptz DEFAULT now()
-- );
-- ALTER TABLE generated_stores ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users own their stores" ON generated_stores FOR ALL USING (auth.uid() = user_id);
```

**D) Show "Saved" badge when savedStoreId is set:**
Near the "Generated in Xs" badge, add:
```tsx
{savedStoreId && (
  <div style={{ marginLeft: 8, fontSize: 10, color: 'rgba(45,202,114,0.7)', fontFamily: 'Syne, sans-serif' }}>
    ✓ Saved
  </div>
)}
```

**E) In the existing `siteHistory` sidebar (C3), also push to local state:**
```typescript
setSiteHistory(prev => [
  { id: Date.now(), name: storeName || niche, html, timestamp: Date.now() },
  ...prev.slice(0, 9),
]);
```

---

## COMPLETION CHECKLIST

After implementing all 7 tasks:

1. `pnpm run build` must pass with 0 TypeScript errors
2. `npx tsc --noEmit` must show 0 errors
3. Run: `git add -A && git commit -m "feat: WebsiteGenerator — live preview, template UX, progress overlay, Shopify connect, quick-start, store history" && git push origin main`
4. Run: trigger Vercel deploy (via API or git push — git push should be enough if auto-deploy is on)

If TypeScript errors appear:
- Add missing type annotations
- Fix undefined refs (e.g. `userPickedTemplate`, `setUserPickedTemplate` state)
- Do not use `any` casts to silence real errors — fix them properly

Report final build output.
