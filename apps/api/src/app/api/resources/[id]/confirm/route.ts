import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources } from "../../../../../db/schema";
import { env } from "../../../../../lib/env";
import { eq, and } from "drizzle-orm";
import { documentPipelineQueue } from "../../../../../lib/queues";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    const resource = resourceList[0] as any;

    // Check if it's already past pending
    if (resource.status !== "pending") {
      return NextResponse.json({ message: "Upload already confirmed", status: resource.status }, { status: 200 });
    }

    // Update status to pending (already pending, but we could set to 'classifying' or leave 'pending' for now)
    // design 4.1 says: "update resource status to `pending`, enqueue `classify-document` job"
    // Wait, it is already 'pending', but to trigger the SSE pipeline, let's keep it 'pending'. The job will update it.
    
    // Enqueue classify-document job
    await documentPipelineQueue.add("classify-document", {
      resourceId: resource.id,
      userId: resource.userId,
    });

    return NextResponse.json({ message: "Upload confirmed, processing started" }, { status: 200 });

  } catch (error) {
    console.error("Upload confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
