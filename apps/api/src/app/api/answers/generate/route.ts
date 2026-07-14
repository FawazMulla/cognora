import { answerGeneratorNode, qualityVerifierNode } from "@/lib/agents/answer-agent";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentModels, studentTopicProfiles } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

const AnswerGenerateSchema = z.object({
  question: z.string().min(1, "Question is required"),
  markValue: z.number().int().positive(),
  format: z.string(),
  subjectId: z.string().uuid().optional(),
  topic: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    // Zod Validation (FR-039)
    const parseResult = AnswerGenerateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.issues }, { status: 400 });
    }
    
    const { question, markValue, format, subjectId, topic } = parseResult.data;

    // Fetch Student Model snapshot (FR-026)
    let snapshot: any = {};
    const sm = await db.select().from(studentModels).where(eq(studentModels.userId, userId)).limit(1);
    if (sm.length) {
      snapshot.preferredStyle = sm[0].preferredStyle;
      snapshot.learningPace = sm[0].learningPace;
    }

    if (subjectId && topic) {
      const topicProfile = await db.select().from(studentTopicProfiles)
        .where(and(
          eq(studentTopicProfiles.userId, userId),
          eq(studentTopicProfiles.subjectId, subjectId),
          eq(studentTopicProfiles.topic, topic)
        )).limit(1);
      
      if (topicProfile.length) {
        snapshot.confidence = topicProfile[0].confidence;
      }
    }

    // 1. Answer Generator
    let generated = await answerGeneratorNode({ 
      question, 
      markValue, 
      format, 
      studentModelSnapshot: snapshot 
    });

    // 2. Quality Verifier
    let verifyResult = await qualityVerifierNode(generated.answer, generated.targetMaxWords, format);

    if (!verifyResult.passed) {
      console.warn("Answer failed quality check:", verifyResult.reason);
      // Auto-regenerate attempt (1 retry)
      generated = await answerGeneratorNode({ 
        question, 
        markValue, 
        format, 
        studentModelSnapshot: snapshot 
      });
      verifyResult = await qualityVerifierNode(generated.answer, generated.targetMaxWords, format);
    }

    return NextResponse.json({
      answer: generated.answer,
      wordCount: generated.wordCount || generated.answer.split(/\s+/).length,
      qualityWarning: !verifyResult.passed ? verifyResult.reason : null
    }, { status: 200 });

  } catch (error) {
    console.error("POST answer generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
