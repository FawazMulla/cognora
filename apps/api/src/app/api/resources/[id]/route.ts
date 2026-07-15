import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources } from "../../../../db/schema";
import { env } from "../../../../lib/env";
import { eq, and } from "drizzle-orm";
import { supabaseAdmin } from "../../../../lib/supabase";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resourceList = await db.select().from(resources).where(
      and(
        eq(resources.id, params.id),
        eq(resources.userId, userId)
      )
    ).limit(1);

    if (resourceList.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({ resource: resourceList[0] }, { status: 200 });

  } catch (error) {
    console.error("Resource GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the resource first to get the storage_url
    const resourceList = await db.select().from(resources).where(
      and(
        eq(resources.id, params.id),
        eq(resources.userId, userId)
      )
    ).limit(1);

    if (resourceList.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const resource = resourceList[0] as any;

    // Delete from Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('resources')
      .remove([resource.storageUrl]);

    if (storageError) {
      console.error("Failed to delete from storage:", storageError);
      // We might want to continue and delete from DB anyway, or return error. Let's proceed.
    }

    // Delete from Database. 
    // Thanks to ON DELETE CASCADE on the foreign keys in the schema, 
    // chunks, embeddings, flashcards, etc. will be automatically deleted.
    await db.delete(resources).where(
      and(
        eq(resources.id, params.id),
        eq(resources.userId, userId)
      )
    );

    return NextResponse.json({ message: "Resource deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Resource DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
