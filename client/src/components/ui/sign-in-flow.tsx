"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Uniforms = {
  [key: string]: { value: number[] | number[][] | number; type: string };
};

interface ShaderProps {
  source: string;
  uniforms: { [key: string]: { value: number[] | number[][] | number; type: string } };
  maxFps?: number;
}

interface SignInPageProps {
  className?: string;
  loginUrl?: string;
  onSuccess?: () => void;
}

// ─── CanvasRevealEffect ────────────────────────────────────────────────────────

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => (
  <div className={cn("h-full relative w-full", containerClassName)}>
    <div className="h-full w-full">
      <DotMatrix
        colors={colors ?? [[0, 255, 255]]}
        dotSize={dotSize ?? 3}
        opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
        shader={`${reverse ? "u_reverse_active" : "false"}_; animation_speed_factor_${animationSpeed.toFixed(1)}_;`}
        center={["x", "y"]}
      />
    </div>
    {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
  </div>
);

// ─── DotMatrix ─────────────────────────────────────────────────────────────────

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    else if (colors.length === 3) colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    return {
      u_colors: { value: colorsArray.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]), type: "uniform3fv" },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: shader.includes("u_reverse_active") ? 1 : 0, type: "uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
      precision mediump float;
      in vec2 fragCoord;
      uniform float u_time; uniform float u_opacities[10]; uniform vec3 u_colors[6];
      uniform float u_total_size; uniform float u_dot_size; uniform vec2 u_resolution; uniform int u_reverse;
      out vec4 fragColor;
      float PHI=1.61803398874989484820459;
      float random(vec2 xy){return fract(tan(distance(xy*PHI,xy)*0.5)*xy.x);}
      float map(float value,float min1,float max1,float min2,float max2){return min2+(value-min1)*(max2-min2)/(max1-min1);}
      void main(){
        vec2 st=fragCoord.xy;
        ${center.includes("x") ? "st.x-=abs(floor((mod(u_resolution.x,u_total_size)-u_dot_size)*0.5));" : ""}
        ${center.includes("y") ? "st.y-=abs(floor((mod(u_resolution.y,u_total_size)-u_dot_size)*0.5));" : ""}
        float opacity=step(0.0,st.x); opacity*=step(0.0,st.y);
        vec2 st2=vec2(int(st.x/u_total_size),int(st.y/u_total_size));
        float frequency=5.0; float show_offset=random(st2);
        float rand=random(st2*floor((u_time/frequency)+show_offset+frequency));
        opacity*=u_opacities[int(rand*10.0)];
        opacity*=1.0-step(u_dot_size/u_total_size,fract(st.x/u_total_size));
        opacity*=1.0-step(u_dot_size/u_total_size,fract(st.y/u_total_size));
        vec3 color=u_colors[int(show_offset*6.0)];
        float animation_speed_factor=0.5;
        vec2 center_grid=u_resolution/2.0/u_total_size;
        float dist_from_center=distance(center_grid,st2);
        float timing_offset_intro=dist_from_center*0.01+(random(st2)*0.15);
        float max_grid_dist=distance(center_grid,vec2(0.0,0.0));
        float timing_offset_outro=(max_grid_dist-dist_from_center)*0.02+(random(st2+42.0)*0.2);
        if(u_reverse==1){
          opacity*=1.0-step(timing_offset_outro,u_time*animation_speed_factor);
          opacity*=clamp((step(timing_offset_outro+0.1,u_time*animation_speed_factor))*1.25,1.0,1.25);
        } else {
          opacity*=step(timing_offset_intro,u_time*animation_speed_factor);
          opacity*=clamp((1.0-step(timing_offset_intro+0.1,u_time*animation_speed_factor))*1.25,1.0,1.25);
        }
        fragColor=vec4(color,opacity); fragColor.rgb*=fragColor.a;
      }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

// ─── Shader Material ───────────────────────────────────────────────────────────

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string;
  hovered?: boolean;
  maxFps?: number;
  uniforms: Uniforms;
}) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material: any = ref.current.material;
    material.uniforms.u_time.value = clock.getElapsedTime();
  });

  const getUniforms = () => {
    const preparedUniforms: any = {};
    for (const uniformName in uniforms) {
      const uniform: any = uniforms[uniformName];
      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
          break;
        case "uniform1i":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1i" };
          break;
        case "uniform3f":
          preparedUniforms[uniformName] = { value: new THREE.Vector3().fromArray(uniform.value), type: "3f" };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: uniform.value.map((v: number[]) => new THREE.Vector3().fromArray(v)),
            type: "3fv",
          };
          break;
        case "uniform2f":
          preparedUniforms[uniformName] = { value: new THREE.Vector2().fromArray(uniform.value), type: "2f" };
          break;
      }
    }
    preparedUniforms["u_time"] = { value: 0, type: "1f" };
    preparedUniforms["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return preparedUniforms;
  };

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `precision mediump float; in vec2 coordinates; uniform vec2 u_resolution; out vec2 fragCoord;
      void main(){ float x=position.x; float y=position.y; gl_Position=vec4(x,y,0.0,1.0);
      fragCoord=(position.xy+vec2(1.0))*0.5*u_resolution; fragCoord.y=u_resolution.y-fragCoord.y; }`,
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
    <mesh ref={ref as any}>
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

// ─── SignInPage ────────────────────────────────────────────────────────────────

export function SignInPage({ className, loginUrl, onSuccess }: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep("code");
  };

  useEffect(() => {
    if (step === "code") setTimeout(() => codeInputRefs.current[0]?.focus(), 500);
  }, [step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) codeInputRefs.current[index + 1]?.focus();
      if (index === 5 && value && newCode.every((d) => d.length === 1)) {
        setReverseCanvasVisible(true);
        setTimeout(() => setInitialCanvasVisible(false), 50);
        setTimeout(() => setStep("success"), 2000);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) codeInputRefs.current[index - 1]?.focus();
  };

  const handleBackClick = () => {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  return (
    <div className={cn("flex w-full flex-col min-h-screen bg-black relative", className)}>
      {/* Animated dot-matrix background */}
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[[212, 175, 55], [212, 175, 55]]}
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
              colors={[[212, 175, 55], [212, 175, 55]]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.85)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Floating header */}
        <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-8 pl-6 pr-4 py-3 rounded-full border border-white/10 bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#d4af37] rounded-md flex items-center justify-center font-black text-black text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              M
            </div>
            <span className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Majorka</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/50">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
        </header>

        {/* Sign-in form */}
        <div className="flex flex-1 flex-col justify-center items-center px-4">
          <div className="w-full mt-24 max-w-sm">
            <AnimatePresence mode="wait">
              {/* ── Step 1: Email ── */}
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 text-center"
                >
                  <div>
                    <div
                      className="w-12 h-12 bg-[#d4af37] rounded-xl flex items-center justify-center font-black text-black text-xl mx-auto mb-4"
                      style={{ fontFamily: "Syne, sans-serif" }}
                    >
                      M
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
                      Welcome back
                    </h1>
                    <p className="text-white/50 mt-2">Sign in to your Majorka account</p>
                  </div>

                  <div className="space-y-3">
                    {/* Google OAuth */}
                    <button
                      onClick={() => (window.location.href = "/api/auth/google")}
                      className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </button>

                    {/* Apple OAuth */}
                    <button
                      onClick={() => (window.location.href = "/api/auth/apple")}
                      className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors"
                    >
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      Continue with Apple
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                      <div className="h-px bg-white/10 flex-1" />
                      <span className="text-white/40 text-sm">or</span>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>

                    {/* Email form */}
                    <form onSubmit={handleEmailSubmit}>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-full py-3 px-5 focus:outline-none focus:border-[#d4af37]/50 text-center placeholder:text-white/30"
                          required
                        />
                        <button
                          type="submit"
                          className="absolute right-1.5 top-1.5 w-9 h-9 flex items-center justify-center rounded-full bg-[#d4af37] hover:bg-[#c9a227] text-black transition-colors font-bold"
                        >
                          →
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Legal */}
                  <p className="text-xs text-white/30">
                    By signing in you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-white/50">Terms</Link> and{" "}
                    <Link href="/privacy" className="underline hover:text-white/50">Privacy Policy</Link>
                  </p>
                </motion.div>
              )}

              {/* ── Step 2: Verification Code ── */}
              {step === "code" && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 60 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 text-center"
                >
                  <div>
                    <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>Check your email</h1>
                    <p className="text-white/50 mt-2">We sent a 6-digit code to {email}</p>
                  </div>

                  <div className="rounded-2xl py-5 px-5 border border-white/10 bg-white/5">
                    <div className="flex items-center justify-center gap-2">
                      {code.map((digit, i) => (
                        <div key={i} className="relative">
                          <input
                            ref={(el) => {
                              codeInputRefs.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="w-10 h-12 text-center text-xl bg-transparent text-white border-b-2 border-white/20 focus:border-[#d4af37] focus:outline-none transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-white/40 text-sm cursor-pointer hover:text-white/60 transition-colors">
                    Resend code
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBackClick}
                      className="w-[35%] rounded-full border border-white/10 text-white py-3 hover:bg-white/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      className={`flex-1 rounded-full font-semibold py-3 transition-all ${
                        code.every((d) => d !== "")
                          ? "bg-[#d4af37] text-black hover:bg-[#c9a227]"
                          : "bg-white/5 text-white/30 cursor-not-allowed"
                      }`}
                      disabled={!code.every((d) => d !== "")}
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Success ── */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="space-y-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="w-20 h-20 rounded-full bg-[#d4af37] flex items-center justify-center mx-auto"
                  >
                    <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>

                  <div>
                    <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>You're in!</h1>
                    <p className="text-white/50 mt-2">Redirecting to your dashboard…</p>
                  </div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={() => {
                      if (onSuccess) onSuccess();
                      else window.location.href = "/app";
                    }}
                    className="w-full rounded-full bg-[#d4af37] text-black font-semibold py-3 hover:bg-[#c9a227] transition-colors"
                  >
                    Go to Dashboard →
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
