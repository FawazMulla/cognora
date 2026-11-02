import { NextResponse } from "next/server";

export const runtime = "nodejs";

const processStartTime = Date.now();

/**
 * GET /api/health
 * Returns comprehensive system health, uptime, and memory metrics for reliability monitoring.
 */
export function GET() {
  const mem = process.memoryUsage();

  return NextResponse.json(
    {
      status: "ok",
      uptimeSeconds: Math.floor((Date.now() - processStartTime) / 1000),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      },
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
    { status: 200 },
  );
}
