import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studySessions } from "../../db/schema";
import { env } from "../env";
import { eq, desc } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export interface TemporalMemoryInput {
  userId: string;
  currentSessionId?: string;
  maxTurns?: number;
}

export interface MemoryContext {
  recentTopics: string[];
  lastWeakConcepts: string[];
  sessionHistory: string;
  continuityPrompt: string;
}

/**
 * Tool: temporal_memory
 * Injects long-context memory from previous study sessions into the current prompt.
 * Ensures AI remembers what was discussed, learned, and struggled with previously.
 */
export async function temporalMemoryTool(input: TemporalMemoryInput): Promise<MemoryContext> {
  const defaultMemory: MemoryContext = {
    recentTopics: [],
    lastWeakConcepts: [],
    sessionHistory: '',
    continuityPrompt: ''
  };

  try {
    const sessions = await db.select().from(studySessions)
      .where(eq(studySessions.userId, input.userId))
      .orderBy(desc(studySessions.startedAt))
      .limit(input.maxTurns ?? 5);

    if (sessions.length === 0) return defaultMemory;

    const recentTopics = sessions
      .flatMap((s: any) => s.topicsCovered || [])
      .filter(Boolean)
      .slice(0, 10);

    const lastWeakConcepts = sessions
      .flatMap((s: any) => s.weakConcepts || [])
      .filter(Boolean)
      .slice(0, 5);

    const sessionHistory = sessions.map((s: any, i: number) => {
      const date = new Date(s.startedAt).toLocaleDateString();
      const topics = (s.topicsCovered || []).join(', ') || 'General revision';
      const score = s.quizScore ? `Score: ${Math.round(s.quizScore * 100)}%` : '';
      return `Session ${i+1} (${date}): ${topics}. ${score}`;
    }).join(' | ');

    const continuityPrompt = lastWeakConcepts.length > 0
      ? `MEMORY CONTEXT: The student previously struggled with: ${lastWeakConcepts.join(', ')}. Recently studied: ${recentTopics.slice(0,5).join(', ')}. Build upon this foundation and address known gaps.`
      : `MEMORY CONTEXT: Student recently studied: ${recentTopics.slice(0,5).join(', ')}. Continue from where they left off.`;

    return { recentTopics, lastWeakConcepts, sessionHistory, continuityPrompt };
  } catch (err) {
    console.error('[temporal-memory-tool] Error:', err);
    return defaultMemory;
  }
}
