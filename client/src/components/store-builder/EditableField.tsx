import { useState } from 'react';
import { Loader2, Pencil, RefreshCw } from 'lucide-react';

const ACCENT = '#4f8ef7';
const TEXT_PRIMARY = '#f0f4ff';
const TEXT_BODY = '#a1a1aa';
const TEXT_MUTED = '#52525b';
const FONT_BODY = "'DM Sans', sans-serif";

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onRegenerate?: () => Promise<void>;
  multiline?: boolean;
  placeholder?: string;
}

export default function EditableField({
  label,
  value,
  onChange,
  onRegenerate,
  multiline = false,
  placeholder,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [regenerating, setRegeneating] = useState(false);

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setRegeneating(true);
    try {
      await onRegenerate();
    } finally {
      setRegeneating(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: TEXT_BODY, letterSpacing: '0.08em', fontFamily: FONT_BODY }}
        >
          {label}
        </label>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors hover:bg-white/5"
              style={{ color: TEXT_MUTED }}
            >
              <Pencil size={10} /> Edit
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors hover:bg-white/5"
              style={{ color: ACCENT }}
            >
              {regenerating ? (
                <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RefreshCw size={10} />
              )}
              Regenerate
            </button>
          )}
        </div>
      </div>

      {isEditing || !value ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => { if (value) setIsEditing(false); }}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(79,142,247,0.4)',
              color: TEXT_PRIMARY,
              fontFamily: FONT_BODY,
              fontSize: 13,
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
            }}
            autoFocus
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => { if (value) setIsEditing(false); }}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(79,142,247,0.4)',
              color: TEXT_PRIMARY,
              fontFamily: FONT_BODY,
              fontSize: 13,
              outline: 'none',
            }}
            autoFocus
          />
        )
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-white/[0.03]"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: TEXT_PRIMARY,
            fontFamily: FONT_BODY,
            fontSize: 13,
            lineHeight: 1.6,
            minHeight: multiline ? 60 : 'auto',
            whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
