import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/health
 * Returns a simple health check response.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
