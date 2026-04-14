import { useState, type CSSProperties } from 'react';
import { C } from '@/lib/designTokens';
import { Copy, Check } from 'lucide-react';

interface AdFieldEditorProps {
  label: string;
  value: string;
  limit?: number;
  multiline?: boolean;
  onChange: (next: string) => void;
}

export default function AdFieldEditor({ label, value, limit, multiline, onChange }: AdFieldEditorProps) {
  const [copied, setCopied] = useState(false);
  const len = value.length;
  const over = limit != null && len > limit;

  const shared: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: C.bg,
    border: `1px solid ${over ? C.red : C.border}`,
    borderRadius: C.rSm,
    color: C.text,
    fontFamily: C.fontBody,
    fontSize: 13,
    lineHeight: 1.5,
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore clipboard errors */
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: C.fontMono,
            fontSize: 10,
            letterSpacing: 1.4,
            color: C.muted,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {limit != null && (
            <span
              style={{
                fontFamily: C.fontMono,
                fontSize: 10,
                color: over ? C.red : C.muted,
              }}
            >
              {len}/{limit}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
            style={{
              width: 28,
              height: 28,
              display: 'grid',
              placeItems: 'center',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: C.rXs,
              color: copied ? C.green : C.muted,
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={shared}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={shared}
        />
      )}
    </div>
  );
}
