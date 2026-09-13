import { Queue, type ConnectionOptions, type QueueOptions } from "bullmq";
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
// ---------------------------------------------------------------------------
const connection = redis as unknown as ConnectionOptions;

/**
 * Lazy queue proxy helper so BullMQ does not attempt to open Redis
 * connections at module evaluation time during Next.js static build.
 */
function createLazyQueue(name: QueueName, options: QueueOptions): Queue {
  let instance: Queue | null = null;
  return new Proxy({} as Queue, {
    get(_target, prop, receiver) {
      if (!instance) {
        instance = new Queue(name, options);
      }
      const value = Reflect.get(instance, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

/**
 * document-pipeline queue — HIGH priority
 * Jobs: classify-document, ocr-extract, chunk-text, embed-chunks,
 *       update-knowledge-graph, trigger-resource-intelligence
 */
export const documentPipelineQueue = createLazyQueue(QUEUE_NAMES.DOCUMENT_PIPELINE, {
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
export const resourceIntelligenceQueue = createLazyQueue(
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
export const pyqProcessingQueue = createLazyQueue(QUEUE_NAMES.PYQ_PROCESSING, {
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
export const notificationsQueue = createLazyQueue(QUEUE_NAMES.NOTIFICATIONS, {
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
export const analyticsQueue = createLazyQueue(QUEUE_NAMES.ANALYTICS, {
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
