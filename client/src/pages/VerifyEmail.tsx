import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useDocumentTitle } from "@/_core/hooks/useDocumentTitle";

export default function VerifyEmail() {
  useDocumentTitle("Verify Email | Majorka");
  const [, navigate] = useLocation();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Try to get email from URL params or localStorage
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      setResent(true);
    } catch {
      // silent
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#080a0e" }}>
      {/* Background glow */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm text-center space-y-6"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#d4af37" }}>
            <span className="text-black font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>M</span>
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: "Syne, sans-serif" }}>Majorka</span>
        </div>

        {/* Email icon */}
        <div className="py-4">
          <div
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.1)", border: "2px solid rgba(212,175,55,0.2)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: "Syne, sans-serif" }}>
            Check your inbox
          </h1>
          {email ? (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              We sent a verification link to{" "}
              <span className="font-medium" style={{ color: "#d4af37" }}>{email}</span>
            </p>
          ) : (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              We sent a verification link to your email address.
            </p>
          )}
        </div>

        <div
          className="rounded-xl p-4 text-left space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span style={{ color: "#d4af37" }}>1.</span> Open the email from Majorka
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span style={{ color: "#d4af37" }}>2.</span> Click the verification link
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span style={{ color: "#d4af37" }}>3.</span> You'll be taken to your dashboard
          </div>
        </div>

        {/* Resend */}
        <div>
          {email && !resent ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#d4af37" }}
            >
              {resending ? "Sending..." : "Didn't receive it? Resend"}
            </button>
          ) : resent ? (
            <p className="text-sm" style={{ color: "#22c55e" }}>
              Email resent! Check your inbox.
            </p>
          ) : null}
        </div>

        {/* Back to sign in */}
        <button
          onClick={() => navigate("/sign-in")}
          className="text-xs transition-colors"
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}
        >
          Back to sign in
        </button>
      </motion.div>
    </div>
  );
}
