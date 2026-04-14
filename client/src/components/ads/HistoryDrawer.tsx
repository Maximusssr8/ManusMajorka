import { C } from '@/lib/designTokens';
import type { AdFormat } from './FormatTabs';
import { AD_FORMATS } from './FormatTabs';

export interface HistoryItem {
  id: string;
  product_id: string;
  format: AdFormat;
  market: string;
  output_json: {
    headlines: string[];
    bodies: string[];
    ctas: string[];
    hook: string;
    audience: string;
    interests: string[];
  };
  created_at: string;
}

interface HistoryDrawerProps {
  open: boolean;
  items: HistoryItem[];
  loading: boolean;
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
}

function formatLabel(id: AdFormat): string {
  return AD_FORMATS.find((f) => f.id === id)?.label ?? id;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HistoryDrawer({ open, items, loading, onClose, onRestore }: HistoryDrawerProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 420,
          maxWidth: '100%',
          background: C.cardBg,
          borderLeft: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            padding: 18,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: C.fontMono,
                fontSize: 10,
                letterSpacing: 1.4,
                color: C.muted,
                textTransform: 'uppercase',
              }}
            >
              Recent
            </div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 18, fontWeight: 700 }}>History</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            style={{
              width: 44,
              height: 44,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <div style={{ color: C.muted, fontSize: 13 }}>Loading…</div>}
          {!loading && items.length === 0 && (
            <div style={{ color: C.muted, fontSize: 13 }}>No generations yet.</div>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onRestore(item)}
              style={{
                textAlign: 'left',
                padding: 12,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: C.rSm,
                color: C.text,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: C.fontMono,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    color: C.accent,
                    textTransform: 'uppercase',
                  }}
                >
                  {formatLabel(item.format)} · {item.market}
                </div>
                <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.muted }}>
                  {timeAgo(item.created_at)}
                </div>
              </div>
              <div
                style={{
                  fontFamily: C.fontBody,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.output_json.headlines?.[0] ?? item.output_json.hook}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
