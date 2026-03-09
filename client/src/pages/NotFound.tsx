import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "#080a0e" }}
    >
      <div className="w-full max-w-md mx-4 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}
        >
          <span className="text-2xl">404</span>
        </div>

        <h1
          className="text-3xl font-black mb-2"
          style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}
        >
          Page Not Found
        </h1>

        <p className="text-sm mb-8" style={{ color: "rgba(240,237,232,0.45)" }}>
          Sorry, the page you are looking for doesn't exist.
          It may have been moved or deleted.
        </p>

        <button
          onClick={() => setLocation("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: "linear-gradient(135deg, #d4af37, #f0c040)",
            color: "#080a0e",
            fontFamily: "Syne, sans-serif",
            cursor: "pointer",
            border: "none",
          }}
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </div>
    </div>
  );
}
