"use client";

import * as React from "react";
import { RealtimeMetricCard } from "@/components/data/realtime-metric-card";
import { RealtimeChart, type ChartPoint } from "@/components/data/realtime-chart";
import { DataTable, type DataColumn } from "@/components/data/data-table";
import { StatusDot } from "@/components/data/status-dot";
import { useChannel } from "@/hooks/use-channel";
import { initialNodes, mapHealthStatus, type MockNode } from "@/lib/mock-data";
import { formatNumber, formatPercent } from "@/lib/format";

interface SummaryData {
  activeNodes: number;
  reqPerSec: number;
  p99Latency: number;
  uptimePercent: number;
  avgCpu: number;
}

interface HealthData {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  cpu: number;
  memory: number;
  latency: number | null;
}

const MAX_POINTS = 60;

export default function MonitorPage() {
  // ---- Chart: avg CPU history ----
  const [chart, setChart] = React.useState<ChartPoint[]>([]);

  useChannel<SummaryData>("metrics.summary", (msg) => {
    if (msg.type !== "data" || !msg.data) return;
    setChart((prev) => {
      const next = [...prev, { time: msg.timestamp, value: msg.data!.avgCpu }];
      if (next.length > MAX_POINTS) next.splice(0, next.length - MAX_POINTS);
      return next;
    });
  });

  // ---- Node health table ----
  const [nodes, setNodes] = React.useState<MockNode[]>(() => initialNodes());

  useChannel<HealthData>("node.health.*", (msg) => {
    if (msg.type !== "data" || !msg.data) return;
    const incoming = msg.data;
    setNodes((prev) => {
      const map = new Map(prev.map((n) => [n.id, n]));
      map.set(incoming.id, {
        id: incoming.id,
        name: incoming.name,
        status: mapHealthStatus(incoming.status),
        cpu: incoming.cpu,
        memory: incoming.memory,
        latency: incoming.latency,
      });
      return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
    });
  });

  const columns: DataColumn<MockNode>[] = [
    {
      key: "status",
      header: "Status",
      cell: (n) => <StatusDot status={n.status} label={n.status} />,
    },
    { key: "name", header: "Node", cell: (n) => <span className="font-mono">{n.name}</span> },
    {
      key: "cpu",
      header: "CPU",
      align: "right",
      cell: (n) => <span className="font-mono tabular-nums">{formatPercent(n.cpu, 0)}</span>,
    },
    {
      key: "memory",
      header: "Memory",
      align: "right",
      cell: (n) => <span className="font-mono tabular-nums">{formatPercent(n.memory, 0)}</span>,
    },
    {
      key: "latency",
      header: "Latency",
      align: "right",
      cell: (n) => (
        <span className="font-mono tabular-nums">
          {n.latency == null ? "—" : `${formatNumber(n.latency)}ms`}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">Data Monitor</h1>
        <p className="text-sm text-muted-foreground">
          Live metrics streamed via WebSocket. Values animate on update.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <RealtimeMetricCard<SummaryData>
          label="Active Nodes"
          channel="metrics.summary"
          selector={(m) => m.data?.activeNodes ?? 0}
          format="number"
          precision={0}
        />
        <RealtimeMetricCard<SummaryData>
          label="Req / s"
          channel="metrics.summary"
          selector={(m) => m.data?.reqPerSec ?? 0}
          format="number"
          unit="req/s"
          precision={0}
        />
        <RealtimeMetricCard<SummaryData>
          label="P99 Latency"
          channel="metrics.summary"
          selector={(m) => m.data?.p99Latency ?? 0}
          format="number"
          unit="ms"
          precision={0}
          invertColor
        />
        <RealtimeMetricCard<SummaryData>
          label="Uptime"
          channel="metrics.summary"
          selector={(m) => m.data?.uptimePercent ?? 0}
          format="percent"
          precision={2}
        />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Avg CPU (cluster)
          </h2>
        </div>
        <RealtimeChart
          data={chart}
          maxPoints={MAX_POINTS}
          yDomain={[0, 100]}
          formatValue={(v) => `${v.toFixed(0)}%`}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Nodes
        </h2>
        <DataTable<MockNode> columns={columns} rows={nodes} rowKey={(n) => n.id} />
      </section>
    </div>
  );
}
