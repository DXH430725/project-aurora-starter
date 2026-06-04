"use client";

import * as React from "react";
import type {
  MonitorErrorResponse,
  MonitorMetric,
  MonitorRangeResponse,
  MonitorSnapshotResponse,
  StatusResponse,
} from "@/lib/monitor-types";

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const SOURCE_ERROR = "监控数据源不可达";
const MONITOR_RANGE_MINUTES = 12 * 60;

async function readJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: "no-store" });
  const payload = (await response.json()) as T | MonitorErrorResponse;
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? payload.error
        : SOURCE_ERROR;
    throw new Error(message);
  }
  return payload as T;
}

function usePollingResource<T>(url: string, intervalMs: number): QueryState<T> {
  const [state, setState] = React.useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    let disposed = false;
    let timer: number | null = null;
    let controller: AbortController | null = null;

    const load = async () => {
      if (document.visibilityState === "hidden") return;
      controller?.abort();
      controller = new AbortController();

      try {
        const data = await readJson<T>(url, controller.signal);
        if (disposed) return;
        setState({ data, loading: false, error: null });
      } catch (error) {
        if (disposed || controller.signal.aborted) return;
        setState((prev) => ({
          data: prev.data,
          loading: false,
          error: error instanceof Error ? error.message : SOURCE_ERROR,
        }));
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void load();
    };

    void load();
    timer = window.setInterval(() => void load(), intervalMs);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      controller?.abort();
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, url]);

  return state;
}

export function useMonitorSnapshot() {
  return usePollingResource<MonitorSnapshotResponse>("/api/monitor", 15_000);
}

export function useMonitorRange(metric: MonitorMetric, minutes = MONITOR_RANGE_MINUTES) {
  return usePollingResource<MonitorRangeResponse>(
    `/api/monitor/range?metric=${metric}&minutes=${minutes}`,
    60_000,
  );
}

export function useServiceStatus() {
  return usePollingResource<StatusResponse>("/api/status", 60_000);
}
