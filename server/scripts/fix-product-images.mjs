/**
 * fix-product-images.mjs
 * Updates winning_products Supabase rows that have Unsplash placeholder images
 * with real product images from Pexels API + known Amazon CDN URLs.
 */

const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyMTQ0MCwiZXhwIjoyMDg3NTk3NDQwfQ.VTbTM5BCyAq843T1z1DRpkPI-0X7ZkAoD6K2q3sVX9Q';
const PEXELS_KEY = process.env.PEXELS_API_KEY || 'EZjK9XGsizihc0Kr0mTGiQoglCY5kGQfOQ3QIKOLLODImTaxlg5ztpFB';

// Known real product images — curated reliable URLs
const KNOWN_IMAGES = {
  // By product title keyword match
  'ninja creami': 'https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg?auto=compress&cs=tinysrgb&w=400',
  'led light therapy face mask': 'https://images.pexels.com/photos/3985300/pexels-photo-3985300.jpeg?auto=compress&cs=tinysrgb&w=400',
  'led bathroom mirror': 'https://images.pexels.com/photos/1910472/pexels-photo-1910472.jpeg?auto=compress&cs=tinysrgb&w=400',
  'cordless auto hair curler': 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400',
  'stanley dupe': 'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=400',
  'wide leg cargo pants': 'https://images.pexels.com/photos/1895943/pexels-photo-1895943.jpeg?auto=compress&cs=tinysrgb&w=400',
  'standing desk': 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=400',
  'heatless curl': 'https://images.pexels.com/photos/3993316/pexels-photo-3993316.jpeg?auto=compress&cs=tinysrgb&w=400',
  'massage gun': 'https://images.pexels.com/photos/3076516/pexels-photo-3076516.jpeg?auto=compress&cs=tinysrgb&w=400',
  'gps smart watch': 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
  'red light therapy': 'https://images.pexels.com/photos/3985312/pexels-photo-3985312.jpeg?auto=compress&cs=tinysrgb&w=400',
  'adjustable dumbbell': 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=400',
  'dog lick mat': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400',
  'smart led strip': 'https://images.pexels.com/photos/1089459/pexels-photo-1089459.jpeg?auto=compress&cs=tinysrgb&w=400',
  'veggie chopper': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
  'sunscreen moisturiser': 'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=400',
  'air fryer liner': 'https://images.pexels.com/photos/3926133/pexels-photo-3926133.jpeg?auto=compress&cs=tinysrgb&w=400',
  'dog cooling mat': 'https://images.pexels.com/photos/3361739/pexels-photo-3361739.jpeg?auto=compress&cs=tinysrgb&w=400',
  'booty resistance bands': 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400',
  'resistance bands': 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400',
  'smart plug wifi': 'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=400',
  'portable blender': 'https://images.pexels.com/photos/775032/pexels-photo-775032.jpeg?auto=compress&cs=tinysrgb&w=400',
  'lash lift': 'https://images.pexels.com/photos/3764013/pexels-photo-3764013.jpeg?auto=compress&cs=tinysrgb&w=400',
  'white noise machine': 'https://images.pexels.com/photos/1161547/pexels-photo-1161547.jpeg?auto=compress&cs=tinysrgb&w=400',
  'toothpaste': 'https://images.pexels.com/photos/3762453/pexels-photo-3762453.jpeg?auto=compress&cs=tinysrgb&w=400',
  'pet water fountain': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=400',
  'scalp massager': 'https://images.pexels.com/photos/3997989/pexels-photo-3997989.jpeg?auto=compress&cs=tinysrgb&w=400',
  'pimple patch': 'https://images.pexels.com/photos/3762878/pexels-photo-3762878.jpeg?auto=compress&cs=tinysrgb&w=400',
  'dish drying rack': 'https://images.pexels.com/photos/1454808/pexels-photo-1454808.jpeg?auto=compress&cs=tinysrgb&w=400',
  'cat laser': 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ice roller': 'https://images.pexels.com/photos/3985309/pexels-photo-3985309.jpeg?auto=compress&cs=tinysrgb&w=400',
  'recliner chair': 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=400',
  'massage recliner': 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=400',
  'sleep mask': 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=400',
};

function findImage(title) {
  const lower = title.toLowerCase();
  for (const [keyword, url] of Object.entries(KNOWN_IMAGES)) {
    if (lower.includes(keyword)) return url;
  }
  return null;
}

async function searchPexels(query) {
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`, {
      headers: { Authorization: PEXELS_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.medium || null;
  } catch {
    return null;
  }
}

async function main() {
  // Fetch all unsplash products
  const res = await fetch(`${SUPABASE_URL}/rest/v1/winning_products?select=id,product_title,image_url&image_url=ilike.*unsplash*`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const products = await res.json();
  console.log(`Found ${products.length} products with Unsplash images`);

  let updated = 0;
  for (const product of products) {
    const title = product.product_title;
    let imageUrl = findImage(title);
    
    if (!imageUrl) {
      // Fall back to Pexels search
      const searchQuery = title.replace(/\d+[a-z]*/gi, '').replace(/[-_]/g, ' ').trim().substring(0, 50);
      console.log(`Searching Pexels for: ${searchQuery}`);
      imageUrl = await searchPexels(searchQuery);
    }
    
    if (!imageUrl) {
      console.log(`  SKIP: No image found for ${title}`);
      continue;
    }

    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/winning_products?id=eq.${product.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ image_url: imageUrl })
    });

    if (updateRes.ok) {
      console.log(`  ✅ Updated: ${title.substring(0, 40)}`);
      updated++;
    } else {
      const err = await updateRes.text();
      console.log(`  ❌ Failed: ${title.substring(0, 40)} — ${err}`);
    }
    
    // Rate limit Pexels
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone! Updated ${updated}/${products.length} products.`);
}

main().catch(console.error);
