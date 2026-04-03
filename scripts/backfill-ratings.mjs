// Copies `rating` → `real_rating` for all products where real_rating is null
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyMTQ0MCwiZXhwIjoyMDg3NTk3NDQwfQ.VTbTM5BCyAq843T1z1DRpkPI-0X7ZkAoD6K2q3sVX9Q';
const BASE = 'https://ievekuazsjbdrltsdksn.supabase.co/rest/v1/winning_products';
const H = { 'apikey': SKEY, 'Authorization': `Bearer ${SKEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

// Fetch all with rating but no real_rating
const rows = await fetch(`${BASE}?is_active=eq.true&real_rating=is.null&select=id,rating&limit=2000`, { headers: H }).then(r => r.json());
console.log(`Found ${rows.length} products to backfill`);

let updated = 0;
for (const row of rows) {
  if (!row.rating || row.rating <= 0) continue;
  await fetch(`${BASE}?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ real_rating: row.rating }),
  });
  updated++;
  if (updated % 50 === 0) process.stdout.write(`${updated} `);
}
console.log(`\nBackfilled ${updated} real_rating values`);
