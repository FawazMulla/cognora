import { Worker, type ConnectionOptions } from "bullmq";
import { QUEUE_NAMES } from "../lib/queues";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentModels, studentTopicProfiles } from "../db/schema";
import { env } from "../lib/env";
import { eq, sql } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export interface AnalyticsJobData {
  userId: string;
  subjectId?: string;
  sessionId?: string;
  event: 'session-end' | 'quiz-complete' | 'health-score-update';
}

export function createAnalyticsWorker(
  connection: ConnectionOptions,
): Worker<AnalyticsJobData> {
  const worker = new Worker<AnalyticsJobData>(
    QUEUE_NAMES.ANALYTICS,
    async (job) => {
      console.log(`[analytics] Processing job "${job.name}" (id=${job.id})`);
      const { userId, event } = job.data;

      try {
        switch (event) {
          case 'health-score-update': {
            // Recalculate health score (FR-035)
            // Health = 0.4*engagement + 0.3*topic_mastery + 0.3*spaced_repetition
            // Mocking the complex math here:
            const randomDelta = (Math.random() * 5) - 2; // -2 to +3
            
            await db.execute(sql`
              UPDATE student_models
              SET academic_health_score = LEAST(100.0, GREATEST(0.0, academic_health_score + ${randomDelta}))
              WHERE user_id = ${userId}
            `);
            
            return { processed: true, message: "Health score updated" };
          }
          
          case 'session-end': {
            // Task 9.4: session finalization enqueues this
            // We would iterate over topics covered and update confidence
            return { processed: true, message: "Session analytics processed" };
          }
          
          case 'quiz-complete': {
            // Task 12.4: update weak topics
            return { processed: true, message: "Quiz analytics processed" };
          }

          default: {
            throw new Error(`[analytics] Unknown event: "${event}"`);
          }
        }
      } catch (error) {
        console.error(`[analytics] Job ${job.name} failed:`, error);
        throw error;
      }
    },
    { connection, concurrency: 2 },
  );

  return worker;
}
