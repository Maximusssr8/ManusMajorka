import { cn } from "@/lib/utils";

interface BorderBeamProps {
  children: React.ReactNode;
  className?: string;
  colorA?: string;
  colorB?: string;
  duration?: string;
}

export function BorderBeam({
  children,
  className,
  colorA = "#d4af37",
  colorB = "#8b5cf6",
  duration = "4s",
}: BorderBeamProps) {
  return (
    <div
      className={cn("relative rounded-xl p-px", className)}
      style={{
        background: `linear-gradient(var(--border-beam-angle, 0deg), ${colorA}, ${colorB}, ${colorA})`,
        animation: `border-beam-rotate ${duration} linear infinite`,
      }}
    >
      <div className="rounded-[11px] bg-[#0c0c10] h-full w-full">
        {children}
      </div>
    </div>
  );
}
