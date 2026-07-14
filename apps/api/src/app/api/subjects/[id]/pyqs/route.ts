import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pyqQuestions } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, desc } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subjectId = params.id;
    
    // In real app we check if subject belongs to user
    const questions = await db.select().from(pyqQuestions)
      .where(eq(pyqQuestions.subjectId, subjectId))
      .orderBy(desc(pyqQuestions.repeatCount));

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error("GET pyqs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
