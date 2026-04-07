import { Bell, TrendingUp, Flame, AlertCircle, ArrowUpRight } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

interface SampleAlert {
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  color: string;
  bg: string;
  title: string;
  body: string;
  time: string;
}

const SAMPLE_ALERTS: SampleAlert[] = [
  {
    icon: Flame, color: '#ef4444', bg: 'rgba(239,68,68,0.08)',
    title: 'New trending product detected',
    body: 'Silicone Air Fryer Liners are exploding on TikTok Shop AU — 4,200 orders in 48h. Score jumped from 71 to 89.',
    time: '12 min ago',
  },
  {
    icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.08)',
    title: 'Score milestone',
    body: 'Posture Corrector Belt just hit a 92/100 winning score — second-highest this week.',
    time: '1 hr ago',
  },
  {
    icon: Bell, color: '#6366F1', bg: 'rgba(99,102,241,0.08)',
    title: 'Weekly digest ready',
    body: '12 new high-score products added to your watchlist categories: Health & Beauty (5), Home & Kitchen (4), Pet (3).',
    time: '3 hr ago',
  },
  {
    icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',
    title: 'Margin warning',
    body: 'LED Strip Lights USB price dropped 18% on AliExpress — your margin window is shrinking. Consider repricing.',
    time: '6 hr ago',
  },
  {
    icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.08)',
    title: 'New niche alert',
    body: 'Pet category is up 42% in revenue growth this week. 8 new winning products detected.',
    time: '1 day ago',
  },
];

export default function AppAlerts() {
  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: display, fontWeight: 600, fontSize: 28, color: '#ededed', letterSpacing: '-0.025em', margin: '0 0 6px' }}>Alerts</h1>
        <p style={{ fontFamily: sans, fontSize: 14, color: '#71717a', margin: 0 }}>
          Get notified when products hit your thresholds, scores spike, or new niches emerge.
        </p>
      </div>

      <div style={{
        padding: '12px 18px',
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 6,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span style={{ fontFamily: mono, fontSize: 12, color: '#f59e0b' }}>
          Sample alerts — connect your store to receive live notifications based on your watchlist.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SAMPLE_ALERTS.map((alert, i) => {
          const Icon = alert.icon;
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '18px 20px',
              background: '#111114',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              transition: 'border-color 150ms',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: alert.bg,
                color: alert.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${alert.color}33`,
              }}><Icon size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 12 }}>
                  <h3 style={{ fontFamily: display, fontWeight: 600, fontSize: 15, color: '#ededed', letterSpacing: '-0.01em', margin: 0 }}>{alert.title}</h3>
                  <span style={{ fontFamily: mono, fontSize: 11, color: '#52525b', flexShrink: 0 }}>{alert.time}</span>
                </div>
                <p style={{ fontFamily: sans, fontSize: 13, color: '#a1a1aa', lineHeight: 1.55, margin: 0 }}>{alert.body}</p>
              </div>
              <ArrowUpRight size={14} style={{ color: '#52525b', flexShrink: 0, marginTop: 4 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
