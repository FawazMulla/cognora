import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { modelRouting } from "@/db/schema";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

// For admin routes, we should verify an admin role, but for now we'll assume authorized.
export async function GET(request: Request) {
  try {
    const routes = await db.select().from(modelRouting);
    return NextResponse.json({ routes }, { status: 200 });
  } catch (error) {
    console.error("GET model-routing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { taskType, provider, modelName, fallbackProvider, fallbackModel } = body;

    if (!taskType) {
      return NextResponse.json({ error: "taskType is required" }, { status: 400 });
    }

    // Upsert routing config
    const updated = await db.insert(modelRouting)
      .values({
        taskType,
        provider,
        modelName,
        fallbackProvider,
        fallbackModel,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: modelRouting.taskType,
        set: {
          provider,
          modelName,
          fallbackProvider,
          fallbackModel,
          updatedAt: new Date(),
        }
      })
      .returning();

    // Invalidate Redis cache
    await redis.del(`routing:${taskType}`);

    return NextResponse.json({ message: "Routing updated", route: updated[0] }, { status: 200 });
  } catch (error) {
    console.error("PATCH model-routing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
