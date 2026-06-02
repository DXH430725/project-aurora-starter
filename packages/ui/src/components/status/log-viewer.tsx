"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  source?: string;
  timestamp: number;
  message: string;
}

export interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
  autoScroll?: boolean;
  rowHeight?: number;
}

const LEVEL_CLASS: Record<LogLevel, string> = {
  debug: "text-muted-foreground",
  info: "text-foreground",
  warn: "text-warning",
  error: "text-negative",
};

export function LogViewer({ logs, className, rowHeight = 22 }: LogViewerProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [autoScroll, setAutoScroll] = React.useState(true);

  const filtered = React.useMemo(() => {
    if (!query) return logs;
    const q = query.toLowerCase();
    return logs.filter((l) => l.message.toLowerCase().includes(q));
  }, [logs, query]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  // Pause autoScroll when user scrolls up
  React.useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
      setAutoScroll(atBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!autoScroll) return;
    virtualizer.scrollToIndex(filtered.length - 1, { align: "end" });
  }, [filtered.length, autoScroll, virtualizer]);

  const jumpToLatest = () => {
    setAutoScroll(true);
    virtualizer.scrollToIndex(filtered.length - 1, { align: "end" });
  };

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter logs…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {filtered.length.toLocaleString()} / {logs.length.toLocaleString()}
        </span>
        {!autoScroll && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-muted px-2 text-[11px] text-foreground transition-colors duration-fast hover:border-border-strong"
          >
            <ArrowDown className="h-3 w-3" /> Jump to latest
          </button>
        )}
      </div>

      <div ref={parentRef} className="relative flex-1 overflow-auto font-mono text-[11px] leading-[22px]">
        <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
          {virtualizer.getVirtualItems().map((vi) => {
            const log = filtered[vi.index]!;
            return (
              <div
                key={log.id}
                className="absolute inset-x-0 flex items-center gap-3 px-3"
                style={{ transform: `translateY(${vi.start}px)`, height: vi.size }}
              >
                <span className="shrink-0 tabular-nums text-muted-foreground">{formatStamp(log.timestamp)}</span>
                <span className={cn("shrink-0 w-12 uppercase text-[10px]", LEVEL_CLASS[log.level])}>
                  {log.level}
                </span>
                {log.source && (
                  <span className="shrink-0 text-muted-foreground">{log.source}</span>
                )}
                <span className={cn("truncate", LEVEL_CLASS[log.level])}>
                  <Highlight text={log.message} query={query} />
                </span>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">No logs match.</div>
        )}
      </div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function formatStamp(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}
