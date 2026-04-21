"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bento Grid — adapted from ui.aceternity.com.
 * Colors/borders use CSS variables (via Tailwind tokens).
 */
export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid auto-rows-[minmax(12rem,auto)] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  children,
  span,
}: {
  className?: string;
  children?: React.ReactNode;
  /** grid span on md+ screens */
  span?: "1" | "2" | "3";
}) {
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground transition-colors duration-normal",
        "hover:border-border-strong",
        span === "2" && "md:col-span-2",
        span === "3" && "md:col-span-2 xl:col-span-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
