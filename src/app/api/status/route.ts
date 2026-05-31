import { NextResponse } from "next/server";
import { mockStatus } from "@/lib/monitor-mock";
import { fetchStatusFromPrometheus, monitorErrorResponse } from "@/lib/prometheus";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.MONITOR_MOCK === "1") {
    return NextResponse.json(mockStatus());
  }

  try {
    return NextResponse.json({
      at: Date.now(),
      services: await fetchStatusFromPrometheus(),
    });
  } catch {
    return monitorErrorResponse();
  }
}
