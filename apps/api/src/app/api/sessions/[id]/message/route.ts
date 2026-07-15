import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studySessions } from "../../../../../db/schema";
import { env } from "../../../../../lib/env";
import { eq } from "drizzle-orm";
import { runRagPipeline } from "../../../../../lib/agents/rag-agent";

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
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // Verify session
    const sessions = await db.select().from(studySessions).where(eq(studySessions.id, sessionId)).limit(1);
    const session = sessions[0] as any;
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Note: Streaming response would normally use Next.js Response streams or ai sdk
    // For this MVP, we wait for the answer and return it.
    
    const ragResult = await runRagPipeline({
      userId,
      subjectId: session.subjectId!,
      query,
      goalMode: session.goalMode
    });

    // Increment questions_asked
    await db.update(studySessions)
      .set({ questionsAsked: (session.questionsAsked || 0) + 1 })
      .where(eq(studySessions.id, sessionId));

    return NextResponse.json({ 
      answer: ragResult.answer, 
      citations: ragResult.citations 
    }, { status: 200 });
  } catch (error) {
    console.error("POST session message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
