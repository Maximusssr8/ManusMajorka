const fs = require('fs'), https = require('https'), crypto = require('crypto');
const KEY_PATH = process.env.GCP_KEY_PATH || '/Users/maximus/ManusMajorka/server/majorka-gcp-key.json';
const key = JSON.parse(fs.readFileSync(KEY_PATH));

function createJWT() {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/indexing', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256'); sign.update(`${header}.${payload}`);
  return `${header}.${payload}.${sign.sign(key.private_key).toString('base64url')}`;
}
function post(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'POST', headers }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) })); });
    req.on('error', reject); req.write(body); req.end();
  });
}
const URLS = [
  'https://www.majorka.io/',
  'https://www.majorka.io/dropshipping-australia',
  'https://www.majorka.io/tiktok-shop-australia',
  'https://www.majorka.io/winning-products-australia',
  'https://www.majorka.io/pricing',
  'https://www.majorka.io/store-health',
];
(async () => {
  const jwt = createJWT();
  const tokenRes = await post('oauth2.googleapis.com', '/token', {'Content-Type':'application/x-www-form-urlencoded'}, `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`);
  const token = tokenRes.body.access_token;
  for (const url of URLS) {
    const body = JSON.stringify({ url, type: 'URL_UPDATED' });
    const res = await post('indexing.googleapis.com', '/v3/urlNotifications:publish', {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)}, body);
    console.log(res.status === 200 ? `✅ ${url}` : `❌ ${url}: ${res.body.error?.message}`);
    await new Promise(r => setTimeout(r, 300));
  }
})().catch(console.error);
