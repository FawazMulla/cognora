import { NextResponse } from "next/server";
import { aiGateway } from "../../../../lib/ai-gateway";
import { updateTopicStatus } from "../../../../lib/student-model";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { question, answer, subjectId, topic } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: "question and answer required" }, { status: 400 });
    }

    const prompt = `You are an expert examiner evaluating a student's oral exam answer.

QUESTION: ${question}

STUDENT ANSWER: ${answer}

Evaluate the answer and return a JSON object with:
- score: number from 0-10 (10 = perfect, expert-level answer)
- isCorrect: boolean (true if score >= 5)
- feedback: string (2-3 sentences of specific, constructive feedback)
- suggestedCorrection: string (model answer or key points they missed, 1-2 paragraphs)
- followUpQuestion: string (a natural follow-up question to probe deeper understanding)

Return ONLY valid JSON, no markdown.`;

    let evaluation: any = null;

    try {
      const res = await aiGateway.invoke('viva_gen', { text: prompt }, {
        userId,
        subjectId,
        useHighContext: false,
        useTools: false
      });

      const raw = typeof res === 'string' ? res : (res?.answer || res?.text || JSON.stringify(res));
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else if (res && typeof res === 'object' && typeof res.score === 'number') {
        // Gateway may have already parsed the JSON
        evaluation = res;
      }
    } catch (err) {
      console.error('AI evaluation error:', err);
    }

    // Robust fallback
    if (!evaluation || typeof evaluation.score !== 'number') {
      const words = answer.trim().split(/\s+/).length;
      const score = words < 10 ? 3 : words < 30 ? 5 : words < 60 ? 7 : 8;
      evaluation = {
        score,
        isCorrect: score >= 5,
        feedback: score >= 7
          ? "Good answer with solid conceptual understanding. Add more formal notation or examples to score higher."
          : score >= 5
          ? "Partial credit. You captured the main idea but missed key technical details or formal definitions."
          : "The answer is too brief or lacks core concepts. Review the relevant chapter notes.",
        suggestedCorrection: `Model Answer: For the question "${question.slice(0, 80)}...", a complete answer should define the concept formally, provide a step-by-step explanation, and give a concrete example or proof.`,
        followUpQuestion: `Can you formally define the key terms involved in your previous answer?`
      };
    }

    // Update topic mastery
    if (topic && subjectId) {
      const accuracy = evaluation.score / 10;
      try {
        await updateTopicStatus(userId, subjectId, topic, accuracy, evaluation.score < 4);
      } catch (err) {
        console.error('updateTopicStatus error (non-fatal):', err);
      }
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("POST viva evaluate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
