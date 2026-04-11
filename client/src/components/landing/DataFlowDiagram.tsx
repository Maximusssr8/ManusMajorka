import { motion } from 'framer-motion';

// DeerFlow-inspired data pipeline diagram for the Majorka landing hero.
// Shows: AliExpress → DataHub ingest → Scoring → Products → Ads Studio / Store Builder
// with animated pulses travelling between nodes along the connecting lines.
//
// Palette: deep black canvas, white text, single electric-blue accent (#3B82F6).

const display = "'Syne', 'Bricolage Grotesque', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

interface NodeSpec {
  id: string;
  label: string;
  sub: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  accent?: boolean;
}

const NODES: NodeSpec[] = [
  { id: 'ali',    label: 'AliExpress',   sub: 'Affiliate API',   x: 8,  y: 18 },
  { id: 'cj',     label: 'CJ Dropship',  sub: 'Supplier feed',   x: 8,  y: 78 },
  { id: 'hub',    label: 'DataHub',      sub: 'Ingest · 6h',     x: 34, y: 48, accent: true },
  { id: 'score',  label: 'AI Scoring',   sub: 'Rank · Margin',   x: 58, y: 48, accent: true },
  { id: 'prod',   label: 'Products',     sub: '2,302 live',      x: 84, y: 18 },
  { id: 'ads',    label: 'Ads Studio',   sub: 'Creative gen',    x: 84, y: 48 },
  { id: 'store',  label: 'Store Builder', sub: 'Shopify push',   x: 84, y: 78 },
];

const EDGES: { from: string; to: string; delay: number }[] = [
  { from: 'ali',   to: 'hub',   delay: 0 },
  { from: 'cj',    to: 'hub',   delay: 0.4 },
  { from: 'hub',   to: 'score', delay: 0.8 },
  { from: 'score', to: 'prod',  delay: 1.2 },
  { from: 'score', to: 'ads',   delay: 1.5 },
  { from: 'score', to: 'store', delay: 1.8 },
];

function getNode(id: string): NodeSpec {
  const n = NODES.find((x) => x.id === id);
  if (!n) throw new Error(`DataFlowDiagram: unknown node ${id}`);
  return n;
}

export function DataFlowDiagram() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 10',
        background:
          'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%), #0a0a0a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.04), 0 30px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* Dot grid background */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      {/* Window chrome */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 34,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 10,
          zIndex: 2,
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2a2a2a' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2a2a2a' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2a2a2a' }} />
        <span
          style={{
            marginLeft: 12,
            fontFamily: mono,
            fontSize: 11,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.02em',
          }}
        >
          majorka://pipeline/live
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: '#3B82F6',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#3B82F6',
              boxShadow: '0 0 8px rgba(59,130,246,0.8)',
            }}
          />
          streaming
        </span>
      </div>

      {/* SVG layer for edges + pulses */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="mj-edge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.45)" />
          </linearGradient>
        </defs>

        {EDGES.map((e) => {
          const a = getNode(e.from);
          const b = getNode(e.to);
          return (
            <g key={`${e.from}-${e.to}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="url(#mj-edge)"
                strokeWidth={0.25}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      {/* Pulses — use framer-motion traversing from node A to B. */}
      {EDGES.map((e) => {
        const a = getNode(e.from);
        const b = getNode(e.to);
        return (
          <motion.span
            key={`pulse-${e.from}-${e.to}`}
            aria-hidden
            initial={{ left: `${a.x}%`, top: `${a.y}%`, opacity: 0 }}
            animate={{
              left: [`${a.x}%`, `${b.x}%`],
              top: [`${a.y}%`, `${b.y}%`],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.4,
              delay: e.delay,
              repeat: Infinity,
              repeatDelay: 1.6,
              ease: 'easeInOut',
              times: [0, 0.1, 0.9, 1],
            }}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              marginLeft: -4,
              marginTop: -4,
              borderRadius: '50%',
              background: '#3B82F6',
              boxShadow: '0 0 16px rgba(59,130,246,0.9), 0 0 4px #fff',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map((n) => (
        <div
          key={n.id}
          style={{
            position: 'absolute',
            left: `${n.x}%`,
            top: `${n.y}%`,
            transform: 'translate(-50%, -50%)',
            padding: '10px 14px',
            minWidth: 120,
            background: n.accent
              ? 'linear-gradient(180deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%)'
              : 'rgba(15,15,15,0.92)',
            border: n.accent
              ? '1px solid rgba(59,130,246,0.45)'
              : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            textAlign: 'center',
            zIndex: 4,
            boxShadow: n.accent
              ? '0 0 24px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 6px 20px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              fontFamily: display,
              fontSize: 13,
              fontWeight: 700,
              color: '#ededed',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {n.label}
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              color: n.accent ? '#60A5FA' : 'rgba(255,255,255,0.45)',
              marginTop: 3,
              letterSpacing: '0.02em',
            }}
          >
            {n.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DataFlowDiagram;
