import { db, client } from "../../../../db";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { homeworkStyleProfiles } from "../../../../db/schema";
import { env } from "../../../../lib/env";
import { eq, and } from "drizzle-orm";
import { homeworkGeneratorNode } from "../../../../lib/agents/homework-agent";
import { z } from "zod";


const HomeworkGenerateSchema = z.object({
  question: z.string().min(1, "Question is required"),
  instructions: z.string().optional(),
  wordLimit: z.number().int().positive().optional(),
  subjectId: z.string().uuid("Invalid subject ID")
});

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    const parseResult = HomeworkGenerateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.issues }, { status: 400 });
    }

    const { question, instructions, wordLimit, subjectId } = parseResult.data;

    // 1. Fetch style profile if any
    let styleProfile: any = undefined;
    const profiles = await db.select().from(homeworkStyleProfiles)
      .where(and(
        eq(homeworkStyleProfiles.userId, userId),
        eq(homeworkStyleProfiles.subjectId, subjectId)
      )).limit(1);

    if (profiles.length) {
      styleProfile = profiles[0];
    }

    // 2. Generate homework via OCI Cohere Command A (or fallback)
    const limit = wordLimit || 1200;
    
    // Check if OCI is available
    const { getOciInferenceClient, callOciCohereChat } = await import("../../../../lib/oci-client");
    if (getOciInferenceClient()) {
      const cleanPrompt = question.trim();
      const ociPrompt = `You are a distinguished university professor and academic researcher preparing a comprehensive, multi-page university assignment report.

ASSIGNMENT TOPIC / QUESTION (Keep this EXACT title verbatim): "${cleanPrompt}"
ADDITIONAL INSTRUCTIONS: "${instructions || 'Comprehensive university-level academic assignment with clear sections'}"
TARGET WORD COUNT: At least ${limit} words across multiple comprehensive sections.
STYLE INSTRUCTION: ${styleProfile ? `Mimic style: Formality: ${styleProfile.formalityLevel}, Avg sentence length: ${styleProfile.avgSentenceLength}.` : 'Rigorous undergraduate/postgraduate university standard.'}

STRUCTURE THE ASSIGNMENT WITH THESE COMPLETE, IN-DEPTH PAGES / SECTIONS:
# Assignment: ${cleanPrompt}

## 1. Executive Summary & Abstract
(A detailed 150-200 word academic abstract explaining scope, theoretical basis, and outcomes)

## 2. Theoretical Foundations & Mathematical Formulations
(Deep theoretical background, formal definitions, equations, axioms, and operational mechanics - minimum 350 words)

## 3. Comparative Architecture & Taxonomy
(Detailed analysis comparing different approaches, mechanisms, trade-offs, time/space complexity)

## 4. Implementation Details & Algorithmic Workflow
(Step-by-step procedures, pseudocode or concrete implementation snippets, data flow)

## 5. Case Study & Real-World Industry Application
(Real-world enterprise or practical deployment scenario, analysis of performance metrics)

## 6. Critical Analysis, Limitations & Future Scope
(Limitations, edge cases, open problems, and emerging trends)

## 7. Conclusion & Key Takeaways
(Summary of findings and final academic synthesis)

## 8. Viva Voce & Discussion Questions
(Provide 4 key technical questions with thorough answers)

Write the assignment in full detail, avoiding placeholders or superficial summaries. Output clean, publication-ready markdown.`;

      const responseText = await callOciCohereChat({
        message: ociPrompt,
        systemPrompt: "You are an elite academic professor who writes thorough, extensive, publication-grade university assignments in clean markdown.",
        maxTokens: 3500,
        temperature: 0.5
      });

      const words = responseText.trim().split(/\s+/).length;
      return NextResponse.json({
        answer: responseText,
        wordCount: words,
        readabilityScore: 72,
        handwritingFriendlyVersion: responseText.split('. ').join('.\n\n')
      }, { status: 200 });
    }

    const result = await homeworkGeneratorNode(
      question,
      instructions || "",
      limit,
      styleProfile
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST homework generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
