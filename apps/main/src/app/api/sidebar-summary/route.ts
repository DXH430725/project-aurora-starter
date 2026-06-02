import { NextResponse } from "next/server";

interface StatusSummary {
  nodes_total?: number;
  nodes_up?: number;
  alerts?: number;
}

interface AmpSummary {
  tasks_total?: number;
  tasks_failed?: number;
  placeholder?: boolean;
}

async function readJson<T>(baseUrl: string): Promise<T> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/summary`, {
    cache: "no-store",
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error("summary_unreachable");
  return (await response.json()) as T;
}

export async function GET() {
  const statusUrl = process.env.INTERNAL_STATUS_URL || "https://status.430123.xyz";
  const ampUrl = process.env.INTERNAL_AMP_URL || "https://amp.430123.xyz";

  const [status, amp] = await Promise.allSettled([
    readJson<StatusSummary>(statusUrl),
    readJson<AmpSummary>(ampUrl),
  ]);

  return NextResponse.json({
    status: {
      state: status.status === "fulfilled" ? "ok" : "unreachable",
      badge:
        status.status === "fulfilled"
          ? `${status.value.nodes_up ?? 0}/${status.value.nodes_total ?? 0}`
          : "offline",
    },
    amp: {
      state: amp.status === "fulfilled" ? "ok" : "unreachable",
      badge: amp.status === "fulfilled" ? `${amp.value.tasks_failed ?? 0}x` : "offline",
    },
  });
}
