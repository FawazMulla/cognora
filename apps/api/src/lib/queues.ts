import { Queue, type ConnectionOptions } from "bullmq";
import { redis } from "./redis";

/**
 * Canonical queue name constants.
 * Use these everywhere instead of bare strings to prevent typos.
 */
export const QUEUE_NAMES = {
  DOCUMENT_PIPELINE: "document-pipeline",
  RESOURCE_INTELLIGENCE: "resource-intelligence",
  PYQ_PROCESSING: "pyq-processing",
  NOTIFICATIONS: "notifications",
  ANALYTICS: "analytics",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ---------------------------------------------------------------------------
// Shared connection
// The ioredis client exported from redis.ts already has the BullMQ-compatible
// options set (maxRetriesPerRequest: null, enableReadyCheck: false).
//
// Cast is necessary because pnpm may resolve two different patch versions of
// ioredis (one for this package, one for bullmq), making the types structurally
// incompatible despite being runtime-compatible.
// ---------------------------------------------------------------------------
const connection = redis as unknown as ConnectionOptions;

/**
 * document-pipeline queue — HIGH priority
 * Jobs: classify-document, ocr-extract, chunk-text, embed-chunks,
 *       update-knowledge-graph, trigger-resource-intelligence
 */
export const documentPipelineQueue = new Queue(QUEUE_NAMES.DOCUMENT_PIPELINE, {
  connection,
  defaultJobOptions: {
    priority: 1, // 1 = HIGH (lower number = higher priority in BullMQ)
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5_000,
    },
    removeOnComplete: { count: 1_000 },
    removeOnFail: { count: 5_000 },
  },
});

/**
 * resource-intelligence queue — MEDIUM priority
 * Jobs: generate-summary, generate-key-topics, generate-flashcards,
 *       generate-definitions, generate-viva-questions, generate-exam-questions
 */
export const resourceIntelligenceQueue = new Queue(
  QUEUE_NAMES.RESOURCE_INTELLIGENCE,
  {
    connection,
    defaultJobOptions: {
      priority: 5, // 5 = MEDIUM
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5_000,
      },
      removeOnComplete: { count: 1_000 },
      removeOnFail: { count: 5_000 },
    },
  },
);

/**
 * pyq-processing queue — HIGH priority
 * Jobs: pyq-extract, pyq-dedup, pyq-frequency
 */
export const pyqProcessingQueue = new Queue(QUEUE_NAMES.PYQ_PROCESSING, {
  connection,
  defaultJobOptions: {
    priority: 1, // 1 = HIGH
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5_000,
    },
    removeOnComplete: { count: 1_000 },
    removeOnFail: { count: 5_000 },
  },
});

/**
 * notifications queue — LOW priority
 * Jobs: exam-reminder, flashcard-due, homework-due, processing-complete,
 *       processing-failed
 */
export const notificationsQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
  connection,
  defaultJobOptions: {
    priority: 10, // 10 = LOW
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 3_000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2_000 },
  },
});

/**
 * analytics queue — LOW priority
 * Jobs: health-score-update, readiness-score
 */
export const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS, {
  connection,
  defaultJobOptions: {
    priority: 10, // 10 = LOW
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 3_000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2_000 },
  },
});
