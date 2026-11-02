import { db } from "../../../../db";
import { NextResponse } from "next/server";
import { answerOptimizerNode } from "../../../../lib/agents/answer-agent";
import { studentTopicProfiles } from "../../../../db/schema";
import { env } from "../../../../lib/env";
import { AcademicEventBus } from "../../../../lib/cic/cross-feature/event-bus";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { studentAnswer, question, subjectId, topic } = body;

    if (!studentAnswer || !question) {
      return NextResponse.json({ error: "studentAnswer and question are required" }, { status: 400 });
    }

    // Run Optimizer
    const result = await answerOptimizerNode(studentAnswer, question);

    // Cross-feature intelligence: trigger answer.evaluated event
    let crossFeatureOpportunities: any[] = [];
    try {
      const ev = await AcademicEventBus.emit({
        userId,
        eventType: 'answer.evaluated',
        data: {
          questionText: question,
          topicId: topic || 'itc701-t1',
          missingKeywords: result.missingConcepts || [],
          score: (result.missingConcepts && result.missingConcepts.length > 2) ? 50 : 80,
        },
      });
      crossFeatureOpportunities = ev.opportunitiesGenerated;
    } catch (e) {
      console.warn("Non-fatal event bus notice in answer optimizer:", e);
    }

    return NextResponse.json({
      ...result,
      crossFeatureOpportunities,
    }, { status: 200 });
  } catch (error) {
    console.error("POST answer optimize error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
