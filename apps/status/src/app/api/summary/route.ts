import { NextResponse } from "next/server";
import { mockMonitorSnapshot } from "@/lib/monitor-mock";
import { fetchMonitorSnapshotFromPrometheus } from "@/lib/prometheus";

export async function GET() {
  const nodes =
    process.env.MONITOR_MOCK === "1"
      ? mockMonitorSnapshot().nodes
      : await fetchMonitorSnapshotFromPrometheus();
  const nodesTotal = nodes.length;
  const nodesUp = nodes.filter((node) => node.up === 1).length;

  return NextResponse.json({
    nodes_total: nodesTotal,
    nodes_up: nodesUp,
    alerts: nodesTotal - nodesUp,
  });
}
