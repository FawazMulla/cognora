# AI Academic Workspace

### Product Vision & Functional Specification (Master Context Document)

**Version:** 0.1.0
**Status:** Draft — Single Source of Truth
**Platform:** Mobile-first (Android & iOS), Next.js backend
**Owner:** Product/Founder
**Purpose:** This document is the canonical context for AI coding agents (Claude Code, Codex, Cursor, Kiro, etc.). Read this in full before generating architecture, database schema, API contracts, or code.

---

## 1. Vision

AI Academic Workspace is a mobile-first academic platform that manages a student's **entire semester**, not just isolated questions. It ingests notes, PDFs, previous year question papers, and practicals, then helps the student study, revise, take viva, complete homework/practicals, and track progress — all from one connected workspace.

**One-sentence vision:** An AI-powered academic workspace that manages everything from lecture notes to final exams through specialized AI agents and a persistent student profile.

## 2. Problem Statement

Students juggle disconnected tools every semester: ChatGPT for explanations, NotebookLM for PDFs, Drive for storage, Quizlet for flashcards, manual practical writing, manual revision planning. No single platform owns the full academic workflow (ingest → understand → practice → evaluate → submit → track).

## 3. Why This Isn't "ChatGPT + NotebookLM"

| Tool                | Strength                | What it lacks                                                                |
| ------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| ChatGPT             | Reasoning, explanations | No semester memory, no exam-format awareness, no viva, no practical workflow |
| NotebookLM          | Document Q&A, citations | No adaptive learning, no student profile, no exam prediction                 |
| Gemini              | Fast, ecosystem         | Generic assistant, no academic workflow                                      |
| LMS (Moodle/Canvas) | Assignment mgmt         | Almost no intelligence                                                       |
| Quizlet             | Flashcards              | Only one stage of learning                                                   |

**Positioning:** Not an AI tutor. An **Academic Execution Platform** — it doesn't just explain, it completes academic work end-to-end.

## 4. Product Principles (non-negotiable)

1. **Academic execution over generation** — complete workflows, not just answers.
2. **Long-term memory** — never re-ask context the system already knows (semester, subject, weak topics, exam date, preferred answer style).
3. **Goal-first UX** — student picks an objective (prepare for exam, viva, revise, homework), not a blank chat box.
4. **Personalization via a Student Digital Twin** that updates after every interaction.
5. **Mobile-first** — most study behavior (bus, library, before class) happens on a phone, not a desktop.
6. **AI-provider agnostic** — swappable between cloud and local models per task (cost control).

## 5. Target Users

- **Primary:** Engineering/university/diploma students.
- **Secondary:** Faculty (future — question papers, evaluation).
- **Future:** Competitive exam aspirants, professional certification learners (AWS, Oracle, Cisco).

### Personas

- **Rahul** — scattered notes, crams before exams, doesn't know important questions or answer length.
- **Aisha** — consistent student, wants structured revision to push CGPA higher.
- **Faculty** — needs question papers, assignments, student evaluation support.

## 6. Core Differentiator (the moat)

The system understands **university-specific exam patterns**: syllabus, marks distribution, repeated PYQ topics, answer length conventions, practical file formats, viva style — by university, semester, and subject. That contextual specificity is what generic AI chat tools don't provide.

---

## 7. Academic Lifecycle (the backbone of the product)

```
Semester Starts → Import Resources → AI Organizes Everything → Student Studies →
AI Tracks Learning → Revision → Assignments & Practicals → Internal Exams →
Viva → Final Exam → Semester Analytics → Knowledge Carried Forward
```

Every feature must map to one stage of this lifecycle. The product should never feel like a chatbot — it should feel like an academic workspace.

## 8. First-Time User Experience (Onboarding)

**Step 1 — Setup:** University, Branch, Semester, Division (optional), Subjects.

**Step 2 — Upload resources:** PDFs, PPTs, notes, images, PYQs, practical files, reference books, handwritten notes. The AI auto-classifies by subject/unit/topic — the student never manually files anything.

**Step 3 — Processing (shown as progress, not a spinner):** reading document → understanding chapters → extracting diagrams → finding repeated concepts → mapping syllabus → connecting PYQs → building semester workspace.

## 9. Semester Workspace (home screen)

Not a chat interface. A dashboard: today's progress, upcoming exam countdown, homework due, weak topics, today's revision, and quick actions (Study / Revision / PYQ / Viva / Homework / Practical). Chat is one tool inside the product, not the product itself.

## 10. Subject Workspace

Each subject is its own workspace: Overview, Notes, PYQs, Assignments, Practicals, Flashcards, Revision, Analytics, Viva, Resources — all sharing one knowledge base so nothing is uploaded twice.

## 11. Resource Intelligence

Every uploaded document automatically generates (without being asked): summary, key topics, flashcards, definitions, viva questions, expected exam questions, formula sheet, diagram index, acronym list, related PYQs, revision notes, quiz.

---

## 12. Student Digital Twin (core IP of the product)

A continuously evolving academic profile per student, updated after every interaction — never manually edited. Tracks:

- Knowledge level & confidence per topic
- Learning speed, writing speed, speaking confidence
- Preferred explanation style / answer length / language
- Weak topics, strong topics, mistake patterns
- Revision frequency & consistency
- Exam readiness / predicted marks

This profile drives every adaptive behavior in the app (answer length, difficulty, revision timing, viva pacing).

## 13. Adaptive Learning Examples

- Visual learner → more diagrams, less text.
- Fast reader → longer answers.
- Exam tomorrow → only high-yield topics, no theory.
- Exam in a month → concept-first learning path.

## 14. Study / Goal Modes

Instead of "ask me anything," the entry point is **"what do you want to accomplish?"**:
Study Mode, Exam Mode, Revision Mode, Assignment Mode, Practical Mode, Viva Mode, Quick Doubt Mode, Crash Course Mode, Last-Night-Before-Exam Mode, (future) Placement Mode. Each mode changes UI, AI behavior, output format, time allocation, and answer length.

## 15. Daily Study Workflow

Each morning the AI checks upcoming exams, homework, weak topics, and revision schedule, then generates a time-boxed plan (e.g., Study 35 min / Revision 20 min / PYQ practice 15 min / Flashcards 10 min / Mock viva 5 questions). Re-adjusts automatically if sessions are skipped.

## 16. Academic Memory Rules

- Every generated/corrected answer updates preferred style.
- Repeated revision of a unit increases its future revision frequency.
- Consistent mistakes in one area (e.g., definitions) increase future emphasis on that area.
- **Core rule: the user should never have to explain context twice.** "Generate today's revision" already implies semester, subject, weak units, exam date, available time, and learning style.

---

## 17. Academic Workflows (feature specs)

Workflows, not isolated features — each has a Goal, Input, AI Processing, Output, and Follow-up.

### 17.1 Exam Preparation Workflow ⭐⭐⭐⭐⭐

- **Goal:** prepare for a university exam.
- **Input:** subject + days remaining (today / tomorrow / 3 days / 1 week / 1 month).
- **Behavior:** near-term → only important questions, concise notes, PYQs, revision, no theory. Long-term → concept learning → practice → revision → mock exam → predicted marks/confidence.
- **Output:** study plan, important/predicted questions, model answers, flashcards, viva, quiz, weak topics, formula sheet, revision notes, time allocation.
- **Acceptance criteria:** student never has to manually decide what to study next.

### 17.2 Previous Year Paper (PYQ) Engine ⭐⭐⭐⭐⭐ (biggest differentiator)

- Upload multiple PYQs → AI extracts questions, groups duplicates, maps to syllabus, computes frequency, predicts probability, generates an answer bank.
- **Output:** repeated questions, frequency-per-topic, unit weightage, predicted questions with priority, model answers, revision notes.

### 17.3 Answer Generator ⭐⭐⭐⭐⭐

- One question → multiple output variants: Topper Answer, University Answer, Concise Answer, Revision Answer, Handwriting Version, Bullet Version, Concept-only, Definition-only, Diagram-friendly, Voice-revision version. Supports 2/5/10-mark lengths.

### 17.4 Smart Answer Optimizer ⭐⭐⭐⭐⭐

- Student submits their own written/typed/photographed answer → AI scores structure, keywords, coverage, clarity, examples, presentation, missing concepts → suggests an improved version with a diff view.

### 17.5 Teacher Mode / Viva Engine ⭐⭐⭐⭐⭐

- Student selects subject, unit, difficulty, and "professor personality" (Friendly / Strict / University Examiner / Placement Interviewer).
- Voice-based: times the student, listens, can interrupt/cross-question, scores answer on accuracy/completeness/keywords/communication/time.
- **Adaptive timing:** after each of the first 1–5 answers, time slots per question adjust to the user's demonstrated capability.
- Assessment is quality- and marks-based (not strict word-for-word), producing marks + improvement suggestions + updated weak-topic list.

### 17.6 Homework Workflow

- Inputs: question, teacher instructions, word limit, reference notes, previous homework (style fingerprint).
- Output: submission-ready answer matching teacher's format/style/word limit, checked for length/grammar/college style, plus a handwriting-friendly version, avoiding obviously "AI-sounding" language.

### 17.7 Practical Workflow ⭐⭐⭐⭐⭐

- Student uploads previous practical or college format template.
- AI generates Aim, Theory, Apparatus/Algorithm, Procedure, Observation, Result, Conclusion — with blank placeholder space left for diagrams/images (student adds by hand or photo).
- Future: auto-generated flowcharts/diagrams (ER, DFD, UML, network diagrams).

### 17.8 Flashcard Engine

- From uploaded material: basic flashcards, concept cards, formula cards, image cards, one-line revision cards, MCQs, adaptive spaced review.

### 17.9 Quiz Engine

- Adaptive difficulty driven by weak topics, revision history, exam probability, confidence, past mistakes — not random.

### 17.10 Smart Revision Engine

- Doesn't ask "what to revise" — decides based on exam date, forgetting-curve memory model, and available time; generates 20/40/120-minute sessions.

### 17.11 Study Planner ("Academic GPS")

- Current knowledge % → destination (pass/target grade) → route (study/revision/practice/mock) → ETA → daily re-adjustment.

### 17.12 Analytics Dashboard

- Learning score, exam readiness, confidence, knowledge growth, weak/strong units, writing speed, speaking score, revision consistency, assignment/practical completion, predicted marks, improvement curve over time.

---

## 18. AI Behavior Rules (must be enforced across all agents)

- Never give the longest possible answer by default — first infer goal, time available, exam type, difficulty, and learning history, then respond.
- Never re-ask for context already known.
- Never lose semester memory or forget uploaded documents.
- Always remember preferred answer style/length.
- Prefer citing/grounding in the student's own uploaded notes when possible.
- Always default toward university-specific format conventions.
- Every interaction should update the Student Digital Twin.
- Always be able to recommend "the next best academic action."

## 19. Additional High-Value Concepts

- **Academic Command Center (home screen):** proactive surfacing of what needs attention today — not a reactive chatbox.
- **Academic Timeline:** a log of academic events (uploads, viva scores, revision sessions, weak-topic improvements, predicted-mark changes) so the AI can answer "how has my understanding of DBMS improved this semester?"
- **Study Sessions instead of Chat Threads:** persist structured session records (subject, duration, topics covered, quiz score, weak concepts, next revision date) rather than raw chat logs.
- **Academic Health Score (0–100):** single composite score from study consistency, revision status, homework completion, viva performance, quiz accuracy, exam readiness.
- **PYQ Heatmap:** visual per-unit probability of appearing in the next exam.
- **Weak Topic Detection with reasons:** not just "60%" — but _why_ (definitions vs diagrams vs numericals).
- **Camera Notes:** photograph whiteboard/notebook/printed notes → cleaned notes + flashcards + questions + summary.
- **Offline Mode:** downloaded notes/flashcards/answers usable without internet.
- **Smart Notifications:** context-specific ("Your DBMS exam is in 4 days — practice these 5 questions"), not generic reminders.

## 20. Non-Goals for MVP (explicitly out of scope initially)

- Faculty dashboard, parent dashboard, group study/collaboration, placement/career mode, coding-lab hint engine, research-paper assistant — all deferred to post-MVP roadmap (Section 22).

---

## 21. Suggested Tech Stack (implementation detail — agents may refine)

- **Mobile:** React Native + Expo (single codebase, iOS/Android).
- **Backend:** Next.js.
- **Database:** PostgreSQL + pgvector (embeddings/vector search).
- **AI orchestration:** LangChain / LangGraph, LangSmith for tracing/eval.
- **OCR:** Docling primary, Tesseract fallback.
- **Embeddings:** BGE / Nomic / Jina (local where possible for cost control).
- **Object storage:** AWS S3 or Supabase Storage.
- **Auth:** Clerk or Supabase Auth.
- **Cache:** Redis.
- **Model routing:** an AI Gateway layer so any feature can switch between cloud (OpenAI/Gemini/Claude) and local (Llama/Qwen/Mistral) models per task, avoiding vendor lock-in and controlling cost. Cheap/local for OCR, parsing, embeddings, flashcards, quiz gen; cloud/premium for teacher-mode evaluation and complex reasoning/verification.

### Suggested Agent Roster (for LangGraph-style orchestration)

1. Academic Planner Agent — semester/exam/study/revision scheduling
2. Document Processing / OCR Agent
3. Knowledge Structuring Agent — topic/unit/chapter graph
4. RAG Planner / Router Agent
5. Exam Intelligence Agent — PYQ trend/frequency analysis
6. Answer Generation Agent — multi-length/format answers
7. Viva Examiner Agent — voice, timing, cross-questioning, scoring
8. Homework Agent — style/format-matching
9. Practical Agent — structured journal generation
10. Flashcard Agent
11. Revision Agent — forgetting-curve scheduling
12. Student Model Agent — maintains the Digital Twin
13. Analytics Agent — predictions, readiness scoring
14. Recommendation Agent — next-best-action suggestions
15. Quality Verification Agent — hallucination/format/completeness checks

---

## 22. Roadmap

**MVP (Phase 1, ~months 1–2):** Auth, semester/subject management, file upload, OCR, vector search, basic agentic RAG chat.

**Phase 2 (~months 3–4):** PYQ answer generator, flashcards, smart notes, homework generator.

**Phase 3 (~month 5):** Teacher/viva mode with voice evaluation, Student Digital Twin, analytics dashboard.

**Phase 4 (~month 6):** Practical generator, revision engine, mobile polish/performance.

**Post-MVP (v2+):** Faculty dashboard, group study, parent dashboard, placement/career mode, coding-lab agent, research assistant, multi-university scaling, professional certification content (AWS/Oracle/Cisco).

## 23. Cost Strategy (for reference during build)

Route by task, not one provider for everything:

| Task                                       | Preferred                                            |
| ------------------------------------------ | ---------------------------------------------------- |
| OCR, PDF parsing                           | Local (free)                                         |
| Embeddings, vector search                  | Local                                                |
| Flashcards, quiz generation                | Local model                                          |
| Teacher-mode evaluation, complex reasoning | Cloud model (higher quality)                         |
| Speech-to-text / TTS (viva)                | Usually the largest variable cost — budget carefully |

Rough dev-phase budget (solo testing): near-free using local models + free tiers; heavier cloud API use during a small beta realistically runs into the low thousands (₹) per month depending on PDF volume and voice-viva usage.

## 24. Success Metrics

- Student can upload an entire semester's material in under 10 minutes.
- Generated exam answers are appropriately lengthed/formatted for the target mark value.
- Voice-viva scores correlate reasonably with manual/human evaluation.
- Revision recommendations visibly adapt over time per student.
- A full semester workflow (upload → prepare → practice → evaluate → submit → track) is completable inside one app.

## 25. Product Identity / Naming Notes

Working name: **AI Academic Workspace**. Candidate alternative names considered: Atlas, Nexus Learn, AcademOS, LearnFlow, CampusMind, StudyPilot, ScholarOS, CogniFlow. Positioning line to use in marketing/pitch: _"Not an AI tutor — an Academic Execution Platform that manages the entire semester, from first lecture to final viva."_

---

## Appendix A — Sample Functional Requirement Format (for agent-generated specs going forward)

```
### FR-001
The system shall automatically classify uploaded academic resources into the
correct subject without requiring manual categorization.

Acceptance Criteria:
- ≥95% classification accuracy on supported document types.
- User can override classification if needed.
```

## Appendix B — Sample User Story Format

```
As a student,
I want to upload all my semester material once,
so that I never have to organize files manually again.
```

## Appendix C — Instructions for AI Coding Agents Reading This File

1. This document defines **product vision and behavior requirements**, not final implementation. Architecture, DB schema, and API contracts should be generated as separate documents (e.g., `ARCHITECTURE.md`, `DATABASE.md`, `API_SPEC.md`) derived from this file.
2. Do not remove or contradict the AI Behavior Rules (Section 18) or Product Principles (Section 4) when generating downstream specs or code.
3. Treat Section 17 workflows as the feature backlog; each should become its own set of FR-XXX requirements and user stories before implementation.
4. The tech stack (Section 21) is a recommendation — agents may propose alternatives but should flag any deviation explicitly rather than silently substituting.
5. Keep this file as the single canonical reference; downstream docs should link back to relevant section numbers here rather than duplicating content.
