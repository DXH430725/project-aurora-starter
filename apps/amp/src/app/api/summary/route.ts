import { NextResponse } from "next/server";
import { readAmpOverview } from "@/app/lib/amp-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const overview = await readAmpOverview();
    const tasksFailed = overview.tasks.filter(({ metrics }) => {
      if (!metrics) return false;
      const lastFailure = metrics.last_failure_at ? Date.parse(metrics.last_failure_at) : 0;
      const lastSuccess = metrics.last_success_at ? Date.parse(metrics.last_success_at) : 0;
      return lastFailure > lastSuccess;
    }).length;
    const failedRuns = overview.tasks.reduce(
      (total, { metrics }) => total + (metrics?.failed_runs ?? 0) + (metrics?.timeout_runs ?? 0),
      0,
    );

    return NextResponse.json({
      tasks_total: overview.tasks.length,
      tasks_failed: tasksFailed,
      failed_runs: failedRuns,
      placeholder: false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        tasks_total: 0,
        tasks_failed: 0,
        failed_runs: 0,
        placeholder: false,
        error: "amp_api_unreachable",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 502 },
    );
  }
}
