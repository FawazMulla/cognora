import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources } from "@/db/schema";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";
import { verifyOwnership } from "@/lib/security";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resourceId = params.id;

    // 1. Enforce Data Isolation (FR-038)
    const isOwner = await verifyOwnership(userId, resourceId, "resources");
    if (!isOwner) {
      console.warn(`[SECURITY] User ${userId} attempted unauthorized access to resource ${resourceId}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resRecord = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
    if (!resRecord.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Generate Presigned URL
    // In a real S3 / Supabase setup, we call the SDK here. We mock it for now.
    const storageUrl = resRecord[0].storageUrl;
    const presignedUrl = `${storageUrl}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600&mockSignature=xyz123`;

    return NextResponse.json({ downloadUrl: presignedUrl }, { status: 200 });
  } catch (error) {
    console.error("GET resource download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
