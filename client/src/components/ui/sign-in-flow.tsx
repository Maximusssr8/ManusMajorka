"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// ─── CanvasRevealEffect ──────────────────────────────────────────────────────

interface CanvasRevealEffectProps {
  animationSpeed?: number;
  containerClassName?: string;
  colors?: number[][];
  dotSize?: number;
  reverse?: boolean;
}

interface ShaderProps {
  source: string;
  uniforms?: Record<string, { value: unknown; type?: string }>;
  maxFps?: number;
}

const dotMatrixShader = `
precision mediump float;
in vec2 fragCoord;
uniform float u_time;
uniform float u_opacities[10];
uniform vec3 u_colors[6];
uniform float u_total_size;
uniform float u_dot_size;
uniform vec2 u_resolution;
out vec4 fragColor;

float PHI = 1.61803398874989484820459;
float random(vec2 xy) {
  return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
}
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
  vec2 st = fragCoord.xy;
  float opacity = step(0.0, st.y);
  opacity *= step(0.0, st.x);
  vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
  float rand = random(st2);
  opacity *= u_opacities[int(rand * 10.0)];
  opacity *= pow(random(st2 * 2.0 + 100.0), (u_time * 0.05));
  float opacityStep = 1.0 / 6.0;
  vec3 color = u_colors[0];
  if (rand > opacityStep * 1.0) color = u_colors[1];
  if (rand > opacityStep * 2.0) color = u_colors[2];
  if (rand > opacityStep * 3.0) color = u_colors[3];
  if (rand > opacityStep * 4.0) color = u_colors[4];
  if (rand > opacityStep * 5.0) color = u_colors[5];
  vec2 st3 = st2 * u_total_size;
  vec2 stCenter = st3 + vec2(u_total_size / 2.0);
  float dist = distance(st, stCenter);
  opacity *= step(dist, u_dot_size / 2.0);
  fragColor = vec4(color, opacity);
}
`;

const ShaderMaterial: React.FC<ShaderProps> = ({ source, uniforms = {}, maxFps = 60 }) => {
  const ref = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  let lastFrameTime = useRef(0);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const timestamp = clock.getElapsedTime();
    if (timestamp - lastFrameTime.current < 1 / maxFps) return;
    lastFrameTime.current = timestamp;
    const mat = ref.current.material as THREE.ShaderMaterial;
    const timeUniform = mat.uniforms["u_time"];
    if (timeUniform) timeUniform.value = timestamp;
  });

  const getUniforms = () => {
    const preparedUniforms: Record<string, { value: unknown }> = {};
    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName]!;
      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value as number };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = { value: uniform.value as THREE.Vector3[] };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value as number[] };
          break;
        default:
          preparedUniforms[uniformName] = { value: uniform.value };
      }
    }
    preparedUniforms["u_time"] = { value: 0 };
    preparedUniforms["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };
    return preparedUniforms;
  };

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main(){
            float x = position.x;
            float y = position.y;
            gl_Position = vec4(x, y, 0.0, 1.0);
            fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: source,
        uniforms: getUniforms(),
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height, source]
  );

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
  </Canvas>
);

export function CanvasRevealEffect({
  animationSpeed = 0.4,
  containerClassName,
  colors = [[255, 255, 255]],
  dotSize = 3,
  reverse = false,
}: CanvasRevealEffectProps) {
  const opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1];
  const totalSize = 4;

  const colorVectors = useMemo(() => {
    const vecs: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const c = colors[i % colors.length] ?? [255, 255, 255];
      vecs.push(new THREE.Vector3(c[0]! / 255, c[1]! / 255, c[2]! / 255));
    }
    return vecs;
  }, [colors]);

  return (
    <div className={cn("h-full relative bg-white w-full", containerClassName)}>
      <Shader
        source={dotMatrixShader}
        uniforms={{
          u_opacities: { value: opacities, type: "uniform1fv" },
          u_colors: { value: colorVectors, type: "uniform3fv" },
          u_total_size: { value: totalSize, type: "uniform1f" },
          u_dot_size: { value: dotSize, type: "uniform1f" },
        }}
        maxFps={60}
      />
    </div>
  );
}

// ─── SignInPage ──────────────────────────────────────────────────────────────

import { supabase } from "@/lib/supabase";

interface SignInPageProps {
  className?: string;
  onSuccess?: () => void;
}

export function SignInPage({ className, onSuccess }: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "magic-link-sent" | "success">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  // Listen for auth state changes (handles OAuth redirect and magic link return)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setReverseCanvasVisible(true);
        setTimeout(() => setInitialCanvasVisible(false), 50);
        setStep("success");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (err) setError(err.message);
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (err) {
      setError(err.message);
    } else {
      setStep("magic-link-sent");
    }
    setLoading(false);
  };

  const handleBackClick = () => {
    setStep("email");
    setError(null);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  return (
    <div className={cn("flex w-full flex-col min-h-screen bg-black relative", className)}>
      {/* Background canvas */}
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[[212, 175, 55], [180, 140, 30]]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[[212, 175, 55], [255, 215, 80]]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.85)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 justify-center items-center px-4">
        {/* Majorka logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#d4af37" }}>
            <span className="text-black font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>M</span>
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: "Syne, sans-serif" }}>Majorka</span>
        </div>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold leading-tight tracking-tight text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                    Welcome back
                  </h1>
                  <p className="text-lg text-white/60 font-light">Sign in to your Majorka account</p>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-full py-3 px-4 font-medium transition-colors disabled:opacity-50"
                  style={{ background: "#d4af37", color: "#000", cursor: loading ? "wait" : "pointer", border: "none" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-white/40 text-sm">or use email</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                <form onSubmit={handleMagicLink}>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 backdrop-blur text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-[#d4af37]/50 text-center"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="absolute right-1.5 top-1.5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white disabled:opacity-50"
                    >
                      {loading ? "..." : "\u2192"}
                    </button>
                  </div>
                </form>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <p className="text-xs text-white/30 pt-4">
                  By continuing, you agree to Majorka's{" "}
                  <Link href="#" className="underline hover:text-white/50 transition-colors">Terms</Link> and{" "}
                  <Link href="#" className="underline hover:text-white/50 transition-colors">Privacy Policy</Link>.
                </p>
              </motion.div>
            ) : step === "magic-link-sent" ? (
              <motion.div
                key="magic-link-step"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold leading-tight tracking-tight text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                    Check your email
                  </h1>
                  <p className="text-lg text-white/50 font-light">We sent a magic link to {email}</p>
                </div>

                <div className="py-6">
                  <div
                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                </div>

                <p className="text-white/40 text-sm">Click the link in your email to sign in. You can close this tab.</p>

                <motion.button
                  onClick={handleBackClick}
                  className="rounded-full bg-white/10 text-white font-medium px-6 py-3 hover:bg-white/20 transition-colors"
                  style={{ border: "none", cursor: "pointer" }}
                  whileTap={{ scale: 0.97 }}
                >
                  Back to sign in
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold leading-tight tracking-tight text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                    You're in!
                  </h1>
                  <p className="text-lg text-white/50 font-light">Welcome to Majorka</p>
                </div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="py-10"
                >
                  <div
                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "#d4af37" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={onSuccess}
                  className="w-full rounded-full font-medium py-3 text-black transition-colors"
                  style={{ background: "#d4af37", border: "none", cursor: "pointer" }}
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
