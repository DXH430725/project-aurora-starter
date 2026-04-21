import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusKind = "active" | "idle" | "warning" | "error" | "offline";

export interface StatusDotProps {
  status: StatusKind;
  label?: string;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}

const COLOR: Record<StatusKind, string> = {
  active: "bg-positive",
  idle: "bg-muted-foreground",
  warning: "bg-warning",
  error: "bg-negative",
  offline: "bg-muted-foreground opacity-50",
};

export function StatusDot({
  status,
  label,
  size = "md",
  pulse,
  className,
}: StatusDotProps) {
  const shouldPulse = pulse ?? status === "active";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-block rounded-full",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
          COLOR[status],
          shouldPulse && "animate-breathe",
        )}
        aria-hidden
      />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  );
}
