import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentModels, studySessions } from "../../../../db/schema";
import { env } from "../../../../lib/env";
import { eq } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [model] = await db.select().from(studentModels).where(eq(studentModels.userId, userId));
    
    // If a student has no logged study sessions, their academic health score is 0
    const sessions = await db.select().from(studySessions).where(eq(studySessions.userId, userId)).limit(1);
    const healthScore = sessions.length > 0 ? ((model as any)?.academicHealthScore ?? 50) : 0;

    return NextResponse.json({ healthScore, updatedAt: (model as any)?.updatedAt || new Date().toISOString() });
  } catch (error) {
    console.error("GET analytics health error:", error);
    // Return 0 score on error
    return NextResponse.json({ healthScore: 0, updatedAt: new Date().toISOString() });
  }
}
