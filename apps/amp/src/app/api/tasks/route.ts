import { NextResponse } from "next/server";
import { readAmpOverview } from "@/app/lib/amp-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await readAmpOverview());
  } catch (error) {
    return NextResponse.json(
      {
        error: "amp_api_unreachable",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 502 },
    );
  }
}
