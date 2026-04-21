"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  PulseIndicator,
  aggregateStatus,
  type NodeHealthSample,
} from "@/components/status/pulse-indicator";
import { NodeHealthGrid } from "@/components/status/node-health-grid";
import { UptimeBar } from "@/components/status/uptime-bar";
import { AlertList } from "@/components/status/alert-list";
import { LogViewer, type LogEntry } from "@/components/status/log-viewer";
import { useChannel } from "@/hooks/use-channel";
import { generateLogs, generateUptimeSegments } from "@/lib/mock-data";

interface SummaryData {
  uptimePercent: number;
  activeNodes: number;
  p99Latency: number;
}

const LOG_CAP = 10_000;

export default function StatusPage() {
  const [samples, setSamples] = React.useState<Record<string, NodeHealthSample>>({});
  const [summary, setSummary] = React.useState<SummaryData | null>(null);
  const [logs, setLogs] = React.useState<LogEntry[]>(() => generateLogs(LOG_CAP));
  const [uptimeApi] = React.useState(() => generateUptimeSegments(90));
  const [uptimeDb] = React.useState(() => generateUptimeSegments(90));
  const [uptimeQueue] = React.useState(() => generateUptimeSegments(90));

  useChannel<SummaryData>("metrics.summary", (msg) => {
    if (msg.type !== "data" || !msg.data) return;
    setSummary(msg.data);
  });

  // Append a log line every second from summary — keeps LogViewer lively.
  React.useEffect(() => {
    if (!summary) return;
    const entry: LogEntry = {
      id: `live-${Date.now()}`,
      level: summary.p99Latency > 35 ? "warn" : "info",
      source: "api",
      timestamp: Date.now(),
      message: `summary uptime=${summary.uptimePercent.toFixed(2)}% active=${summary.activeNodes} p99=${summary.p99Latency}ms`,
    };
    setLogs((prev) => {
      const next = [...prev, entry];
      return next.length > LOG_CAP ? next.slice(next.length - LOG_CAP) : next;
    });
  }, [summary]);

  const overall = aggregateStatus(samples);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">System Status</h1>
        <p className="text-sm text-muted-foreground">
          Health, uptime, and operational signal across the fleet.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Overall
            </span>
            <PulseIndicator samples={samples} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Uptime" value={summary ? `${summary.uptimePercent.toFixed(3)}%` : "—"} />
            <Stat label="Active nodes" value={summary?.activeNodes?.toString() ?? "—"} />
            <Stat label="P99 latency" value={summary ? `${summary.p99Latency} ms` : "—"} />
          </div>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Status aggregate: {overall}
          </span>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Node health
        </h2>
        <NodeHealthGrid onSamplesChange={setSamples} />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Core service uptime (last 90 minutes)
        </h2>
        <UptimeBar label="api-gateway" segments={uptimeApi} uptimePercent={99.982} />
        <UptimeBar label="postgres-primary" segments={uptimeDb} uptimePercent={99.995} />
        <UptimeBar label="message-queue" segments={uptimeQueue} uptimePercent={99.91} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <LogViewer logs={logs} className="h-[480px]" />
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Alerts
          </h2>
          <AlertList />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-mono text-lg tabular-nums text-foreground">{value}</span>
    </div>
  );
}
