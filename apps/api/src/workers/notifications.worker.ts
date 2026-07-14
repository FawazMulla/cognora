import { Worker, type ConnectionOptions } from "bullmq";
import { QUEUE_NAMES } from "../lib/queues";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentTopicProfiles, subjects } from "../db/schema";
import { env } from "../lib/env";
import { eq, and } from "drizzle-orm";
import { generateDailyPlanNode } from "../lib/agents/planner-agent";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export interface NotificationsJobData {
  userId: string;
  type: 'daily-plan' | 'exam-reminder' | 'flashcard-due';
}

export function createNotificationsWorker(
  connection: ConnectionOptions,
): Worker<NotificationsJobData> {
  const worker = new Worker<NotificationsJobData>(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
      console.log(`[notifications] Processing job "${job.name}" (id=${job.id})`);
      const { userId, type } = job.data;

      try {
        if (type === 'daily-plan') {
          // 1. Fetch upcoming exams
          const upcomingExams = await db.select().from(subjects).where(eq(subjects.userId, userId));
          
          // 2. Fetch weak topics
          const weakTopics = await db.select().from(studentTopicProfiles)
            .where(and(
              eq(studentTopicProfiles.userId, userId),
              eq(studentTopicProfiles.weakFlag, 'weak')
            )).limit(3);

          // 3. Generate daily plan
          const plan = await generateDailyPlanNode({
            userId,
            exams: upcomingExams,
            weakTopics,
            availableStudyMinutes: 120 // mock preference
          });

          console.log(`Daily plan generated for ${userId}:`, plan.dailyPlan);
          
          // In a real app we'd save this to a `daily_plans` table or push notification
          return { processed: true, plan };
        }

        return { processed: true, message: `Notification type ${type} handled` };
      } catch (error) {
        console.error(`[notifications] Job ${job.name} failed:`, error);
        throw error;
      }
    },
    { connection, concurrency: 5 },
  );

  return worker;
}
