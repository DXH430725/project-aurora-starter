"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeltaBadge } from "@/components/data/delta-badge";
import { Sparkline } from "@/components/data/sparkline";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { formatByType } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: number | null | undefined;
  previousValue?: number;
  format?: "number" | "currency" | "percent" | "bytes";
  precision?: number;
  trend?: number[];
  unit?: string;
  loading?: boolean;
  /** When true, shows muted styling (e.g. WS disconnected). */
  stale?: boolean;
  invertColor?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  previousValue,
  format = "number",
  precision = 2,
  trend,
  unit,
  loading,
  stale,
  invertColor,
  className,
}: MetricCardProps) {
  const animated = useAnimatedNumber(value ?? null);

  const delta =
    previousValue != null && value != null ? value - previousValue : undefined;
  const deltaPercent =
    delta != null && previousValue ? (delta / previousValue) * 100 : undefined;

  const display =
    animated == null
      ? "—"
      : formatByType(
          animated,
          format,
          format === "number" && Number.isInteger(value ?? 0) && precision === 2 ? 0 : precision,
        );

  return (
    <Card
      className={cn(
        "flex flex-col gap-4 p-4 transition-colors duration-normal",
        stale && "opacity-60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {delta != null && !loading && (
          <DeltaBadge delta={delta} deltaPercent={deltaPercent} format="both" invertColor={invertColor} />
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5 overflow-hidden">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <span className="font-mono text-2xl font-medium leading-none tabular-nums">
              {display}
            </span>
          )}
          {unit && !loading && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
        {trend && trend.length > 1 && !loading && (
          <Sparkline data={trend} width={96} height={32} />
        )}
      </div>
    </Card>
  );
}
