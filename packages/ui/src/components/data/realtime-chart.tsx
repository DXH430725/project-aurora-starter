"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export interface ChartPoint {
  time: number;
  value: number | null;
  label?: string;
}

export interface RealtimeChartProps {
  data: ChartPoint[];
  maxPoints?: number;
  yDomain?: [number, number] | "auto";
  color?: string;
  height?: number;
  showGrid?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
  stale?: boolean;
}

function formatTime(t: number) {
  const d = new Date(t);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartPoint }>;
}

function GlassTooltip({
  active,
  payload,
  formatValue,
}: TooltipProps & { formatValue?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="glass rounded-sm border border-border px-2.5 py-1.5 text-xs shadow-md">
      <div className="font-mono tabular-nums text-foreground">
        {formatValue ? formatValue(p.value) : p.value.toLocaleString()}
      </div>
      <div className="text-muted-foreground">{formatTime(p.payload.time)}</div>
    </div>
  );
}

export function RealtimeChart({
  data,
  maxPoints = 60,
  yDomain = "auto",
  color = "hsl(var(--primary))",
  height = 240,
  showGrid = true,
  formatValue,
  className,
  stale,
}: RealtimeChartProps) {
  const trimmed = React.useMemo(
    () => (data.length > maxPoints ? data.slice(data.length - maxPoints) : data),
    [data, maxPoints],
  );

  const domain: [number | "auto", number | "auto"] =
    yDomain === "auto" ? ["auto", "auto"] : yDomain;

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border bg-card p-4 transition-opacity duration-normal",
        stale && "opacity-60",
        className,
      )}
    >
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trimmed} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            {showGrid && (
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
                vertical={false}
              />
            )}
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v) => (formatValue ? formatValue(v as number) : String(v))}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border-strong))", strokeWidth: 1 }}
              content={<GlassTooltip formatValue={formatValue} />}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
