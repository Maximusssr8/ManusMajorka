import { useLocation } from "wouter";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#0a0b0d" }}>
      <div className="text-center px-6 max-w-md animate-fade-in">
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", boxShadow: "0 8px 32px rgba(212,175,55,0.25)" }}
        >
          <span className="text-black font-black text-2xl" style={{ fontFamily: "Syne, sans-serif" }}>M</span>
        </div>

        {/* 404 */}
        <h1 className="text-6xl font-black mb-3" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-2px" }}>
          404
        </h1>

        {/* Witty AU message */}
        <p className="text-base font-semibold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
          Yeah nah, this page doesn't exist.
        </p>
        <p className="text-sm mb-8" style={{ color: "rgba(240,237,232,0.4)", lineHeight: 1.6 }}>
          Looks like this URL has gone walkabout. No worries — let's get you back on track.
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(240,237,232,0.6)",
              fontFamily: "Syne, sans-serif",
            }}
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #d4af37, #f0c040)",
              color: "#0a0b0d",
              fontFamily: "Syne, sans-serif",
              border: "none",
              boxShadow: "0 4px 16px rgba(212,175,55,0.25)",
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
