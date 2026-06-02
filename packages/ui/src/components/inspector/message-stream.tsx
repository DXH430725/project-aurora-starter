"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WSMessage } from "@/types/ws";

export interface MessageStreamProps {
  messages: WSMessage[];
  sampled?: boolean;
  className?: string;
}

export function MessageStream({ messages, sampled, className }: MessageStreamProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [expanded, setExpanded] = React.useState<Set<number>>(() => new Set());
  const [flash, setFlash] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    if (messages.length === 0) return;
    const lastId = messageKey(messages[messages.length - 1]!, messages.length - 1);
    setFlash((prev) => {
      const next = new Set(prev);
      next.add(lastId);
      return next;
    });
    const t = setTimeout(() => {
      setFlash((prev) => {
        const next = new Set(prev);
        next.delete(lastId);
        return next;
      });
    }, 150);
    return () => clearTimeout(t);
  }, [messages]);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (expanded.has(i) ? 220 : 26),
    overscan: 10,
  });

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
    if (!autoScroll || messages.length === 0) return;
    virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
  }, [messages.length, autoScroll, virtualizer]);

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
    virtualizer.measure();
  };

  return (
    <div className={cn("relative flex flex-col overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Messages · {messages.length}
        </h2>
        <div className="flex items-center gap-2">
          {sampled && (
            <span className="rounded-sm bg-warning-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
              Sampled 1:10
            </span>
          )}
          {!autoScroll && (
            <button
              type="button"
              onClick={() => {
                setAutoScroll(true);
                virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
              }}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-muted px-2 text-[11px] text-foreground transition-colors duration-fast hover:border-border-strong"
            >
              <ArrowDown className="h-3 w-3" /> Latest
            </button>
          )}
        </div>
      </div>

      <div ref={parentRef} className="relative flex-1 overflow-auto font-mono text-[11px]">
        <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
          {virtualizer.getVirtualItems().map((vi) => {
            const msg = messages[vi.index]!;
            const key = messageKey(msg, vi.index);
            const isExpanded = expanded.has(vi.index);
            const isFlash = flash.has(key);
            return (
              <div
                key={key}
                className={cn(
                  "absolute inset-x-0 border-b border-border/50 px-3 py-1 transition-colors",
                  isFlash && "bg-primary/10",
                )}
                style={{ transform: `translateY(${vi.start}px)` }}
              >
                <button
                  type="button"
                  onClick={() => toggle(vi.index)}
                  className="flex w-full items-center gap-3 text-left focus:outline-none"
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatStamp(msg.timestamp)}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-sm px-1 py-0.5 text-[10px] uppercase",
                      msg.type === "error"
                        ? "bg-negative-muted text-negative"
                        : msg.type === "ack"
                          ? "bg-info-muted text-info"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {msg.type}
                  </span>
                  <span className="truncate text-foreground">{msg.channel}</span>
                </button>
                {isExpanded && (
                  <pre className="mt-1 max-h-48 overflow-auto rounded-sm border border-border bg-muted p-2 text-[11px] leading-snug text-foreground">
                    {JSON.stringify(msg, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
        {messages.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Waiting for messages…
          </div>
        )}
      </div>
    </div>
  );
}

function messageKey(msg: WSMessage, i: number) {
  return `${i}-${msg.timestamp}-${msg.channel}`;
}

function formatStamp(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}
