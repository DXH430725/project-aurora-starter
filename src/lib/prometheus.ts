import type {
  MonitorMetric,
  MonitorNodeSnapshot,
  MonitorRangeResponse,
  ServiceStatusDay,
  ServiceStatusItem,
} from "@/lib/monitor-types";

const MONITOR_ERROR = "监控数据源不可达";
const STATUS_OK_THRESHOLD = 0.95;
const PROMETHEUS_TIMEOUT_MS = 5_000;

export const MONITOR_QUERIES = {
  cpu: '100 - (avg by (instance, region) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
  mem: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
  disk:
    '(1 - (node_filesystem_avail_bytes{mountpoint="/",fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{mountpoint="/",fstype!~"tmpfs|overlay"})) * 100',
  netRx: 'rate(node_network_receive_bytes_total{device!~"lo|docker.*|veth.*"}[5m])',
  netTx: 'rate(node_network_transmit_bytes_total{device!~"lo|docker.*|veth.*"}[5m])',
  up: 'up{job="node"}',
} satisfies Record<MonitorMetric | "up", string>;

const STATUS_CURRENT_QUERY = 'probe_success{job="blackbox"}';
const STATUS_RANGE_QUERY = 'avg_over_time(probe_success{job="blackbox"}[1d])';

interface PrometheusVectorResult {
  metric: Record<string, string>;
  value?: [number, string];
}

interface PrometheusMatrixResult {
  metric: Record<string, string>;
  values?: Array<[number, string]>;
}

interface PrometheusEnvelope<T> {
  status: "success" | "error";
  data?: {
    resultType: "vector" | "matrix";
    result: T[];
  };
  error?: string;
}

function prometheusBaseUrl(): string {
  const base = process.env.PROMETHEUS_URL;
  if (!base) throw new Error(MONITOR_ERROR);
  return base.replace(/\/$/, "");
}

async function prometheusGet<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${prometheusBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROMETHEUS_TIMEOUT_MS),
    });
  } catch {
    throw new Error(MONITOR_ERROR);
  }

  if (!response.ok) throw new Error(MONITOR_ERROR);

  const payload = (await response.json()) as PrometheusEnvelope<T>;
  if (payload.status !== "success" || !payload.data) {
    throw new Error(payload.error || MONITOR_ERROR);
  }

  return payload.data.result;
}

function firstFiniteValue(result: PrometheusVectorResult): number | null {
  const raw = result.value?.[1];
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function nodeKey(metric: Record<string, string>): string {
  return `${metric.instance ?? "unknown"}|${metric.region ?? "unknown"}`;
}

function targetKey(metric: Record<string, string>): string {
  return metric.target || metric.instance || metric.__param_target || "unknown";
}

function serviceName(metric: Record<string, string>): string {
  return metric.name || metric.service || metric.job || targetKey(metric);
}

function serviceTarget(metric: Record<string, string>): string {
  return metric.target || metric.__param_target || metric.instance || "unknown";
}

export async function fetchMonitorSnapshotFromPrometheus(): Promise<MonitorNodeSnapshot[]> {
  const [up, cpu, mem, disk, netRx, netTx] = await Promise.all([
    prometheusGet<PrometheusVectorResult>("/api/v1/query", { query: MONITOR_QUERIES.up }),
    prometheusGet<PrometheusVectorResult>("/api/v1/query", { query: MONITOR_QUERIES.cpu }),
    prometheusGet<PrometheusVectorResult>("/api/v1/query", { query: MONITOR_QUERIES.mem }),
    prometheusGet<PrometheusVectorResult>("/api/v1/query", { query: MONITOR_QUERIES.disk }),
    prometheusGet<PrometheusVectorResult>("/api/v1/query", { query: MONITOR_QUERIES.netRx }),
    prometheusGet<PrometheusVectorResult>("/api/v1/query", { query: MONITOR_QUERIES.netTx }),
  ]);

  const nodes = new Map<string, MonitorNodeSnapshot>();

  function ensure(result: PrometheusVectorResult): MonitorNodeSnapshot {
    const key = nodeKey(result.metric);
    const existing = nodes.get(key);
    if (existing) return existing;
    const next: MonitorNodeSnapshot = {
      instance: result.metric.instance ?? "unknown",
      region: result.metric.region ?? "unknown",
      up: 0,
      cpu: null,
      mem: null,
      disk: null,
      netRxBps: null,
      netTxBps: null,
    };
    nodes.set(key, next);
    return next;
  }

  for (const result of up) {
    ensure(result).up = firstFiniteValue(result) === 1 ? 1 : 0;
  }

  for (const [field, results] of [
    ["cpu", cpu],
    ["mem", mem],
    ["disk", disk],
    ["netRxBps", netRx],
    ["netTxBps", netTx],
  ] as const) {
    for (const result of results) {
      ensure(result)[field] = firstFiniteValue(result);
    }
  }

  return Array.from(nodes.values()).sort((a, b) => a.instance.localeCompare(b.instance));
}

export async function fetchMonitorRangeFromPrometheus(
  metric: MonitorMetric,
  minutes: number,
): Promise<MonitorRangeResponse> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - minutes * 60;
  const stepSec = minutes <= 60 ? 30 : 60;
  const result = await prometheusGet<PrometheusMatrixResult>("/api/v1/query_range", {
    query: MONITOR_QUERIES[metric],
    start: String(start),
    end: String(end),
    step: `${stepSec}s`,
  });

  return {
    metric,
    start,
    end,
    stepSec,
    series: result.map((item) => ({
      instance: item.metric.instance ?? "unknown",
      region: item.metric.region ?? "unknown",
      points: (item.values ?? [])
        .map(([epochSec, raw]) => [epochSec, Number(raw)] as [number, number])
        .filter(([, value]) => Number.isFinite(value)),
    })),
  };
}

function dateKey(epochSec: number): string {
  return new Date(epochSec * 1000).toISOString().slice(0, 10);
}

function sevenDays(): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}

function availabilityState(value: number | null): ServiceStatusDay["state"] {
  if (value == null || Number.isNaN(value)) return "nodata";
  return value >= STATUS_OK_THRESHOLD ? "ok" : "down";
}

function uptimeFromDays(days: ServiceStatusDay[]): number | null {
  const sampled = days.filter((day) => day.state !== "nodata");
  if (!sampled.length) return null;
  const ok = sampled.filter((day) => day.state === "ok").length;
  return Number(((ok / sampled.length) * 100).toFixed(2));
}

export async function fetchStatusFromPrometheus(): Promise<ServiceStatusItem[]> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 6 * 24 * 60 * 60;
  const [current, range] = await Promise.all([
    prometheusGet<PrometheusVectorResult>("/api/v1/query", { query: STATUS_CURRENT_QUERY }),
    prometheusGet<PrometheusMatrixResult>("/api/v1/query_range", {
      query: STATUS_RANGE_QUERY,
      start: String(start),
      end: String(end),
      step: "1d",
    }),
  ]);

  const services = new Map<string, ServiceStatusItem>();
  const days = sevenDays();

  function ensure(metric: Record<string, string>): ServiceStatusItem {
    const key = targetKey(metric);
    const existing = services.get(key);
    if (existing) return existing;
    const next: ServiceStatusItem = {
      name: serviceName(metric),
      target: serviceTarget(metric),
      currentUp: null,
      days: days.map((date) => ({ date, state: "nodata", availability: null })),
      uptime7d: null,
    };
    services.set(key, next);
    return next;
  }

  for (const result of current) {
    const service = ensure(result.metric);
    const value = firstFiniteValue(result);
    service.currentUp = value == null ? null : value >= 1 ? 1 : 0;
  }

  for (const result of range) {
    const service = ensure(result.metric);
    const byDate = new Map(
      (result.values ?? []).map(([epochSec, raw]) => {
        const value = Number(raw);
        return [dateKey(epochSec), Number.isFinite(value) ? value : null] as const;
      }),
    );

    service.days = days.map((date) => {
      const value = byDate.get(date);
      const availability = value == null ? null : Number((value * 100).toFixed(2));
      return {
        date,
        state: availabilityState(value ?? null),
        availability,
      };
    });
    service.uptime7d = uptimeFromDays(service.days);
  }

  return Array.from(services.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function monitorErrorResponse() {
  return Response.json({ error: MONITOR_ERROR }, { status: 502 });
}
