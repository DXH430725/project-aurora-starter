"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TimelineEventType = "info" | "warning" | "success" | "error";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: number;
}

/**
 * Timeline — adapted from ui.aceternity.com.
 * Vertical list with colored nodes keyed to event type. Tokens only.
 */
export function Timeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  return (
    <ol className={cn("relative flex flex-col gap-5 pl-6", className)}>
      <span
        aria-hidden
        className="absolute left-[7px] top-1 bottom-1 w-px bg-border"
      />
      {events.map((ev) => (
        <TimelineNode key={ev.id} event={ev} />
      ))}
      {events.length === 0 && (
        <li className="text-sm text-muted-foreground">No events yet.</li>
      )}
    </ol>
  );
}

function TimelineNode({ event }: { event: TimelineEvent }) {
  const dot = colorFor(event.type);
  return (
    <li className="relative">
      <span
        aria-hidden
        className={cn(
          "absolute -left-6 top-1.5 flex h-3 w-3 items-center justify-center rounded-full border",
          dot.ring,
          dot.bg,
        )}
      />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-foreground">{event.title}</span>
          <time className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatTime(event.timestamp)}
          </time>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground">{event.description}</p>
        )}
      </div>
    </li>
  );
}

function colorFor(t: TimelineEventType) {
  switch (t) {
    case "success":
      return { bg: "bg-positive", ring: "border-positive-muted" };
    case "warning":
      return { bg: "bg-warning", ring: "border-warning-muted" };
    case "error":
      return { bg: "bg-negative", ring: "border-negative-muted" };
    case "info":
    default:
      return { bg: "bg-info", ring: "border-info-muted" };
  }
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
