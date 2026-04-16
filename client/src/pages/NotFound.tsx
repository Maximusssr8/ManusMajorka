import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { MOTION, reducedMotion, cubicBezier } from '@/lib/motionTokens';

export default function NotFound() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(reducedMotion());

  useEffect(() => {
    if (reducedMotion()) {
      setMounted(true);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const mountStyle: React.CSSProperties = {
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(8px)',
    transition: reducedMotion()
      ? 'none'
      : `opacity ${MOTION.duration.reveal}ms ${cubicBezier(MOTION.ease.out)}, transform ${MOTION.duration.reveal}ms ${cubicBezier(MOTION.ease.out)}`,
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ background: '#080808' }}
    >
      <div className="text-center w-full max-w-md" style={mountStyle}>
        <div
          style={{
<<<<<<< HEAD
            fontFamily: "'Syne', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(96px, 22vw, 140px)',
            lineHeight: 1,
            color: '#d4af37',
            letterSpacing: '-0.05em',
            marginBottom: 12,
=======
            background: 'linear-gradient(135deg, #4f8ef7, #4f8ef7)',
            boxShadow: '0 8px 32px rgba(79,142,247,0.25)',
>>>>>>> origin/app-theme-cobalt
          }}
        >
          404
        </div>

        <h2
          style={{
            fontFamily: "'Syne', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: '#f5f5f5',
            marginBottom: 10,
            letterSpacing: '-0.01em',
          }}
        >
          That page moved or never existed.
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 15,
            color: '#9CA3AF',
            lineHeight: 1.5,
            marginBottom: 28,
          }}
        >
          Here&apos;s somewhere useful:
        </p>

        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center"
          style={{ gap: 12 }}
        >
          <button
            onClick={() => setLocation('/')}
            style={{
<<<<<<< HEAD
              minHeight: 44,
              padding: '0 20px',
              background: '#d4af37',
              color: '#080808',
              border: 'none',
              borderRadius: 12,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: reducedMotion()
                ? 'none'
                : `transform ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}, filter ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}`,
            }}
            onMouseEnter={(e) => {
              if (reducedMotion()) return;
              e.currentTarget.style.transform = `translateY(${MOTION.lift.y}px)`;
              e.currentTarget.style.filter = `brightness(${MOTION.lift.brightness})`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.filter = 'brightness(1)';
=======
              background: 'linear-gradient(135deg, #4f8ef7, #4f8ef7)',
              color: '#FAFAFA',
              fontFamily: "'Syne', sans-serif",
              border: 'none',
              boxShadow: '0 4px 16px rgba(79,142,247,0.25)',
>>>>>>> origin/app-theme-cobalt
            }}
          >
            Back to home
          </button>
          <button
            onClick={() => setLocation('/app/products')}
            style={{
              minHeight: 44,
              padding: '0 20px',
              background: 'transparent',
              color: '#CBD5E1',
              border: '1px solid #1a1a1a',
              borderRadius: 12,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: reducedMotion()
                ? 'none'
                : `border-color ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1a1a1a';
            }}
          >
            Browse products
          </button>
        </div>

        <p
          style={{
            marginTop: 32,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 13,
            color: '#6B7280',
          }}
        >
          Still lost?{' '}
          <a
            href="mailto:support@majorka.io"
            style={{ color: '#9CA3AF', textDecoration: 'underline', textUnderlineOffset: 4 }}
          >
            support@majorka.io
          </a>
        </p>
      </div>
    </div>
  );
}
