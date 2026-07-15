import { Worker, Job } from "bullmq";
import { redis } from "../lib/redis";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";
import { studySessions, subjects, studentModels, studentTopicProfiles } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 5 });
const db = drizzle(client);

const connection = redis as unknown as any;

export const planGenerationWorker = new Worker(
  "academic-planner",
  async (job: Job) => {
    console.log(`[Worker] Generating daily plan for user ${job.data.userId}`);
    const { userId } = job.data;
    
    // 1. Fetch user subjects
    const userSubjects = await db.select().from(subjects).where(eq(subjects.userId, userId));
    if (userSubjects.length === 0) return { status: 'no_subjects' };

    // 2. Fetch student model for preferences
    const [studentModel] = await db.select().from(studentModels).where(eq(studentModels.userId, userId));
    const studyPace = (studentModel as any)?.learningPace || 'standard';

    let dailyPlan = [];

    // 3. Logic: For each subject, find weak topics and upcoming exams
    for (const subject of userSubjects) {
      const subj = subject as any;
      const weakTopics = await db.select().from(studentTopicProfiles)
        .where(
          and(
            eq(studentTopicProfiles.userId, userId),
            eq(studentTopicProfiles.subjectId, subj.id),
            eq(studentTopicProfiles.weakFlag, 'weak')
          )
        )
        .limit(3);

      const daysToExam = subj.examDate ? Math.ceil((new Date(subj.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

      if (daysToExam !== null && daysToExam <= 7) {
        dailyPlan.push({ subjectId: subj.id, type: 'exam_prep', topic: (weakTopics[0] as any)?.topic || 'General Revision', urgency: 'high' });
      } else if (weakTopics.length > 0) {
        dailyPlan.push({ subjectId: subj.id, type: 'weak_topic_revision', topic: (weakTopics[0] as any).topic, urgency: 'medium' });
      }
    }

    if (dailyPlan.length === 0) {
      dailyPlan.push({ type: 'general_study', message: 'Continue regular syllabus coverage.' });
    }

    // 4. In a real system, we would store this daily plan in a dedicated `daily_plans` table or update the student model metadata.
    // For this MVP, we log it and update the student model's metadata payload.
    console.log(`[Worker] Daily plan for ${userId}:`, dailyPlan);

    return { status: 'success', plan: dailyPlan };
  },
  { connection }
);
