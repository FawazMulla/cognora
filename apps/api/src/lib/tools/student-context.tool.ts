import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentModels, studentTopicProfiles, studySessions } from "../../db/schema";
import { env } from "../env";
import { eq, and, desc } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export interface StudentContextInput {
  userId: string;
  subjectId?: string | undefined;
}

export interface StudentContext {
  preferredStyle: string;
  learningPace: string;
  preferredAnswerLength: string;
  academicHealthScore: number;
  weakTopics: string[];
  improvingTopics: string[];
  strongTopics: string[];
  recentSessionTopics: string[];
  systemPromptInjection: string;
}

/**
 * Tool: student_context
 * Fetches and formats the student's learning profile to inject into AI prompts.
 * This personalizes every AI response to the student's exact learning state.
 */
export async function studentContextTool(input: StudentContextInput): Promise<StudentContext> {
  const defaultContext: StudentContext = {
    preferredStyle: 'text',
    learningPace: 'standard',
    preferredAnswerLength: 'medium',
    academicHealthScore: 50,
    weakTopics: [],
    improvingTopics: [],
    strongTopics: [],
    recentSessionTopics: [],
    systemPromptInjection: ''
  };

  try {
    const [modelRaw] = await db.select().from(studentModels).where(eq(studentModels.userId, input.userId));
    const model = modelRaw as any;

    const topicConditions: any[] = [eq(studentTopicProfiles.userId, input.userId)];
    if (input.subjectId) topicConditions.push(eq(studentTopicProfiles.subjectId, input.subjectId));
    
    const topics = await db.select().from(studentTopicProfiles)
      .where(and(...topicConditions))
      .limit(50);

    const recentSessions = await db.select().from(studySessions)
      .where(eq(studySessions.userId, input.userId))
      .orderBy(desc(studySessions.startedAt))
      .limit(3);

    const weakTopics = topics.filter((t: any) => t.weakFlag === 'weak').map((t: any) => t.topic);
    const improvingTopics = topics.filter((t: any) => t.weakFlag === 'improving').map((t: any) => t.topic);
    const strongTopics = topics.filter((t: any) => t.weakFlag === 'strong').map((t: any) => t.topic);
    
    const recentSessionTopics = recentSessions
      .flatMap((s: any) => s.topicsCovered || [])
      .filter(Boolean)
      .slice(0, 5);

    const systemPromptInjection = [
      `STUDENT PROFILE CONTEXT:`,
      `- Learning Style: ${model?.preferredStyle || 'text'}`,
      `- Learning Pace: ${model?.learningPace || 'standard'}`,
      `- Preferred Answer Length: ${model?.preferredAnswerLength || 'medium'}`,
      `- Academic Health Score: ${model?.academicHealthScore || 50}/100`,
      weakTopics.length > 0 ? `- Currently Weak Topics: ${weakTopics.join(', ')} → Give extra attention, simpler explanations, and step-by-step breakdowns for these.` : '',
      improvingTopics.length > 0 ? `- Improving Topics: ${improvingTopics.join(', ')} → Reinforce with examples.` : '',
      `Adapt your response to this student's profile. Use ${model?.preferredStyle === 'visual' ? 'diagrams, tables, and structured lists' : 'clear paragraph explanations with numbered points'}. Keep the length ${model?.preferredAnswerLength || 'medium'}.`
    ].filter(Boolean).join('\n');

    return {
      preferredStyle: model?.preferredStyle || 'text',
      learningPace: model?.learningPace || 'standard',
      preferredAnswerLength: model?.preferredAnswerLength || 'medium',
      academicHealthScore: model?.academicHealthScore || 50,
      weakTopics,
      improvingTopics,
      strongTopics,
      recentSessionTopics,
      systemPromptInjection
    };
  } catch (err) {
    console.error('[student-context-tool] Error:', err);
    return defaultContext;
  }
}
