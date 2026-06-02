"use client";

import * as React from "react";
import { useWSStore } from "@/stores/ws-store";
import { cn } from "@/lib/utils";
import type { WSMessage } from "@/types/ws";

export interface ChannelStats {
  channel: string;
  subscribers: number;
  msgsPerSec: number;
  lastSeen: number | null;
}

export interface ChannelListProps {
  messages: WSMessage[];
  selected: Set<string>;
  onToggle: (channel: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  className?: string;
}

const WINDOW_MS = 5_000;

export function ChannelList({
  messages,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  className,
}: ChannelListProps) {
  const subscriptions = useWSStore((s) => s.subscriptions);
  const [, tick] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  const stats = React.useMemo<ChannelStats[]>(() => {
    const now = Date.now();
    const byChannel = new Map<string, { count: number; last: number }>();
    for (const m of messages) {
      const entry = byChannel.get(m.channel) ?? { count: 0, last: 0 };
      if (now - m.timestamp <= WINDOW_MS) entry.count += 1;
      if (m.timestamp > entry.last) entry.last = m.timestamp;
      byChannel.set(m.channel, entry);
    }
    const all = new Set<string>([
      ...Object.keys(subscriptions),
      ...Array.from(byChannel.keys()),
    ]);
    return Array.from(all)
      .sort((a, b) => a.localeCompare(b))
      .map((channel) => {
        const entry = byChannel.get(channel);
        return {
          channel,
          subscribers: subscriptions[channel]?.length ?? 0,
          msgsPerSec: entry ? entry.count / (WINDOW_MS / 1000) : 0,
          lastSeen: entry?.last ?? null,
        };
      });
  }, [messages, subscriptions]);

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Channels · {stats.length}
        </h2>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <button
            type="button"
            onClick={onSelectAll}
            className="hover:text-foreground transition-colors duration-fast"
          >
            All
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={onClear}
            className="hover:text-foreground transition-colors duration-fast"
          >
            None
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {stats.length === 0 && (
          <div className="p-4 text-xs text-muted-foreground">
            No channels observed yet.
          </div>
        )}
        {stats.map((s) => (
          <label
            key={s.channel}
            className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2 text-xs transition-colors duration-fast hover:bg-muted"
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-primary"
              checked={selected.has(s.channel)}
              onChange={() => onToggle(s.channel)}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-mono text-[11px] text-foreground">{s.channel}</span>
              <span className="flex items-center gap-2 text-[10px] tabular-nums text-muted-foreground">
                <span>{s.subscribers} sub</span>
                <span>·</span>
                <span>{s.msgsPerSec.toFixed(1)}/s</span>
                {s.lastSeen && (
                  <>
                    <span>·</span>
                    <span>{Math.max(0, Math.floor((Date.now() - s.lastSeen) / 1000))}s ago</span>
                  </>
                )}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
