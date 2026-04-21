import * as React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeltaBadgeProps {
  delta: number;
  deltaPercent?: number;
  format?: "absolute" | "percent" | "both";
  /** For metrics where a negative change is good (e.g. latency). */
  invertColor?: boolean;
  className?: string;
}

export function DeltaBadge({
  delta,
  deltaPercent,
  format = "absolute",
  invertColor = false,
  className,
}: DeltaBadgeProps) {
  const isZero = Math.abs(delta) < 1e-9;
  const isPositive = delta > 0;
  const good = isZero ? false : invertColor ? !isPositive : isPositive;
  const kind = isZero ? "neutral" : good ? "positive" : "negative";

  const tone =
    kind === "positive"
      ? "bg-positive-muted text-positive"
      : kind === "negative"
        ? "bg-negative-muted text-negative"
        : "bg-muted text-muted-foreground";

  const Icon = isZero ? Minus : isPositive ? ArrowUp : ArrowDown;

  const label = (() => {
    const abs = Math.abs(delta);
    const absText = abs.toLocaleString("en-US", { maximumFractionDigits: 2 });
    const pctText =
      deltaPercent != null ? `${Math.abs(deltaPercent).toFixed(1)}%` : null;
    if (format === "percent" && pctText) return pctText;
    if (format === "both" && pctText) return `${absText} · ${pctText}`;
    return absText;
  })();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-xs font-medium tabular-nums",
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      <span className="font-mono">{label}</span>
    </span>
  );
}
