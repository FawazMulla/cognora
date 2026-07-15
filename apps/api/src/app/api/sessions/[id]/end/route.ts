import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studySessions } from "../../../../../db/schema";
import { env } from "../../../../../lib/env";
import { eq } from "drizzle-orm";
import { analyticsQueue } from "../../../../../lib/queues";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessionId = params.id;

    // Verify session
    const sessions = await db.select().from(studySessions).where(eq(studySessions.id, sessionId)).limit(1);
    const session = sessions[0] as any;
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const endedAt = new Date();
    const durationSecs = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

    // End session
    await db.update(studySessions)
      .set({ 
        endedAt,
        durationSecs
      })
      .where(eq(studySessions.id, sessionId));

    // Enqueue analytics job to update student_topic_profiles (Task 9.4)
    await analyticsQueue.add("session-end", {
      sessionId,
      userId,
      subjectId: session.subjectId
    });

    return NextResponse.json({ message: "Session ended" }, { status: 200 });
  } catch (error) {
    console.error("POST session end error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
