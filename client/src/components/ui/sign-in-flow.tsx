'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Shield, TrendingUp, Users, Zap } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { identify, trackLogin, trackSignup } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ─── Social proof stats ────────────────────────────────────────────────────────
const SOCIAL_PROOF = [
  { icon: Users, stat: '500+', label: 'AU sellers onboard' },
  { icon: Zap, stat: '50+', label: 'AI-powered tools' },
  { icon: TrendingUp, stat: '$63B', label: 'AU ecommerce market' },
  { icon: Shield, stat: '100%', label: 'AU-native, no US fluff' },
];

const FEATURES = [
  'AI product research tailored to the Australian market',
  'Generate ad copy, websites, and brand identity in minutes',
  'Built for Shopify, Amazon AU, and local marketplaces',
];

// ─── SignInPage ──────────────────────────────────────────────────────────────

interface SignInPageProps {
  className?: string;
  onSuccess?: () => void;
  mode?: 'signin' | 'signup';
}

export function SignInPage({ className, onSuccess, mode: initialMode }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'magic-link-sent' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode || 'signin');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [betaError, setBetaError] = useState(false);

  useEffect(() => {
    // Check for beta access denied error
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'beta') {
      setBetaError(true);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  }, []);

  useEffect(() => {
    // Capture referral code from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('majorka_ref', ref);
      // Track the click
      fetch('/api/affiliate/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref }),
      }).catch(() => {});
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        // Identify user and track login/signup
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            identify(user.id, { email: user.email, plan: 'free', market: 'AU' });
            const isNewUser = !localStorage.getItem('majorka_onboarded');
            if (isNewUser) {
              trackSignup('email');
            } else {
              trackLogin('email');
            }
          }
        } catch {
          /* best-effort */
        }

        // Credit referral on signup
        const refCode = localStorage.getItem('majorka_ref');
        if (refCode) {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await fetch('/api/affiliate/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: refCode, referredUserId: user.id }),
              });
              localStorage.removeItem('majorka_ref');
            }
          } catch {
            /* best-effort */
          }
        }
        setStep('success');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const getPasswordStrength = (pw: string): number => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setPasswordStrength(getPasswordStrength(val));
  };

  const handleGoogleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://www.majorka.io/app`,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (err) {
      setError(err.message);
    } else if (data?.url) {
      window.open(data.url, '_self');
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    if (mode === 'signup' && password) {
      // Sign up with email + password
      if (!agreedToTerms) {
        setError('Please agree to the Terms and Privacy Policy.');
        setLoading(false);
        return;
      }
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (err) {
        setError(err.message);
      } else {
        setStep('magic-link-sent');
      }
    } else {
      // Magic link sign in
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (err) {
        setError(err.message);
      } else {
        setStep('magic-link-sent');
      }
    }
    setLoading(false);
  };

  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className={cn('flex w-full min-h-screen', className)} style={{ background: '#05070F' }}>
      {/* ── Left panel: Brand + Social Proof (desktop only) ──────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] xl:w-[520px] flex-shrink-0 p-10 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)' }}>
        {/* Background glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, transparent 60%)',
          }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: '#6366F1' }}
            >
              <span
                className="text-white font-bold text-sm"
                style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
              >
                M
              </span>
            </div>
            <span
              className="text-slate-100 font-bold text-xl"
              style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
            >
              Majorka
            </span>
          </div>

          {/* Brand statement */}
          <h2
            className="text-3xl font-bold leading-tight mb-4"
            style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: 'white', letterSpacing: '-0.02em' }}
          >
            Your AI ecommerce
            <br />
            <span style={{ color: '#6366F1' }}>operating system.</span>
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
            50+ AI tools built specifically for Australian sellers. Research, build, launch, and
            scale — all from one platform.
          </p>

          {/* Feature list */}
          <div className="space-y-3 mb-10">
            {FEATURES.map((feat, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Social proof grid */}
        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-3">
            {SOCIAL_PROOF.map(({ icon: Icon, stat, label }) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} style={{ color: '#6366F1' }} />
                  <span
                    className="text-lg font-bold"
                    style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: 'white' }}
                  >
                    {stat}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: Auth form ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 relative">
        {/* Background glow */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background: 'transparent',
            }}
          />
        </div>

        {/* Mobile logo (hidden on desktop) */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#6366F1' }}
          >
            <span
              className="text-white font-bold text-sm"
              style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
            >
              M
            </span>
          </div>
          <span className="text-slate-100 font-bold text-xl" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            Majorka
          </span>
        </div>

        <div className="w-full max-w-sm relative z-10">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-5"
              >
                {/* Header */}
                <div className="text-center lg:text-left space-y-1">
                  <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#F8FAFC' }}
                  >
                    {mode === 'signup' ? 'Create your account' : 'Welcome back'}
                  </h1>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>
                    {mode === 'signup'
                      ? 'Start free — no credit card needed'
                      : 'Sign in to your Majorka account'}
                  </p>
                </div>

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 font-medium transition-all disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#CBD5E1',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading)
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    or use email
                  </span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>

                {/* Email/Password form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: '#94A3B8' }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl py-3 px-4 text-sm outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid #F0F0F0',
                        color: '#CBD5E1',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.4)')}
                      onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
                      required
                    />
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: '#94A3B8' }}
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className="w-full rounded-xl py-3 px-4 text-sm outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid #F0F0F0',
                          color: '#CBD5E1',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.4)')}
                        onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
                        required
                        minLength={8}
                      />
                      {/* Password strength indicator */}
                      {password.length > 0 && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="h-1 flex-1 rounded-full transition-all"
                                style={{
                                  background:
                                    i < passwordStrength
                                      ? strengthColors[passwordStrength - 1]
                                      : '#F5F5F5',
                                }}
                              />
                            ))}
                          </div>
                          <span
                            className="text-xs"
                            style={{
                              color:
                                strengthColors[passwordStrength - 1] || '#9CA3AF',
                            }}
                          >
                            {passwordStrength > 0
                              ? strengthLabels[passwordStrength - 1]
                              : 'Too short'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {mode === 'signup' && (
                    <label className="flex items-start gap-2.5 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 rounded"
                        style={{ accentColor: '#6366F1' }}
                      />
                      <span
                        className="text-xs leading-relaxed"
                        style={{ color: '#94A3B8' }}
                      >
                        I agree to the{' '}
                        <Link
                          href="/terms"
                          className="underline"
                          style={{ color: '#CBD5E1' }}
                        >
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="/privacy"
                          className="underline"
                          style={{ color: '#CBD5E1' }}
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  )}

                  {betaError && (
                    <div
                      className="text-sm px-4 py-3 rounded-xl"
                      style={{
                        background: 'rgba(244,63,94,0.08)',
                        border: '1px solid rgba(244,63,94,0.2)',
                        color: '#e11d48',
                      }}
                    >
                      Majorka is currently in private beta. Access is restricted.
                    </div>
                  )}

                  {error && (
                    <div
                      className="text-sm px-3 py-2 rounded-lg"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444',
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (mode === 'signup' && !agreedToTerms)}
                    className="w-full rounded-xl py-3.5 font-semibold text-sm transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                      color: '#FAFAFA',
                      border: 'none',
                      cursor: loading ? 'wait' : 'pointer',
                      fontFamily: "'Inter', -apple-system, sans-serif",
                    }}
                  >
                    {loading
                      ? 'Please wait...'
                      : mode === 'signup'
                        ? 'Start Free — No Credit Card Needed'
                        : 'Send Magic Link'}
                  </button>
                </form>

                {/* Toggle mode */}
                <p className="text-center text-sm" style={{ color: '#9CA3AF' }}>
                  {mode === 'signup' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        onClick={() => {
                          setMode('signin');
                          setError(null);
                        }}
                        className="font-medium underline"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6366F1',
                        }}
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      New to Majorka?{' '}
                      <button
                        onClick={() => {
                          setMode('signup');
                          setError(null);
                        }}
                        className="font-medium underline"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6366F1',
                        }}
                      >
                        Create an account
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            ) : step === 'magic-link-sent' ? (
              <motion.div
                key="sent-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-6 text-center"
              >
                <div className="space-y-2">
                  <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#F8FAFC' }}
                  >
                    Check your email
                  </h1>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>
                    {mode === 'signup'
                      ? `We sent a confirmation link to ${email}`
                      : `We sent a magic link to ${email}`}
                  </p>
                </div>

                <div className="py-6">
                  <div
                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.25)',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                </div>

                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  Click the link in your email to{' '}
                  {mode === 'signup' ? 'verify your account' : 'sign in'}. You can close this tab.
                </p>

                <motion.button
                  onClick={() => {
                    setStep('form');
                    setError(null);
                  }}
                  className="rounded-xl font-medium px-6 py-3 text-sm transition-colors" style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE', cursor: 'pointer' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Back to sign in
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-2">
                  <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#F8FAFC' }}
                  >
                    You're in!
                  </h1>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>
                    Welcome to Majorka
                  </p>
                </div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="py-8"
                >
                  <div
                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: '#6366F1' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={onSuccess}
                  className="w-full rounded-xl font-semibold py-3.5 text-sm text-white transition-colors"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                  }}
                >
                  Continue to Dashboard
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
