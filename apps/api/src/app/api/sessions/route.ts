import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studySessions } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

const SessionCreateSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  goalMode: z.string().min(1)
});

const SessionUpdateSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  durationSecs: z.number().int().nonnegative().optional(),
  topicsCovered: z.array(z.string()).optional(),
  questionsAsked: z.number().int().nonnegative().optional(),
  weakConcepts: z.array(z.string()).optional(),
  quizScore: z.number().min(0).max(100).optional()
});

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    let query = db.select().from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(studySessions.createdAt));
    
    // Type mismatch workaround since Drizzle can't dynamically chain easily without typed helpers here
    const sessions = await query;
    const filtered = subjectId ? sessions.filter(s => s.subjectId === subjectId) : sessions;

    return NextResponse.json({ sessions: filtered }, { status: 200 });
  } catch (error) {
    console.error("GET sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    const parseResult = SessionCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.issues }, { status: 400 });
    }

    const { subjectId, goalMode } = parseResult.data;

    if (!subjectId || !goalMode) {
      return NextResponse.json({ error: "subjectId and goalMode required" }, { status: 400 });
    }

    const inserted = await db.insert(studySessions).values({
      userId,
      subjectId,
      goalMode,
      startedAt: new Date(),
    }).returning();

    return NextResponse.json({ session: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("POST sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
