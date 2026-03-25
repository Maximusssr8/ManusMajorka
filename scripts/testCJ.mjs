/**
 * Test script for CJ Dropshipping API
 * Run: node scripts/testCJ.mjs
 * Requires: CJ_API_EMAIL + CJ_API_KEY in .env.local
 */
import { readFileSync } from 'fs';

const env = readFileSync('/Users/maximus/ManusMajorka/.env.local', 'utf8');
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
}

const email = process.env.CJ_API_EMAIL;
const key = process.env.CJ_API_KEY;
const USD_TO_AUD = 1.55;

if (!email || !key) {
  console.error('❌ CJ_API_EMAIL or CJ_API_KEY not set in .env.local');
  console.error('Add them first: go to developers.cjdropshipping.com → API credentials');
  process.exit(1);
}

console.log('Testing CJ API with email:', email);

// Step 1: Get token
const authRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: key }),
});
const authData = await authRes.json();

if (!authData.success) {
  console.error('❌ Auth failed:', authData.message);
  process.exit(1);
}

const token = authData.data.accessToken;
console.log('✅ Token obtained:', token.slice(0, 20) + '...');

// Step 2: Fetch Health & Beauty products
console.log('\nFetching Health & Beauty top sellers...');
const params = new URLSearchParams({ categoryName: 'Health & Beauty', pageNum: '1', pageSize: '5', sortField: 'sells' });
const prodRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?${params}`, {
  headers: { 'CJ-Access-Token': token },
});
const prodData = await prodRes.json();

if (!prodData.success) {
  console.error('❌ Product fetch failed:', prodData.message);
  console.log('Full response:', JSON.stringify(prodData, null, 2).slice(0, 500));
  process.exit(1);
}

const products = prodData.data?.list || [];
console.log(`✅ ${products.length} products returned`);
console.log('\nSample item keys:', products[0] ? Object.keys(products[0]).join(', ') : 'none');

console.log('\n═══ First 3 products ═══');
products.slice(0, 3).forEach((p, i) => {
  const usdPrice = parseFloat(p.sellPrice || p.listingPrice || '0');
  const sells = parseInt(p.sells || p.salesCount || '0', 10);
  console.log(`\n[${i + 1}] ${p.productNameEn || p.productName}`);
  console.log(`    Price: $${usdPrice} USD → $${(usdPrice * USD_TO_AUD).toFixed(2)} AUD`);
  console.log(`    Image: ${(p.productImage || p.productImageUrl || 'none').slice(0, 80)}`);
  console.log(`    Sells: ${sells}`);
  console.log(`    Category: ${p.categoryName}`);
  console.log(`    Added: ${p.createTime || 'unknown'}`);
});
