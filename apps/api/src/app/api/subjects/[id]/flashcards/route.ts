import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { flashcards } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, asc, lte } from "drizzle-orm";

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
    
    // Get due flashcards first (dueDate <= today)
    const today = new Date();
    
    // In a real app we'd probably use a more complex sorting
    const cards = await db.select().from(flashcards)
      .where(eq(flashcards.subjectId, subjectId))
      .orderBy(asc(flashcards.dueDate));

    return NextResponse.json({ flashcards: cards }, { status: 200 });
  } catch (error) {
    console.error("GET flashcards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
