/**
 * "Since you last logged in" deltas strip — appended to the Home page.
 *
 * Calls POST /api/user/ping on mount to stamp last_login_at and read back the
 * PREVIOUS value. Then calls GET /api/user/deltas to fetch counts for:
 *   - new products in the user's tracked categories
 *   - their most-viewed product's 7-day velocity
 *   - total trending (score >= 85) items since last login
 *
 * Renders nothing for unauthenticated users or on API failure — never blocks
 * the Home page.
 */
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Clock, Flame, LineChart, Package } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface DeltasResponse {
  new_in_categories: number;
  most_viewed_jump: { product_id: string; title: string | null; pct: number } | null;
  trending_count: number;
  since: string | null;
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'recently';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return 'recently';
  const ms = Date.now() - ts;
  const hrs = Math.round(ms / 3600_000);
  if (hrs < 1) return 'less than an hour ago';
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

export function SinceLastLogin() {
  const { user, isAuthenticated } = useAuth();
  const [deltas, setDeltas] = useState<DeltasResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }
        // Stamp last_login_at, but don't block the deltas call.
        fetch('/api/user/ping', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {
          /* non-fatal */
        });
        const r = await fetch('/api/user/deltas', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const body = (await r.json()) as DeltasResponse;
        if (cancelled) return;
        setDeltas(body);
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || loading || !deltas) return null;

  const hasAny =
    (deltas.new_in_categories ?? 0) > 0 ||
    deltas.most_viewed_jump != null ||
    (deltas.trending_count ?? 0) > 0;
  if (!hasAny) return null;

  const cards: { icon: typeof Flame; label: string; value: string; sub: string; href: string; color: string }[] = [];

  if ((deltas.new_in_categories ?? 0) > 0) {
    cards.push({
      icon: Package,
      label: 'New in your categories',
      value: `${deltas.new_in_categories}`,
      sub: 'products you might have missed',
      href: '/app/products',
      color: '#10b981',
    });
  }
  if (deltas.most_viewed_jump) {
    const title = deltas.most_viewed_jump.title ?? 'Your most-viewed product';
    cards.push({
      icon: LineChart,
      label: 'Your most-viewed jumped',
      value: `+${deltas.most_viewed_jump.pct}%`,
      sub: title.length > 48 ? `${title.slice(0, 45)}…` : title,
      href: `/app/products?product=${deltas.most_viewed_jump.product_id}`,
      color: '#e5c158',
    });
  }
  if ((deltas.trending_count ?? 0) > 0) {
    cards.push({
      icon: Flame,
      label: 'New trending items',
      value: `${deltas.trending_count}`,
      sub: 'winning score 85+',
      href: '/app/products?tab=hot-now',
      color: '#f59e0b',
    });
  }

  return (
    <section className="px-4 md:px-8 py-6 border-t border-white/[0.05]">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} className="text-white/40" />
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-white/50">
          Since you last logged in
          <span className="text-white/30 ml-2">· {formatRelative(deltas.since)}</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group bg-surface border border-white/[0.07] hover:border-white/[0.15] rounded-2xl p-5 transition-all no-underline"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}33` }}
              >
                <c.icon size={16} />
              </div>
              <ArrowRight
                size={14}
                className="text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all"
              />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">
              {c.label}
            </div>
            <div className="text-2xl font-semibold text-white tabular-nums" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="text-xs text-white/50 mt-1 line-clamp-1">{c.sub}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
