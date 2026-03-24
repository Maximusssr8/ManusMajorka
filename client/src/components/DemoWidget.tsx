/**
 * DemoWidget — cinematic AI terminal experience for the Majorka landing page.
 * Auto-cycles through 3 demo prompts with typing → thinking → streaming → done phases.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

const dm = "'DM Sans', sans-serif";
const syne = "'Bricolage Grotesque', sans-serif";
const mono = "'DM Mono', 'Fira Code', 'Courier New', monospace";

const DEMO_STYLES = `
@keyframes border-breathe {
  0%, 100% { box-shadow: 0 0 40px rgba(99,102,241,0.08); }
  50%       { box-shadow: 0 0 60px rgba(99,102,241,0.16); }
}
@keyframes thinking-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
  40%           { transform: scale(1.0); opacity: 1; }
}
@keyframes word-appear {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}
.demo-cursor {
  display: inline-block; width: 2px; height: 14px;
  background: #6366F1; border-radius: 1px;
  vertical-align: middle; margin-left: 2px;
  animation: cursor-blink 0.8s step-end infinite;
}
.thinking-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #6366F1;
  animation: thinking-bounce 1.4s ease-in-out infinite;
}
.thinking-dot:nth-child(2) { animation-delay: 0.16s; }
.thinking-dot:nth-child(3) { animation-delay: 0.32s; }
.word-token {
  animation: word-appear 0.18s ease both;
}
@keyframes demo-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.demo-cta-primary {
  position: relative; overflow: hidden;
}
.demo-cta-primary::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, #D1D5DB 50%, transparent 100%);
  background-size: 200% 100%;
  animation: demo-shimmer 3s linear infinite;
  pointer-events: none;
}
`;

const PROMPTS = [
  'Find me a trending product to sell in Australia under $50',
  'Write me a Meta ad for a portable blender targeting gym-goers',
  'Build me a 5-email welcome sequence for a skincare brand',
];

const RESPONSE_LINES: string[][] = [
  [
    '## 🔥 Trending Now: Posture Corrector Pro',
    '',
    '**AU Demand Signal** ██████████ 94/100',
    '**Competition Level** ███░░░░░░░ Low-Med',
    '',
    '💰 Buy Price: $6–9 AUD (Alibaba)',
    '💸 Sell Price: $49 AUD',
    '📊 Gross Margin: 72%',
    '🚚 Ship Time: 7–10 days (AusPost eParcel)',
    '',
    "**Why it's winning AU right now:**",
    '→ Office workers post-COVID return surge',
    '→ Low saturation on Meta AU (CPM ~$14)',
    '→ Afterpay eligible — boosts AOV conversion',
    '',
    '**Top supplier:** Guangzhou Posture Co. ⭐ 4.8',
    'MOQ: 10 units · DHL Express 4 days available',
  ],
  [
    '## 📱 Meta Ad — Portable Blender',
    '',
    '**Hook (stop the scroll):**',
    '"POV: You\'re the person at the gym who actually drinks their protein fresh"',
    '',
    '**Primary Text:**',
    'Your blender is literally holding you back. The BlendGo fits in your gym bag, charges via USB, and blends a full protein shake in 20 seconds. No more chalky powder water.',
    '',
    '300ml. 6-blade motor. 3-hour battery.',
    '',
    '⚡ Free shipping Australia-wide',
    '💳 Pay in 4 with Afterpay',
    '',
    '**Headline:** Stop Drinking Clumpy Protein Shakes',
    '**CTA:** Shop Now · $39 AUD',
    '',
    '*Targeting: AU 🇦🇺 | 22–38 | Health & Fitness | Lookalike 1%*',
  ],
  [
    '## 📧 5-Email Welcome Sequence — Skincare',
    '',
    '**Email 1 (Day 0) — The Welcome**',
    'Sub: "Your skin just found its new routine ✨"',
    '→ Brand story, what makes you different, first purchase discount (WELCOME15)',
    '',
    '**Email 2 (Day 2) — Education**',
    'Sub: "The 3-step routine that actually works"',
    '→ Product education, ingredient hero story, social proof',
    '',
    '**Email 3 (Day 5) — Social Proof**',
    'Sub: "847 Australians can\'t be wrong..."',
    '→ UGC, before/after, reviews from AU customers',
    '',
    '**Email 4 (Day 8) — Objection Handling**',
    'Sub: "Is [product] actually worth it? Honest answer."',
    '→ Address top 3 objections, money-back guarantee, ACCC rights',
    '',
    '**Email 5 (Day 12) — Last Chance**',
    'Sub: "Your 15% off expires tonight"',
    '→ Urgency, scarcity, final CTA',
    '✅ Spam Act 2003 compliant · Unsubscribe included',
  ],
];

type Phase = 'typing' | 'thinking' | 'streaming' | 'done';

function renderLine(line: string, idx: number) {
  if (line === '') return <div key={idx} style={{ height: 5 }} />;

  if (line.startsWith('## ')) {
    return (
      <div
        key={idx}
        style={{
          fontFamily: syne,
          fontWeight: 800,
          fontSize: 14,
          color: '#6366F1',
          marginBottom: 6,
          marginTop: idx > 0 ? 12 : 0,
        }}
      >
        {line.slice(3)}
      </div>
    );
  }
  if (line.startsWith('→')) {
    return (
      <div
        key={idx}
        style={{
          fontSize: 12,
          color: '#6B7280',
          lineHeight: 1.65,
          paddingLeft: 4,
          marginBottom: 1,
        }}
      >
        {line}
      </div>
    );
  }
  if (/^[💰💸📊🚚⚡💳✅]/u.test(line)) {
    return (
      <div
        key={idx}
        style={{
          fontSize: 12,
          color: '#6B7280',
          lineHeight: 1.7,
          marginBottom: 1,
          fontFamily: mono,
        }}
      >
        {line}
      </div>
    );
  }
  if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
    return (
      <div
        key={idx}
        style={{
          fontSize: 11,
          color: '#9CA3AF',
          fontStyle: 'italic',
          lineHeight: 1.6,
          marginBottom: 2,
        }}
      >
        {line.replace(/^\*|\*$/g, '')}
      </div>
    );
  }

  // Parse inline bold
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  const rendered = parts.map((p, j) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={j} style={{ color: '#0A0A0A', fontWeight: 700 }}>
        {p.replace(/\*\*/g, '')}
      </strong>
    ) : (
      <span key={j}>{p}</span>
    )
  );

  return (
    <>
      <title>Demo Dashboard — Majorka</title>
      <meta name="robots" content="noindex, nofollow" />
    <div key={idx} style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, marginBottom: 2 }}>
      {rendered}
    </div>
  );
}

export default function DemoWidget() {
  const [promptIdx, setPromptIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const [typedLen, setTypedLen] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const responseRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    let idx = 0;

    const sleep = (ms: number) =>
      new Promise<void>((res) => {
        const t = setTimeout(res, ms);
        // store on window so we can clear on cancel? We'll just let it expire
        void t;
      });

    const run = async (promptIndex: number) => {
      if (cancelRef.current) return;
      const prompt = PROMPTS[promptIndex];
      const lines = RESPONSE_LINES[promptIndex];

      // Phase 1: typing
      setPhase('typing');
      setTypedLen(0);
      setVisibleLines(0);
      for (let i = 1; i <= prompt.length; i++) {
        if (cancelRef.current) return;
        await sleep(40);
        setTypedLen(i);
      }

      // Phase 2: thinking
      if (cancelRef.current) return;
      setPhase('thinking');
      await sleep(2200);

      // Phase 3: streaming lines
      if (cancelRef.current) return;
      setPhase('streaming');
      setVisibleLines(0);
      for (let i = 1; i <= lines.length; i++) {
        if (cancelRef.current) return;
        await sleep(i === 1 ? 0 : 65);
        setVisibleLines(i);
        if (responseRef.current) {
          responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
      }

      // Phase 4: done
      if (cancelRef.current) return;
      setPhase('done');
      await sleep(2500);

      if (cancelRef.current) return;
      idx = (promptIndex + 1) % PROMPTS.length;
      setPromptIdx(idx);
      run(idx);
    };

    run(0);
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const currentPrompt = PROMPTS[promptIdx];
  const currentLines = RESPONSE_LINES[promptIdx];

  return (
    <>
      <title>Demo Dashboard — Majorka</title>
      <meta name="robots" content="noindex, nofollow" />
    <div style={{ maxWidth: 620, width: '100%', minWidth: 0 }}>
      <style>{DEMO_STYLES}</style>

      <div
        style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 16,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'border-breathe 4s ease-in-out infinite',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Scanline overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, #FAFAFA 0px, #FAFAFA 1px, transparent 1px, transparent 4px)',
            backgroundSize: '100% 4px',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 16px',
            background: 'rgba(0,0,0,0.35)',
            borderBottom: '1px solid rgba(99,102,241,0.1)',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: syne,
              fontWeight: 700,
              fontSize: 12,
              color: '#6366F1',
              letterSpacing: '0.06em',
              textShadow: '0 0 10px rgba(99,102,241,0.5)',
            }}
          >
            Majorka AI
          </div>
          <div style={{ width: 42 }} />
        </div>

        {/* Prompt input */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '12px 16px',
            borderBottom: '1px solid #F9FAFB',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(99,102,241,0.04)',
              border: '1px solid rgba(99,102,241,0.14)',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <span
              style={{
                color: '#6366F1',
                fontFamily: mono,
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              &gt;
            </span>
            <span
              style={{
                fontFamily: dm,
                fontSize: 13,
                color: '#e2e8f0',
                flex: 1,
                minHeight: 20,
                letterSpacing: '0.01em',
              }}
            >
              {currentPrompt.slice(0, typedLen)}
              {phase === 'typing' && <span className="demo-cursor" />}
            </span>
          </div>
        </div>

        {/* Response area */}
        <div
          ref={responseRef}
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '14px 16px',
            minHeight: 220,
            maxHeight: 300,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#F5F5F5 transparent',
          }}
        >
          {phase === 'thinking' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div className="thinking-dot" />
                <div className="thinking-dot" />
                <div className="thinking-dot" />
              </div>
              <span style={{ fontFamily: dm, fontSize: 12, color: '#6B7280' }}>
                Analysing market data...
              </span>
            </div>
          )}

          {(phase === 'streaming' || phase === 'done') && visibleLines > 0 && (
            <div>
              {currentLines.slice(0, visibleLines).map((line, i) => renderLine(line, i))}
              {phase === 'streaming' && <span className="demo-cursor" style={{ marginTop: 4 }} />}
            </div>
          )}

          {phase === 'typing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 0' }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'rgba(99,102,241,0.3)',
                }}
              />
              <span style={{ fontSize: 12, color: '#6B7280', fontFamily: dm }}>
                Waiting for your prompt...
              </span>
            </div>
          )}
        </div>

        {/* Prompt dot indicator */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 16px 12px',
            borderTop: '1px solid #F9FAFB',
          }}
        >
          {PROMPTS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === promptIdx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === promptIdx ? '#6366F1' : '#F0F0F0',
                transition: 'all 0.35s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginTop: 20,
          alignItems: 'center',
        }}
        className="sm:flex-row sm:justify-center sm:flex-wrap"
      >
        <Link
          href="/sign-in"
          className="demo-cta-primary"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            color: '#FFFFFF',
            borderRadius: 10,
            padding: '11px 28px',
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: 'none',
            display: 'block',
            textAlign: 'center',
            boxShadow: '0 0 24px rgba(99,102,241,0.25)',
            width: '100%',
            maxWidth: 300,
            minHeight: 48,
            boxSizing: 'border-box',
          }}
        >
          Try it yourself →
        </Link>
        <a
          href="#features"
          style={{
            background: 'transparent',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#6366F1',
            borderRadius: 10,
            padding: '11px 28px',
            fontFamily: syne,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            display: 'block',
            textAlign: 'center',
            transition: 'all 0.2s',
            width: '100%',
            maxWidth: 300,
            minHeight: 48,
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          }}
        >
          See all 20+ tools
        </a>
      </div>
    </div>
  );
}
