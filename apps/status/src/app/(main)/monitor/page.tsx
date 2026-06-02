"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonitorRange, useMonitorSnapshot } from "@/hooks/use-monitor-api";
import type {
  MonitorMetric,
  MonitorNodeSnapshot,
  MonitorRangeResponse,
} from "@/lib/monitor-types";
import { formatBytes, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const METRIC_CHARTS: Array<{
  metric: MonitorMetric;
  title: string;
  unit: string;
  domain?: [number, number];
  format: (value: number | null | undefined) => string;
}> = [
  { metric: "cpu", title: "CPU 使用率", unit: "%", domain: [0, 100], format: (v) => formatPercent(v, 1) },
  { metric: "mem", title: "内存使用率", unit: "%", domain: [0, 100], format: (v) => formatPercent(v, 1) },
  { metric: "disk", title: "磁盘使用率", unit: "%", domain: [0, 100], format: (v) => formatPercent(v, 1) },
];

interface ChartDatum {
  time: string;
  [seriesKey: string]: string | number;
}

function average(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value != null);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function max(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value != null);
  if (!valid.length) return null;
  return Math.max(...valid);
}

function seriesKey(instance: string, suffix = ""): string {
  return `${instance}${suffix}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function timeLabel(epochSec: number): string {
  return new Date(epochSec * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toChartData(range: MonitorRangeResponse | null): {
  data: ChartDatum[];
  series: Array<{ key: string; name: string; color: string }>;
} {
  if (!range) return { data: [], series: [] };

  const rows = new Map<number, ChartDatum>();
  const series = range.series.map((item, index) => ({
    key: seriesKey(item.instance),
    name: `${item.instance} (${item.region})`,
    color: SERIES_COLORS[index % SERIES_COLORS.length],
  }));

  for (const item of range.series) {
    const key = seriesKey(item.instance);
    for (const [epochSec, value] of item.points) {
      const row = rows.get(epochSec) ?? { time: timeLabel(epochSec) };
      row[key] = value;
      rows.set(epochSec, row);
    }
  }

  return {
    data: Array.from(rows.entries())
      .sort(([left], [right]) => left - right)
      .map(([, row]) => row),
    series,
  };
}

function toNetworkChartData(rx: MonitorRangeResponse | null, tx: MonitorRangeResponse | null) {
  const rows = new Map<number, ChartDatum>();
  const series: Array<{ key: string; name: string; color: string; dashed?: boolean }> = [];

  for (const [range, suffix, label, dashed] of [
    [rx, "_rx", "Rx", false],
    [tx, "_tx", "Tx", true],
  ] as const) {
    for (const [index, item] of (range?.series ?? []).entries()) {
      const key = seriesKey(item.instance, suffix);
      series.push({
        key,
        name: `${item.instance} ${label}`,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        dashed,
      });
      for (const [epochSec, value] of item.points) {
        const row = rows.get(epochSec) ?? { time: timeLabel(epochSec) };
        row[key] = value;
        rows.set(epochSec, row);
      }
    }
  }

  return {
    data: Array.from(rows.entries())
      .sort(([left], [right]) => left - right)
      .map(([, row]) => row),
    series,
  };
}

export default function MonitorPage() {
  const snapshot = useMonitorSnapshot();
  const cpu = useMonitorRange("cpu");
  const mem = useMonitorRange("mem");
  const disk = useMonitorRange("disk");
  const netRx = useMonitorRange("netRx");
  const netTx = useMonitorRange("netTx");

  const firstError = [snapshot.error, cpu.error, mem.error, disk.error, netRx.error, netTx.error].find(Boolean);
  if (firstError && !snapshot.data) {
    return <MonitorError message={firstError} />;
  }

  const nodes = snapshot.data?.nodes ?? [];
  const online = nodes.filter((node) => node.up === 1).length;
  const avgCpu = average(nodes.map((node) => node.cpu));
  const avgMem = average(nodes.map((node) => node.mem));
  const maxDisk = max(nodes.map((node) => node.disk));

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">性能监控</h1>
        <p className="text-sm text-muted-foreground">
          通过 Next.js BFF 轮询 Prometheus；本地 mock 模式覆盖离线节点与多指标曲线。
        </p>
      </section>

      {firstError && <InlineWarning message={firstError} />}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard
          label="节点在线"
          value={nodes.length ? `${online} / ${nodes.length}` : "—"}
          loading={snapshot.loading}
        />
        <SummaryCard label="平均 CPU" value={formatPercent(avgCpu, 1)} loading={snapshot.loading} />
        <SummaryCard label="平均内存" value={formatPercent(avgMem, 1)} loading={snapshot.loading} />
        <SummaryCard label="最高磁盘" value={formatPercent(maxDisk, 1)} loading={snapshot.loading} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {METRIC_CHARTS.map((chart) => (
          <MetricTimeseriesCard
            key={chart.metric}
            title={chart.title}
            loading={chart.metric === "cpu" ? cpu.loading : chart.metric === "mem" ? mem.loading : disk.loading}
            range={chart.metric === "cpu" ? cpu.data : chart.metric === "mem" ? mem.data : disk.data}
            domain={chart.domain}
            formatValue={chart.format}
          />
        ))}
        <NetworkTimeseriesCard loading={netRx.loading || netTx.loading} rx={netRx.data} tx={netTx.data} />
      </section>

      <NodeTable nodes={nodes} loading={snapshot.loading} />
    </div>
  );
}

function MonitorError({ message }: { message: string }) {
  return (
    <Card className="border-negative/40 bg-negative-muted/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-medium text-foreground">监控数据源不可达</h1>
          <p className="text-sm text-muted-foreground">
            {message || "监控数据源不可达"}，15s 后重试。
          </p>
        </div>
      </div>
    </Card>
  );
}

function InlineWarning({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-negative/40 bg-negative-muted/30 px-3 py-2 text-sm text-negative">
      {message}，15s 后重试。
    </div>
  );
}

function SummaryCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <span className="font-mono text-2xl font-medium leading-none tabular-nums">
          {value}
        </span>
      )}
    </Card>
  );
}

function MetricTimeseriesCard({
  title,
  loading,
  range,
  domain,
  formatValue,
}: {
  title: string;
  loading: boolean;
  range: MonitorRangeResponse | null;
  domain?: [number, number];
  formatValue: (value: number | null | undefined) => string;
}) {
  const chart = React.useMemo(() => toChartData(range), [range]);

  return (
    <Card className="flex min-h-[320px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {loading && !chart.data.length ? (
          <Skeleton className="h-[230px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chart.data}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--chart-muted)" tickLine={false} axisLine={false} />
              <YAxis
                domain={domain}
                stroke="var(--chart-muted)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatValue(Number(value))}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--chart-tooltip-border)",
                  borderRadius: "var(--radius-sm)",
                }}
                labelStyle={{ color: "var(--chart-tooltip-fg)" }}
                formatter={(value) => formatValue(Number(value))}
              />
              {chart.series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.name}
                  stroke={item.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        <ChartLegend series={chart.series} />
      </CardContent>
    </Card>
  );
}

function NetworkTimeseriesCard({
  loading,
  rx,
  tx,
}: {
  loading: boolean;
  rx: MonitorRangeResponse | null;
  tx: MonitorRangeResponse | null;
}) {
  const chart = React.useMemo(() => toNetworkChartData(rx, tx), [rx, tx]);

  return (
    <Card className="flex min-h-[320px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
          网络入出速率
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {loading && !chart.data.length ? (
          <Skeleton className="h-[230px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chart.data}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--chart-muted)" tickLine={false} axisLine={false} />
              <YAxis
                stroke="var(--chart-muted)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatBytes(Number(value))}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--chart-tooltip-border)",
                  borderRadius: "var(--radius-sm)",
                }}
                labelStyle={{ color: "var(--chart-tooltip-fg)" }}
                formatter={(value) => formatBytes(Number(value))}
              />
              {chart.series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.name}
                  stroke={item.color}
                  strokeDasharray={item.dashed ? "5 5" : undefined}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        <ChartLegend series={chart.series} />
      </CardContent>
    </Card>
  );
}

function ChartLegend({ series }: { series: Array<{ key: string; name: string; color: string; dashed?: boolean }> }) {
  if (!series.length) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {series.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span
            className={cn("h-0.5 w-5", item.dashed && "border-t border-dashed bg-transparent")}
            style={item.dashed ? { borderColor: item.color } : { background: item.color }}
          />
          {item.name}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
        <span className="h-0.5 w-5 bg-muted-foreground/50" />
        offline 节点不绘制曲线
      </span>
    </div>
  );
}

function NodeTable({ nodes, loading }: { nodes: MonitorNodeSnapshot[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">节点详情</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !nodes.length ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 text-left font-medium">节点</th>
                  <th className="py-2 text-left font-medium">Region</th>
                  <th className="py-2 text-left font-medium">状态</th>
                  <th className="py-2 text-right font-medium">CPU</th>
                  <th className="py-2 text-right font-medium">内存</th>
                  <th className="py-2 text-right font-medium">磁盘</th>
                  <th className="py-2 text-right font-medium">Rx</th>
                  <th className="py-2 text-right font-medium">Tx</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr
                    key={node.instance}
                    className={cn(
                      "border-b border-border/60 last:border-0",
                      node.up === 0 && "text-muted-foreground opacity-60",
                    )}
                  >
                    <td className="py-3 font-mono">{node.instance}</td>
                    <td className="py-3">{node.region}</td>
                    <td className="py-3">
                      <Badge variant={node.up ? "positive" : "negative"}>
                        {node.up ? "online" : "offline"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">{formatPercent(node.cpu, 1)}</td>
                    <td className="py-3 text-right font-mono tabular-nums">{formatPercent(node.mem, 1)}</td>
                    <td className="py-3 text-right font-mono tabular-nums">{formatPercent(node.disk, 1)}</td>
                    <td className="py-3 text-right font-mono tabular-nums">{formatBytes(node.netRxBps)}</td>
                    <td className="py-3 text-right font-mono tabular-nums">{formatBytes(node.netTxBps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !nodes.length && (
          <p className="py-8 text-center text-sm text-muted-foreground">暂无节点数据。</p>
        )}
      </CardContent>
    </Card>
  );
}
