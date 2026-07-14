import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, and } from "drizzle-orm";
import Redis from "ioredis";

const client = postgres(env.DATABASE_URL, { max: 5 });
const db = drizzle(client);

// Helper to create a new Redis instance for subscription
function createSubscriber() {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resourceId = params.id;

    // Verify ownership
    const resourceList = await db.select().from(resources).where(
      and(
        eq(resources.id, resourceId),
        eq(resources.userId, userId)
      )
    ).limit(1);

    if (resourceList.length === 0) {
      return NextResponse.json({ error: "Resource not found or access denied" }, { status: 404 });
    }

    const currentResource = resourceList[0];
    const channelName = `resource:${resourceId}:status`;

    const encoder = new TextEncoder();
    const subscriber = createSubscriber();

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial status immediately
        const initialData = JSON.stringify({ status: currentResource.status });
        controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

        // Connect and subscribe to Redis channel for updates
        try {
          await subscriber.connect();
        } catch (e) {
          // If connect fails, we just won't get live updates, but they get the initial one
          console.error("Redis sub connect error:", e);
        }

        await subscriber.subscribe(channelName);

        subscriber.on("message", (channel, message) => {
          if (channel === channelName) {
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          }
        });

        // Close stream when client disconnects
        request.signal.addEventListener("abort", () => {
          subscriber.quit();
          controller.close();
        });
      },
      cancel() {
        subscriber.quit();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Status stream error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
