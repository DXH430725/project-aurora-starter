import { NextResponse } from "next/server";
import { mockMonitorSnapshot } from "@/lib/monitor-mock";

export async function GET() {
  const snapshot = mockMonitorSnapshot();
  const nodesTotal = snapshot.nodes.length;
  const nodesUp = snapshot.nodes.filter((node) => node.up === 1).length;

  return NextResponse.json({
    nodes_total: nodesTotal,
    nodes_up: nodesUp,
    alerts: nodesTotal - nodesUp,
  });
}
