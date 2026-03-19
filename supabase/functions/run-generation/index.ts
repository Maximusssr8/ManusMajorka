/**
 * run-generation — Supabase Edge Function (Deno)
 * Handles the slow Anthropic calls for store generation.
 * No Node.js — uses fetch() directly against Anthropic REST API.
 * Stores plan JSON in generation_jobs table.
 * Vercel reads plan JSON and runs buildStoreHTML (fast, no timeout risk).
 */

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_KEY  = Deno.env.get('SERVICE_ROLE_KEY') || '';
const HAIKU_MODEL   = 'claude-haiku-4-5-20251001';

// ── Supabase REST helpers ──────────────────────────────────────────────────────

async function sbUpdate(table: string, id: string, data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[edge] sbUpdate ${table}/${id} failed:`, err);
  }
}

// ── Anthropic call ─────────────────────────────────────────────────────────────

async function callHaiku(systemPrompt: string, userPrompt: string, maxTokens = 2500): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content?.[0]?.text || '';
}

function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
}

function parseJson(raw: string): Record<string, unknown> | null {
  const cleaned = stripJsonFences(raw);
  try { return JSON.parse(cleaned); } catch { /* */ }
  const match = cleaned.match(/\{[\s\S]+\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* */ } }
  return null;
}

// ── Template selection ─────────────────────────────────────────────────────────

function getTemplateForNiche(niche: string): string {
  const n = niche.toLowerCase();
  if (/skincare|beauty|makeup|cosmetic|serum|moistur|lip|brow|lash|perfume|nail|hair.*care|face|glow/.test(n)) return 'bloom-beauty';
  if (/tech|gadget|electronic|phone|laptop|gaming|drone|camera|smart|led|ring.light|wearable|earbuds|bluetooth/.test(n)) return 'tech-mono';
  if (/watch|jewel|luxury|premium|gold|diamond|leather|silk|cashmere|designer/.test(n)) return 'premium-brand';
  if (/coastal|beach|surf|swim|outdoor|camping|hiking|travel|yoga|pet|dog|cat|garden|plant|eco|sustainable/.test(n)) return 'coastal-au';
  if (/deal|discount|bulk|wholesale|kitchen|tool|car|auto|baby|kids|toy/.test(n)) return 'dropship-bold';
  if (/fit|gym|sport|supplement|protein|creatine|workout|exercise|muscle|weight|run|cycling/.test(n)) return 'dtc-minimal';
  return 'dtc-minimal';
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  let jobId = 'unknown';
  try {
    const body = await req.json() as {
      jobId: string;
      storeName: string;
      productName?: string;
      niche: string;
      price?: string;
      imageUrl?: string;
      template?: string;
      productData?: Record<string, unknown>;
    };
    jobId = body.jobId;
    const { storeName, niche, price = '49.95', imageUrl = '', productData = {} } = body;
    const template = body.template || getTemplateForNiche(niche);
    const productName = body.productName || (productData?.product_title as string) || niche;
    const priceNum = parseFloat(price.replace(/[^0-9.]/g, '')) || 49.95;

    console.log(`[edge:${jobId}] Starting: ${storeName} | ${niche} | ${template}`);

    // Mark as processing
    await sbUpdate('generation_jobs', jobId, { status: 'processing', started_at: new Date().toISOString() });

    // ── Step 1: expandStoreBrief ──────────────────────────────────────────────
    console.log(`[edge:${jobId}] Step 1: expandStoreBrief`);
    const briefRaw = await callHaiku(
      'You are a DTC brand strategist for Australian Shopify stores. Return valid JSON only — no markdown, no backticks.',
      `Store: ${storeName}\nNiche: ${niche}\nProduct: ${productName}\nPrice: AUD $${priceNum}\n\n` +
      `Return JSON: {"brandName":"...","tagline":"...(6-10 words)","heroHeadline":"...(8-12 words)","heroSubheadline":"...(15-20 words, benefit-focused)","testimonials":[{"name":"AU name","location":"AU city","text":"2 sentences"},{"name":"AU name","location":"AU city","text":"2 sentences"},{"name":"AU name","location":"AU city","text":"2 sentences"}],"faq":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]}`,
      800,
    );
    const brief = parseJson(briefRaw) || {};
    console.log(`[edge:${jobId}] brief OK: ${brief.brandName || '?'}`);

    // ── Step 2: planStore ──────────────────────────────────────────────────────
    console.log(`[edge:${jobId}] Step 2: planStore`);
    const planPrompt = `You are a senior Shopify copywriter for the Australian market.
Output ONLY a valid JSON object. No markdown. No code fences. No explanation.

Generate a complete store plan for:
- Store name: "${storeName}"
- Product: "${productName}"
- Niche: "${niche}"
- Price: AUD $${priceNum}
- Template: ${template}

JSON schema:
{
  "storeName": "${storeName}",
  "tagline": "string (6-10 words, AU market)",
  "heroHeadline": "string (8-14 words, specific to product)",
  "heroSubheadline": "string (15-20 words, benefit-focused)",
  "heroCTA": "string (2-4 words)",
  "productName": "${productName}",
  "productDescription": "string (2-3 sentences)",
  "productBullets": ["string","string","string","string","string"],
  "price": ${priceNum},
  "afterpayPrice": ${(priceNum/4).toFixed(2)},
  "testimonials": [
    {"name":"AU name","location":"City, State","text":"2-3 sentences","rating":5},
    {"name":"AU name","location":"City, State","text":"2-3 sentences","rating":5},
    {"name":"AU name","location":"City, State","text":"2-3 sentences","rating":5}
  ],
  "faqItems": [
    {"q":"How long does shipping take?","a":"AU-specific answer"},
    {"q":"Do you offer Afterpay?","a":"Yes, 4 payments..."},
    {"q":"Return policy?","a":"30-day returns..."},
    {"q":"Is this quality?","a":"Quality specific to ${niche}..."}
  ],
  "howItWorks": [
    {"step":"01","title":"Order Online","description":"1-2 sentences"},
    {"step":"02","title":"Fast Dispatch","description":"1-2 sentences"},
    {"step":"03","title":"Love It","description":"1-2 sentences"}
  ]
}
RULES: storeName="${storeName}", productName="${productName}", price=${priceNum}, afterpayPrice=${(priceNum/4).toFixed(2)}, ALL AU-specific, zero lorem ipsum`;

    const planRaw = await callHaiku('You output only valid JSON for Australian Shopify stores. No markdown. No explanation.', planPrompt, 2500);
    let plan = parseJson(planRaw);
    if (!plan) {
      console.warn(`[edge:${jobId}] planStore JSON parse failed, using fallback`);
      plan = {};
    }

    // Enforce critical fields
    plan.storeName = storeName;
    plan.productName = productName;
    plan.price = priceNum;
    plan.afterpayPrice = parseFloat((priceNum / 4).toFixed(2));
    plan.template = template;
    plan.heroImageUrl = imageUrl || '';
    plan.productImageUrl = imageUrl || '';
    plan.niche = niche;

    if (!Array.isArray(plan.productBullets) || (plan.productBullets as unknown[]).length < 3) {
      plan.productBullets = [
        `Premium ${niche} quality tested for Australian conditions`,
        `Fast 3-5 day delivery Australia-wide from our local warehouse`,
        `30-day no-questions-asked returns — shop with confidence`,
        `Backed by 2,400+ verified Australian customer reviews`,
        `Afterpay available — pay in 4 easy interest-free instalments`,
      ];
    }
    if (!Array.isArray(plan.testimonials) || (plan.testimonials as unknown[]).length < 3) {
      const bts = brief.testimonials as Array<{name:string;location:string;text:string}> | undefined;
      plan.testimonials = bts && bts.length >= 3 ? bts.map((t) => ({...t, rating:5})) : [
        { name: 'Sarah M.', location: 'Sydney, NSW', text: `Amazing quality! Fast delivery and exactly as described.`, rating: 5 },
        { name: 'Jake T.', location: 'Brisbane, QLD', text: `Best ${niche} I've found in Australia. Will reorder.`, rating: 5 },
        { name: 'Emma K.', location: 'Melbourne, VIC', text: `Super fast shipping, great product, love it!`, rating: 5 },
      ];
    }
    if (!Array.isArray(plan.faqItems) || (plan.faqItems as unknown[]).length < 3) {
      plan.faqItems = [
        { q: 'How long does shipping take?', a: '3-5 business days Australia-wide. Express option available at checkout.' },
        { q: 'Do you offer Afterpay?', a: 'Yes! Pay in 4 interest-free fortnightly payments with Afterpay.' },
        { q: "What's your return policy?", a: '30-day hassle-free returns. Full refund guaranteed if you\'re not happy.' },
        { q: 'Is this genuine quality?', a: `All our ${niche} products are quality-tested before shipping.` },
      ];
    }
    if (!Array.isArray(plan.howItWorks) || (plan.howItWorks as unknown[]).length < 2) {
      plan.howItWorks = [
        { step: '01', title: 'Order Online', description: 'Shop securely with Afterpay, Zip or card. 100% safe checkout.' },
        { step: '02', title: 'Fast Dispatch', description: 'We ship within 24 hours from our Australian warehouse.' },
        { step: '03', title: 'Delivered Fast', description: '3-5 business days Australia-wide with full tracking.' },
      ];
    }

    // Add font/colour info from template
    const fontMap: Record<string, {h:string;b:string}> = {
      'bloom-beauty': { h:'Cormorant Garamond', b:'Nunito' },
      'tech-mono':    { h:'JetBrains Mono', b:'Inter' },
      'premium-brand':{ h:'Playfair Display', b:'Lato' },
      'coastal-au':   { h:'Montserrat', b:'Lato' },
      'dropship-bold':{ h:'Barlow Condensed', b:'Inter' },
      'dtc-minimal':  { h:'Syne', b:'DM Sans' },
    };
    const colorMap: Record<string,{p:string;a:string}> = {
      'bloom-beauty': { p:'#c9607f', a:'#e8a0b4' },
      'tech-mono':    { p:'#2ea043', a:'#58a6ff' },
      'premium-brand':{ p:'#c9a84c', a:'#e8d5a0' },
      'coastal-au':   { p:'#2a9d8f', a:'#e76f51' },
      'dropship-bold':{ p:'#ff4500', a:'#ffcc00' },
      'dtc-minimal':  { p:'#d4af37', a:'#f0d060' },
    };
    const fonts = fontMap[template] || fontMap['dtc-minimal'];
    const colors = colorMap[template] || colorMap['dtc-minimal'];
    plan.headingFontName = fonts.h;
    plan.bodyFontName = fonts.b;
    plan.headingFont = `'${fonts.h}', sans-serif`;
    plan.bodyFont = `'${fonts.b}', sans-serif`;
    plan.primaryColour = colors.p;
    plan.accentColour = colors.a;
    plan.supportEmail = `support@${storeName.toLowerCase().replace(/[^a-z0-9]/g,'')}.com.au`;

    console.log(`[edge:${jobId}] Plan complete. Storing...`);

    // Store plan in DB — Vercel will render HTML
    await sbUpdate('generation_jobs', jobId, {
      status: 'plan_ready',
      plan_json: plan,
      product_name: productName,
    });

    console.log(`[edge:${jobId}] Done. Status: plan_ready`);
    return new Response(JSON.stringify({ ok: true, jobId, status: 'plan_ready' }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[edge:${jobId}] FATAL:`, msg);
    await sbUpdate('generation_jobs', jobId, { status: 'error', error_msg: msg }).catch(() => {});
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
