import type {
  MonitorMetric,
  MonitorNodeSnapshot,
  MonitorRangeResponse,
  ServiceDayState,
  ServiceStatusDay,
  ServiceStatusItem,
  StatusResponse,
} from "@/lib/monitor-types";

const NODES: Array<{ instance: string; region: string; base: number; offline?: boolean }> = [
  { instance: "racknerd-dublin", region: "Dublin", base: 38 },
  { instance: "racknerd-us", region: "US", base: 46 },
  { instance: "byvirt-jp", region: "Japan", base: 31 },
  { instance: "Massivegird-Longdong", region: "London", base: 54 },
  { instance: "LengendVPS-SG", region: "Singapore", base: 27, offline: true },
];

const METRIC_OFFSET: Record<MonitorMetric, number> = {
  cpu: 0,
  mem: 18,
  disk: 28,
  netRx: 6,
  netTx: 12,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wave(seed: number, index: number): number {
  return Math.sin(index / 8 + seed) * 4 + Math.cos(index / 17 + seed) * 2;
}

function percentValue(metric: MonitorMetric, base: number, index: number): number {
  const max = metric === "disk" ? 92 : 96;
  return Number(clamp(base + METRIC_OFFSET[metric] + wave(base / 10, index), 4, max).toFixed(1));
}

function networkValue(metric: MonitorMetric, base: number, index: number): number {
  const factor = metric === "netRx" ? 18_000 : 11_000;
  const burst = Math.max(0, Math.sin(index / 5 + base) * 0.35 + 0.65);
  return Math.round((base + METRIC_OFFSET[metric]) * factor * burst);
}

function currentValue(metric: MonitorMetric, base: number): number {
  const index = Math.floor(Date.now() / 30_000);
  if (metric === "netRx" || metric === "netTx") return networkValue(metric, base, index);
  return percentValue(metric, base, index);
}

export function mockMonitorSnapshot(): { at: number; nodes: MonitorNodeSnapshot[] } {
  return {
    at: Date.now(),
    nodes: NODES.map((node) => {
      if (node.offline) {
        return {
          instance: node.instance,
          region: node.region,
          up: 0,
          cpu: null,
          mem: null,
          disk: null,
          netRxBps: null,
          netTxBps: null,
        };
      }

      return {
        instance: node.instance,
        region: node.region,
        up: 1,
        cpu: currentValue("cpu", node.base),
        mem: currentValue("mem", node.base),
        disk: currentValue("disk", node.base),
        netRxBps: currentValue("netRx", node.base),
        netTxBps: currentValue("netTx", node.base),
      };
    }),
  };
}

export function mockMonitorRange(metric: MonitorMetric, minutes = 60): MonitorRangeResponse {
  const end = Math.floor(Date.now() / 1000);
  const stepSec = 30;
  const pointCount = Math.max(2, Math.round((minutes * 60) / stepSec));
  const start = end - pointCount * stepSec;

  return {
    metric,
    start,
    end,
    stepSec,
    series: NODES.filter((node) => !node.offline).map((node) => ({
      instance: node.instance,
      region: node.region,
      points: Array.from({ length: pointCount }, (_, index) => {
        const epochSec = start + index * stepSec;
        const value =
          metric === "netRx" || metric === "netTx"
            ? networkValue(metric, node.base, index)
            : percentValue(metric, node.base, index);
        return [epochSec, value];
      }),
    })),
  };
}

function isoDay(daysAgo: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function serviceDays(values: Array<number | null>): ServiceStatusDay[] {
  return values.map((availability, index) => {
    const state: ServiceDayState =
      availability == null ? "nodata" : availability >= 95 ? "ok" : "down";
    return {
      date: isoDay(6 - index),
      state,
      availability,
    };
  });
}

function uptime7d(days: ServiceStatusItem["days"]): number | null {
  const sampled = days.filter((day) => day.state !== "nodata");
  if (!sampled.length) return null;
  const ok = sampled.filter((day) => day.state === "ok").length;
  return Number(((ok / sampled.length) * 100).toFixed(2));
}

function service(
  name: string,
  target: string,
  currentUp: 0 | 1 | null,
  values: Array<number | null>,
): ServiceStatusItem {
  const days = serviceDays(values);
  return {
    name,
    target,
    currentUp,
    days,
    uptime7d: uptime7d(days),
  };
}

export function mockStatus(): StatusResponse {
  return {
    at: Date.now(),
    services: [
      service("AMP 平台 API", "https://amp.example.com/api/health", 1, [
        100, 100, 99.98, 100, 99.99, 100, 100,
      ]),
      service("NORMA /health", "https://norma.example.com/health", 0, [
        100, 100, 71.4, 100, 82.2, 100, 96.7,
      ]),
      service("Pulse Monitor", "https://pulse.example.com/health", 1, [
        99.99, 100, 100, 99.95, 100, 100, 100,
      ]),
      service("博客监控任务", "https://blog.example.com/health", 1, [
        null, null, null, null, 100, 99.97, 100,
      ]),
      service("实验中的新服务", "https://lab.example.com/health", null, [
        null, null, null, null, null, null, null,
      ]),
    ],
  };
}
