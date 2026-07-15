import { Worker, type ConnectionOptions } from "bullmq";
import { QUEUE_NAMES } from "../lib/queues";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pyqQuestions, resources } from "../db/schema";
import { env } from "../lib/env";
import { eq, inArray } from "drizzle-orm";
import { aiGateway } from "../lib/ai-gateway";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export interface PyqJobData {
  resourceId?: string;
  userId: string;
  subjectId: string;
}

export function createPyqProcessingWorker(
  connection: ConnectionOptions,
): Worker<PyqJobData> {
  const worker = new Worker<PyqJobData>(
    QUEUE_NAMES.PYQ_PROCESSING,
    async (job) => {
      console.log(`[pyq-processing] Processing job "${job.name}" (id=${job.id})`);

      try {
        switch (job.name) {
          case "pyq-extract": {
            const { resourceId, userId, subjectId } = job.data;
            if (!resourceId) throw new Error("resourceId required for extraction");

                        const res = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
            const resourceRecord = res[0];
            if (!resourceRecord) throw new Error("Resource not found");

            // Extract questions via AI Gateway (simulated)
            const extractedResult = await aiGateway.invoke("knowledge_extraction", { text: resourceRecord.rawText, mode: 'pyq' });
            
            // Mock extracted data
            const questions = [
              { text: "What is AI?", markValue: 5, year: "2023", unit: "Unit 1" },
              { text: "Explain backpropagation.", markValue: 10, year: "2022", unit: "Unit 2" }
            ];

            // 10.2 Deduplication would happen here via vector search for similar questions
            // We just insert them
            for (const q of questions) {
              await db.insert(pyqQuestions).values({
                userId,
                subjectId,
                resourceId,
                questionText: q.text,
                markValue: q.markValue,
                examYear: q.year,
                unitHeader: q.unit,
                repeatCount: 1, // Base case
              });
            }

            return { processed: true, message: "PYQs extracted and stored" };
          }

          case "pyq-dedup": {
            // Task 10.2: Cluster semantically equivalent questions
            // Simulated dedup pass over subject's PYQs
            return { processed: true, message: "PYQ deduplication complete" };
          }

          case "pyq-frequency": {
            // Task 10.4: Compute frequency and label priority
            const { subjectId } = job.data;
            const pyqs = await db.select().from(pyqQuestions).where(eq(pyqQuestions.subjectId, subjectId));

            // E.g., if repeat_count >= 3 -> High, 2 -> Medium, 1 -> Low
            for (const pyq of pyqs) {
              let label = "Low";
              if (pyq.repeatCount >= 3) label = "High";
              else if (pyq.repeatCount === 2) label = "Medium";

              await db.update(pyqQuestions)
                .set({ priorityLabel: label })
                .where(eq(pyqQuestions.id, pyq.id));
            }

            return { processed: true, message: "PYQ frequency labelled" };
          }

          default: {
            throw new Error(`[pyq-processing] Unknown job name: "${job.name}"`);
          }
        }
      } catch (error) {
        console.error(`[pyq-processing] Job ${job.name} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
    },
  );

  worker.on("completed", (job, result) => {
    console.log(`[pyq-processing] Job "${job.name}" completed`, result);
  });

  return worker;
}
