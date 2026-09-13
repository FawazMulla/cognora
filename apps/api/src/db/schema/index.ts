import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  date,
  doublePrecision,
  bigint,
  vector,
  unique,
  index,
  AnyPgColumn
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 2.1 Core User Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  authId: text('auth_id').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const academicProfiles = pgTable('academic_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  university: text('university').notNull(),
  branch: text('branch').notNull(),
  semester: integer('semester').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2.2 Subject and Resource Tables
export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  academicProfileId: uuid('academic_profile_id').references(() => academicProfiles.id),
  name: text('name').notNull(),
  code: text('code'),
  examDate: date('exam_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id),
  filename: text('filename').notNull(),
  storageUrl: text('storage_url').notNull(),
  fileType: text('file_type').notNull(),
  sha256Hash: text('sha256_hash').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }),
  status: text('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  rawText: text('raw_text'),
  intelligenceData: jsonb('intelligence_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  dedupConstraint: unique('resource_dedup_idx').on(t.userId, t.subjectId, t.sha256Hash),
  statusIdx: index('resource_status_idx').on(t.userId, t.subjectId, t.status),
}));

// 2.3 Vector and Knowledge Graph Tables
export const knowledgeGraphNodes = pgTable('knowledge_graph_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id),
  nodeType: text('node_type').notNull(),
  label: text('label').notNull(),
  canonicalId: uuid('canonical_id').references((): AnyPgColumn => knowledgeGraphNodes.id),
  sourceResourceId: uuid('source_resource_id').references(() => resources.id),
  sourcePage: integer('source_page'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const resourceChunks = pgTable('resource_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceId: uuid('resource_id').references(() => resources.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  subjectId: uuid('subject_id').references(() => subjects.id),
  chunkIndex: integer('chunk_index').notNull(),
  pageNumber: integer('page_number'),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  embedding: vector('embedding', { dimensions: 768 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  embeddingIdx: index('chunk_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
  scopedIdx: index('chunk_scoped_idx').on(t.userId, t.subjectId),
}));

// 2.4 PYQ, Answer Bank, and Flashcard Tables
export const pyqQuestions = pgTable('pyq_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id),
  resourceId: uuid('resource_id').references(() => resources.id),
  canonicalId: uuid('canonical_id').references((): AnyPgColumn => pyqQuestions.id),
  questionText: text('question_text').notNull(),
  markValue: integer('mark_value'),
  examYear: text('exam_year'),
  unitHeader: text('unit_header'),
  priorityLabel: text('priority_label'),
  repeatCount: integer('repeat_count').notNull().default(1),
  knowledgeNodeId: uuid('knowledge_node_id').references(() => knowledgeGraphNodes.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const answerBank = pgTable('answer_bank', {
  id: uuid('id').primaryKey().defaultRandom(),
  pyqQuestionId: uuid('pyq_question_id').references(() => pyqQuestions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  format: text('format').notNull(),
  markValue: integer('mark_value'),
  content: text('content').notNull(),
  keyPoints: jsonb('key_points'),
  invalidatedAt: timestamp('invalidated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const flashcards = pgTable('flashcards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id),
  sourceResourceId: uuid('source_resource_id').references(() => resources.id),
  sourceChunkIndex: integer('source_chunk_index').notNull(),
  cardType: text('card_type').notNull(),
  front: text('front').notNull(),
  back: text('back').notNull(),
  originalFront: text('original_front'),
  originalBack: text('original_back'),
  isStudentCurated: boolean('is_student_curated').default(false),
  isArchived: boolean('is_archived').default(false),
  intervalDays: integer('interval_days').default(1),
  easeFactor: doublePrecision('ease_factor').default(2.5),
  dueDate: date('due_date').defaultNow(),
  reviewCount: integer('review_count').default(0),
  correctRecallRate: doublePrecision('correct_recall_rate').default(0.0),
  lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2.5 Student Model and Analytics Tables
export const studySessions = pgTable('study_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id),
  goalMode: text('goal_mode').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSecs: integer('duration_secs'),
  topicsCovered: text('topics_covered').array(),
  questionsAsked: integer('questions_asked').default(0),
  weakConcepts: text('weak_concepts').array(),
  quizScore: doublePrecision('quiz_score'),
  profileSnapshot: jsonb('profile_snapshot'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const studentModels = pgTable('student_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  preferredAnswerLength: text('preferred_answer_length').default('medium'),
  preferredStyle: text('preferred_style').default('text'),
  learningPace: text('learning_pace').default('standard'),
  academicHealthScore: doublePrecision('academic_health_score').default(50.0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const studentTopicProfiles = pgTable('student_topic_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id),
  topic: text('topic').notNull(),
  confidence: integer('confidence').default(50),
  weakFlag: text('weak_flag').default('none'),
  weakReason: text('weak_reason'),
  definitionErrors: integer('definition_errors').default(0),
  diagramErrors: integer('diagram_errors').default(0),
  numericalErrors: integer('numerical_errors').default(0),
  lastRevisedAt: timestamp('last_revised_at', { withTimezone: true }),
  revisionCount: integer('revision_count').default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  uniqueTopicConstraint: unique('topic_profile_dedup_idx').on(t.userId, t.subjectId, t.topic),
}));

export const homeworkStyleProfiles = pgTable('homework_style_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id),
  avgSentenceLength: doublePrecision('avg_sentence_length'),
  formalityLevel: text('formality_level'),
  vocabularyRange: text('vocabulary_range'),
  paragraphStructure: jsonb('paragraph_structure'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  uniqueStyleConstraint: unique('style_profile_dedup_idx').on(t.userId, t.subjectId),
}));

// 2.6 AI Gateway and Logging Tables
export const modelRouting = pgTable('model_routing', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskType: text('task_type').unique().notNull(),
  provider: text('provider').notNull(),
  modelName: text('model_name').notNull(),
  fallbackProvider: text('fallback_provider'),
  fallbackModel: text('fallback_model'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const modelInvocationLogs = pgTable('model_invocation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelName: text('model_name').notNull(),
  taskType: text('task_type').notNull(),
  latencyMs: integer('latency_ms'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  estimatedCostUsd: doublePrecision('estimated_cost_usd'),
  fallbackUsed: boolean('fallback_used').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
