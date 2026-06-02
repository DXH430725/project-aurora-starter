"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GlowingEffect — adapted from ui.aceternity.com.
 *
 * Event-triggered only. Wrap any container: when `active` is true, a soft
 * primary-tinted border glow pulses around the child. All colors pull from
 * CSS vars so retheme propagates automatically.
 */
export function GlowingEffect({
  active = false,
  className,
  children,
  tone = "primary",
}: {
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
  tone?: "primary" | "negative" | "warning";
}) {
  const color =
    tone === "negative"
      ? "var(--negative)"
      : tone === "warning"
        ? "var(--warning)"
        : "var(--primary)";
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-slow",
          active ? "opacity-100 animate-pulse" : "opacity-0",
        )}
        style={{
          boxShadow: `0 0 0 1px hsl(${color} / 0.55), 0 0 24px 0 hsl(${color} / 0.35)`,
        }}
      />
      <div className="relative rounded-[inherit]">{children}</div>
    </div>
  );
}
