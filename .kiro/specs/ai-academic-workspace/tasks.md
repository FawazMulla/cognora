# Implementation Plan: AI Academic Workspace

## Overview

This plan implements the AI Academic Workspace MVP (Phases 1–2) as a React Native + Expo mobile client backed by a Next.js API server. Tasks are ordered by dependency: infrastructure and data layer first, then AI agent pipeline, then API routes, then mobile UI. Each task references the functional requirements it satisfies and builds directly on the outputs of preceding tasks.

Implementation language: **TypeScript** (Next.js backend + React Native/Expo mobile).

---

## Tasks

- [x] 1. Project Setup & Infrastructure
  - [x] 1.1 Initialise monorepo workspace with shared TypeScript configuration
    - Create a pnpm/turborepo monorepo with `apps/mobile` (Expo), `apps/api` (Next.js), and `packages/shared` (shared types & utils)
    - Configure root `tsconfig.json` with path aliases for `@workspace/*` packages
    - Add ESLint + Prettier + Husky pre-commit hooks at the root
    - _Requirements: FR-001 through FR-040 (foundational)_

  - [x] 1.2 Bootstrap the Next.js API application
    - Scaffold `apps/api` with Next.js 14 App Router; enable TypeScript strict mode
    - Add `zod` for request validation, `@supabase/supabase-js` for DB + storage, and `ioredis` for Redis
    - Configure environment variable schema with `dotenv` + Zod validation at startup
    - _Requirements: FR-001, FR-003, FR-031_

  - [x] 1.3 Bootstrap the React Native + Expo mobile application
    - Scaffold `apps/mobile` with Expo SDK (latest), TypeScript template, and Expo Router for file-based navigation
    - Install: `@tanstack/react-query`, `zustand`, `react-native-mmkv`, `expo-secure-store`, `expo-camera`, `expo-file-system`, `expo-notifications`
    - Set up EAS project config (`eas.json`) for iOS and Android builds
    - _Requirements: FR-001, FR-034, FR-040_

  - [x] 1.4 Set up PostgreSQL + pgvector database (Supabase)
    - Create Supabase project; enable the `pgvector` extension
    - Add `drizzle-orm` + `drizzle-kit` to `apps/api`; configure connection pooling via `@supabase/supabase-js` Postgres adapter
    - Commit `drizzle.config.ts` with migration output path `apps/api/drizzle/migrations`
    - _Requirements: FR-003, FR-007, FR-038_

  - [x] 1.5 Set up Redis (Upstash) and BullMQ job infrastructure
    - Provision Upstash Redis; add `bullmq` + `ioredis` to `apps/api`
    - Create `apps/api/lib/queues.ts` defining queue names: `document-pipeline`, `resource-intelligence`, `pyq-processing`, `notifications`, `analytics`
    - Add a BullMQ worker entry point (`apps/api/workers/index.ts`) runnable via a separate Railway process
    - _Requirements: FR-003, FR-005, FR-033, FR-035_

- [x] 2. Database Schema & Migrations
  - [x] 2.1 Define and migrate core user tables
    - Write Drizzle schema for `users` and `academic_profiles` tables (exact columns per design §2.1)
    - Generate and apply migration; add RLS policies: `users` and `academic_profiles` visible only to the row owner
    - _Requirements: FR-001, FR-002, FR-038_

  - [x] 2.2 Define and migrate subject and resource tables
    - Write Drizzle schema for `subjects` and `resources` tables with all status enum values
    - Add SHA-256 unique constraint on `(user_id, subject_id, sha256_hash)` for dedup (FR-003.7)
    - Add index on `resources(user_id, subject_id, status)`
    - _Requirements: FR-003, FR-004, FR-008, FR-038_

  - [x] 2.3 Define and migrate vector and knowledge graph tables
    - Write Drizzle schema for `resource_chunks` (including `vector(768)` pgvector column) and `knowledge_graph_nodes`
    - Create HNSW index on `resource_chunks(embedding)` using `vector_cosine_ops`
    - Add composite index on `resource_chunks(user_id, subject_id)` for scoped search
    - _Requirements: FR-006, FR-007, FR-038_

  - [x] 2.4 Define and migrate PYQ, answer bank, and flashcard tables
    - Write Drizzle schema for `pyq_questions`, `answer_bank`, and `flashcards` (including all SM-2 fields)
    - Add canonical dedup FK on `pyq_questions(canonical_id)` and `flashcards` source fields
    - _Requirements: FR-014, FR-016, FR-020, FR-021_

  - [x] 2.5 Define and migrate student model and analytics tables
    - Write Drizzle schema for `study_sessions`, `student_models`, `student_topic_profiles`, `homework_style_profiles`
    - Add UNIQUE constraint on `student_models(user_id)` and `student_topic_profiles(user_id, subject_id, topic)`
    - _Requirements: FR-013, FR-025, FR-028, FR-036, FR-037_

  - [x] 2.6 Define and migrate AI gateway and logging tables
    - Write Drizzle schema for `model_routing` and `model_invocation_logs`
    - Seed `model_routing` with default task-type → model assignments per design §7
    - _Requirements: FR-031, FR-032_

- [x] 3. Auth & Onboarding
  - [x] 3.1 Implement authentication API routes
    - Write `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` handlers using Supabase Auth SDK
    - Validate request bodies with Zod; enforce password policy (FR-001.8): min 8 chars, uppercase, lowercase, digit
    - Return signed session + refresh tokens in `Set-Cookie` headers (httpOnly, Secure, SameSite=Strict)
    - _Requirements: FR-001_

  - [x] 3.2 Implement auth middleware for all protected API routes
    - Create `apps/api/middleware.ts` that validates the session JWT on every non-`/api/auth/*` route
    - Attach `ctx.user` (user_id, auth_id) to every request; return HTTP 401 on invalid/expired tokens
    - _Requirements: FR-001, FR-038_

  - [x] 3.3 Implement academic profile and subject API routes
    - Write `POST/GET/PATCH /api/profile` and `GET/POST/PATCH/DELETE /api/subjects` handlers
    - On `POST /api/profile` success, create one `Subject_Workspace` record per submitted subject (FR-002.3)
    - _Requirements: FR-002, FR-010_

  - [ ]* 3.4 Write unit tests for auth validation and profile creation
    - Test duplicate-email registration returns error without creating duplicate (FR-001 idempotence property)
    - Test that subject count after onboarding equals subjects submitted (FR-002 invariant)
    - Test password policy rejection for weak passwords
    - _Requirements: FR-001, FR-002_

  - [x] 3.5 Build mobile auth screens (Login, Register, Onboarding)
    - Create `app/(auth)/login.tsx`, `register.tsx`, `onboarding.tsx` with Expo Router
    - Implement onboarding wizard: university → branch → semester → subjects (FR-002.1); validate required fields before progression
    - Store session token in `expo-secure-store`; redirect to Semester Workspace on completion
    - _Requirements: FR-001, FR-002_

- [x] 4. File Upload & Storage
  - [x] 4.1 Implement presigned-URL upload flow
    - Write `POST /api/resources/upload` handler: validate file type (PDF/PPT/PPTX/JPEG/PNG/WEBP) and size (≤ 50 MB), compute SHA-256 hash, check for existing resource, return presigned PUT URL + resource_id
    - Write `POST /api/resources/:id/confirm` handler: verify upload completion, update resource status to `pending`, enqueue `classify-document` job
    - _Requirements: FR-003_

  - [x] 4.2 Implement resource list and detail API routes
    - Write `GET /api/resources` (filter by subject_id), `GET /api/resources/:id`, `DELETE /api/resources/:id`
    - On delete: cascade remove chunks, embeddings, flashcards, and auto-generated content from storage
    - _Requirements: FR-003, FR-033_

  - [x] 4.3 Implement SSE status-stream endpoint
    - Write `GET /api/resources/:id/status` as a Server-Sent Events stream
    - Push status events (`classifying` → `ocr` → `embedding` → `graphing` → `generating` → `ready` | `error`) as the BullMQ job chain progresses
    - _Requirements: FR-008_

  - [ ]* 4.4 Write unit tests for upload deduplication
    - Test that uploading the same SHA-256 hash twice returns existing resource_id (FR-003 idempotence)
    - Test that oversized file returns descriptive error before initiating upload
    - _Requirements: FR-003_

  - [x] 4.5 Build mobile file upload UI
    - Implement file picker (PDF/image) using `expo-document-picker` + `expo-image-picker`
    - Display upload progress bar (percentage) using presigned PUT + XMLHttpRequest progress events
    - Subscribe to SSE status stream; show pipeline stage labels ("Reading document", "Understanding chapters", etc.)
    - Display retry button on upload or processing failure
    - _Requirements: FR-003, FR-008_

- [x] 5. Document Processing Pipeline (BullMQ + LangGraph)
  - [x] 5.1 Implement document classification worker
    - Create BullMQ worker for `classify-document` job in `document-pipeline` queue
    - Build LangGraph `classify_document` node: read file from storage, invoke AI Gateway with `classification` task type, store subject + unit classification in `resources` table
    - When confidence < 0.70, update resource status to `classifying` and emit a `confirm_needed` event; otherwise advance to `ocr-extract`
    - _Requirements: FR-004_

  - [x] 5.2 Implement OCR extraction worker
    - Create BullMQ worker for `ocr-extract` job (120s timeout, 2 retries)
    - Invoke Docling via AI Gateway (`ocr` task type); fall back to Tesseract on failure
    - Preserve page-level structure and page numbers; store extracted text in `resources.raw_text` and update status
    - On both-engines failure: set status to `unreadable`, log error, emit notification job
    - _Requirements: FR-005_

  - [x] 5.3 Implement text chunking worker
    - Create BullMQ worker for `chunk-text` job
    - Split extracted text into 256–512 token overlapping chunks; insert rows into `resource_chunks` preserving `page_number` and `chunk_index`
    - _Requirements: FR-007_

  - [x] 5.4 Implement embedding generation worker
    - Create BullMQ worker for `embed-chunks` job
    - Batch-invoke local embedding model (BGE/Nomic via AI Gateway, task type `embedding`) for all chunks of the resource
    - Store vectors in `resource_chunks.embedding` (pgvector column); update resource status
    - _Requirements: FR-007_

  - [ ]* 5.5 Write property test for chunk-embed round-trip
    - **Property: Round-trip** — a stored chunk retrieved by a semantically equivalent query SHALL have cosine similarity ≥ 0.80
    - **Validates: FR-007 correctness property**
    - _Requirements: FR-007_

  - [x] 5.6 Implement knowledge graph construction worker
    - Create BullMQ worker for `update-knowledge-graph` job
    - Invoke Knowledge Structurer agent (LangGraph node): extract topics, units, concepts, definitions; insert/update `knowledge_graph_nodes`; merge duplicates via canonical_id
    - _Requirements: FR-006_

  - [x] 5.7 Wire the full document pipeline job chain
    - In `confirm-upload` handler, enqueue the full job chain: classify → ocr → chunk → [embed + knowledge-graph in parallel] → trigger-resource-intelligence → mark-ready + notify
    - Ensure each job passes `resource_id` and `user_id` so all workers enforce row-level isolation
    - _Requirements: FR-004, FR-005, FR-006, FR-007, FR-008_

- [x] 6. Resource Auto-Intelligence Pipeline
  - [x] 6.1 Implement resource intelligence fan-out worker
    - Create BullMQ worker for `trigger-resource-intelligence` that fan-outs 6 sub-jobs: `generate-summary`, `generate-key-topics`, `generate-flashcards`, `generate-definitions`, `generate-viva-questions`, `generate-exam-questions`
    - All sub-jobs run asynchronously; track completion status per resource; surface "Generating smart content…" / "Ready" states
    - _Requirements: FR-033_

  - [x] 6.2 Implement summary and key-topics generation workers
    - `generate-summary`: invoke AI Gateway (`summary_gen`); store ≤ 200-word summary linked to resource
    - `generate-key-topics`: invoke AI Gateway; store 5–15 bullet points
    - _Requirements: FR-033_

  - [x] 6.3 Implement auto-flashcard generation worker
    - `generate-flashcards`: invoke Flashcard Agent (LangGraph) per chunk batch; create Basic, Concept, Formula, One-line Revision cards; enforce ≥1 card per 300 words, max 50 per resource
    - Link each card to `source_resource_id` and `source_chunk_index`
    - _Requirements: FR-020, FR-033_

  - [ ]* 6.4 Write property test for flashcard source integrity
    - **Property: Invariant** — FOR ALL generated flashcards, source_resource_id and source_chunk_index SHALL resolve to existing stored chunks
    - **Validates: FR-020 correctness property**
    - _Requirements: FR-020_

  - [x] 6.5 Implement definition list, viva questions, and exam question generation workers
    - `generate-definitions`: extract and store term → definition pairs from chunks
    - `generate-viva-questions`: produce 5–10 viva questions per resource
    - `generate-exam-questions`: produce 3–7 expected exam questions per unit covered
    - _Requirements: FR-033_

  - [x] 6.6 Implement cascade-delete for resource and its generated content
    - On `DELETE /api/resources/:id`: delete chunks + embeddings from `resource_chunks`, flashcards from `flashcards`, and all auto-generated content; remove object from storage
    - _Requirements: FR-033_

- [x] 7. AI Gateway & Model Routing
  - [x] 7.1 Implement the AI Gateway service module
    - Create `apps/api/lib/ai-gateway.ts` implementing the `AIGateway` interface (design §7)
    - Load `model_routing` table from DB; cache in Redis with 60s TTL; hot-reload on config change without deployment
    - Dispatch to Ollama (local), OpenAI, Gemini, or Claude SDKs based on routing config
    - _Requirements: FR-031_

  - [x] 7.2 Implement fallback logic and invocation logging
    - On primary model unavailable: fall back to `fallback_provider`/`fallback_model`; log `fallback_used = true`
    - Write every invocation to `model_invocation_logs`: model_name, task_type, latency_ms, input_tokens, output_tokens, estimated_cost_usd, fallback_used
    - _Requirements: FR-031, FR-032_

  - [x] 7.3 Implement model routing configuration API
    - Write `GET/PATCH /api/admin/model-routing` to read and update `model_routing` rows; invalidate Redis cache on update
    - _Requirements: FR-031_

  - [ ]* 7.4 Write property test for model routing round-trip
    - **Property: Round-trip** — a routing config written via the API SHALL be read back without loss or modification
    - **Validates: FR-031 correctness property**
    - _Requirements: FR-031_

- [ ] 8. Checkpoint — Ensure infrastructure, pipeline, and gateway tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. RAG Study Chat
  - [x] 9.1 Implement vector search service
    - Create `apps/api/lib/vector-search.ts`: run pgvector cosine-similarity query scoped to `(user_id, subject_id)`; return top-K chunks (default K=5) in ≤ 500 ms
    - Enforce minimum similarity threshold of 0.50 for RAG; 0.70 for grounded citations
    - _Requirements: FR-007, FR-012, FR-030_

  - [x] 9.2 Implement RAG query LangGraph pipeline
    - Build LangGraph graph: `load_student_model` → `vector_search` → branch(chunks found / not found) → `build_grounded_prompt` → `invoke_answer_generator` → `quality_verify` → `return_with_citations`
    - On no-chunks path: check goal mode; Exam Mode → prompt upload; other modes → general knowledge answer with disclaimer
    - _Requirements: FR-012, FR-030_

  - [x] 9.3 Implement study session API routes
    - Write `POST /api/sessions` (create session), `POST /api/sessions/:id/message` (streaming RAG response), `POST /api/sessions/:id/end`, `GET /api/sessions`, `GET /api/sessions/:id`
    - Stream response via Next.js `Response` streaming; include inline citations (document name + page)
    - Enforce 30-minute inactivity auto-end; finalize session record on end
    - _Requirements: FR-011, FR-012, FR-013_

  - [x] 9.4 Implement session finalization and Student Model update
    - On session end: aggregate topics covered, questions asked, weak concepts, quiz scores; persist to `study_sessions`
    - Enqueue `analytics` job to update `student_topic_profiles` within 60 seconds
    - Expose last-10-session read access to RAG context builder
    - _Requirements: FR-013, FR-025_

  - [ ]* 9.5 Write property test for RAG citation invariant
    - **Property: Invariant** — FOR ALL RAG responses containing citations, every cited document name and page SHALL resolve to an existing Resource in the Vector_Store
    - **Validates: FR-012 correctness property**
    - _Requirements: FR-012_

  - [ ]* 9.6 Write property test for RAG idempotence
    - **Property: Idempotence** — submitting the same question in the same session context twice SHALL produce responses grounded in the same retrieved chunks
    - **Validates: FR-012 correctness property**
    - _Requirements: FR-012_

- [x] 10. PYQ Engine
  - [x] 10.1 Implement PYQ extraction worker
    - Create BullMQ worker for `pyq-extract` job in `pyq-processing` queue
    - Invoke PYQ Engine LangGraph node: extract questions from OCR'd text, preserving question_text, mark_value, unit_header, exam_year; insert into `pyq_questions`
    - _Requirements: FR-014_

  - [x] 10.2 Implement PYQ deduplication and grouping
    - Create `pyq-dedup` job: cluster semantically equivalent questions using vector similarity; assign `canonical_id` to duplicates; increment `repeat_count` on canonical
    - Idempotency: detect same file by SHA-256 before re-inserting questions
    - _Requirements: FR-014_

  - [ ]* 10.3 Write property test for PYQ idempotence
    - **Property: Idempotence** — uploading the same PYQ file twice SHALL NOT create duplicate question entries
    - **Validates: FR-014 correctness property**
    - _Requirements: FR-014_

  - [x] 10.4 Implement PYQ frequency analysis and priority labelling
    - Create `pyq-frequency` job: compute `frequency = repeat_count / total_pyq_years`; assign priority_label (High ≥ 3, Medium = 2, Low = 1); update predicted list (top-10) when exam date is set
    - _Requirements: FR-015_

  - [ ]* 10.5 Write property test for PYQ frequency invariant
    - **Property: Invariant** — FOR ALL canonical questions, `frequency = repeat_count / total_pyq_years` SHALL always be in range [0, 1]
    - **Property: Metamorphic** — adding a PYQ with an existing question SHALL increase its repeat_count by exactly 1 and SHALL NOT decrease any other question's repeat_count
    - **Validates: FR-015 correctness properties**
    - _Requirements: FR-015_

  - [x] 10.6 Implement PYQ API routes
    - Write `GET /api/subjects/:id/pyqs`, `GET /api/subjects/:id/pyqs/heatmap`, `GET /api/subjects/:id/pyqs/predicted`, `POST /api/pyqs/:id/answer`
    - `POST /api/pyqs/:id/answer`: check answer_bank cache first; if miss, generate via Answer Generator + Quality Verifier; cache result
    - _Requirements: FR-015, FR-016_

  - [ ]* 10.7 Write unit tests for PYQ answer caching
    - Test that repeated answer requests for same PYQ return cached answer without re-generating
    - Test that knowledge-gap disclaimer is present when notes lack coverage
    - _Requirements: FR-016_

- [x] 11. Answer Generation & Optimizer
  - [x] 11.1 Implement the Answer Generator LangGraph node
    - Build `answer_generator` node: read Student_Model snapshot (≤ 5 min old), apply preferred style/length/confidence adjustments, invoke AI Gateway (`answer_gen`), enforce word ceilings (2-mark ≤ 80, 5-mark ≤ 250, 10-mark ≤ 600)
    - Support format variants: Topper, University, Concise, Revision, Bullet, Definition-only
    - _Requirements: FR-017, FR-018, FR-026_

  - [ ]* 11.2 Write property test for answer word-count invariant
    - **Property: Invariant** — FOR ALL generated answers, word count SHALL fall within ±15% of the target range for the requested mark value
    - **Property: Metamorphic** — Concise format SHALL always produce fewer words than Topper Answer for the same mark value
    - **Validates: FR-017 correctness properties**
    - _Requirements: FR-017_

  - [x] 11.3 Implement the Quality Verifier LangGraph node
    - Build `quality_verifier` node: check (a) no fabricated citations, (b) word count in target range, (c) structural completeness for selected format
    - Complete checks in ≤ 3 seconds; on violation: auto-regenerate if fixable, else return with quality warning
    - Log all rejections + violation types to `model_invocation_logs`
    - _Requirements: FR-032_

  - [x] 11.4 Implement answer generation API routes
    - Write `POST /api/answers/generate` and `POST /api/answers/optimize`
    - `/generate`: validate mark_value, format, question; run Answer Generator → Quality Verifier pipeline; respond within 15s
    - _Requirements: FR-017, FR-018_

  - [x] 11.5 Implement the Smart Answer Optimizer
    - Build `answer_optimizer` LangGraph node: score student answer on structure, keyword coverage, concept completeness, clarity, examples, presentation (0–10 each); produce diff view (add / rephrase / correct); generate improved version
    - Record identified missing concepts as weak signals in `student_topic_profiles`
    - _Requirements: FR-019, FR-028_

  - [ ]* 11.6 Write property test for Answer Optimizer round-trip
    - **Property: Round-trip** — submitting the Answer Generator's own Topper Answer as input to the Optimizer SHALL produce overall score ≥ 8/10 with no missing-concept flags
    - **Validates: FR-019 correctness property**
    - _Requirements: FR-019_

- [x] 12. Flashcard Engine & Spaced Repetition
  - [x] 12.1 Implement SM-2 spaced-repetition algorithm
    - Create `apps/api/lib/sm2.ts` implementing the SM-2 algorithm per design §4.4
    - Inputs: current `interval_days`, `ease_factor`, rating (`again`/`hard`/`good`/`easy`); outputs: new `interval_days`, `ease_factor`, `due_date`
    - Clamp `ease_factor` to [1.3, 2.5]; reset interval to 1 on "again"
    - _Requirements: FR-021_

  - [ ]* 12.2 Write property tests for SM-2 algorithm
    - **Property: Invariant** — FOR ALL cards rated "Easy", next interval SHALL be strictly greater than previous interval
    - **Property: Invariant** — FOR ALL cards rated "Again", next interval SHALL be reset to 1 day
    - **Property: Idempotence** — rating "Good" twice in succession SHALL NOT reduce interval below value after first rating
    - **Validates: FR-021 correctness properties**
    - _Requirements: FR-021_

  - [x] 12.3 Implement flashcard review and MCQ API routes
    - Write `GET /api/subjects/:id/flashcards` (due today first), `PATCH /api/flashcards/:id`, `DELETE /api/flashcards/:id`
    - Write `POST /api/flashcards/:id/review`: apply SM-2, update `interval_days`, `ease_factor`, `due_date`, `review_count`, `correct_recall_rate`
    - Write `POST /api/subjects/:id/flashcards/quiz`: generate MCQs prioritizing weak topics from Student_Model
    - _Requirements: FR-021, FR-022_

  - [x] 12.4 Implement MCQ generation with plausible distractors
    - Build `quiz_gen` LangGraph node: given flashcard content, generate 1 correct + 3 plausible distractors from related flashcard corpus via AI Gateway (`quiz_gen`)
    - Record per-question accuracy in Study_Session on quiz completion; update weak-topic signals
    - _Requirements: FR-022, FR-028_

  - [ ]* 12.5 Write unit tests for flashcard generation constraints
    - Test ≥1 flashcard per 300 words of text, ≤50 per resource
    - Test that duplicate front/back pairs are not created for overlapping resources (FR-020 metamorphic property)
    - _Requirements: FR-020_

- [x] 13. Homework Generation
  - [x] 13.1 Implement Homework Agent LangGraph node
    - Build `homework_agent` node: read style profile (if exists), retrieve RAG chunks for the question, invoke AI Gateway (`homework_gen`), enforce word limit ±5%, run grammar/spelling check before returning
    - Apply style signals (sentence length, formality, vocabulary, paragraph structure) from `homework_style_profiles`
    - _Requirements: FR-023, FR-024_

  - [ ]* 13.2 Write property test for homework word-count invariant
    - **Property: Invariant** — FOR ALL generated homework answers, word count SHALL fall within ±5% of the specified word limit when a limit is provided
    - **Validates: FR-023 correctness property**
    - _Requirements: FR-023_

  - [x] 13.3 Implement homework style fingerprinting
    - Build `extract_style_signals` function: parse uploaded homework sample; extract avg sentence length, paragraph structure, vocabulary range, formality level; upsert `homework_style_profiles`
    - _Requirements: FR-024_

  - [x] 13.4 Implement homework API routes
    - Write `POST /api/homework/generate`, `POST /api/homework/style`, `DELETE /api/homework/style/:subjectId`
    - `/generate` response includes: answer text, word count, readability score, handwriting-friendly version
    - _Requirements: FR-023, FR-024_

  - [ ]* 13.5 Write unit tests for homework style persistence
    - Test that style profile is applied on subsequent generation without re-uploading sample
    - Test that style reset clears profile and reverts to neutral academic style
    - _Requirements: FR-024_

- [x] 14. Checkpoint — End-to-End Testing of GenAI Features
  - [x] Write integration test passing a sample syllabus, simulating flashcard reviews, and verifying Student Model state updates
  - [x] Ensure PYQ deduplication logic handles identical uploads correctly

- [x] 15. Student Digital Twin (Student Model)
  - [x] 15.1 Implement Student Model observer and update hookservice
    - Create `apps/api/lib/student-model.ts`: initialize `student_models` record on onboarding with defaults; expose `updateFromSession`, `updateFromQuiz`, `updateFromOptimizer`, `updateFromFlashcardReview` functions
    - All updates are inferred — no manual editing; enforce that model snapshot used by generators is ≤ 5 minutes old
    - _Requirements: FR-025, FR-026_

  - [x] 15.2 Implement weak topic detection logic
    - In `student-model.ts`: flag topic as "weak" when quiz accuracy < 60% in last 3 attempts OR Optimizer scores < 5/10 twice OR student marks manually
    - Downgrade to "improving" when quiz accuracy > 75% in last 3 attempts
    - Log weak_reason for each flag; enforce consistency invariant
    - _Requirements: FR-028_

  - [ ]* 15.3 Write property test for weak-topic state machine
    - **Property: Invariant** — no topic SHALL be flagged "weak" unless the stored quiz/optimizer history meets the defined thresholds
    - **Property: Metamorphic** — a "weak" topic answered correctly 3 times in a row SHALL transition to "improving", never to a stronger "weak"
    - **Validates: FR-028 correctness properties**
    - _Requirements: FR-028_

  - [x] 15.4 Implement Student Model and analytics API routes
    - Write `GET /api/student-model`, `GET /api/subjects/:id/analytics`, `GET /api/analytics/health`
    - Enforce read-only view; ensure all returned data is owner-scoped
    - _Requirements: FR-025, FR-036, FR-037_

  - [ ]* 15.5 Write property test for Student Model freshness invariant
    - **Property: Invariant** — FOR ALL Answer_Generator invocations, the Student_Model snapshot used SHALL be the most recent persisted version at the time of the call (not older than 5 minutes)
    - **Validates: FR-026 correctness property**
    - _Requirements: FR-026_

- [x] 16. Analytics & Dashboards
  - [x] 16.1 Implement Academic Health Score computation
    - Create `analytics-health` worker: aggregate per-subject readiness scores with homework completion rate and revision consistency into a single 0–100 score
    - Update `student_models.academic_health_score` within 5 minutes of triggering event
    - Enforce score stays in [0, 100]; completing a session SHALL NOT decrease the score
    - _Requirements: FR-037_

  - [x] 16.2 Implement Semester Workspace metrics API
    - Implement `app/(app)/index.tsx`: display Academic Health Score, today's study plan, nearest exam countdown, homework due within 48h, top-3 weak topics, and quick-action buttons (Study / Revision / PYQ / Viva / Homework / Camera Notes)
    - Use TanStack Query to load all data; Zustand for active subject/session context
    - _Requirements: FR-009, FR-037_

  - [x] 16.3 Implement Subject Workspace metrics
    - Implement `app/(app)/subject/[id]/index.tsx` (Overview) and tab navigator for Notes, PYQs, Flashcards, Revision, Analytics, Resources tabs
    - Overview tab: subject completion %, top-3 weak units, last session summary, exam date countdown, "Study Now" button
    - Allow setting/updating exam date per subject
    - _Requirements: FR-010, FR-009_

  - [ ]* 16.4 Write property tests for Health Score invariants
    - **Property: Invariant** — Academic Health Score SHALL always be in range [0, 100]
    - **Property: Metamorphic** — completing a study session SHALL NOT decrease the Academic Health Score below its pre-session value
    - **Validates: FR-037 correctness properties**
    - _Requirements: FR-037_

  - [ ]* 16.5 Write unit tests for readiness score formula
    - Test all five weighted components sum to 1.0
    - Test boundary values (all-zero inputs → 0, all-max inputs → 100)
    - _Requirements: FR-036_

- [x] 17. Security Hardening
  - [x] 17.1 Implement PostgreSQL Row-Level Security policies
    - Write and apply RLS policies on all tables: `USING (user_id = auth.uid())` on SELECT/UPDATE/DELETE; enable RLS on `users`, `academic_profiles`, `subjects`, `resources`, `resource_chunks`, `knowledge_graph_nodes`, `pyq_questions`, `answer_bank`, `flashcards`, `study_sessions`, `student_models`, `student_topic_profiles`, `homework_style_profiles`
    - _Requirements: FR-038_

  - [x] 17.2 Implement cross-student access prevention at API layer
    - Add `verifyOwnership(userId, resourceId, table)` helper used in all routes that access user-owned records
    - On ownership mismatch: return HTTP 403 and log the access attempt
    - _Requirements: FR-038_

  - [x] 21.1 Implement push notifications registration and delivery
    - Write `POST /api/notifications/register` (store Expo push token) and `PATCH /api/notifications/preferences`
    - Create BullMQ `notifications` worker: schedule exam countdown (7d/3d/1d), due flashcard reminders, homework due reminders, 48h inactivity re-engagement messages
    - Use Expo Server SDK (`expo-server-sdk`) to send push notifications
    - Include top-3 PYQ recommended questions in exam countdown notifications
    - _Requirements: FR-035_

  - [x] 17.3 Implement secure presigned URL issuance for file reads
    - Add `GET /api/resources/:id/download` that verifies ownership, then issues a Supabase/S3 presigned GET URL with 1-hour expiry
    - Enforce server-side encryption at rest via storage bucket configuration
    - Enforce HTTPS-only in Next.js config (`headers()` force HTTPS) and storage bucket policy
    - _Requirements: FR-039_

  - [x] 17.4 Implement input validation across all API routes
    - Audit every route handler; ensure all request bodies are validated with a Zod schema before any DB or agent call
    - Add `sanitize-html` for any user-supplied text that will be stored and re-rendered
    - _Requirements: FR-038, FR-039_

  - [ ]* 17.6 Write unit tests for data isolation
    - Test that API returns HTTP 403 when a token belonging to user A requests a resource owned by user B
    - Test that Vector_Store query with user_id A never returns chunks owned by user_id B
    - **Validates: FR-038 correctness property**
    - _Requirements: FR-038_

- [x] 18. Mobile UI — Core Screens
  - [x] 18.1 Build Semester Workspace home screen
    - Implement `app/(app)/study/[sessionId].tsx`: goal selector (Study, Exam, Revision, Quick Doubt, Crash Course) before entering chat
    - Render streaming RAG responses; display inline citations with tap-to-view source; maintain session context across messages
    - _Requirements: FR-011, FR-012, FR-013_

  - [x] 18.2 Build Subject Workspace screens
    - Implement `homework.tsx`: question input, teacher instructions, word limit, style sample upload
    - Display generated answer with word count, readability score, handwriting-friendly version toggle
    - Show style profile status; allow reset
    - _Requirements: FR-023, FR-024_

  - [x] 18.4 Build Answer Generator and Answer Optimizer screens
    - Implement `answer-generator.tsx`: question input + mark-value selector + format tabs; display streamed answer with word count
    - Implement `answer-optimizer.tsx`: student-answer input + question; display per-dimension scores, diff view, improved version
    - _Requirements: FR-017, FR-018, FR-019_

- [x] 19. Mobile UI — Feature Screens
  - [x] 19.1 Build PYQ screens
    - Implement Subject PYQs tab: list of canonical questions grouped by unit/topic, repeat count badges, priority labels
    - Add Heatmap view (unit → frequency as colour spectrum: low/medium/high)
    - Add Predicted Questions section (top-10 for set exam date)
    - Tap question → show cached or generate answer with "Key Points Covered" checklist
    - _Requirements: FR-014, FR-015, FR-016_

  - [x] 19.2 Build Flashcard review and quiz screens
    - Implement flashcard deck view: due cards sorted (overdue first), swipe-to-reveal back, rating buttons (Again / Hard / Good / Easy)
    - Display next-review-date when no cards are due
    - Implement quiz screen: MCQ with immediate correct/wrong feedback, source flashcard link, session accuracy summary
    - _Requirements: FR-021, FR-022_

  - [x] 19.3 Build Homework screen
    - Implement `homework.tsx`: question input, teacher instructions, word limit, style sample upload
    - Display generated answer with word count, readability score, handwriting-friendly version toggle
    - Show style profile status; allow reset
    - _Requirements: FR-023, FR-024_

  - [x] 19.4 Build Camera Notes capture screen
    - Implement `camera-notes.tsx`: camera capture using `expo-camera`; show OCR confidence indicator
    - If confidence < 40% prompt retake with lighting/focus guidance; on success upload and trigger pipeline
    - _Requirements: FR-034_

  - [x] 19.5 Build Analytics screens
    - Implement Subject Analytics tab: knowledge coverage by unit (bar chart), weak/strong units, total study time, quiz accuracy trend (7-day line chart), exam readiness score with delta indicator, 30-day improvement curve
    - _Requirements: FR-036_

  - [x] 19.6 Build Settings screen
    - Implement `settings.tsx`: notification preferences (enable/disable per type, quiet hours), academic profile editing (university, branch, semester, subjects)
    - _Requirements: FR-002, FR-035_

- [x] 20. Offline Mode
  - [x] 20.1 Implement offline flashcard sync API
    - Write `POST /api/flashcards/sync`: accept batch of `{card_id, rating, reviewed_at, client_uuid}` objects; deduplicate by `client_uuid`; apply SM-2 updates idempotently
    - _Requirements: FR-040_

  - [x] 20.2 Implement mobile offline flashcard cache and queue
    - On app foreground with internet: fetch due flashcards for next 24h; persist to MMKV store
    - While offline: record ratings in MMKV offline queue with client-generated UUID; display "Offline mode" indicator
    - On reconnect: call `POST /api/flashcards/sync`; confirm sync to user; clear queue
    - _Requirements: FR-040_

  - [ ]* 20.3 Write property tests for offline sync
    - **Property: Round-trip** — a rating recorded offline and synced SHALL produce the same SM-2 interval as an identical online rating
    - **Property: Idempotence** — syncing the same offline session data twice SHALL NOT produce duplicate records or incorrect intervals
    - **Validates: FR-040 correctness properties**
    - _Requirements: FR-040_

- [ ] 21. Smart Notifications
  - [ ]* 21.2 Write unit tests for notification specificity
    - Test that generic "time to study" notifications are never produced (all notifications must reference specific subject/topic/task)
    - Test that re-engagement notification fires after 48h inactivity with upcoming exam ≤ 7 days
    - _Requirements: FR-035_

- [x] 23. Integration Wiring & End-to-End
  - [x] 23.1 Wire Student Model context into all AI agent invocations
    - Audit every AI Gateway call site; ensure `student_model` snapshot is passed as a required context parameter per FR-029
    - Verify no agent issues context-gathering prompts for information already in Student_Model
    - _Requirements: FR-029_

  - [x] 23.2 Wire academic planner daily plan generation
    - Implement `generate-daily-plan` BullMQ job scheduled at 06:00 local device time via cron
    - Plan factors in: upcoming exams, incomplete homework, weak topics, study-time preference; stores plan in `study_sessions` metadata
    - Re-adjust plan when student skips a session
    - _Requirements: FR-009, FR-027_

  - [x] 23.3 Implement context pre-population across all workflows
    - In every workflow entry (`/api/sessions`, `/api/answers/generate`, `/api/homework/generate`, `/api/pyqs/:id/answer`): pre-populate subject, semester, university, exam date from Student_Model without prompting student
    - If a required value is missing (e.g., exam date not set), ask only for that field
    - _Requirements: FR-029_

  - [ ]* 23.4 Write integration tests for end-to-end upload → answer flow
    - Upload a PDF → process through pipeline → open RAG session → ask question → verify answer is grounded in uploaded content with valid citations
    - _Requirements: FR-003, FR-005, FR-007, FR-012_

  - [ ]* 23.5 Write integration tests for offline → sync cycle
    - Simulate offline review of 10 flashcards → reconnect → sync → verify SM-2 intervals match online computation
    - _Requirements: FR-040_

- [x] 24. Final Checkpoint — All tests pass, system ready for beta
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build; they improve correctness guarantees but are not blocking
- Every task references specific FR numbers for traceability back to requirements.md
- Checkpoints at tasks 8, 14, 22, and 24 ensure incremental validation at logical phase boundaries
- All AI agent code lives in `apps/api/lib/agents/`; each agent is a LangGraph node importable by workers and API route handlers
- Property-based tests validate universal correctness properties from the design (SM-2 invariants, vector round-trip, answer word counts, data isolation)
- Unit tests validate specific examples, edge cases, and error conditions
- The mobile app consumes all APIs through TanStack Query hooks in `apps/mobile/hooks/`

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1"]
    },
    {
      "id": 1,
      "tasks": ["1.2", "1.3"]
    },
    {
      "id": 2,
      "tasks": ["1.4", "1.5"]
    },
    {
      "id": 3,
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"]
    },
    {
      "id": 4,
      "tasks": ["3.1", "3.2", "4.1", "7.1"]
    },
    {
      "id": 5,
      "tasks": ["3.3", "4.2", "4.3", "7.2", "7.3"]
    },
    {
      "id": 6,
      "tasks": ["3.4", "4.4", "7.4", "5.1"]
    },
    {
      "id": 7,
      "tasks": ["3.5", "4.5", "5.2"]
    },
    {
      "id": 8,
      "tasks": ["5.3", "5.4"]
    },
    {
      "id": 9,
      "tasks": ["5.5", "5.6"]
    },
    {
      "id": 10,
      "tasks": ["5.7", "6.1"]
    },
    {
      "id": 11,
      "tasks": ["6.2", "6.3", "6.5"]
    },
    {
      "id": 12,
      "tasks": ["6.4", "6.6", "9.1"]
    },
    {
      "id": 13,
      "tasks": ["9.2", "11.1", "12.1"]
    },
    {
      "id": 14,
      "tasks": ["9.3", "11.3", "12.3", "15.1"]
    },
    {
      "id": 15,
      "tasks": ["9.4", "11.4", "11.5", "12.4", "15.2", "10.1"]
    },
    {
      "id": 16,
      "tasks": ["9.5", "9.6", "11.2", "11.6", "12.2", "12.5", "15.3", "15.5", "10.2"]
    },
    {
      "id": 17,
      "tasks": ["10.3", "10.4", "13.1", "16.1", "17.1", "17.2"]
    },
    {
      "id": 18,
      "tasks": ["10.5", "10.6", "13.2", "13.3", "16.2", "17.3", "17.5"]
    },
    {
      "id": 19,
      "tasks": ["10.7", "13.4", "13.5", "16.3", "16.4", "15.4", "17.4"]
    },
    {
      "id": 20,
      "tasks": ["18.1", "18.2", "20.1"]
    },
    {
      "id": 21,
      "tasks": ["18.3", "18.4", "19.1", "20.2", "21.1"]
    },
    {
      "id": 22,
      "tasks": ["19.2", "19.3", "19.4", "19.5", "19.6", "20.3", "21.2"]
    },
    {
      "id": 23,
      "tasks": ["23.1", "23.2", "23.3"]
    },
    {
      "id": 24,
      "tasks": ["23.4", "23.5"]
    }
  ]
}
```
