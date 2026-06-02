/**
 * Centralized mock data generators. Keep all mocks here — do not sprinkle
 * them through components.
 */

export type NodeStatus = "active" | "idle" | "warning" | "error" | "offline";

export interface MockNode {
  id: string;
  name: string;
  status: NodeStatus;
  cpu: number;
  memory: number;
  latency: number | null;
}

export const MOCK_NODE_IDS = [
  "node-01",
  "node-02",
  "node-03",
  "node-04",
  "node-05",
  "node-06",
  "node-07",
  "node-08",
] as const;

export function initialNodes(): MockNode[] {
  return [
    { id: "node-01", name: "node-01", status: "active", cpu: 42, memory: 58, latency: 18 },
    { id: "node-02", name: "node-02", status: "active", cpu: 67, memory: 71, latency: 22 },
    { id: "node-03", name: "node-03", status: "warning", cpu: 94, memory: 83, latency: 284 },
    { id: "node-04", name: "node-04", status: "active", cpu: 31, memory: 44, latency: 15 },
    { id: "node-05", name: "node-05", status: "active", cpu: 55, memory: 60, latency: 20 },
    { id: "node-06", name: "node-06", status: "idle", cpu: 5, memory: 32, latency: 12 },
    { id: "node-07", name: "node-07", status: "error", cpu: 0, memory: 0, latency: null },
    { id: "node-08", name: "node-08", status: "active", cpu: 78, memory: 66, latency: 31 },
  ];
}

// -------------------- Intel --------------------

import type { IntelItem, IntelImportance } from "@/components/content/intel-card";
import type { TimelineEvent, TimelineEventType } from "@/components/content/timeline";

const INTEL_TAGS = [
  "ops",
  "security",
  "pipeline",
  "infra",
  "release",
  "observability",
  "cost",
  "incident",
];
const INTEL_SOURCES = ["Runbook", "Slack", "GitHub", "PagerDuty", "Grafana"];
const INTEL_TITLES = [
  "Pipeline backfill completed",
  "New canary deploy strategy landed",
  "P99 regression traced to cache miss",
  "Quarterly capacity review draft",
  "Rotating credentials for ingest service",
  "Upgraded Postgres to 16.3",
  "Disk pressure on node-07",
  "Cost anomaly in us-east-1",
  "New on-call playbook published",
];

function pickN<T>(arr: readonly T[], n: number): T[] {
  const out: T[] = [];
  const pool = [...arr];
  while (pool.length && out.length < n) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]!);
  }
  return out;
}

export function generateIntelItems(count = 9): IntelItem[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const importance: IntelImportance =
      i === 0 ? "high" : i < 3 ? "normal" : Math.random() < 0.15 ? "high" : "normal";
    const title = INTEL_TITLES[i % INTEL_TITLES.length]!;
    return {
      id: `intel-${i}`,
      title,
      summary:
        "Auto-generated summary for demo purposes. Wire this to your own content pipeline to stream real signals into the feed.",
      tags: pickN(INTEL_TAGS, 2 + Math.floor(Math.random() * 2)),
      source: INTEL_SOURCES[i % INTEL_SOURCES.length],
      publishedAt: now - i * 1000 * 60 * (5 + Math.floor(Math.random() * 40)),
      importance,
    };
  });
}

export function generateTimelineEvents(count = 6): TimelineEvent[] {
  const types: TimelineEventType[] = ["info", "success", "warning", "error"];
  const now = Date.now();
  const titles = [
    "Deploy succeeded",
    "Alert acknowledged",
    "Threshold crossed",
    "Config change applied",
    "Incident opened",
    "Canary promoted",
    "Backfill started",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `ev-${i}`,
    type: types[i % types.length]!,
    title: titles[i % titles.length]!,
    description: "Auto-generated event.",
    timestamp: now - i * 1000 * 60 * (2 + Math.floor(Math.random() * 15)),
  }));
}

// -------------------- Logs / Uptime --------------------

import type { LogEntry, LogLevel } from "@/components/status/log-viewer";
import type { UptimeSegment, UptimeStatus } from "@/components/status/uptime-bar";

const LOG_SOURCES = ["api", "worker", "ingest", "scheduler", "db"];
const LOG_MESSAGES = [
  "request completed in 42ms",
  "cache miss for key=user:profile",
  "connection pool at 78% utilization",
  "retrying upstream after 503",
  "task queued id=1234",
  "migration step 17 applied",
  "pong from node-03",
  "token refresh succeeded",
  "disk write 128KB",
  "rate limit hit for ip=10.0.0.12",
  "job finished status=ok duration=1.2s",
  "GC pause 14ms",
];

export function generateLogs(count = 10_000): LogEntry[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const r = Math.random();
    const level: LogLevel = r > 0.97 ? "error" : r > 0.88 ? "warn" : r > 0.5 ? "info" : "debug";
    return {
      id: `log-${i}`,
      level,
      source: LOG_SOURCES[i % LOG_SOURCES.length],
      timestamp: now - (count - i) * 200,
      message: LOG_MESSAGES[i % LOG_MESSAGES.length]!,
    };
  });
}

export function generateUptimeSegments(count = 90): UptimeSegment[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const r = Math.random();
    const status: UptimeStatus = r > 0.97 ? "down" : r > 0.9 ? "degraded" : "up";
    return {
      timestamp: now - (count - i) * 60_000,
      status,
    };
  });
}

export function mapHealthStatus(s: string): NodeStatus {
  switch (s) {
    case "healthy":
      return "active";
    case "degraded":
      return "warning";
    case "down":
      return "error";
    case "unknown":
      return "offline";
    default:
      return "idle";
  }
}
