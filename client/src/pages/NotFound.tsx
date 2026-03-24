import { ArrowLeft, Home } from 'lucide-react';
import { useLocation } from 'wouter';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: '#FAFAFA' }}
    >
      <div className="text-center px-6 max-w-md animate-fade-in">
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #f0c040)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
          }}
        >
          <span
            className="text-black font-extrabold text-2xl"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            M
          </span>
        </div>

        {/* 404 */}
        <h1
          className="text-6xl font-extrabold mb-3"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A', letterSpacing: '-2px' }}
        >
          404
        </h1>

        {/* Witty AU message */}
        <p
          className="text-base font-semibold mb-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A' }}
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
              background: '#F9FAFB',
              border: '1px solid #F0F0F0',
              color: '#374151',
              fontFamily: "'Bricolage Grotesque', sans-serif",
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
              background: 'linear-gradient(135deg, #6366F1, #f0c040)',
              color: '#FAFAFA',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              border: 'none',
              boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
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
