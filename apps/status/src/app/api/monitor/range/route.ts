import { NextRequest, NextResponse } from "next/server";
import type { MonitorMetric } from "@/lib/monitor-types";
import { mockMonitorRange } from "@/lib/monitor-mock";
import { fetchMonitorRangeFromPrometheus, monitorErrorResponse } from "@/lib/prometheus";

export const runtime = "nodejs";

const METRICS: MonitorMetric[] = ["cpu", "mem", "disk", "netRx", "netTx"];

function parseMetric(value: string | null): MonitorMetric | null {
  if (!value) return null;
  return METRICS.includes(value as MonitorMetric) ? (value as MonitorMetric) : null;
}

function parseMinutes(value: string | null): number {
  const minutes = Number(value ?? 60);
  if (!Number.isFinite(minutes)) return 60;
  return Math.max(15, Math.min(24 * 60, Math.round(minutes)));
}

export async function GET(req: NextRequest) {
  const metric = parseMetric(req.nextUrl.searchParams.get("metric"));
  if (!metric) {
    return NextResponse.json({ error: "invalid_metric" }, { status: 400 });
  }

  const minutes = parseMinutes(req.nextUrl.searchParams.get("minutes"));

  if (process.env.MONITOR_MOCK === "1") {
    return NextResponse.json(mockMonitorRange(metric, minutes));
  }

  try {
    return NextResponse.json(await fetchMonitorRangeFromPrometheus(metric, minutes));
  } catch {
    return monitorErrorResponse();
  }
}
