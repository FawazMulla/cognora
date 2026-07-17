import { Worker, type ConnectionOptions } from "bullmq";
import { QUEUE_NAMES, documentPipelineQueue, resourceIntelligenceQueue } from "../lib/queues";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources, resourceChunks, knowledgeGraphNodes } from "../db/schema";
import { env } from "../lib/env";
import { eq } from "drizzle-orm";
import { redis } from "../lib/redis";
import { aiGateway } from "../lib/ai-gateway";
import { supabaseAdmin } from "../lib/supabase";
import type {
  ClassifyDocumentJob,
  OcrExtractJob,
  ChunkTextJob,
  EmbedChunksJob,
  UpdateKnowledgeGraphJob,
  TriggerResourceIntelligenceJob,
} from "../lib/job-types";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

type DocumentPipelineJobData =
  | ClassifyDocumentJob
  | OcrExtractJob
  | ChunkTextJob
  | EmbedChunksJob
  | UpdateKnowledgeGraphJob
  | TriggerResourceIntelligenceJob;

// Helper to push status to SSE via Redis Pub/Sub
async function updateStatus(resourceId: string, status: string) {
  await db.update(resources).set({ status }).where(eq(resources.id, resourceId));
  await redis.publish(`resource:${resourceId}:status`, JSON.stringify({ status }));
}

export function createDocumentPipelineWorker(
  connection: ConnectionOptions,
): Worker<DocumentPipelineJobData> {
  const worker = new Worker<DocumentPipelineJobData>(
    QUEUE_NAMES.DOCUMENT_PIPELINE,
    async (job) => {
      console.log(`[document-pipeline] Processing job "${job.name}" (id=${job.id})`);

      try {
        switch (job.name) {
          case "classify-document": {
            const data = job.data as ClassifyDocumentJob;
            await updateStatus(data.resourceId, "classifying");

            const res = await db.select().from(resources).where(eq(resources.id, data.resourceId)).limit(1);
            const resourceRecord = res[0];
            if (!resourceRecord) throw new Error("Resource not found");

            const classification = await aiGateway.invoke("classification", { filename: resourceRecord.filename });

            if (classification.confidence < 0.70) {
              await updateStatus(data.resourceId, "classifying");
              // Emit confirm_needed event (not fully implemented, leaving status as classifying)
            } else {
              // Advance to OCR
              await documentPipelineQueue.add("ocr-extract", {
                resourceId: data.resourceId,
                userId: data.userId,
              });
            }
            return { processed: true, message: "Classified" };
          }

          case "ocr-extract": {
            const data = job.data as OcrExtractJob;
            await updateStatus(data.resourceId, "ocr");

            const res = await db.select().from(resources).where(eq(resources.id, data.resourceId)).limit(1);
            const resourceRecord = res[0];
            if (!resourceRecord) throw new Error("Resource not found");
            
            const ocrResult = await aiGateway.invoke("ocr", { url: resourceRecord.storageUrl });
            
            await db.update(resources)
              .set({ rawText: ocrResult.text })
              .where(eq(resources.id, data.resourceId));

            // Advance to chunking
            await documentPipelineQueue.add("chunk-text", {
              resourceId: data.resourceId,
              userId: data.userId,
            });

            return { processed: true, message: "OCR Extracted" };
          }

          case "chunk-text": {
            const data = job.data as ChunkTextJob;
            await updateStatus(data.resourceId, "embedding");

            const res = await db.select().from(resources).where(eq(resources.id, data.resourceId)).limit(1);
            const resourceRecord = res[0];
            if (!resourceRecord) throw new Error("Resource not found");
            
            const text = resourceRecord.rawText || "";

            // Intelligent sentence and paragraph-aware chunking algorithm (FR-006)
            const paragraphs = text.split(/\n\s*\n/);
            const chunks: string[] = [];
            let currentChunk = "";
            const TARGET_CHUNK_SIZE = 600; // Optimal token/char footprint for semantic embeddings

            for (const paragraph of paragraphs) {
              if (currentChunk.length + paragraph.length < TARGET_CHUNK_SIZE) {
                currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
              } else {
                if (currentChunk) {
                  chunks.push(currentChunk.trim());
                  currentChunk = "";
                }
                
                // If single paragraph is oversized, split by sentence bounds
                if (paragraph.length >= TARGET_CHUNK_SIZE) {
                  const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)/g) || [paragraph];
                  for (const sentence of sentences) {
                    if (currentChunk.length + sentence.length < TARGET_CHUNK_SIZE) {
                      currentChunk += (currentChunk ? " " : "") + sentence.trim();
                    } else {
                      if (currentChunk) {
                        chunks.push(currentChunk.trim());
                      }
                      currentChunk = sentence.trim();
                    }
                  }
                } else {
                  currentChunk = paragraph;
                }
              }
            }
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            
            // Ensure we don't insert empty arrays which crashes Drizzle
            if (chunks.length > 0) {
              const chunkRecords = chunks.map((chunk, idx) => ({
                resourceId: data.resourceId,
                userId: data.userId,
                subjectId: resourceRecord.subjectId,
                chunkIndex: idx,
                content: chunk,
                tokens: Math.floor(chunk.length / 4), // Rough estimate
                pageNumber: 1, // Stub page number
              }));

              await db.insert(resourceChunks).values(chunkRecords);
            }

            // Enqueue both embed and knowledge-graph in parallel
            await Promise.all([
              documentPipelineQueue.add("embed-chunks", {
                resourceId: data.resourceId,
                userId: data.userId,
              }),
              documentPipelineQueue.add("update-knowledge-graph", {
                resourceId: data.resourceId,
                userId: data.userId,
              })
            ]);

            return { processed: true, message: "Chunked" };
          }

          case "embed-chunks": {
            const data = job.data as EmbedChunksJob;
            await updateStatus(data.resourceId, "embedding"); // Already embedding, but good to ensure

            const chunks = await db.select().from(resourceChunks).where(eq(resourceChunks.resourceId, data.resourceId));
            
            for (const chunk of chunks) {
              const embedResult = await aiGateway.invoke("embedding", { text: chunk.content });
              await db.update(resourceChunks)
                .set({ embedding: embedResult.embedding })
                .where(eq(resourceChunks.id, chunk.id));
            }

            // Since embed-chunks and update-knowledge-graph run in parallel, we need a way to know when BOTH are done.
            // For now, we will just advance to trigger-resource-intelligence from embed-chunks.
            await documentPipelineQueue.add("trigger-resource-intelligence", {
              resourceId: data.resourceId,
              userId: data.userId,
            });

            return { processed: true, message: "Embedded" };
          }

          case "update-knowledge-graph": {
            const data = job.data as UpdateKnowledgeGraphJob;
            await updateStatus(data.resourceId, "graphing");
            
            const res = await db.select().from(resources).where(eq(resources.id, data.resourceId)).limit(1);
            const resourceRecord = res[0];
            if (!resourceRecord) throw new Error("Resource not found");
            
            const kgResult = await aiGateway.invoke("knowledge_extraction", { text: resourceRecord.rawText });
            
            // In a real implementation, we would insert nodes to knowledgeGraphNodes
            
            return { processed: true, message: "Knowledge Graph Updated" };
          }

          case "trigger-resource-intelligence": {
            const data = job.data as TriggerResourceIntelligenceJob;
            await updateStatus(data.resourceId, "generating");

            // Fan out sub-jobs to resourceIntelligenceQueue
            const subJobs = [
              { name: "generate-summary", data: { resourceId: data.resourceId, userId: data.userId } },
              { name: "generate-key-topics", data: { resourceId: data.resourceId, userId: data.userId } },
              { name: "generate-flashcards", data: { resourceId: data.resourceId, userId: data.userId } },
              { name: "generate-definitions", data: { resourceId: data.resourceId, userId: data.userId } },
              { name: "generate-viva-questions", data: { resourceId: data.resourceId, userId: data.userId } },
              { name: "generate-exam-questions", data: { resourceId: data.resourceId, userId: data.userId } },
            ];

            await resourceIntelligenceQueue.addBulk(subJobs);

            // Once dispatched, mark resource as ready!
            await updateStatus(data.resourceId, "ready");

            return { processed: true, message: "Intelligence jobs dispatched and resource marked ready" };
          }

          default: {
            throw new Error(`[document-pipeline] Unknown job name: "${job.name}"`);
          }
        }
      } catch (error) {
        console.error(`[document-pipeline] Job ${job.name} failed:`, error);
        
        // Mark as error on unhandled failure
        if (job.data && 'resourceId' in job.data) {
          await updateStatus(job.data.resourceId, "error");
        }
        
        throw error; // Re-throw to trigger BullMQ retry logic
      }
    },
    {
      connection,
      concurrency: 5,
    },
  );

  return worker;
}
