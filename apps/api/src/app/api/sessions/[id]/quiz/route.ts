import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studySessions, studentTopicProfiles } from "../../../../../db/schema";
import { env } from "../../../../../lib/env";
import { eq, and } from "drizzle-orm";
import { aiGateway } from "../../../../../lib/ai-gateway";
import { updateTopicStatus } from "../../../../../lib/student-model";

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
    const { action, topic, answer, correctAnswer, isCorrect } = body;

    // Load session to get subjectId
    const [session] = await db.select().from(studySessions).where(
      and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId))
    );

    const subjectId = session?.subjectId || undefined;

    if (action === 'get_question') {
      // Generate a quiz question via AI
      const questionTopic = topic || 'Core syllabus concept';

      let quizQuestion = {
        question: '',
        options: [] as string[],
        correctAnswer: 0,
        explanation: '',
        syllabusUnit: 'Unit 1'
      };

      try {
        const res = await aiGateway.invoke('quiz_gen', {
          text: `Generate a 4-option multiple choice question about: ${questionTopic}. Return JSON: { question, options: [4 strings], correctAnswer: 0-3 index, explanation, syllabusUnit }`,
          topic: questionTopic,
          subjectId
        }, {
          userId,
          subjectId,
          useHighContext: true,
          useTools: false
        });

        // Parse the AI response
        const raw = typeof res === 'string' ? res : (res?.answer || res?.text || JSON.stringify(res));
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          quizQuestion = {
            question: parsed.question || `Explain the key concept of ${questionTopic}`,
            options: parsed.options || [
              `${questionTopic} involves all of the above`,
              `${questionTopic} is undefined`,
              `None of the above`,
              `Both A and B`
            ],
            correctAnswer: typeof parsed.correctAnswer === 'number' ? parsed.correctAnswer : 0,
            explanation: parsed.explanation || `This concept is a core part of the syllabus on ${questionTopic}.`,
            syllabusUnit: parsed.syllabusUnit || 'Unit 1'
          };
        } else {
          // res might already be a parsed object from the gateway
          if (res?.question) {
            quizQuestion = {
              question: res.question,
              options: res.options || [],
              correctAnswer: typeof res.correctAnswer === 'number' ? res.correctAnswer : 0,
              explanation: res.explanation || '',
              syllabusUnit: res.syllabusUnit || 'Unit 1'
            };
          }
        }
      } catch (err) {
        console.error('AI quiz gen error, using fallback:', err);
      }

      // Use fallback if question is still empty
      if (!quizQuestion.question) {
        const fallbackQuestions: typeof quizQuestion[] = [
          {
            question: 'What is the time complexity of A* search in the worst case?',
            options: ['O(n)', 'O(n log n)', 'O(b^d)', 'O(n^2)'],
            correctAnswer: 2,
            explanation: 'A* has O(b^d) worst case complexity where b is branching factor and d is depth.',
            syllabusUnit: 'Unit 1: Search'
          },
          {
            question: 'Which of the following is NOT an ACID property?',
            options: ['Atomicity', 'Consistency', 'Availability', 'Durability'],
            correctAnswer: 2,
            explanation: 'ACID stands for Atomicity, Consistency, Isolation, Durability. Availability is from CAP theorem.',
            syllabusUnit: 'Unit 3: Databases'
          },
          {
            question: 'What does the softmax function output?',
            options: ['Binary values', 'Probability distribution summing to 1', 'Logits', 'Gradients'],
            correctAnswer: 1,
            explanation: 'Softmax normalizes outputs to a probability distribution where all values sum to 1.',
            syllabusUnit: 'Unit 4: Neural Networks'
          },
          {
            question: 'In Bayesian inference, what does the prior represent?',
            options: [
              'The probability of evidence given hypothesis',
              'The belief about a hypothesis before seeing evidence',
              'The normalized posterior',
              'The likelihood function'
            ],
            correctAnswer: 1,
            explanation: 'The prior P(H) encodes initial beliefs before new data is observed.',
            syllabusUnit: 'Unit 2: Probability'
          }
        ];
        quizQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]!;
      }

      return NextResponse.json(quizQuestion);
    }

    if (action === 'submit_answer') {
      // Update topic mastery if we have a topic
      if (topic && userId && subjectId) {
        const accuracy = isCorrect ? 1.0 : 0.0;
        try {
          await updateTopicStatus(userId, subjectId, topic, accuracy);
        } catch (err) {
          console.error('updateTopicStatus error (non-fatal):', err);
        }
      }

      // Update session quiz score
      if (session) {
        const currentScore = session.quizScore || 0;
        const newScore = isCorrect ? Math.min(1, currentScore + 0.1) : currentScore;
        await db.update(studySessions)
          .set({ quizScore: newScore, updatedAt: new Date() } as any)
          .where(eq(studySessions.id, sessionId));
      }

      return NextResponse.json({ recorded: true, isCorrect });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('POST quiz error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
