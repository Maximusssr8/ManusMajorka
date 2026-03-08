"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacitySpeed: number;
}

export function SparklesCore({
  id = "sparkles",
  className,
  background = "transparent",
  minSize = 1,
  maxSize = 3,
  speed = 2,
  particleColor = "#ffffff",
  particleDensity = 120,
}: SparklesCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ w: width, h: height });
        canvas.width = width;
        canvas.height = height;
      }
    });

    resizeObserver.observe(canvas.parentElement || canvas);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.w === 0 || dimensions.h === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize particles
    const count = Math.floor((dimensions.w * dimensions.h) / (400 * 400) * particleDensity);
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * dimensions.w,
      y: Math.random() * dimensions.h,
      size: Math.random() * (maxSize - minSize) + minSize,
      speedX: (Math.random() - 0.5) * speed * 0.3,
      speedY: (Math.random() - 0.5) * speed * 0.3,
      opacity: Math.random(),
      opacitySpeed: (Math.random() * 0.5 + 0.5) * speed * 0.01,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.w, dimensions.h);

      for (const p of particlesRef.current) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.opacitySpeed;

        if (p.opacity > 1 || p.opacity < 0.1) {
          p.opacitySpeed *= -1;
        }

        if (p.x < 0) p.x = dimensions.w;
        if (p.x > dimensions.w) p.x = 0;
        if (p.y < 0) p.y = dimensions.h;
        if (p.y > dimensions.h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.opacity));
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [dimensions, minSize, maxSize, speed, particleColor, particleDensity]);

  return (
    <div className={cn("relative h-full w-full", className)} style={{ background }}>
      <canvas
        ref={canvasRef}
        id={id}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
