// Innovation 4 — Animated Data Flow Visualization
// Pure SVG/CSS showing: AliExpress → Pipeline → Scored → Your Winners

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { F, LT } from '@/lib/landingTokens';

const FLOW_CSS = `
@keyframes mjFlowDash {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
@keyframes mjFlowDashVert {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
.mj-flow-line {
  stroke-dasharray: 8 4;
  animation: mjFlowDash 3s linear infinite;
}
.mj-flow-line-vert {
  stroke-dasharray: 8 4;
  animation: mjFlowDashVert 3s linear infinite;
}
`;

interface FlowNode {
  title: string;
  stat: string;
  detail: string;
}

const NODES: FlowNode[] = [
  { title: 'AliExpress', stat: '50M+', detail: 'listings' },
  { title: 'Majorka Pipeline', stat: 'Filter · Score', detail: 'every 6 hours' },
  { title: 'Scored Products', stat: '4,155', detail: 'ranked by velocity' },
  { title: 'Your Winners', stat: 'Top 50', detail: 'daily' },
];

function FlowNodeCard({
  node,
  visible,
  delay,
  isActive,
}: {
  node: FlowNode;
  visible: boolean;
  delay: number;
  isActive?: boolean;
}) {
  const cardStyle: CSSProperties = {
    background: '#0d1117',
    border: `1px solid ${isActive ? 'rgba(79,142,247,0.4)' : '#161b22'}`,
    borderRadius: 14,
    padding: '18px 20px',
    textAlign: 'center',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms, border-color 300ms`,
    minWidth: 0,
  };

  return (
    <div style={cardStyle}>
      <p style={{
        fontFamily: F.mono,
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#6B7280',
        margin: '0 0 8px',
      }}>
        {node.title}
      </p>
      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 20,
        fontWeight: 700,
        color: isActive ? LT.cobalt : '#E0E0E0',
        margin: '0 0 4px',
        whiteSpace: 'nowrap',
      }}>
        {node.stat}
      </p>
      <p style={{
        fontFamily: F.mono,
        fontSize: 11,
        color: '#4b5563',
        margin: 0,
      }}>
        {node.detail}
      </p>
    </div>
  );
}

export function DataFlow() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver to trigger fade-in
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Responsive: detect mobile
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth <= 640);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="How Majorka works"
      style={{
        background: '#04060f',
        padding: '48px 24px',
        width: '100%',
      }}
    >
      <style>{FLOW_CSS}</style>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {isMobile ? <MobileFlow visible={visible} /> : <DesktopFlow visible={visible} />}
      </div>
    </section>
  );
}

function DesktopFlow({ visible }: { visible: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      {/* SVG arrows between cards */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        preserveAspectRatio="none"
      >
        {/* Three horizontal connecting lines at roughly the vertical center */}
        {[0, 1, 2].map((i) => {
          const x1Pct = 25 * (i + 1) - 7;
          const x2Pct = 25 * (i + 1) + 7;
          return (
            <line
              key={i}
              x1={`${x1Pct}%`}
              y1="50%"
              x2={`${x2Pct}%`}
              y2="50%"
              stroke={LT.cobalt}
              strokeWidth="1.5"
              strokeOpacity={visible ? 0.6 : 0}
              className="mj-flow-line"
              style={{ transition: `stroke-opacity 500ms ease ${400 + i * 200}ms` }}
            />
          );
        })}
      </svg>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 40,
        position: 'relative',
        zIndex: 1,
      }}>
        {NODES.map((node, i) => (
          <FlowNodeCard
            key={node.title}
            node={node}
            visible={visible}
            delay={i * 200}
            isActive={i === 1}
          />
        ))}
      </div>
    </div>
  );
}

function MobileFlow({ visible }: { visible: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      alignItems: 'center',
    }}>
      {NODES.map((node, i) => (
        <div key={node.title} style={{ width: '100%', maxWidth: 280 }}>
          <FlowNodeCard
            node={node}
            visible={visible}
            delay={i * 200}
            isActive={i === 1}
          />
          {i < NODES.length - 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 0',
            }}>
              <svg width="2" height="28" viewBox="0 0 2 28">
                <line
                  x1="1" y1="0" x2="1" y2="28"
                  stroke={LT.cobalt}
                  strokeWidth="1.5"
                  strokeOpacity={visible ? 0.6 : 0}
                  className="mj-flow-line-vert"
                  style={{ transition: `stroke-opacity 500ms ease ${400 + i * 200}ms` }}
                />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
