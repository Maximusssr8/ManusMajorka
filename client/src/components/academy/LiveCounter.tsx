import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { supabase } from '@/lib/supabase';

/**
 * Pulls the live count of winning_products from Supabase and animates it
 * up from 0. Falls back to a sensible default if the fetch fails.
 */
export function LiveCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { count: n, error } = await supabase
          .from('winning_products')
          .select('*', { count: 'exact', head: true });
        if (cancelled) return;
        if (error) throw error;
        setCount(typeof n === 'number' ? n : 3715);
      } catch {
        if (!cancelled) setCount(3715);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (count === null) {
    return <span className="text-white/40 tabular-nums">—</span>;
  }

  return (
    <span className="tabular-nums" style={{ color: '#10b981', textShadow: '0 0 16px rgba(16,185,129,0.4)' }}>
      <CountUp end={count} duration={2.4} separator="," />
    </span>
  );
}
