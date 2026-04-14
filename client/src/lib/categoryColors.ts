export function getCategoryColor(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('kitchen') || cat.includes('food')) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
  if (cat.includes('health') || cat.includes('medical')) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  if (cat.includes('fashion') || cat.includes('clothing') || cat.includes('apparel')) return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
  if (cat.includes('electron') || cat.includes('tech') || cat.includes('phone')) return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
  if (cat.includes('beauty') || cat.includes('cosmetic')) return 'bg-pink-500/20 text-pink-300 border border-pink-500/30';
  if (cat.includes('kids') || cat.includes('baby') || cat.includes('child')) return 'bg-[#3B82F6]/20 text-violet-300 border border-[#3B82F6]/30';
  if (cat.includes('outdoor') || cat.includes('garden') || cat.includes('camp')) return 'bg-green-500/20 text-green-300 border border-green-500/30';
  if (cat.includes('pet') || cat.includes('animal')) return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
  if (cat.includes('home') || cat.includes('decor') || cat.includes('furniture')) return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
  if (cat.includes('sport') || cat.includes('fitness') || cat.includes('gym')) return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
  if (cat.includes('car') || cat.includes('auto') || cat.includes('vehicle')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
  return 'bg-[#d4af37]/20 text-[#e5c158] border border-[#d4af37]/30';
}

export function getCategoryStyle(category: string): { background: string; color: string; border: string } {
  const cat = (category || '').toLowerCase();
  if (cat.includes('kitchen') || cat.includes('food')) return { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' };
  if (cat.includes('health') || cat.includes('medical')) return { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' };
  if (cat.includes('fashion') || cat.includes('clothing') || cat.includes('apparel')) return { background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' };
  if (cat.includes('electron') || cat.includes('tech') || cat.includes('phone')) return { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' };
  if (cat.includes('beauty') || cat.includes('cosmetic')) return { background: 'rgba(236,72,153,0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)' };
  if (cat.includes('kids') || cat.includes('baby') || cat.includes('child')) return { background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' };
  if (cat.includes('outdoor') || cat.includes('garden') || cat.includes('camp')) return { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' };
  if (cat.includes('pet') || cat.includes('animal')) return { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' };
  if (cat.includes('home') || cat.includes('decor') || cat.includes('furniture')) return { background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' };
  if (cat.includes('sport') || cat.includes('fitness') || cat.includes('gym')) return { background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)' };
  if (cat.includes('supplement')) return { background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' };
  if (cat.includes('car') || cat.includes('auto') || cat.includes('vehicle')) return { background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' };
  return { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' };
}
