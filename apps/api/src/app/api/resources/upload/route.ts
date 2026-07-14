import { NextResponse } from "next/server";
import { uploadInitSchema } from "@/lib/validators/resource";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, and } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = uploadInitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { filename, fileType, sizeBytes, sha256Hash, subjectId } = parsed.data;

    // Check for existing resource by sha256 hash
    const existing = await db.select().from(resources).where(
      and(
        eq(resources.userId, userId),
        eq(resources.subjectId, subjectId),
        eq(resources.sha256Hash, sha256Hash)
      )
    ).limit(1);

    if (existing.length > 0) {
      // Resource already exists, do not upload again
      return NextResponse.json({
        message: "Resource already exists",
        resourceId: existing[0].id,
        presignedUrl: null,
        status: existing[0].status
      }, { status: 200 });
    }

    // Generate path for storage
    const storagePath = `${userId}/${subjectId}/${sha256Hash}_${filename}`;

    // Create a new record with status 'pending' (the client must upload then call confirm)
    const newResource = await db.insert(resources).values({
      userId,
      subjectId,
      filename,
      storageUrl: storagePath,
      fileType,
      sha256Hash,
      sizeBytes,
      status: "pending",
    }).returning();

    // Ensure the bucket exists or is already created in Supabase 'resources' bucket
    // Create signed upload URL valid for 1 hour
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('resources')
      .createSignedUploadUrl(storagePath);

    if (uploadError) {
      console.error("Storage Error:", uploadError);
      return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
    }

    return NextResponse.json({
      resourceId: newResource[0].id,
      presignedUrl: uploadData.signedUrl,
      storagePath,
    }, { status: 200 });

  } catch (error) {
    console.error("Upload Init error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
