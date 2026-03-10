import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#0a0b0d" }}>
      <div className="text-center px-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)" }}>
          <span className="text-black font-black text-2xl" style={{ fontFamily: "Syne, sans-serif" }}>M</span>
        </div>
        <h1 className="text-5xl font-black mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>404</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(240,237,232,0.45)" }}>
          This page doesn't exist or has been moved.
        </p>
        <button
          onClick={() => setLocation("/")}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: "linear-gradient(135deg, #d4af37, #f0c040)",
            color: "#0a0b0d",
            fontFamily: "Syne, sans-serif",
            cursor: "pointer",
            border: "none",
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
