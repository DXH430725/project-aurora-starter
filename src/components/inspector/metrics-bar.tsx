"use client";

import * as React from "react";
import { useWSClient } from "@/components/providers/ws-provider";
import { useWSStore } from "@/stores/ws-store";
import { cn } from "@/lib/utils";

export function MetricsBar({ className }: { className?: string }) {
  const client = useWSClient();
  const state = useWSStore((s) => s.state);
  const [, tick] = React.useReducer((x: number) => x + 1, 0);

  React.useEffect(() => {
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  const m = client.getMetrics();
  const uptime =
    m.connectedAt && state === "OPEN"
      ? Math.floor((Date.now() - m.connectedAt) / 1000)
      : null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-5",
        className,
      )}
    >
      <Stat label="State" value={state} mono />
      <Stat label="Uptime" value={uptime == null ? "—" : formatDuration(uptime)} />
      <Stat label="RTT" value={m.latency == null ? "—" : `${m.latency} ms`} />
      <Stat label="Rx / Tx" value={`${m.messagesReceived} / ${m.messagesSent}`} />
      <Stat
        label="Bytes"
        value={`↓ ${formatBytes(m.bytesReceived)}  ↑ ${formatBytes(m.bytesSent)}`}
      />
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-sm tabular-nums text-foreground", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m === 0) return `${ss}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${m}m ${ss}s`;
  return `${h}h ${mm}m`;
}
