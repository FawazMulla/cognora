/**
 * Job payload type definitions for all BullMQ queues.
 *
 * Each type corresponds to a named job that a worker may receive.
 * Use these types when adding jobs to queues and when processing jobs
 * inside workers to ensure end-to-end type safety.
 */

// ---------------------------------------------------------------------------
// document-pipeline queue
// ---------------------------------------------------------------------------

export interface ClassifyDocumentJob {
  resourceId: string;
  userId: string;
}

export interface OcrExtractJob {
  resourceId: string;
  userId: string;
}

export interface ChunkTextJob {
  resourceId: string;
  userId: string;
}

export interface EmbedChunksJob {
  resourceId: string;
  userId: string;
  subjectId: string;
}

export interface UpdateKnowledgeGraphJob {
  resourceId: string;
  userId: string;
  subjectId: string;
}

export interface TriggerResourceIntelligenceJob {
  resourceId: string;
  userId: string;
  subjectId: string;
}

// ---------------------------------------------------------------------------
// resource-intelligence queue
// ---------------------------------------------------------------------------

export interface GenerateSummaryJob {
  resourceId: string;
  userId: string;
}

export interface GenerateFlashcardsJob {
  resourceId: string;
  userId: string;
  subjectId: string;
}

// ---------------------------------------------------------------------------
// pyq-processing queue
// ---------------------------------------------------------------------------

export interface PYQExtractJob {
  resourceId: string;
  userId: string;
  subjectId: string;
}

export interface PYQDedupJob {
  subjectId: string;
  userId: string;
}

export interface PYQFrequencyJob {
  subjectId: string;
  userId: string;
}

// ---------------------------------------------------------------------------
// notifications queue
// ---------------------------------------------------------------------------

export interface NotificationJob {
  userId: string;
  type:
    | "exam-reminder"
    | "flashcard-due"
    | "homework-due"
    | "processing-complete"
    | "processing-failed";
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// analytics queue
// ---------------------------------------------------------------------------

export interface AnalyticsJob {
  userId: string;
  subjectId?: string;
  type: "health-score-update" | "readiness-score";
}

// ---------------------------------------------------------------------------
// Union type covering every possible job payload
// ---------------------------------------------------------------------------

export type AnyJobData =
  | ClassifyDocumentJob
  | OcrExtractJob
  | ChunkTextJob
  | EmbedChunksJob
  | UpdateKnowledgeGraphJob
  | TriggerResourceIntelligenceJob
  | GenerateSummaryJob
  | GenerateFlashcardsJob
  | PYQExtractJob
  | PYQDedupJob
  | PYQFrequencyJob
  | NotificationJob
  | AnalyticsJob;
