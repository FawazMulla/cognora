import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { subjects, studentTopicProfiles } from "../../../../db/schema";
import { env } from "../../../../lib/env";
import { eq, and } from "drizzle-orm";
import { aiGateway } from "../../../../lib/ai-gateway";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

const FALLBACK_QUESTIONS: { default: string[]; [key: string]: string[] | undefined } = {
  default: [
    "Explain the A* search algorithm and prove admissibility of the heuristic function.",
    "Define forward chaining and backward chaining in knowledge-based expert systems.",
    "Explain the concept of overfitting and how dropout regularization prevents it.",
    "What is Bayes' theorem? Illustrate with a medical diagnosis example.",
    "Compare and contrast BFS and DFS in terms of completeness, optimality, time and space complexity.",
    "Explain the minimax algorithm for game trees. What is alpha-beta pruning?",
    "Describe the process of backpropagation in neural networks. Derive the weight update rule.",
    "What are the ACID properties? Give a real-world violation example for each.",
    "Explain 3NF and BCNF normalization. When do they differ?",
    "What is the difference between supervised and unsupervised learning? Give examples."
  ]
};

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { subjectId, topic } = body;

    let subjectName = 'your subject';
    let weakTopics: string[] = [];

    if (subjectId) {
      const [subj] = await db.select().from(subjects).where(eq(subjects.id, subjectId));
      subjectName = (subj as any)?.name || 'your subject';

      const topicProfiles = await db.select().from(studentTopicProfiles).where(
        and(eq(studentTopicProfiles.userId, userId), eq(studentTopicProfiles.subjectId, subjectId))
      ).limit(5);
      weakTopics = topicProfiles.filter((t: any) => t.weakFlag === 'weak').map((t: any) => t.topic);
    }

    // Pick topic to focus on
    const targetTopic = topic || (weakTopics.length > 0 ? weakTopics[0] : null);
    const prompt = targetTopic
      ? `You are a viva examiner. Generate a single challenging oral examination question specifically about "${targetTopic}" for the subject "${subjectName}". The question should test deep conceptual understanding, not just definitions. Output only the question text.`
      : `You are a viva examiner. Generate a single challenging oral examination question for the subject "${subjectName}". Pick an important syllabus concept. The question should test conceptual depth. Output only the question text.`;

    let question = '';
    try {
      const res = await aiGateway.invoke('viva_gen', { text: prompt }, {
        userId,
        subjectId,
        useHighContext: false,
        useTools: false
      });
      question = typeof res === 'string' ? res : (res?.question || res?.answer || res?.text || '');
      question = question.replace(/^["']|["']$/g, '').trim();
    } catch (err) {
      console.error('AI viva gen failed, using fallback:', err);
    }

    if (!question || question.length < 10) {
      const key = subjectId || 'default';
      const fallbacks = FALLBACK_QUESTIONS[key] ?? FALLBACK_QUESTIONS['default'];
      const index = Math.floor(Math.random() * fallbacks.length);
      question = fallbacks[index] ?? FALLBACK_QUESTIONS['default'][0]!;
    }

    return NextResponse.json({ question, topic: targetTopic, subjectName });
  } catch (error) {
    console.error("POST viva generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
