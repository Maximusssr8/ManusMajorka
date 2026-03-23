// server/lib/competitor-shops.ts
// 20 real AU dropship/DTC stores to monitor

export const AU_DROPSHIP_STORES = [
  { domain: 'ozziesupplies.com.au',   name: 'Ozzie Supplies',     category: 'General' },
  { domain: 'mytrendyphone.com.au',   name: 'My Trendy Phone AU', category: 'Tech & Gadgets' },
  { domain: 'kogan.com',              name: 'Kogan AU',            category: 'Tech & Gadgets' },
  { domain: 'catch.com.au',           name: 'Catch AU',            category: 'General' },
  { domain: 'luxyhair.com',           name: 'Luxy Hair',           category: 'Beauty' },
  { domain: 'priceline.com.au',       name: 'Priceline AU',        category: 'Beauty & Skincare' },
  { domain: 'shein.com.au',           name: 'SHEIN AU',            category: 'Fashion' },
  { domain: 'temu.com',               name: 'Temu AU',             category: 'General' },
  { domain: 'bellabox.com.au',        name: 'Bellabox AU',         category: 'Beauty' },
  { domain: 'beautyheaven.com.au',    name: 'Beauty Heaven AU',    category: 'Skincare' },
  { domain: 'petbarn.com.au',         name: 'Petbarn AU',          category: 'Pet Care' },
  { domain: 'petcircle.com.au',       name: 'Pet Circle AU',       category: 'Pet Care' },
  { domain: 'gymshark.com',           name: 'Gymshark AU',         category: 'Fitness' },
  { domain: 'stylerunner.com',        name: 'Stylerunner AU',      category: 'Fitness & Fashion' },
  { domain: 'frankbody.com',          name: 'Frank Body AU',       category: 'Skincare' },
  { domain: 'juicygreenshop.com.au',  name: 'Juicy Green Shop',    category: 'Home & Wellness' },
  { domain: 'theiconic.com.au',       name: 'THE ICONIC AU',       category: 'Fashion' },
  { domain: 'iherb.com',              name: 'iHerb AU',            category: 'Health & Wellness' },
  { domain: 'nuvita.com.au',          name: 'Nuvita AU',           category: 'Health' },
  { domain: 'goodnessme.com.au',      name: 'GoodnessMe AU',       category: 'Health & Wellness' },
];

export type CompetitorStore = typeof AU_DROPSHIP_STORES[number];
