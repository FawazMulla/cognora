import { NextResponse } from "next/server";
import { answerGeneratorNode, qualityVerifierNode } from "../../../../lib/agents/answer-agent";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentModels, studentTopicProfiles } from "../../../../db/schema";
import { env } from "../../../../lib/env";
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
    if (sm.length && sm[0]) {
      snapshot.preferredStyle = (sm[0] as any).preferredStyle;
      snapshot.learningPace = (sm[0] as any).learningPace;
    }

    if (subjectId && topic) {
      const topicProfile = await db.select().from(studentTopicProfiles)
        .where(and(
          eq(studentTopicProfiles.userId, userId),
          eq(studentTopicProfiles.subjectId, subjectId),
          eq(studentTopicProfiles.topic, topic)
        )).limit(1);
      
      if (topicProfile.length && topicProfile[0]) {
        snapshot.confidence = (topicProfile[0] as any).confidence;
      }
    }

    // 1. Direct OCI Cohere Command A Call for Exam Answer Generation
    const { getOciInferenceClient, callOciCohereChat } = await import("../../../../lib/oci-client");
    if (getOciInferenceClient()) {
      let maxWords = 80;
      if (markValue >= 15) maxWords = 900;
      else if (markValue >= 10) maxWords = 600;
      else if (markValue >= 5) maxWords = 300;

      const ociPrompt = `You are a university exam topper and subject matter expert.
Provide a complete, full-marks model answer formatted exactly for a university exam.

EXAMINATION QUESTION: "${question}"
TARGET MARKS: ${markValue} Marks (Calibrate depth, detail, and technical rigor to justify ${markValue} full marks)
TARGET WORD COUNT: ~${maxWords} words.
PRESENTATION FORMAT: ${format}

REQUIRED TOPPER STRUCTURE:
1. Core Definition & Technical Overview (Crisp, high-impact introductory statement)
2. Mathematical Formula / Theoretical Foundation / Complexity Invariants (where applicable)
3. ASCII Architecture Diagram / Conceptual Flow (Clear, readable ASCII box-and-arrow visualization)
4. Comprehensive Point-by-Point Technical Breakdown (With bold keywords and clear numbered points)
5. Practical Real-World Example / Code Snippet or Concrete Trace
6. Critical Comparison Table or Summary Takeaways (if comparing approaches)

Strictly avoid generic filler. Write the full university answer in publication-ready markdown.`;

      const responseText = await callOciCohereChat({
        message: ociPrompt,
        systemPrompt: "You are a university topper exam answer writer who produces exhaustive, technically rigorous answers with ASCII diagrams and formulas.",
        maxTokens: 3000,
        temperature: 0.5
      });

      const words = responseText.trim().split(/\s+/).length;
      return NextResponse.json({
        answer: responseText,
        wordCount: words,
        qualityWarning: null
      }, { status: 200 });
    }

    // Fallback: Answer Generator node
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
      answer: generated.answer || 'Answer generation failed. Please try again.',
      wordCount: generated.wordCount || (generated.answer || '').split(/\s+/).length,
      qualityWarning: !verifyResult.passed ? verifyResult.reason : null
    }, { status: 200 });

  } catch (error) {
    console.error("POST answer generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
