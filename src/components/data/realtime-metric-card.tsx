"use client";

import * as React from "react";
import { MetricCard, type MetricCardProps } from "@/components/data/metric-card";
import { useChannelValue } from "@/hooks/use-channel-value";
import type { WSMessage } from "@/types/ws";

type Base = Omit<MetricCardProps, "value" | "previousValue" | "loading" | "stale" | "trend">;

export interface RealtimeMetricCardProps<T = unknown> extends Base {
  channel: string;
  selector: (msg: WSMessage<T>) => number;
  /** Max points retained in the trend sparkline. */
  trendWindow?: number;
}

export function RealtimeMetricCard<T = unknown>({
  channel,
  selector,
  trendWindow = 20,
  ...rest
}: RealtimeMetricCardProps<T>) {
  const { value, state, lastUpdatedAt } = useChannelValue<T, number | null>(
    channel,
    (msg) => {
      try {
        return selector(msg);
      } catch {
        return null;
      }
    },
    null,
  );

  const [trend, setTrend] = React.useState<number[]>([]);
  const prevRef = React.useRef<number | undefined>(undefined);
  const [previousValue, setPreviousValue] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (value == null) return;
    setTrend((t) => {
      const next = [...t, value];
      if (next.length > trendWindow) next.splice(0, next.length - trendWindow);
      return next;
    });
    if (prevRef.current != null) setPreviousValue(prevRef.current);
    prevRef.current = value;
  }, [value, trendWindow]);

  const stale = state !== "OPEN";
  const loading = value == null && lastUpdatedAt == null;

  return (
    <MetricCard
      {...rest}
      value={value ?? undefined}
      previousValue={previousValue}
      trend={trend}
      loading={loading}
      stale={stale}
    />
  );
}
