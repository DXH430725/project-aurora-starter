"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GlareCard — adapted from ui.aceternity.com.
 * A hover-tracked radial highlight. Colors sourced from --primary. No shadows.
 */
export function GlareCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 50, y: 50 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative isolate overflow-hidden rounded-lg border border-border bg-card transition-colors duration-normal",
        "hover:border-border-strong",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-normal"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(420px circle at ${pos.x}% ${pos.y}%, hsl(var(--primary) / 0.14), transparent 55%)`,
        }}
      />
      <div className="relative z-0 h-full">{children}</div>
    </div>
  );
}
