"use client";

/**
 * Aurora Background — Aceternity-inspired.
 * Displays softly animated aurora gradients over deep bg. Used on /gate only.
 * Respects prefers-reduced-motion (falls back to static gradient).
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <main
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute -inset-[10%] opacity-60 [filter:blur(80px)] [transform:translateZ(0)]",
            "motion-safe:animate-[aurora_18s_linear_infinite]",
          )}
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, hsl(var(--primary) / 0.35) 0%, hsl(var(--secondary) / 0.30) 14%, hsl(var(--primary) / 0.08) 22%, transparent 30%, hsl(var(--info) / 0.20) 38%, hsl(var(--primary) / 0.25) 50%)",
            backgroundSize: "200% 200%",
            mixBlendMode: "screen",
          }}
        />
        {showRadialGradient && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 0%, hsl(var(--background) / 0.9) 70%, hsl(var(--background)) 100%)",
            }}
          />
        )}
      </div>
      <style>{`
        @keyframes aurora {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="relative z-10 w-full">{children}</div>
    </main>
  );
}
