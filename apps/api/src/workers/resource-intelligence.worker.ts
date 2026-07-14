import { Worker, type ConnectionOptions } from "bullmq";
import { QUEUE_NAMES } from "../lib/queues";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources, flashcards } from "../db/schema";
import { env } from "../lib/env";
import { eq } from "drizzle-orm";
import { redis } from "../lib/redis";
import { aiGateway } from "../lib/ai-gateway";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

// A simple interface for the jobs we dispatch to this queue
export interface ResourceIntelligenceJobData {
  resourceId: string;
  userId: string;
}

export function createResourceIntelligenceWorker(
  connection: ConnectionOptions,
): Worker<ResourceIntelligenceJobData> {
  const worker = new Worker<ResourceIntelligenceJobData>(
    QUEUE_NAMES.RESOURCE_INTELLIGENCE,
    async (job) => {
      console.log(`[resource-intelligence] Processing job "${job.name}" (id=${job.id})`);
      const { resourceId, userId } = job.data;

      try {
        switch (job.name) {
          case "generate-summary": {
            const res = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
            if (!res.length) throw new Error("Resource not found");

            const result = await aiGateway.invoke("summary_gen", { text: res[0].rawText });
            const currentData = (res[0].intelligenceData as any) || {};
            await db.update(resources)
              .set({ intelligenceData: { ...currentData, summary: result.summary } })
              .where(eq(resources.id, resourceId));

            return { processed: true, message: "Summary generated" };
          }

          case "generate-key-topics": {
            const res = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
            if (!res.length) throw new Error("Resource not found");
            const result = await aiGateway.invoke("summary_gen", { text: res[0]?.rawText, mode: 'key_topics' });
            
            const currentData = (res[0].intelligenceData as any) || {};
            await db.update(resources)
              .set({ intelligenceData: { ...currentData, keyTopics: result.topics } })
              .where(eq(resources.id, resourceId));

            return { processed: true, message: "Key topics generated" };
          }

          case "generate-flashcards": {
            const res = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
            // Simulate chunk processing
            const result = await aiGateway.invoke("flashcard_gen", { text: res[0]?.rawText });
            
            // Insert mock flashcard
            await db.insert(flashcards).values({
              userId,
              subjectId: res[0]?.subjectId || "",
              front: "Mock Front",
              back: "Mock Back",
              sourceResourceId: resourceId,
              sourceChunkIndex: 0,
            });

            return { processed: true, message: "Flashcards generated" };
          }

          case "generate-definitions": {
            const res = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
            if (!res.length) throw new Error("Resource not found");
            const result = await aiGateway.invoke("knowledge_extraction", { type: 'definitions' });
            
            const currentData = (res[0].intelligenceData as any) || {};
            await db.update(resources)
              .set({ intelligenceData: { ...currentData, definitions: result.definitions } })
              .where(eq(resources.id, resourceId));

            return { processed: true, message: "Definitions generated" };
          }

          case "generate-viva-questions": {
            const res = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
            if (!res.length) throw new Error("Resource not found");
            const result = await aiGateway.invoke("quiz_gen", { type: 'viva' });
            
            const currentData = (res[0].intelligenceData as any) || {};
            await db.update(resources)
              .set({ intelligenceData: { ...currentData, vivaQuestions: result.questions } })
              .where(eq(resources.id, resourceId));

            return { processed: true, message: "Viva questions generated" };
          }

          case "generate-exam-questions": {
            const res = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
            if (!res.length) throw new Error("Resource not found");
            const result = await aiGateway.invoke("quiz_gen", { type: 'exam' });
            
            const currentData = (res[0].intelligenceData as any) || {};
            await db.update(resources)
              .set({ intelligenceData: { ...currentData, expectedExamQuestions: result.questions } })
              .where(eq(resources.id, resourceId));

            return { processed: true, message: "Exam questions generated" };
          }

          default: {
            throw new Error(`[resource-intelligence] Unknown job name: "${job.name}"`);
          }
        }
      } catch (error) {
        console.error(`[resource-intelligence] Job ${job.name} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 10,
    },
  );

  worker.on("completed", (job, result) => {
    console.log(`[resource-intelligence] Job "${job.name}" (id=${job.id}) completed`, result);
  });

  worker.on("failed", (job, err) => {
    console.error(`[resource-intelligence] Job "${job?.name}" (id=${job?.id}) failed:`, err.message);
  });

  return worker;
}
