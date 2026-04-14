import { C } from '@/lib/designTokens';

export type AdFormat = 'meta_feed' | 'meta_story' | 'tiktok_feed' | 'tiktok_story';

export interface FormatSpec {
  id: AdFormat;
  label: string;
  sub: string;
  aspect: '1:1' | '9:16';
  platform: 'meta' | 'tiktok';
  headlineLimit: number;
  bodyLimit: number;
}

export const AD_FORMATS: readonly FormatSpec[] = [
  { id: 'meta_feed',    label: 'Meta Feed',    sub: '1:1 · 125ch headline · 500ch body',  aspect: '1:1',  platform: 'meta',   headlineLimit: 125, bodyLimit: 500 },
  { id: 'meta_story',   label: 'Meta Story',   sub: '9:16 · short hook',                  aspect: '9:16', platform: 'meta',   headlineLimit: 60,  bodyLimit: 150 },
  { id: 'tiktok_feed',  label: 'TikTok Feed',  sub: 'Casual · hook-first · hashtags',     aspect: '9:16', platform: 'tiktok', headlineLimit: 80,  bodyLimit: 300 },
  { id: 'tiktok_story', label: 'TikTok Story', sub: 'Ultra-short · 3s readable',          aspect: '9:16', platform: 'tiktok', headlineLimit: 40,  bodyLimit: 100 },
] as const;

interface FormatTabsProps {
  value: AdFormat;
  onChange: (f: AdFormat) => void;
}

export default function FormatTabs({ value, onChange }: FormatTabsProps) {
  return (
    <div
      role="tablist"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 8,
      }}
    >
      {AD_FORMATS.map((f) => {
        const active = f.id === value;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(f.id)}
            style={{
              minHeight: 64,
              padding: '10px 12px',
              textAlign: 'left',
              background: active ? C.accentSubtle : C.cardBg,
              border: `1px solid ${active ? C.accent : C.border}`,
              borderRadius: C.rMd,
              color: C.text,
              cursor: 'pointer',
              transition: `all ${C.dur} ${C.ease}`,
            }}
          >
            <div
              style={{
                fontFamily: C.fontDisplay,
                fontSize: 13,
                fontWeight: 700,
                color: active ? C.accent : C.text,
                letterSpacing: 0.3,
              }}
            >
              {f.label}
            </div>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.muted, marginTop: 3 }}>
              {f.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function getFormatSpec(format: AdFormat): FormatSpec {
  return AD_FORMATS.find((f) => f.id === format) ?? AD_FORMATS[0];
}
