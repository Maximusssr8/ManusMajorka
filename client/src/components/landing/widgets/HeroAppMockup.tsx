/**
 * HeroAppMockup — decorative 3-panel macOS-style app window for the
 * Majorka landing hero. Titlebar → Sidebar + Chat + Diff.
 *
 * Pure presentational component. No interactivity, no real data. Manual
 * syntax highlighting via inline spans (no Shiki/Prism dependency).
 *
 * Drop it directly into the hero section:
 *     <HeroAppMockup />
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

const FONT_SANS = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "ui-monospace, 'Cascadia Code', 'JetBrains Mono', monospace";

// Syntax token palette
const TOK = {
  keyword:     'rgb(246,117,118)',
  identifier:  'rgb(255,255,255)',
  string:      'rgb(152,195,121)',
  propertyKey: 'rgb(224,196,242)',
  punct:       'rgba(255,255,255,0.45)',
};

const ANIM_STYLE = `
@keyframes mj-hero-rise {
  0%   { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0); }
}
.mj-hero-mockup {
  animation: mj-hero-rise 700ms ease forwards;
  animation-delay: 300ms;
  opacity: 0;
}
@keyframes mj-chip-in {
  0%   { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}
.mj-chip-stream > * {
  opacity: 0;
  animation: mj-chip-in 280ms ease forwards;
}
.mj-chip-stream > *:nth-child(1) { animation-delay: 900ms;  }
.mj-chip-stream > *:nth-child(2) { animation-delay: 1100ms; }
.mj-chip-stream > *:nth-child(3) { animation-delay: 1300ms; }
.mj-chip-stream > *:nth-child(4) { animation-delay: 1500ms; }
.mj-chip-stream > *:nth-child(5) { animation-delay: 1700ms; }
`;

export function HeroAppMockup() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
      <style>{ANIM_STYLE}</style>
      <div style={{
        // Parent mask wrapper — fade out at bottom
        position: 'relative',
        width: '100%',
        maxWidth: 1240,
        margin: '0 auto',
        padding: '0 16px 48px',
        boxSizing: 'border-box',
        WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 2rem), transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black calc(100% - 2rem), transparent 100%)',
      }}>
        <div
          className="mj-hero-mockup"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 1180,
            margin: '0 auto',
            height: isDesktop ? 720 : 500,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#121212',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Titlebar />
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <Sidebar />
            <ChatPanel />
            {isDesktop && <DiffPanel />}
          </div>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Titlebar
// ────────────────────────────────────────────────────────────────────

function Titlebar() {
  return (
    <div style={{
      height: 44,
      background: 'rgb(28,27,31)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Traffic lights */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingLeft: 4 }}>
        {[
          { bg: '#FF5F57' },
          { bg: '#FEBC2E' },
          { bg: '#28C840' },
        ].map((d, i) => (
          <span key={i} style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: d.bg,
            border: '0.5px solid rgba(0,0,0,0.12)',
            display: 'inline-block',
          }} />
        ))}
        {/* Sidebar toggle icon */}
        <button aria-label="Toggle sidebar" style={{
          width: 26,
          height: 26,
          background: 'transparent',
          border: 'none',
          marginLeft: 8,
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="3" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <line x1="9" y1="4" x2="13" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="9" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="9" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Center: tab + breadcrumb */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: FONT_SANS,
      }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Create Majorka hero</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1.5" y="3" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <line x1="5" y1="13.5" x2="11" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12 }}>majorka/app</span>
        </div>
      </div>

      {/* Right: Open + Commit buttons */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <TitlebarButton label="Open" />
        <TitlebarButton label="Commit" icon={<CommitIcon />} />
      </div>
    </div>
  );
}

function TitlebarButton({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <button style={{
      height: 28,
      padding: '0 12px',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 6,
      fontFamily: FONT_SANS,
      fontSize: 13,
      color: 'white',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      cursor: 'pointer',
    }}>
      {icon}
      {label}
      <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
    </button>
  );
}

function CommitIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 6 L13 6 L13 11 L8 11" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M11 4 L13 6 L11 8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// Sidebar
// ────────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside style={{
      width: 256,
      flexShrink: 0,
      background: 'rgba(0,0,0,0.5)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      padding: '12px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      overflow: 'hidden',
      fontFamily: FONT_SANS,
    }}>
      <NavItem icon={<PenIcon />} label="New thread" />
      <NavItem icon={<ClockIcon />} label="Automations" />
      <NavItem icon={<GridIcon />} label="Skills" />

      <div style={{
        marginTop: 12,
        padding: '4px 8px',
        fontSize: 11,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.35)',
      }}>Your workspaces</div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        height: 28,
      }}>
        <FolderIcon />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Majorka</span>
      </div>

      <div style={{ marginLeft: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ThreadRow label="Build landing page" time="1h" />
        <ThreadRow label="Create Majorka hero" time="4h" selected />
        <ThreadRow label="Implement dark mode" time="8h" />
        <ThreadRow label="Refactor pricing" time="1d" />
      </div>
    </aside>
  );
}

function NavItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div style={{
      height: 30,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 8px',
      borderRadius: 6,
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      cursor: 'pointer',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.55)', display: 'flex' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function ThreadRow({ label, time, selected }: { label: string; time: string; selected?: boolean }) {
  return (
    <div style={{
      height: 28,
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px 0 4px',
      borderRadius: 6,
      fontSize: 13,
      background: selected ? 'rgba(255,255,255,0.09)' : 'transparent',
      color: selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
      gap: 6,
      minWidth: 0,
    }}>
      {selected && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#3B82F6',
          flexShrink: 0,
        }} />
      )}
      <span style={{
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{label}</span>
      <span style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.35)',
        fontFamily: FONT_MONO,
        flexShrink: 0,
      }}>{time}</span>
    </div>
  );
}

function PenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11 2 L14 5 L6 13 L2 14 L3 10 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4 V8 L11 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4 L6 4 L7.5 5.5 L14 5.5 L14 12 L2 12 Z" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// Chat panel
// ────────────────────────────────────────────────────────────────────

function ChatPanel() {
  return (
    <section style={{
      flex: 1,
      minWidth: 0,
      background: '#121212',
      padding: '20px 20px 0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: FONT_SANS,
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {/* User message bubble */}
        <div style={{
          alignSelf: 'center',
          maxWidth: '75%',
          background: '#302F36',
          borderRadius: 14,
          padding: '10px 14px',
          marginBottom: 20,
          marginLeft: 'auto',
          marginRight: 'auto',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.9)',
          width: 'fit-content',
        }}>
          Create a compelling launch hero for the new Majorka app
        </div>

        {/* AI response */}
        <p style={{
          fontSize: 13,
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.8)',
          margin: '0 0 16px',
        }}>
          I'll update the hero copy to clearly communicate what Majorka does, add outcome-focused bullets, and ensure the CTAs align with launch goals.
        </p>

        {/* Status rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Thought 7s</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Explored 2 files</span>
        </div>

        {/* Action chips — staggered entrance */}
        <div className="mj-chip-stream" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ActionChip action="Edited"  file="hero.tsx"    ok />
          <ActionChip action="Read"    file="config.ts" />
          <ActionChip action="Edited"  file="config.ts"   ok />
          <ActionChip action="Read"    file="pricing.tsx" />
          <ActionChip action="Edited"  file="pricing.tsx" ok />
        </div>
      </div>

      {/* Input bar */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: '#121212',
        padding: '12px 0 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <button aria-label="Attach" style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          cursor: 'pointer',
          flexShrink: 0,
        }}>+</button>
        <span style={{
          flex: 1,
          fontSize: 13,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: FONT_SANS,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>Ask Majorka anything, @ to add files, / for commands</span>
        <button aria-label="Send" style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'white',
          border: 'none',
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}>↑</button>
      </div>
    </section>
  );
}

function ActionChip({ action, file, ok }: { action: 'Edited' | 'Read'; file: string; ok?: boolean }) {
  const actionColor = action === 'Edited' ? 'rgb(245,158,11)' : 'rgba(255,255,255,0.4)';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: '#1C1C1C',
      borderRadius: 6,
      padding: '5px 10px',
      height: 30,
      width: '100%',
      fontSize: 12,
      boxSizing: 'border-box',
    }}>
      <span style={{ color: actionColor, fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{action}</span>
      <span style={{
        color: 'rgba(255,255,255,0.75)',
        fontFamily: FONT_MONO,
        fontSize: 12,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{file}</span>
      {ok && <span style={{ color: 'rgb(34,197,94)', fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>✓</span>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Diff panel
// ────────────────────────────────────────────────────────────────────

type DiffKind = 'context' | 'add' | 'remove';
interface DiffLine {
  kind: DiffKind;
  content: ReactNode;
}

function DiffPanel() {
  return (
    <section style={{
      width: 370,
      flexShrink: 0,
      background: '#16161A',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      padding: 16,
      overflowY: 'auto',
      fontFamily: FONT_SANS,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>2 files changed</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#22C55E' }}>+9</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#F87171' }}>-6</span>
        </div>
      </div>

      {/* File row */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        padding: '6px 10px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: FONT_MONO }}>src/</span>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: FONT_MONO, fontWeight: 600 }}>hero.tsx</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#22C55E' }}>+8</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#F87171' }}>-5</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>✓</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>×</span>
        </div>
      </div>

      {/* Code block */}
      <div style={{
        fontFamily: FONT_MONO,
        fontSize: 12,
        lineHeight: 1.75,
      }}>
        {DIFF_LINES.map((line, i) => <DiffRow key={i} line={line} />)}
      </div>
    </section>
  );
}

function DiffRow({ line }: { line: DiffLine }) {
  const base: CSSProperties = {
    display: 'flex',
    padding: '0 8px',
    minHeight: 21,
    alignItems: 'center',
  };
  let rowStyle: CSSProperties = { ...base };
  let gutterChar = ' ';
  let gutterColor = 'rgba(255,255,255,0.2)';
  if (line.kind === 'add') {
    rowStyle = {
      ...base,
      background: 'rgba(34,197,94,0.12)',
      borderLeft: '2px solid rgb(34,197,94)',
      paddingLeft: 6,
    };
    gutterChar = '+';
    gutterColor = '#4ADE80';
  } else if (line.kind === 'remove') {
    rowStyle = {
      ...base,
      background: 'rgba(239,68,68,0.15)',
      borderLeft: '2px solid rgb(239,68,68)',
      paddingLeft: 6,
    };
    gutterChar = '-';
    gutterColor = '#F87171';
  }
  return (
    <div style={rowStyle}>
      <span style={{
        width: 14,
        flexShrink: 0,
        fontSize: 11,
        color: gutterColor,
        textAlign: 'right',
        marginRight: 12,
        userSelect: 'none',
      }}>{gutterChar}</span>
      <span style={{ color: 'rgba(255,255,255,0.9)' }}>{line.content}</span>
    </div>
  );
}

// Token helpers — tiny inline syntax highlighter
const K = (s: string) => <span style={{ color: TOK.keyword }}>{s}</span>;
const I = (s: string) => <span style={{ color: TOK.identifier }}>{s}</span>;
const S = (s: string) => <span style={{ color: TOK.string }}>{s}</span>;
const P = (s: string) => <span style={{ color: TOK.propertyKey }}>{s}</span>;
const X = (s: string) => <span style={{ color: TOK.punct }}>{s}</span>;

const DIFF_LINES: DiffLine[] = [
  { kind: 'context', content: <>{K('export')} {K('const')} {I('hero')} {X('=')} {X('{')}</> },
  { kind: 'remove',  content: <>  {P('eyebrow')}{X(':')} {S('"New"')}{X(',')}</> },
  { kind: 'remove',  content: <>  {P('title')}{X(':')} {S('"Majorka"')}{X(',')}</> },
  { kind: 'remove',  content: <>  {P('subtitle')}{X(':')} {S('"AI for teams"')}{X(',')}</> },
  { kind: 'add',     content: <>  {P('eyebrow')}{X(':')} {S('"Introducing"')}{X(',')}</> },
  { kind: 'add',     content: <>  {P('title')}{X(':')} {S('"Majorka v2"')}{X(',')}</> },
  { kind: 'add',     content: <>  {P('subtitle')}{X(':')} {S('"Ship 10x faster"')}{X(',')}</> },
  { kind: 'add',     content: <>  {P('primaryCta')}{X(':')} {S('"Get started"')}{X(',')}</> },
  { kind: 'add',     content: <>  {P('secondaryCta')}{X(':')} {S('"See demo"')}{X(',')}</> },
  { kind: 'context', content: <>{X('};')}</> },
];
