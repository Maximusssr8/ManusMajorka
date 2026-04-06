/**
 * AliExpress Relay Server
 * Runs on Mac Mini (whitelisted IP) — proxies AE API calls from Vercel
 * Start: node relay/server.mjs
 */
import http from 'http';
import crypto from 'crypto';

const PORT = 18820;
const APP_KEY = process.env.AE_APP_KEY || '531190';
const APP_SECRET = process.env.AE_APP_SECRET || 'Aos4XyINBiKjg197MBooXcw6TPBR6uNU';
const TRACKING_ID = process.env.AE_TRACKING_ID || 'majorka_au';
const RELAY_SECRET = process.env.RELAY_SECRET || 'majorka_relay_2026';
const AE_API = 'https://api-sg.aliexpress.com/sync';

function sign(params) {
  const sorted = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', APP_SECRET).update(sorted).digest('hex').toUpperCase();
}

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

async function callAE(method, extra = {}) {
  const p = {
    method,
    app_key: APP_KEY,
    timestamp: ts(),
    format: 'json',
    v: '2.0',
    sign_method: 'sha256',
    ...extra,
  };
  p.sign = sign(p);
  const res = await fetch(AE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(p),
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

function parseQuery(url) {
  const u = new URL(url, 'http://localhost');
  return Object.fromEntries(u.searchParams.entries());
}

function jsonResponse(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  });
  res.end(body);
}

// In-memory cache — 2h TTL for AE product searches
const relayCache = new Map();
const RELAY_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
function relayCacheGet(key) {
  const entry = relayCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > RELAY_CACHE_TTL) { relayCache.delete(key); return null; }
  return entry.data;
}
function relayCacheSet(key, data) {
  relayCache.set(key, { data, time: Date.now() });
  // Evict oldest entries if cache grows > 200 entries
  if (relayCache.size > 200) {
    const oldest = [...relayCache.entries()].sort((a, b) => a[1].time - b[1].time)[0];
    if (oldest) relayCache.delete(oldest[0]);
  }
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization' });
    res.end(); return;
  }

  const url = req.url || '/';
  const qs = parseQuery(url);

  // Auth check — relay secret in Authorization header or ?secret= param
  const authHeader = req.headers.authorization || '';
  const secret = authHeader.replace('Bearer ', '') || qs.secret || '';
  if (secret !== RELAY_SECRET) {
    return jsonResponse(res, 401, { error: 'Unauthorized' });
  }

  try {
    // ── GET /relay/aliexpress/products?keywords=yoga+mat&page=1&limit=50 ──
    if (url.startsWith('/relay/aliexpress/products')) {
      const { keywords = '', page = '1', limit = '50', categoryId } = qs;
      const cacheKey = `products:${keywords}:${page}:${limit}:${categoryId || ''}`;
      const hit = relayCacheGet(cacheKey);
      if (hit) { res.setHeader('X-Relay-Cache', 'HIT'); return jsonResponse(res, 200, hit); }

      const params = {
        keywords,
        page_no: page,
        page_size: String(Math.min(parseInt(limit) || 50, 50)),
        tracking_id: TRACKING_ID,
        sort: 'LAST_VOLUME_DESC',
        fields: 'product_id,product_title,sale_price,original_price,commission_rate,product_main_image_url,detail_url,evaluate_rate,lastest_volume,hot_product_flag',
      };
      if (categoryId) params.category_id = categoryId;

      const raw = await callAE('aliexpress.affiliate.product.query', params);
      const resp = raw?.aliexpress_affiliate_product_query_response?.resp_result;
      const products = resp?.result?.products?.product || [];
      const result = {
        products,
        total: products.length,
        keyword: keywords,
        source: 'aliexpress',
        resp_code: resp?.resp_code,
        resp_msg: resp?.resp_msg,
      };
      relayCacheSet(cacheKey, result);
      return jsonResponse(res, 200, result);
    }

    // ── GET /relay/aliexpress/hot?page=1 ──
    if (url.startsWith('/relay/aliexpress/hot')) {
      const { page = '1', limit = '50', categoryId } = qs;
      const cacheKey = `hot:${page}:${limit}:${categoryId || ''}`;
      const hit = relayCacheGet(cacheKey);
      if (hit) { res.setHeader('X-Relay-Cache', 'HIT'); return jsonResponse(res, 200, hit); }

      const params = {
        page_no: page,
        page_size: String(Math.min(parseInt(limit) || 50, 50)),
        tracking_id: TRACKING_ID,
        fields: 'product_id,product_title,sale_price,original_price,commission_rate,product_main_image_url,detail_url,evaluate_rate,lastest_volume,hot_product_flag',
      };
      if (categoryId) params.category_id = categoryId;

      const raw = await callAE('aliexpress.affiliate.hotproduct.query', params);
      const resp = raw?.aliexpress_affiliate_hotproduct_query_response?.resp_result;
      const products = resp?.result?.products?.product || [];
      return jsonResponse(res, 200, {
        products,
        total: products.length,
        source: 'aliexpress',
        resp_code: resp?.resp_code,
        resp_msg: resp?.resp_msg,
      });
    }

    // ── POST /relay/aliexpress/link (body: {"productUrl": "..."}) ──
    if (url.startsWith('/relay/aliexpress/link') && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const { productUrl } = JSON.parse(body || '{}');
      if (!productUrl) return jsonResponse(res, 400, { error: 'productUrl required' });

      const raw = await callAE('aliexpress.affiliate.link.generate', {
        source_values: productUrl,
        tracking_id: TRACKING_ID,
        promotion_link_type: '0',
      });
      const link = raw?.aliexpress_affiliate_link_generate_response?.resp_result?.result
        ?.promotion_links?.promotion_link?.[0]?.promotion_link;
      if (!link) {
        const code = raw?.aliexpress_affiliate_link_generate_response?.resp_result?.resp_code;
        const msg = raw?.aliexpress_affiliate_link_generate_response?.resp_result?.resp_msg;
        return jsonResponse(res, 400, { error: `${msg} (code ${code})` });
      }
      return jsonResponse(res, 200, { url: link });
    }

    // ── GET /relay/health ──
    if (url.startsWith('/relay/health')) {
      return jsonResponse(res, 200, {
        ok: true,
        app_key: APP_KEY.slice(0, 4) + '****',
        tracking_id: TRACKING_ID,
        uptime: Math.round(process.uptime()),
      });
    }

    jsonResponse(res, 404, { error: 'Not found', available: ['/relay/aliexpress/products', '/relay/aliexpress/hot', '/relay/aliexpress/link', '/relay/health'] });
  } catch (err) {
    console.error('[relay] Error:', err.message);
    jsonResponse(res, 500, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ AliExpress relay server running on http://localhost:${PORT}`);
  console.log(`   Auth: RELAY_SECRET=${RELAY_SECRET}`);
});
