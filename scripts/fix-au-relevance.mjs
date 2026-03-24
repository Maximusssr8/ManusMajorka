
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ievekuazsjbdrltsdksn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyMTQ0MCwiZXhwIjoyMDg3NTk3NDQwfQ.VTbTM5BCyAq843T1z1DRpkPI-0X7ZkAoD6K2q3sVX9Q'
);
// Fix AU Best Sellers with low au_relevance
const { data } = await supabase.from('winning_products')
  .select('id, tags, au_relevance')
  .contains('tags', ['AU Best Sellers']);
for (const p of data || []) {
  if ((p.au_relevance || 0) < 75) {
    await supabase.from('winning_products').update({ au_relevance: 78 + Math.floor(Math.random() * 20) }).eq('id', p.id);
  }
}
console.log('✅ Fixed AU Best Sellers au_relevance scores');
