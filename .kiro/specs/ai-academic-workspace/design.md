# Design Document: AI Academic Workspace

## Overview

AI Academic Workspace is a mobile-first academic platform built with React Native + Expo (client) and Next.js (backend API). The system ingests academic documents, processes them through an AI pipeline, and exposes a set of specialized AI agents that help students study, revise, practice, and track progress across an entire semester.

This document covers the technical architecture, data models, API design, AI agent topology, key system flows, and mobile app structure for the MVP (Phases 1–2).

---

## 1. System Architecture

### 1.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native + Expo)            │
│  Semester Workspace │ Subject Workspace │ Study Chat │ Offline  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS / WebSocket
┌───────────────────────────────▼─────────────────────────────────┐
│                      Next.js Backend (API Routes)               │
│  Auth Middleware │ REST API │ WebSocket Server │ Job Queue       │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼────┐  ┌─────▼──────────────┐
│ Auth Service│ │ PostgreSQL  │ │  Redis  │  │  Object Storage    │
│(Clerk/Supa.)│ │ + pgvector  │ │ (cache) │  │  (S3/Supabase)     │
└─────────────┘ └─────────────┘ └─────────┘  └────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    AI Gateway (Model Router)                     │
│   Local models (OCR, embeddings, flashcards, quiz gen)          │
│   Cloud models (Answer Gen, Answer Optimizer, RAG reasoning)    │
└──────┬──────────────────────────────────────────────────────────┘
       │ LangGraph Agent Orchestration
┌──────▼──────────────────────────────────────────────────────────┐
│                        Agent Layer                              │
│  Document Processor │ Knowledge Structurer │ RAG Router         │
│  PYQ Engine │ Answer Generator │ Flashcard Engine               │
│  Homework Agent │ Student Model Agent │ Analytics Agent         │
│  Academic Planner │ Quality Verifier                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Decisions

- **Next.js API routes** serve as the backend. Long-running jobs (OCR, embedding, agent invocations) run in a background job queue (BullMQ + Redis) so API responses are non-blocking.
- **pgvector** extension on PostgreSQL handles semantic search, keeping the vector store co-located with relational data and eliminating a separate vector DB service.
- **LangGraph** orchestrates all multi-step agent workflows (document pipeline, RAG chain, PYQ extraction). Each agent is a node in a directed graph with typed state.
- **AI Gateway** is a thin routing layer (a Next.js service module) that maps task types to model providers. Config stored in a `model_routing` table, hot-reloadable without deployment.
- **BullMQ** handles the async document processing pipeline. Each uploaded file spawns a job chain: classify → OCR → chunk → embed → knowledge graph → resource intelligence.

---

## 2. Data Models

### 2.1 Core Tables

#### `users`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
email       text UNIQUE NOT NULL
auth_id     text UNIQUE NOT NULL  -- Clerk/Supabase user ID
created_at  timestamptz DEFAULT now()
```

#### `academic_profiles`

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid REFERENCES users(id) ON DELETE CASCADE
university    text NOT NULL
branch        text NOT NULL
semester      int NOT NULL CHECK (semester BETWEEN 1 AND 10)
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

#### `subjects`

```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id            uuid REFERENCES users(id) ON DELETE CASCADE
academic_profile_id uuid REFERENCES academic_profiles(id)
name               text NOT NULL
exam_date          date
created_at         timestamptz DEFAULT now()
```

#### `resources`

```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id        uuid REFERENCES users(id) ON DELETE CASCADE
subject_id     uuid REFERENCES subjects(id)
filename       text NOT NULL
storage_url    text NOT NULL
file_type      text NOT NULL  -- 'pdf','pptx','jpeg','png','webp'
sha256_hash    text NOT NULL
size_bytes     bigint
status         text NOT NULL DEFAULT 'pending'
               -- pending | classifying | ocr | embedding | graphing | generating | ready | error | unreadable
error_message  text
created_at     timestamptz DEFAULT now()
```

#### `resource_chunks`

```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
resource_id    uuid REFERENCES resources(id) ON DELETE CASCADE
user_id        uuid REFERENCES users(id)
subject_id     uuid REFERENCES subjects(id)
chunk_index    int NOT NULL
page_number    int
content        text NOT NULL
token_count    int
embedding      vector(768)   -- pgvector column
created_at     timestamptz DEFAULT now()
```

#### `knowledge_graph_nodes`

```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id        uuid REFERENCES users(id) ON DELETE CASCADE
subject_id     uuid REFERENCES subjects(id)
node_type      text NOT NULL  -- 'topic' | 'unit' | 'chapter' | 'concept' | 'definition'
label          text NOT NULL
canonical_id   uuid REFERENCES knowledge_graph_nodes(id)  -- for merged nodes
source_resource_id uuid REFERENCES resources(id)
source_page    int
created_at     timestamptz DEFAULT now()
```

#### `pyq_questions`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid REFERENCES users(id) ON DELETE CASCADE
subject_id          uuid REFERENCES subjects(id)
resource_id         uuid REFERENCES resources(id)
canonical_id        uuid REFERENCES pyq_questions(id)  -- dedup grouping
question_text       text NOT NULL
mark_value          int   -- 2, 5, 10 or null if unknown
exam_year           text
unit_header         text
priority_label      text  -- 'High' | 'Medium' | 'Low'
repeat_count        int NOT NULL DEFAULT 1
knowledge_node_id   uuid REFERENCES knowledge_graph_nodes(id)
created_at          timestamptz DEFAULT now()
```

#### `answer_bank`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
pyq_question_id uuid REFERENCES pyq_questions(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id)
format          text NOT NULL  -- 'topper'|'university'|'concise'|'revision'|'bullet'|'definition'
mark_value      int
content         text NOT NULL
key_points      jsonb   -- array of key point strings
invalidated_at  timestamptz   -- set when source notes updated
created_at      timestamptz DEFAULT now()
```

#### `flashcards`

```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id              uuid REFERENCES users(id) ON DELETE CASCADE
subject_id           uuid REFERENCES subjects(id)
source_resource_id   uuid REFERENCES resources(id)
source_chunk_index   int NOT NULL
card_type            text NOT NULL  -- 'basic'|'concept'|'formula'|'revision'
front                text NOT NULL
back                 text NOT NULL
original_front       text          -- preserved if student edits
original_back        text
is_student_curated   boolean DEFAULT false
is_archived          boolean DEFAULT false
-- SM-2 spaced repetition fields
interval_days        int DEFAULT 1
ease_factor          float DEFAULT 2.5
due_date             date DEFAULT CURRENT_DATE
review_count         int DEFAULT 0
correct_recall_rate  float DEFAULT 0.0
last_reviewed_at     timestamptz
created_at           timestamptz DEFAULT now()
```

#### `study_sessions`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
subject_id      uuid REFERENCES subjects(id)
goal_mode       text NOT NULL  -- 'study'|'exam'|'revision'|'quick_doubt'|'crash_course'
started_at      timestamptz NOT NULL
ended_at        timestamptz
duration_secs   int
topics_covered  text[]
questions_asked int DEFAULT 0
weak_concepts   text[]
quiz_score      float
profile_snapshot jsonb  -- snapshot of student_model at session start
created_at      timestamptz DEFAULT now()
```

#### `student_models`

```sql
id                     uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id                uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE
preferred_answer_length text DEFAULT 'medium'   -- 'short'|'medium'|'long'
preferred_style        text DEFAULT 'text'      -- 'text'|'visual'|'bullet'
learning_pace          text DEFAULT 'standard'  -- 'slow'|'standard'|'fast'
academic_health_score  float DEFAULT 50.0
updated_at             timestamptz DEFAULT now()
```

#### `student_topic_profiles`

```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id           uuid REFERENCES users(id) ON DELETE CASCADE
subject_id        uuid REFERENCES subjects(id)
topic             text NOT NULL
confidence        int DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100)
weak_flag         text DEFAULT 'none'   -- 'none'|'weak'|'improving'
weak_reason       text   -- 'quiz_accuracy'|'answer_quality'|'manual'
definition_errors int DEFAULT 0
diagram_errors    int DEFAULT 0
numerical_errors  int DEFAULT 0
last_revised_at   timestamptz
revision_count    int DEFAULT 0
updated_at        timestamptz DEFAULT now()
UNIQUE(user_id, subject_id, topic)
```

#### `homework_style_profiles`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid REFERENCES users(id) ON DELETE CASCADE
subject_id          uuid REFERENCES subjects(id)
avg_sentence_length float
formality_level     text  -- 'informal'|'neutral'|'formal'
vocabulary_range    text  -- 'basic'|'intermediate'|'advanced'
paragraph_structure jsonb
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
UNIQUE(user_id, subject_id)
```

#### `model_routing`

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
task_type    text UNIQUE NOT NULL  -- 'ocr'|'embedding'|'flashcard_gen'|'answer_gen'|...
provider     text NOT NULL         -- 'local'|'openai'|'gemini'|'claude'
model_name   text NOT NULL
fallback_provider text
fallback_model    text
updated_at   timestamptz DEFAULT now()
```

---

## 3. API Design

All routes are Next.js API routes (`/api/...`). Authentication is enforced via middleware that validates the session token on every request. All responses return JSON. Error responses use `{ error: string, code: string }`.

### 3.1 Auth

```
POST   /api/auth/register          Register with email/password
POST   /api/auth/login             Login (email or OAuth)
POST   /api/auth/refresh           Refresh session token
POST   /api/auth/logout            Revoke session
```

### 3.2 Academic Profile & Subjects

```
POST   /api/profile                Create academic profile (onboarding)
GET    /api/profile                Get current profile
PATCH  /api/profile                Update profile (university, branch, semester)
GET    /api/subjects               List subjects for current user
POST   /api/subjects               Add a subject
PATCH  /api/subjects/:id           Update subject (name, exam date)
DELETE /api/subjects/:id           Remove a subject
```

### 3.3 Resources (File Upload)

```
POST   /api/resources/upload       Initiate upload — returns presigned PUT URL + resource ID
POST   /api/resources/:id/confirm  Confirm upload complete, triggers processing pipeline
GET    /api/resources              List resources (filter by subject)
GET    /api/resources/:id          Get resource metadata + processing status
GET    /api/resources/:id/status   Poll processing status (SSE stream)
DELETE /api/resources/:id          Delete resource + cascade generated content
```

### 3.4 Study Sessions & RAG Chat

```
POST   /api/sessions               Start a study session (subject, goal_mode)
POST   /api/sessions/:id/message   Send a message, get RAG response (streaming)
POST   /api/sessions/:id/end       End session explicitly
GET    /api/sessions               List past sessions (filter by subject)
GET    /api/sessions/:id           Get session details
```

### 3.5 PYQ Engine

```
GET    /api/subjects/:id/pyqs              List canonical PYQ questions
GET    /api/subjects/:id/pyqs/heatmap      Unit-level frequency heatmap
GET    /api/subjects/:id/pyqs/predicted    Top-10 predicted questions
POST   /api/pyqs/:id/answer                Generate or retrieve cached answer
```

### 3.6 Answer Generation

```
POST   /api/answers/generate       Generate answer (question, format, mark_value)
POST   /api/answers/optimize       Smart Answer Optimizer (question + student_answer)
```

### 3.7 Flashcards

```
GET    /api/subjects/:id/flashcards        List flashcards (due today first)
PATCH  /api/flashcards/:id                 Edit flashcard
DELETE /api/flashcards/:id                 Delete flashcard
POST   /api/flashcards/:id/review          Submit review rating (again/hard/good/easy)
POST   /api/subjects/:id/flashcards/quiz   Generate MCQ quiz
POST   /api/flashcards/sync                Offline sync (bulk rating upload)
```

### 3.8 Homework

```
POST   /api/homework/generate      Generate homework answer
POST   /api/homework/style         Upload style reference sample
DELETE /api/homework/style/:subjectId  Reset style profile
```

### 3.9 Student Model & Analytics

```
GET    /api/student-model          Get student model summary
GET    /api/subjects/:id/analytics Get per-subject analytics
GET    /api/analytics/health       Get Academic Health Score
```

### 3.10 Notifications

```
POST   /api/notifications/register     Register push token
PATCH  /api/notifications/preferences  Update notification preferences
```

---

## 4. AI Agent Architecture (LangGraph)

Each agent is a LangGraph node. The orchestration layer composes agents into graphs for multi-step workflows.

### 4.1 Agent Definitions

| Agent                | Model Tier    | Responsibility                                              |
| -------------------- | ------------- | ----------------------------------------------------------- |
| Document Processor   | Local         | OCR (Docling/Tesseract), text cleaning, page structure      |
| Knowledge Structurer | Local         | Topic/unit/concept extraction, Knowledge Graph construction |
| RAG Router           | Local         | Query → Vector_Store retrieval, chunk ranking               |
| Answer Generator     | Cloud         | Multi-format answer generation, Answer Optimizer scoring    |
| PYQ Engine           | Local + Cloud | Question extraction, dedup grouping, frequency computation  |
| Flashcard Agent      | Local         | Flashcard generation from chunks, MCQ generation            |
| Homework Agent       | Cloud         | Style-matched answer generation                             |
| Student Model Agent  | Local         | Profile updates from session outcomes                       |
| Academic Planner     | Local + Cloud | Daily plan generation, notification scheduling              |
| Analytics Agent      | Local         | Score computation, trend calculation                        |
| Quality Verifier     | Cloud         | Hallucination check, format/completeness validation         |

### 4.2 Document Processing Pipeline (LangGraph DAG)

```
Upload Confirmed
      │
      ▼
[classify_document]  ──(confidence < 0.70)──▶ [prompt_user_confirmation]
      │ (confidence ≥ 0.70)                          │
      ▼                                              ▼ (user confirms)
[ocr_extract]  ──(both engines fail)──▶ [mark_unreadable + notify]
      │
      ▼
[chunk_text]  (split into 256–512 token chunks, preserve page numbers)
      │
      ├──▶ [generate_embeddings]  ──▶ [store_in_pgvector]
      │
      ├──▶ [update_knowledge_graph]
      │
      └──▶ [trigger_resource_intelligence]
                  │
                  ├──▶ [generate_summary]
                  ├──▶ [generate_key_topics]
                  ├──▶ [generate_flashcards]
                  ├──▶ [generate_definitions]
                  ├──▶ [generate_viva_questions]
                  └──▶ [generate_expected_exam_questions]
```

### 4.3 RAG Query Flow

```
Student submits question
      │
      ▼
[load_student_model]  →  context snapshot (subject, mode, confidence, style)
      │
      ▼
[vector_search]  →  top-K chunks (cosine similarity ≥ 0.50, subject-scoped)
      │
      ├──(chunks found)──▶ [build_grounded_prompt]  →  [invoke_answer_generator]
      │                                                       │
      │                                               [quality_verify]
      │                                                       │
      │                                               [return_with_citations]
      │
      └──(no chunks)──▶ [goal_mode_check]
                              │
                    ├──(Exam Mode)──▶ [prompt_upload_notes]
                    └──(other modes)─▶ [general_knowledge_answer + disclaimer]
```

### 4.4 SM-2 Spaced Repetition Algorithm

```
On review rating:
  if rating == 'again':   interval = 1,  ease_factor unchanged
  if rating == 'hard':    interval = max(1, interval * 1.2)
  if rating == 'good':    interval = interval * ease_factor
  if rating == 'easy':    interval = interval * ease_factor * 1.3
                          ease_factor = ease_factor + 0.15

ease_factor always clamped to [1.3, 2.5]
next_due_date = today + interval (integer days)
```

---

## 5. Mobile App Structure (React Native + Expo)

### 5.1 Navigation Hierarchy

```
App
├── (auth)
│   ├── login.tsx
│   ├── register.tsx
│   └── onboarding.tsx
│
└── (app)  [requires auth]
    ├── index.tsx                      ← Semester Workspace (home)
    ├── subject/[id]/
    │   ├── index.tsx                  ← Subject Workspace Overview
    │   ├── notes.tsx
    │   ├── pyqs.tsx
    │   ├── flashcards.tsx
    │   ├── revision.tsx
    │   ├── analytics.tsx
    │   ├── viva.tsx
    │   └── resources.tsx
    ├── study/[sessionId].tsx          ← Goal-first study chat
    ├── answer-generator.tsx
    ├── answer-optimizer.tsx
    ├── homework.tsx
    ├── camera-notes.tsx
    └── settings.tsx
```

### 5.2 State Management

- **Server state**: TanStack Query (React Query) — all API data, caching, background refresh.
- **Local state**: Zustand — active session, offline queue, navigation context.
- **Offline store**: MMKV (fast key-value) — cached flashcards, offline review ratings queue.
- **Secure storage**: Expo SecureStore — session tokens, refresh tokens.

### 5.3 Real-time Updates

Resource processing status streamed via **Server-Sent Events (SSE)** from `/api/resources/:id/status`. The App subscribes on the Resources tab and updates the processing indicator in real time.

Study chat responses streamed via **HTTP streaming** (Next.js Response streaming) from `/api/sessions/:id/message`.

### 5.4 Offline Mode

1. On connection, App downloads due flashcards for the next 24 hours into MMKV.
2. While offline, reviews are recorded in the MMKV offline queue.
3. On reconnect, App calls `POST /api/flashcards/sync` with the batched ratings.
4. Sync is idempotent — each rating carries a client-generated UUID; duplicate submissions are deduplicated server-side.

---

## 6. Background Job Architecture (BullMQ + Redis)

### 6.1 Job Queues

| Queue                   | Jobs                                         | Priority |
| ----------------------- | -------------------------------------------- | -------- |
| `document-pipeline`     | classify, ocr, chunk, embed, knowledge-graph | High     |
| `resource-intelligence` | summary, flashcards, topics, viva-q, exam-q  | Medium   |
| `pyq-processing`        | extract, dedup, frequency                    | High     |
| `notifications`         | exam-reminder, flashcard-due, homework-due   | Low      |
| `analytics`             | health-score-update, readiness-score         | Low      |

### 6.2 Job Chain: Document Upload

```
confirm-upload
  → classify-document (30s timeout)
  → ocr-extract (120s timeout, retries: 2)
  → chunk-text (30s timeout)
  → [parallel] embed-chunks + update-knowledge-graph
  → trigger-resource-intelligence (fan-out to 6 sub-jobs)
  → mark-resource-ready + notify-student
```

---

## 7. AI Gateway (Model Routing)

The AI Gateway is a Next.js service module (`lib/ai-gateway.ts`) that reads routing config from the `model_routing` table (cached in Redis, TTL 60s) and dispatches to the appropriate provider SDK.

```typescript
// Conceptual interface
interface AIGateway {
  invoke(taskType: TaskType, prompt: string, options?: InvokeOptions): Promise<AIResponse>;
}

type TaskType =
  | 'ocr'
  | 'embedding'
  | 'classification'
  | 'flashcard_gen'
  | 'quiz_gen'
  | 'summary_gen'
  | 'answer_gen'
  | 'answer_optimize'
  | 'rag_reasoning'
  | 'homework_gen'
  | 'quality_verify'
  | 'plan_gen';
```

Every invocation logs: `model_name`, `task_type`, `latency_ms`, `input_tokens`, `output_tokens`, `estimated_cost_usd`, `fallback_used` to a `model_invocation_logs` table for cost monitoring.

---

## 8. Security Design

- **Row-level security**: All DB queries include `WHERE user_id = $current_user_id`. PostgreSQL RLS policies enforce this at the database layer as a second line of defense.
- **Presigned URLs**: Object storage files are never publicly accessible. All file reads go through the backend which verifies ownership before issuing a 1-hour presigned GET URL.
- **Auth middleware**: Every API route (except `/api/auth/*`) validates the session JWT. Invalid or expired tokens return HTTP 401 immediately.
- **Input validation**: All API request bodies validated with Zod schemas before any DB or agent call.
- **HTTPS only**: Enforced at the infrastructure level (no HTTP). WebSocket connections use WSS.

---

## 9. Infrastructure

| Concern         | Choice                                      | Notes                                                           |
| --------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Backend hosting | Vercel or Railway                           | Next.js native; Railway preferred for persistent BullMQ workers |
| Database        | Supabase (PostgreSQL + pgvector)            | Managed, free tier covers dev/beta                              |
| Object storage  | Supabase Storage or AWS S3                  | Start with Supabase for simplicity                              |
| Auth            | Supabase Auth or Clerk                      | Supabase bundles with DB; Clerk for advanced OAuth              |
| Redis           | Upstash Redis                               | Serverless-compatible, free tier                                |
| Mobile CI       | Expo EAS Build                              | Cloud builds for iOS + Android                                  |
| Monitoring      | LangSmith (agent traces) + Vercel Analytics |                                                                 |
| Local AI models | Ollama sidecar or Replicate API             | For dev/beta; self-hosted for production cost control           |

---

## 10. Key Non-Functional Targets

| Metric                       | Target                         |
| ---------------------------- | ------------------------------ |
| RAG response latency         | ≤ 10s (p95)                    |
| Vector search                | ≤ 500ms (p95)                  |
| File upload (50MB)           | ≤ 60s on 4G                    |
| OCR pipeline (10-page PDF)   | ≤ 120s                         |
| Quality Verifier overhead    | ≤ 3s per check                 |
| Answer generation            | ≤ 15s (p95)                    |
| Offline sync on reconnect    | ≤ 5s for ≤ 200 pending ratings |
| Academic Health Score update | ≤ 5 min after triggering event |
