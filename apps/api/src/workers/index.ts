/**
 * Worker entry point — runnable as a standalone Node.js process.
 *
 * Start with:
 *   pnpm workers:dev   (tsx watch — hot reload)
 *   pnpm workers:start (tsx — single run)
 *
 * Each worker listens on its respective BullMQ queue.  The document-pipeline
 * worker is created via a factory function; the remaining queues have stub
 * inline processors that will be fleshed out in later tasks.
 */

import { Worker, type ConnectionOptions } from "bullmq";
import { redis } from "../lib/redis";
import { QUEUE_NAMES } from "../lib/queues";
import { createDocumentPipelineWorker } from "./document-pipeline.worker";

// Cast is necessary because pnpm may resolve two different patch versions of
// ioredis (one for this package, one for bullmq), making the types structurally
// incompatible despite being runtime-compatible.
const connection = redis as unknown as ConnectionOptions;

const STUB_MESSAGE = "stub — to be implemented in a later task";

// ---------------------------------------------------------------------------
// Create workers
// ---------------------------------------------------------------------------

const documentPipelineWorker = createDocumentPipelineWorker(connection);

import { createResourceIntelligenceWorker } from "./resource-intelligence.worker";

const resourceIntelligenceWorker = createResourceIntelligenceWorker(connection);


import { createPyqProcessingWorker } from "./pyq-processing.worker";

const pyqProcessingWorker = createPyqProcessingWorker(connection);


import { createNotificationsWorker } from "./notifications.worker";

const notificationsWorker = createNotificationsWorker(connection);


import { createAnalyticsWorker } from "./analytics.worker";

const analyticsWorker = createAnalyticsWorker(connection);


const allWorkers = [
  documentPipelineWorker,
  resourceIntelligenceWorker,
  pyqProcessingWorker,
  notificationsWorker,
  analyticsWorker,
];

// ---------------------------------------------------------------------------
// Startup logging
// ---------------------------------------------------------------------------

console.log("[workers] Starting BullMQ workers…");
console.log(`  ✓ document-pipeline`);
console.log(`  ✓ resource-intelligence`);
console.log(`  ✓ pyq-processing`);
console.log(`  ✓ notifications`);
console.log(`  ✓ analytics`);
console.log("[workers] All workers running. Waiting for jobs…");

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[workers] Received ${signal}. Shutting down gracefully…`);

  await Promise.all(allWorkers.map((w) => w.close()));
  console.log("[workers] All workers closed.");

  await redis.quit();
  console.log("[workers] Redis disconnected.");

  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
