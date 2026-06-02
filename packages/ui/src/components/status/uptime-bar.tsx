"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type UptimeStatus = "up" | "degraded" | "down" | "unknown";

export interface UptimeSegment {
  timestamp: number;
  status: UptimeStatus;
  label?: string;
}

export interface UptimeBarProps {
  label: string;
  segments: UptimeSegment[];
  uptimePercent?: number;
  className?: string;
}

const STATUS_CLASS: Record<UptimeStatus, string> = {
  up: "bg-positive",
  degraded: "bg-warning",
  down: "bg-negative",
  unknown: "bg-muted",
};

export function UptimeBar({ label, segments, uptimePercent, className }: UptimeBarProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {uptimePercent != null && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {uptimePercent.toFixed(3)}%
          </span>
        )}
      </div>
      <div className="flex h-6 items-stretch gap-[2px]">
        {segments.map((seg, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "min-w-[3px] flex-1 rounded-[1px] transition-opacity duration-fast hover:opacity-80",
                  STATUS_CLASS[seg.status],
                )}
                aria-label={seg.label ?? seg.status}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-mono">{new Date(seg.timestamp).toLocaleString()}</span>
                <span className="capitalize">{seg.status}</span>
                {seg.label && <span className="text-muted-foreground">{seg.label}</span>}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
