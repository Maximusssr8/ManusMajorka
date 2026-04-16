import { ArrowLeft, Home } from 'lucide-react';
import { useLocation } from 'wouter';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: '#05070F' }}
    >
      <div className="text-center px-6 max-w-md animate-fade-in">
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #4f8ef7, #4f8ef7)',
            boxShadow: '0 8px 32px rgba(79,142,247,0.25)',
          }}
        >
          <span
            className="text-black font-extrabold text-2xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            M
          </span>
        </div>

        {/* 404 */}
        <h1
          className="text-6xl font-extrabold mb-3"
          style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC', letterSpacing: '-2px' }}
        >
          404
        </h1>

        {/* Witty AU message */}
        <p
          className="text-base font-semibold mb-2"
          style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
        >
          Yeah nah, this page doesn't exist.
        </p>
        <p className="text-sm mb-8" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>
          Looks like this URL has gone walkabout. No worries — let's get you back on track.
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid #F0F0F0',
              color: '#CBD5E1',
              fontFamily: "'Syne', sans-serif",
            }}
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #4f8ef7)',
              color: '#FAFAFA',
              fontFamily: "'Syne', sans-serif",
              border: 'none',
              boxShadow: '0 4px 16px rgba(79,142,247,0.25)',
            }}
            aria-label="Go to home page"
          >
            <Home size={14} />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
