import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { answerBank, pyqQuestions } from "../../../../../db/schema";
import { env } from "../../../../../lib/env";
import { eq, and } from "drizzle-orm";
import { aiGateway } from "../../../../../lib/ai-gateway";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pyqId = params.id;
    const pyqs = await db.select().from(pyqQuestions).where(eq(pyqQuestions.id, pyqId)).limit(1);
    const pyq = pyqs[0] as any;
    if (!pyq) return NextResponse.json({ error: "PYQ not found" }, { status: 404 });

    const body = await request.json();
    const format = body.format || "Topper";

    // 1. Check answer bank cache
    const cachedAnswers = await db.select().from(answerBank)
      .where(and(eq(answerBank.pyqQuestionId, pyqId), eq(answerBank.format, format)))
      .limit(1);
    
    const cachedAnswer = cachedAnswers[0] as any;
    if (cachedAnswer) {
      return NextResponse.json({ 
        answer: cachedAnswer.content, 
        cached: true 
      }, { status: 200 });
    }

    // 2. Generate if miss
    const generation = await aiGateway.invoke("answer_gen", { text: pyq.questionText, format });
    
    // 3. Cache result
    await db.insert(answerBank).values({
      pyqQuestionId: pyqId,
      userId,
      format,
      markValue: pyq.markValue,
      content: generation.answer,
    } as any);

    return NextResponse.json({ 
      answer: generation.answer, 
      cached: false 
    }, { status: 200 });
  } catch (error) {
    console.error("POST pyq answer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
