import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentModels } from "../../../../db/schema";
import { env } from "../../../../lib/env";
import { eq } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [model] = await db.select().from(studentModels).where(eq(studentModels.userId, userId));
    const healthScore = (model as any)?.academicHealthScore ?? 50;

    return NextResponse.json({ healthScore, updatedAt: (model as any)?.updatedAt || new Date().toISOString() });
  } catch (error) {
    console.error("GET analytics health error:", error);
    // Return default score on error so new users aren't blocked
    return NextResponse.json({ healthScore: 50, updatedAt: new Date().toISOString() });
  }
}
