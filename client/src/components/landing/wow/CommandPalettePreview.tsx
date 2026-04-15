// Directive 5 — ⌘K command palette with inline previews.
// Floating chip bottom-right. Cmd+K / Ctrl+K opens a cmdk palette.
// Selecting an entry flashes a 700ms preview card, then navigates to
// /sign-in?redirect=<path>.

import { useCallback, useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useLocation } from 'wouter';
import { LT, F, R } from '@/lib/landingTokens';

interface Entry {
  id: string;
  label: string;
  hint: string;
  route: string;
  preview: string;
}

const ENTRIES: Entry[] = [
  { id: 'picks',  label: "See today's top products", hint: 'Home',         route: '/app',              preview: 'Top 5 picks rotating daily · AU demand bars · live score chips' },
  { id: 'brief',  label: 'Generate an AI brief',     hint: 'Maya AI',      route: '/app/maya',         preview: 'Angle · audience · ceiling · one paragraph, shippable' },
  { id: 'ad',     label: 'Create a Meta ad',         hint: 'Ads Studio',   route: '/app/ads-studio',   preview: 'Feed / Reel / Story / Carousel — copy the winner' },
  { id: 'store',  label: 'Build a store',            hint: 'Store Builder', route: '/app/store-builder', preview: 'Shopify-ready sections, product block, imported in one click' },
  { id: 'learn',  label: 'Learn dropshipping in AU', hint: 'Academy',      route: '/academy',          preview: 'AU-first 7-day sprint to first sale · supplier · shipping · tax' },
];

export function CommandPalettePreview() {
  const [open, setOpen] = useState(false);
  const [previewOf, setPreviewOf] = useState<Entry | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pick = useCallback((entry: Entry) => {
    setPreviewOf(entry);
    window.setTimeout(() => {
      setOpen(false);
      setPreviewOf(null);
      navigate(`/sign-in?redirect=${encodeURIComponent(entry.route)}`);
    }, 700);
  }, [navigate]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="mj-cmdk-chip"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 50,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: LT.bgCard,
          border: `1px solid ${LT.border}`,
          borderRadius: 100,
          color: LT.text,
          fontFamily: F.mono,
          fontSize: 12,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          transition: 'border-color 150ms ease, transform 150ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = LT.gold; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = LT.border; }}
      >
        <kbd style={kbdStyle}>⌘</kbd>
        <kbd style={kbdStyle}>K</kbd>
        <span style={{ color: LT.textMute }}>Open preview</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'start center',
            paddingTop: '10vh',
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 640,
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: R.card,
              overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
            }}
          >
            <Command label="Command palette" shouldFilter={!previewOf}>
              <Command.Input
                autoFocus
                placeholder="What do you want to do?"
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  background: LT.bg,
                  border: 'none',
                  borderBottom: `1px solid ${LT.border}`,
                  color: LT.text,
                  fontFamily: F.body,
                  fontSize: 16,
                  outline: 'none',
                }}
              />
              <Command.List style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
                <Command.Empty style={{ padding: 16, color: LT.textMute, fontFamily: F.body, fontSize: 13 }}>
                  No matches. Try "brief" or "store".
                </Command.Empty>
                {ENTRIES.map((e) => (
                  <Command.Item
                    key={e.id}
                    value={`${e.label} ${e.hint} ${e.preview}`}
                    onSelect={() => pick(e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 10,
                      color: LT.text,
                      fontFamily: F.body,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                    className="mj-cmdk-item"
                  >
                    <span>{e.label}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: LT.textMute }}>{e.hint}</span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>

            {previewOf && (
              <div
                aria-live="polite"
                style={{
                  padding: 16,
                  borderTop: `1px solid ${LT.border}`,
                  background: LT.bg,
                  color: LT.textMute,
                  fontFamily: F.mono,
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ color: LT.gold, marginBottom: 6 }}>Preview · {previewOf.hint}</div>
                <div style={{ color: LT.text }}>{previewOf.preview}</div>
                <div style={{ marginTop: 8, color: LT.textDim }}>Opening sign-in…</div>
              </div>
            )}
          </div>

          <style>{`
            [cmdk-item][data-selected="true"] { background: ${LT.bgElevated}; }
            [cmdk-item]:hover { background: ${LT.bgElevated}; }
            @media (max-width: 640px) {
              .mj-cmdk-chip span { display: none; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

const kbdStyle: React.CSSProperties = {
  fontFamily: F.mono,
  fontSize: 11,
  padding: '2px 6px',
  background: LT.bg,
  border: `1px solid ${LT.border}`,
  borderRadius: 4,
  color: LT.gold,
};

export default CommandPalettePreview;
