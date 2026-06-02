"use client";

import * as React from "react";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

/**
 * Minimal inline sparkline — one line, no axes. Resistant to empty inputs.
 */
export function Sparkline({
  data,
  width = 96,
  height = 32,
  stroke = "hsl(var(--primary))",
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} aria-hidden />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
