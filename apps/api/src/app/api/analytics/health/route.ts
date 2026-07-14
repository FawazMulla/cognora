import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentModels } from "@/db/schema";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [model] = await db.select().from(studentModels).where(eq(studentModels.userId, userId));
    
    if (!model) {
      return NextResponse.json({ error: "Student model not found" }, { status: 404 });
    }

    return NextResponse.json({
      healthScore: model.academicHealthScore || 0,
      updatedAt: model.updatedAt
    });
  } catch (error) {
    console.error("GET health error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
