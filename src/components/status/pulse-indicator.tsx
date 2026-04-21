"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type OverallStatus = "healthy" | "degraded" | "critical" | "unknown";

export interface NodeHealthSample {
  status: "healthy" | "degraded" | "down" | "unknown";
  updatedAt: number;
}

export interface PulseIndicatorProps {
  /** Snapshot of all known node health samples, keyed by node id. */
  samples: Record<string, NodeHealthSample>;
  className?: string;
}

const STALE_MS = 90_000;
const FRESH_MS = 60_000;

function aggregate(samples: Record<string, NodeHealthSample>): OverallStatus {
  const values = Object.values(samples);
  if (values.length === 0) return "unknown";
  const now = Date.now();
  const newestAt = values.reduce((m, s) => Math.max(m, s.updatedAt), 0);
  if (now - newestAt > STALE_MS) return "unknown";
  if (values.some((v) => v.status === "down")) return "critical";
  if (values.some((v) => v.status === "degraded")) return "degraded";
  if (values.every((v) => v.status === "healthy") && now - newestAt < FRESH_MS) {
    return "healthy";
  }
  return "unknown";
}

function styleFor(s: OverallStatus) {
  switch (s) {
    case "healthy":
      return { color: "bg-positive", label: "All systems healthy" };
    case "degraded":
      return { color: "bg-warning", label: "Degraded performance" };
    case "critical":
      return { color: "bg-negative", label: "Critical issues" };
    case "unknown":
    default:
      return { color: "bg-muted-foreground", label: "No recent data" };
  }
}

export function PulseIndicator({ samples, className }: PulseIndicatorProps) {
  const [, tick] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(tick, 5_000);
    return () => clearInterval(id);
  }, []);

  const status = aggregate(samples);
  const { color, label } = styleFor(status);
  const animated = status === "healthy" || status === "degraded";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs font-medium",
            className,
          )}
        >
          <span
            aria-hidden
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", color, animated && "animate-breathe")}
          />
          <span className="text-foreground">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="flex flex-col gap-0.5">
          <div>Overall status · {status}</div>
          <div>{Object.keys(samples).length} node(s) reporting</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export { aggregate as aggregateStatus };
