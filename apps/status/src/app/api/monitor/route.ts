import { NextResponse } from "next/server";
import { mockMonitorSnapshot } from "@/lib/monitor-mock";
import { fetchMonitorSnapshotFromPrometheus, monitorErrorResponse } from "@/lib/prometheus";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.MONITOR_MOCK === "1") {
    return NextResponse.json(mockMonitorSnapshot());
  }

  try {
    return NextResponse.json({
      at: Date.now(),
      nodes: await fetchMonitorSnapshotFromPrometheus(),
    });
  } catch {
    return monitorErrorResponse();
  }
}
