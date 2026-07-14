# Requirements Document

## Introduction

AI Academic Workspace is a mobile-first (React Native + Expo) academic platform backed by a Next.js API server. It manages a student's entire semester: ingesting notes, PDFs, previous year question papers (PYQs), and practicals, then helping the student study, revise, practice viva, complete homework, and track progress — all from one connected workspace. The MVP (Phases 1–2) covers authentication and semester setup, resource ingestion with OCR and vector search, agentic RAG-based study chat, the PYQ engine, answer generation, flashcard generation, and homework generation. A foundational Student Digital Twin runs across all features, enabling adaptive behavior from day one.

This document derives exclusively from the product vision in `idea.md` (the single source of truth). All FR-XXX identifiers correspond to that document's Section 17 workflows and supporting sections.

---

## Glossary

- **System**: The AI Academic Workspace platform (mobile app + backend) in aggregate.
- **App**: The React Native + Expo mobile client.
- **Backend**: The Next.js API server.
- **Auth_Service**: The authentication component (Clerk or Supabase Auth).
- **Document_Processor**: The OCR and document-parsing agent (Docling primary, Tesseract fallback).
- **Vector_Store**: The PostgreSQL + pgvector semantic search component.
- **RAG_Engine**: The Retrieval-Augmented Generation pipeline that grounds AI responses in the student's uploaded notes.
- **PYQ_Engine**: The Previous Year Question Paper analysis and answer-bank generation agent.
- **Answer_Generator**: The multi-format, multi-length answer generation agent.
- **Flashcard_Engine**: The flashcard generation and spaced-repetition scheduling agent.
- **Homework_Agent**: The submission-ready homework answer generation agent.
- **Student_Model**: The Student Digital Twin — a continuously updated academic profile per student.
- **Academic_Planner**: The scheduling agent that generates study plans, revision sessions, and daily plans.
- **Knowledge_Graph**: The topic/unit/chapter structure built from uploaded resources.
- **Semester_Workspace**: The student's home dashboard aggregating all subjects and progress signals.
- **Subject_Workspace**: A per-subject dashboard with Notes, PYQs, Assignments, Flashcards, Revision, Analytics, Viva, and Resources tabs.
- **Study_Session**: A structured, persisted record of a single study interaction (subject, duration, topics covered, quiz score, weak concepts, next revision date).
- **PYQ**: Previous Year Question Paper.
- **Digital_Twin**: Synonym for Student_Model.
- **AI_Gateway**: The model-routing layer that dispatches tasks to local or cloud LLM providers.
- **Quality_Verifier**: The agent that checks AI-generated content for hallucinations, format compliance, and completeness.
- **Semester**: An academic period containing one or more subjects selected during onboarding.
- **Resource**: Any uploaded academic document (PDF, PPT, image, handwritten scan, PYQ file).

---

## Requirements

---

## Feature Area 1: Authentication & Onboarding

### FR-001: User Registration and Authentication

**User Story:** As a new student, I want to create an account and sign in securely, so that my academic data is private and persists across devices.

#### Acceptance Criteria

1. THE Auth_Service SHALL support registration via email/password and OAuth (Google).
2. WHEN a new user submits valid registration credentials, THE Auth_Service SHALL create an account and issue an authenticated session within 3 seconds.
3. IF a user submits a duplicate email during registration, THEN THE Auth_Service SHALL return a descriptive error without creating a duplicate account.
4. WHEN a user successfully authenticates, THE Backend SHALL return a signed session token that the App stores securely in device keychain/keystore.
5. WHILE a session token is valid, THE App SHALL not require the user to re-authenticate.
6. WHEN a session token expires, THE Auth_Service SHALL silently refresh it using a stored refresh token without interrupting the user's workflow.
7. IF token refresh fails, THEN THE App SHALL redirect the user to the login screen and preserve any unsaved draft content.
8. THE Auth_Service SHALL enforce a minimum password length of 8 characters containing at least one uppercase letter, one lowercase letter, and one digit.

#### Correctness Properties

- **Idempotence:** Submitting the same registration request twice SHALL produce exactly one account — the second attempt SHALL return a duplicate-email error.
- **Round-trip:** A session token issued by THE Auth_Service SHALL be accepted by THE Backend on every subsequent authenticated request until it expires.

---

### FR-002: Academic Profile Setup (Onboarding)

**User Story:** As a student completing onboarding, I want to specify my university, branch, semester, and subjects once, so that the system never asks me to re-enter that context again.

#### Acceptance Criteria

1. WHEN a newly authenticated user opens the App for the first time, THE App SHALL present an onboarding wizard collecting: university name, branch/program, current semester number, and a list of subjects.
2. THE Backend SHALL persist the academic profile and associate it with the authenticated user's account.
3. WHEN the student submits onboarding data, THE Backend SHALL initialize a Semester_Workspace and one Subject_Workspace per submitted subject.
4. IF the student omits a required field (university, branch, semester, or at least one subject), THEN THE App SHALL highlight the missing field and prevent progression.
5. WHEN onboarding is complete, THE App SHALL navigate the student directly to the Semester_Workspace home screen.
6. THE Backend SHALL allow the student to update their academic profile (add/remove subjects, change semester) at any time after onboarding.
7. WHEN a subject is added post-onboarding, THE Backend SHALL create a new Subject_Workspace for that subject without affecting existing Subject_Workspaces.

#### Correctness Properties

- **Invariant:** FOR ALL completed onboarding submissions, the number of Subject_Workspaces created SHALL equal the number of subjects submitted.
- **Round-trip:** A subject added during or after onboarding SHALL be retrievable by the App on subsequent sessions without re-submission.

---

## Feature Area 2: Resource Ingestion, OCR & Vector Search

### FR-003: File Upload and Storage

**User Story:** As a student, I want to upload PDFs, PPTs, images, and handwritten note photos, so that all my semester material lives in one place without manual filing.

#### Acceptance Criteria

1. THE App SHALL support uploading files of types: PDF, PPT, PPTX, JPEG, PNG, and WEBP.
2. WHEN a user selects a file for upload, THE App SHALL display upload progress as a percentage.
3. THE Backend SHALL enforce a maximum file size of 50 MB per upload.
4. IF a file exceeds 50 MB, THEN THE App SHALL display a descriptive error before initiating the upload request.
5. WHEN a file upload completes, THE Backend SHALL store the file in object storage (AWS S3 or Supabase Storage) and return a stable resource identifier.
6. THE Backend SHALL associate every uploaded Resource with the student's account, the target subject, and the upload timestamp.
7. WHEN the same file content (by SHA-256 hash) is uploaded to the same subject twice, THE Backend SHALL return the existing resource identifier without creating a duplicate storage object.
8. IF an upload fails mid-transfer, THEN THE App SHALL offer a retry option without requiring the user to re-select the file.

#### Correctness Properties

- **Idempotence:** Uploading the same file bytes to the same subject SHALL yield the same resource identifier on repeated submissions.
- **Invariant:** FOR ALL stored Resources, a valid object-storage URL SHALL remain resolvable for the lifetime of the student's account.

---

### FR-004: Automatic Document Classification

**User Story:** As a student, I want uploaded resources to be automatically sorted into the correct subject and topic, so that I never have to manually organize files.

#### Acceptance Criteria

1. WHEN a Resource is stored, THE Document_Processor SHALL classify it into a subject and, where determinable, a unit or chapter — without requiring manual input from the student.
2. THE Document_Processor SHALL achieve a classification accuracy of ≥ 90% when the document's subject is among the student's registered subjects.
3. WHEN classification confidence is below 70%, THE App SHALL prompt the student to confirm or override the suggested classification.
4. THE Backend SHALL allow the student to override any auto-assigned classification at any time.
5. WHEN a student overrides a classification, THE Backend SHALL log the correction and use it to improve future classification signals for that student.

#### Correctness Properties

- **Metamorphic:** Re-classifying the same document after adding no new information SHALL produce the same or higher confidence classification — confidence SHALL NOT decrease without new evidence.

---

### FR-005: OCR and Text Extraction

**User Story:** As a student, I want the system to extract readable text from PDFs, scanned notes, and photos, so that the AI can search and reference all my material regardless of format.

#### Acceptance Criteria

1. WHEN a Resource is classified, THE Document_Processor SHALL extract full text using Docling as the primary OCR engine.
2. IF Docling fails to extract text from a Resource, THEN THE Document_Processor SHALL retry extraction using Tesseract as the fallback engine.
3. WHEN OCR completes, THE Document_Processor SHALL store the extracted text linked to the Resource identifier.
4. THE Document_Processor SHALL process image-based PDFs and JPG/PNG photos of handwritten notes.
5. WHEN a multi-page document is processed, THE Document_Processor SHALL preserve page-level structure and page numbers in the extracted text.
6. IF OCR produces no extractable text after both engines, THEN THE Backend SHALL mark the Resource as "unreadable" and notify the student with a descriptive message.

---

### FR-006: Knowledge Graph Construction

**User Story:** As a student, I want the system to understand the topic structure inside my uploaded notes, so that the AI can give me contextually relevant answers referencing the right chapters and units.

#### Acceptance Criteria

1. WHEN extracted text is available for a Resource, THE Backend SHALL invoke the Knowledge Structuring Agent to build or update the Knowledge_Graph for the associated subject.
2. THE Knowledge_Graph SHALL map topics, units, chapters, definitions, and key concepts extracted from the Resource.
3. WHEN the Knowledge_Graph is updated, THE Backend SHALL link all newly identified concepts back to the source Resource and page number.
4. THE Backend SHALL merge overlapping concepts from multiple Resources into a single canonical node in the Knowledge_Graph without duplication.

---

### FR-007: Vector Embedding and Semantic Search

**User Story:** As a student, I want the system to find relevant passages from my notes when I ask a question, so that answers are grounded in my own material rather than generic AI responses.

#### Acceptance Criteria

1. WHEN OCR extraction completes for a Resource, THE Backend SHALL generate dense vector embeddings for each text chunk using a local embedding model (BGE, Nomic, or Jina).
2. THE Backend SHALL store all embeddings in the Vector_Store (PostgreSQL + pgvector), linked to the source Resource, chunk index, and subject.
3. WHEN the RAG_Engine receives a query, THE Vector_Store SHALL return the top-K semantically similar chunks (K configurable, default 5) within the scoped subject in under 500 ms.
4. THE Backend SHALL re-embed affected chunks when a Resource's text is corrected or overridden.
5. THE Vector_Store SHALL support subject-scoped and semester-scoped search boundaries so that retrieval does not bleed across subjects unless explicitly requested.

#### Correctness Properties

- **Round-trip:** A text chunk stored in THE Vector_Store SHALL be retrievable by a query semantically equivalent to its content with cosine similarity ≥ 0.80.
- **Invariant:** FOR ALL embeddings stored, the source Resource identifier and chunk index SHALL remain non-null and resolvable.

---

### FR-008: Resource Processing Status Visibility

**User Story:** As a student, I want to see real-time processing progress for my uploaded files, so that I know when my material is ready to use.

#### Acceptance Criteria

1. WHEN a Resource upload completes, THE App SHALL display a processing status indicator showing the current pipeline stage: "Reading document", "Understanding chapters", "Extracting key concepts", "Mapping syllabus", "Building workspace".
2. THE App SHALL update the processing status in real time (via WebSocket or polling at ≤ 5-second intervals).
3. WHEN processing completes, THE App SHALL notify the student and make the Resource available for study immediately.
4. IF processing fails at any pipeline stage, THEN THE App SHALL display a human-readable error identifying the failed stage and offering a retry action.
5. WHILE a Resource is being processed, THE App SHALL allow the student to continue using other features without blocking the UI.

---

## Feature Area 3: Semester Workspace & Subject Workspace (Home Screens)

### FR-009: Semester Workspace Dashboard

**User Story:** As a student, I want a home screen that shows my current academic status at a glance, so that I always know what needs attention today without digging through menus.

#### Acceptance Criteria

1. THE App SHALL render a Semester_Workspace home screen as the default post-onboarding view.
2. THE Semester_Workspace SHALL display: today's recommended study plan, the nearest upcoming exam countdown, any homework due within 48 hours, a list of the student's top-3 weak topics, and quick-action buttons for Study, Revision, PYQ, Viva, Homework, and Practical.
3. WHEN a student taps a quick-action button, THE App SHALL navigate directly to the corresponding workflow without requiring additional context input.
4. THE Academic_Planner SHALL generate the daily study plan each morning by 06:00 local device time, factoring in upcoming exams, incomplete homework, weak topics from the Student_Model, and the student's available study time preference.
5. WHEN the student skips a recommended study session, THE Academic_Planner SHALL re-adjust the plan for the following day to redistribute the skipped content.
6. THE App SHALL display the student's Academic Health Score (0–100) on the Semester_Workspace.

---

### FR-010: Subject Workspace

**User Story:** As a student, I want a dedicated workspace per subject, so that all notes, PYQs, flashcards, and analytics for that subject are in one place without needing to search across subjects.

#### Acceptance Criteria

1. THE App SHALL render a Subject_Workspace for each registered subject containing tabs: Overview, Notes, PYQs, Assignments, Practicals, Flashcards, Revision, Analytics, Viva, and Resources.
2. WHEN the student opens a Subject_Workspace tab, THE App SHALL display only data scoped to that subject.
3. THE Subject_Workspace Overview tab SHALL display: subject completion percentage, top-3 weak units, last study session summary, upcoming exam date (if set), and a one-tap "Study Now" action.
4. THE App SHALL allow the student to set or update an exam date for each subject; THE Academic_Planner SHALL use this date for all scheduling decisions.

---

## Feature Area 4: Agentic RAG Study Chat

### FR-011: Goal-First Study Chat Entry

**User Story:** As a student, I want to start a study session by picking a goal (Study, Revise, Quick Doubt, Exam Mode), so that the AI tailors its behavior and answer style to what I actually need right now.

#### Acceptance Criteria

1. THE App SHALL present study-session entry as a goal selector, not a blank chat input, offering at minimum: Study Mode, Exam Mode, Revision Mode, Quick Doubt Mode, and Crash Course Mode.
2. WHEN the student selects a study goal, THE RAG_Engine SHALL adapt its response verbosity, format, and source-grounding behavior to match the selected mode.
3. WHILE in Exam Mode, THE RAG_Engine SHALL default to university-format answers of the appropriate mark-value length for every response.
4. WHILE in Quick Doubt Mode, THE RAG_Engine SHALL limit responses to concise explanations of ≤ 150 words unless the student explicitly requests more detail.
5. WHEN the student starts a study session, THE Backend SHALL create a Study_Session record capturing: subject, selected goal mode, start time, and student profile snapshot at session start.

---

### FR-012: RAG-Grounded Study Chat

**User Story:** As a student, I want AI answers grounded in my own uploaded notes, so that explanations match the way my subject is taught at my university rather than generic textbook content.

#### Acceptance Criteria

1. WHEN the student submits a study question, THE RAG_Engine SHALL retrieve the top-K relevant chunks from the Vector_Store scoped to the selected subject before generating a response.
2. THE RAG_Engine SHALL include inline source citations (document name and page number) in every response that uses retrieved content.
3. WHEN no relevant chunks are found in the student's uploaded material, THE RAG_Engine SHALL clearly indicate this and offer to answer from general knowledge or prompt the student to upload relevant notes.
4. THE RAG_Engine SHALL never fabricate citations to documents that do not exist in the student's Vector_Store.
5. WHEN the student asks a follow-up question within the same Study_Session, THE RAG_Engine SHALL maintain conversational context and not re-ask for subject or goal information already provided.
6. THE RAG_Engine SHALL complete each response within 10 seconds under normal load conditions.
7. WHEN the RAG_Engine generates an answer, THE Quality_Verifier SHALL check the response for factual consistency with the retrieved source chunks before returning it to the student.

#### Correctness Properties

- **Invariant:** FOR ALL RAG responses containing citations, every cited document name and page SHALL correspond to an existing Resource in the student's Vector_Store.
- **Idempotence:** Submitting the same question in the same Study_Session context twice SHALL produce semantically equivalent answers (same retrieved chunks, same grounding).

---

### FR-013: Study Session Persistence

**User Story:** As a student, I want my study sessions to be saved as structured records, so that the AI can track what I've covered and recommend the right next step without me having to repeat myself.

#### Acceptance Criteria

1. WHEN a Study_Session ends (user exits or 30-minute inactivity), THE Backend SHALL finalize the Study_Session record with: end time, list of topics discussed, number of questions asked, any quiz scores recorded, and a list of identified weak concepts.
2. THE Student_Model SHALL be updated with the Study_Session outcomes within 60 seconds of session finalization.
3. THE App SHALL allow the student to view a history of past Study_Sessions per subject, showing date, duration, topics covered, and weak concepts identified.
4. THE RAG_Engine SHALL have read access to the student's last 10 Study_Session records to avoid repeating content already covered recently.

---

## Feature Area 5: PYQ Engine

### FR-014: PYQ Upload and Question Extraction

**User Story:** As a student, I want to upload previous year question papers and have the AI extract and organize all questions, so that I can focus on what has actually appeared in exams rather than guessing.

#### Acceptance Criteria

1. THE App SHALL accept PYQ file uploads in PDF, JPEG, and PNG formats through the PYQs tab of the Subject_Workspace.
2. WHEN a PYQ file is uploaded, THE Document_Processor SHALL extract all individual questions, preserving: question text, mark value (if printed), unit or topic header (if present), and year/exam identifier.
3. THE PYQ_Engine SHALL group extracted questions that are semantically equivalent (duplicate or near-duplicate across years) into a single canonical question entry.
4. THE PYQ_Engine SHALL map each canonical question to a Knowledge_Graph node (unit, chapter, or topic).
5. WHEN PYQ extraction and mapping complete, THE App SHALL display a list of extracted questions organized by unit and topic within the Subject_Workspace PYQs tab.
6. IF a PYQ file cannot be parsed (corrupted or unsupported format), THEN THE Backend SHALL notify the student with a descriptive error and preserve the raw file for manual review.

#### Correctness Properties

- **Round-trip:** A question extracted by THE Document_Processor and stored in the Backend SHALL be retrievable by the PYQ_Engine query by subject and topic without data loss.
- **Idempotence:** Uploading the same PYQ file twice SHALL NOT create duplicate question entries — the second upload SHALL be detected by content hash and return the existing entries.

---

### FR-015: PYQ Frequency Analysis and Prediction

**User Story:** As a student, I want to know which topics and questions appear most often in exams, so that I can prioritize high-yield content when time is limited.

#### Acceptance Criteria

1. WHEN at least two PYQ files for the same subject are available, THE PYQ_Engine SHALL compute topic-level appearance frequency (number of years the topic appeared ÷ total years of PYQs available).
2. THE PYQ_Engine SHALL compute a repeat count for each canonical question showing how many years it has appeared.
3. THE App SHALL display a PYQ Heatmap view per subject showing unit-level probability as a visual spectrum (low / medium / high) based on frequency.
4. THE PYQ_Engine SHALL rank canonical questions by repeat count and assign a priority label: High (appeared ≥ 3 times), Medium (appeared 2 times), Low (appeared once).
5. WHEN the student sets an exam date, THE PYQ_Engine SHALL generate a predicted question list of the top-10 highest-priority canonical questions for that subject.
6. THE PYQ_Engine SHALL update frequency statistics and predictions whenever a new PYQ file is added to the subject.

#### Correctness Properties

- **Invariant:** FOR ALL canonical questions, frequency = repeat_count ÷ total_pyq_years SHALL always be a value in the range [0, 1].
- **Metamorphic:** Adding a PYQ file that contains a question already present in the corpus SHALL increase that question's repeat_count by exactly 1 and SHALL NOT decrease any other question's repeat_count.

---

### FR-016: PYQ Answer Bank Generation

**User Story:** As a student, I want model answers generated for every PYQ question, so that I can study and practice without having to find answers from external sources.

#### Acceptance Criteria

1. WHEN the student requests an answer for a PYQ question, THE Answer_Generator SHALL produce a model answer grounded in the student's uploaded notes via RAG retrieval.
2. THE Answer_Generator SHALL generate the answer in university-exam format appropriate for the mark value associated with the question (2-mark, 5-mark, 10-mark).
3. THE PYQ_Engine SHALL persist generated answers in an Answer Bank linked to the canonical question, so repeated requests return the cached answer rather than re-generating.
4. THE Answer_Generator SHALL include a "Key Points Covered" checklist alongside each model answer listing the essential concepts, definitions, or diagrams required for full marks.
5. WHEN a student's uploaded notes do not contain sufficient information to answer a PYQ question, THE Answer_Generator SHALL clearly indicate the knowledge gap and offer to generate an answer from general knowledge with an explicit disclaimer.

---

## Feature Area 6: Answer Generation

### FR-017: Multi-Format Answer Generation

**User Story:** As a student, I want to generate answers in different formats (topper, concise, bullet, revision), so that I can use the right version depending on whether I'm studying, revising, or writing a submission.

#### Acceptance Criteria

1. WHEN a student submits a question for answer generation, THE Answer_Generator SHALL offer at minimum the following format variants: Topper Answer, University Answer (exam-ready), Concise Answer, Revision Answer (key points only), Bullet Version, and Definition-only.
2. THE Answer_Generator SHALL produce answers calibrated to the target mark value: 2-mark answers SHALL be ≤ 80 words; 5-mark answers SHALL be ≤ 250 words; 10-mark answers SHALL be ≤ 600 words.
3. WHEN the student selects "Topper Answer", THE Answer_Generator SHALL include structured headings, a definition, explanation, example, diagram indication (if applicable), and a conclusion.
4. THE Answer_Generator SHALL adapt answer style to the student's preference stored in the Student_Model (e.g., preferred explanation language, diagram frequency, example density).
5. WHEN the student requests an answer, THE Answer_Generator SHALL complete generation within 15 seconds.
6. THE Quality_Verifier SHALL validate each generated answer for: (a) absence of hallucinated citations, (b) word count within the target range, and (c) presence of the required structural elements for the selected format.

#### Correctness Properties

- **Invariant:** FOR ALL generated answers, the word count SHALL fall within ± 15% of the target range for the requested mark value.
- **Metamorphic:** Requesting the same question in Concise format SHALL always produce a word count strictly less than the word count of the Topper Answer format for the same mark value.

---

### FR-018: Mark-Value Length Calibration

**User Story:** As a student, I want answers automatically sized for the correct mark value, so that I write the right amount in an exam without over- or under-answering.

#### Acceptance Criteria

1. THE Answer_Generator SHALL require the student to specify a target mark value (2, 5, or 10) or infer it from context (e.g., from a PYQ entry that has a stored mark value).
2. WHEN a mark value is inferred, THE App SHALL display the inferred value and allow the student to override it before generation.
3. THE Answer_Generator SHALL not produce answers exceeding the word ceiling for the specified mark value unless the student explicitly overrides the length.

---

### FR-019: Smart Answer Optimizer

**User Story:** As a student, I want to submit my own written answer and get AI feedback on what is missing or weak, so that I can improve my answers before exams.

#### Acceptance Criteria

1. THE App SHALL provide an Answer Optimizer input allowing the student to submit a typed or photographed answer alongside the original question.
2. WHEN an answer is submitted for optimization, THE Answer_Generator SHALL evaluate it across: structure, keyword coverage, concept completeness, clarity, presence of examples, and presentation.
3. THE Answer_Generator SHALL return a score per evaluation dimension (0–10 scale) and an overall score.
4. THE Answer_Generator SHALL produce a diff-style view highlighting: text to add (missing concepts), text to rephrase (unclear or incorrect), and text that is correct.
5. THE Answer_Generator SHALL suggest a complete improved version of the student's answer alongside the feedback.
6. WHEN the Answer Optimizer runs, THE Student_Model SHALL record any identified missing concepts as weak signals for that topic.

#### Correctness Properties

- **Round-trip:** Submitting the Answer_Generator's own Topper Answer output as input to the Answer Optimizer SHALL produce an overall score ≥ 8/10 with no "missing concept" flags.

---

## Feature Area 7: Flashcard Engine

### FR-020: Automatic Flashcard Generation

**User Story:** As a student, I want flashcards automatically generated from my uploaded notes, so that I have ready-made study cards without spending time creating them manually.

#### Acceptance Criteria

1. WHEN a Resource finishes processing, THE Flashcard_Engine SHALL automatically generate a set of flashcards for the Resource without requiring explicit student action.
2. THE Flashcard_Engine SHALL generate at minimum the following flashcard types from each Resource: Basic (question/answer), Concept (definition/explanation), Formula (formula/derivation), and One-line Revision (topic/key point).
3. THE Flashcard_Engine SHALL generate at least 1 flashcard per 300 words of extracted text, up to a maximum of 50 flashcards per Resource.
4. THE Flashcard_Engine SHALL link each flashcard to its source Resource and source chunk so the student can tap to view the original passage.
5. THE App SHALL allow the student to edit, delete, or archive any generated flashcard.
6. WHEN the student edits a flashcard, THE Backend SHALL preserve both the original generated version and the edited version, flagging the card as student-curated.

#### Correctness Properties

- **Invariant:** FOR ALL flashcards, the source_resource_id and source_chunk_index fields SHALL be non-null and resolvable to existing stored chunks.
- **Metamorphic:** Generating flashcards for two Resources covering overlapping topics SHALL produce a union of flashcards that contains no exact duplicate front/back pairs.

---

### FR-021: Spaced Repetition Review Scheduling

**User Story:** As a student, I want the system to schedule which flashcards to review and when, so that I revise at the right intervals to retain information without wasting time on cards I already know well.

#### Acceptance Criteria

1. THE Flashcard_Engine SHALL schedule flashcard review using a spaced-repetition algorithm (SM-2 or equivalent) that adjusts each card's next review date based on the student's recall performance.
2. WHEN the student rates a flashcard review (Again / Hard / Good / Easy), THE Flashcard_Engine SHALL update the card's interval, ease factor, and next scheduled review date according to the algorithm.
3. THE App SHALL surface the student's due flashcards for review each day, sorted by urgency (overdue first, then due today).
4. WHEN the student has no due flashcards for a subject, THE App SHALL display the next scheduled review date for that subject.
5. THE Flashcard_Engine SHALL track per-card statistics: total reviews, correct recall rate, last reviewed date, and current interval.

#### Correctness Properties

- **Invariant:** FOR ALL flashcards rated "Easy", the next review interval SHALL be strictly greater than the previous interval.
- **Invariant:** FOR ALL flashcards rated "Again", the next review interval SHALL be reset to 1 day, regardless of the card's previous interval.
- **Idempotence:** Rating the same card "Good" twice in succession SHALL NOT reduce the card's interval below the value set after the first rating.

---

### FR-022: MCQ Generation from Flashcard Corpus

**User Story:** As a student, I want multiple-choice questions generated from my flashcard topics, so that I can test my recall in an exam-style format.

#### Acceptance Criteria

1. WHEN the student requests a quiz for a subject, THE Flashcard_Engine SHALL generate MCQs using flashcard content as the question pool.
2. EACH MCQ SHALL contain one correct answer and three plausible distractors derived from related flashcard content.
3. THE Flashcard_Engine SHALL prioritize MCQs covering the student's weak topics as identified in the Student_Model.
4. WHEN the student submits a quiz answer, THE App SHALL immediately display whether it is correct, the correct answer if wrong, and the source flashcard for review.
5. WHEN a quiz session ends, THE Backend SHALL record per-question accuracy in the Study_Session and update weak-topic signals in the Student_Model.

---

## Feature Area 8: Homework Generation

### FR-023: Submission-Ready Homework Answer Generation

**User Story:** As a student, I want to generate a homework answer that matches my teacher's format and style, so that my submission looks authentic and meets the expected standard without obvious AI tells.

#### Acceptance Criteria

1. THE App SHALL provide a Homework workflow entry accepting: the homework question, optional teacher instructions, word limit, and an optional style reference (previous homework sample).
2. WHEN a homework request is submitted, THE Homework_Agent SHALL generate a submission-ready answer that: meets the specified word limit (± 5%), matches the style of any provided reference sample, and avoids overtly formulaic AI-generated phrasing.
3. THE Homework_Agent SHALL ground the answer in the student's uploaded subject notes via RAG retrieval before generating.
4. WHEN the student's uploaded notes contain relevant content, THE Homework_Agent SHALL prioritize note-grounded information over general knowledge.
5. THE Homework_Agent SHALL run a grammar and spelling check on every generated answer before returning it.
6. THE App SHALL display the generated answer alongside: a word count, a readability score, and a "Handwriting-friendly version" option that formats the answer in shorter paragraphs suitable for transcription.
7. IF no teacher instructions are provided, THEN THE Homework_Agent SHALL use a neutral academic style calibrated to university-level undergraduate writing.

#### Correctness Properties

- **Invariant:** FOR ALL generated homework answers, the word count SHALL fall within ± 5% of the specified word limit when a limit is provided.
- **Round-trip:** Submitting the generated homework answer to the Smart Answer Optimizer SHALL produce a structure score ≥ 7/10.

---

### FR-024: Homework Style Fingerprinting

**User Story:** As a student, I want the system to learn my writing style from past homework, so that future generated answers feel consistent with work I've submitted before.

#### Acceptance Criteria

1. WHEN the student uploads a previous homework sample in the Homework workflow, THE Homework_Agent SHALL extract style signals: average sentence length, paragraph structure, vocabulary range, and formality level.
2. THE Backend SHALL persist style signals as a homework style profile associated with the student and subject.
3. WHEN a homework style profile exists, THE Homework_Agent SHALL apply it to all subsequent homework generation for that subject without requiring the student to re-upload the sample.
4. THE App SHALL allow the student to reset or update the style profile at any time.

---

## Feature Area 9: Student Digital Twin (Foundational)

### FR-025: Student Model Initialization

**User Story:** As a student, I want the system to build an academic profile of me automatically from day one, so that every AI interaction is personalized without me ever filling out preference surveys.

#### Acceptance Criteria

1. WHEN onboarding completes, THE Backend SHALL initialize a Student_Model record for the student containing default values for: knowledge level per subject (Unknown), preferred answer length (Medium), preferred explanation style (Text), and learning pace (Standard).
2. THE Student_Model SHALL contain the following tracked dimensions per subject and topic: knowledge confidence level (0–100), weak/strong topic flags, last revision date, total revision count, and mistake pattern counters by question type (definition, diagram, numerical).
3. THE Backend SHALL expose the Student_Model as a read-only summary view to the student in the Analytics section.
4. THE Student_Model SHALL be updated by each of the following events: Study_Session completion, flashcard review rating, quiz answer submission, Answer Optimizer evaluation, and homework generation.
5. THE Student_Model SHALL never require manual editing by the student — all updates SHALL be inferred from interactions.

---

### FR-026: Adaptive Answer Behavior Driven by Student Model

**User Story:** As a student, I want the AI to automatically adjust the length, style, and complexity of answers based on my learning history, so that I get the right level of explanation without configuring anything.

#### Acceptance Criteria

1. WHEN the Answer_Generator produces a response, THE AI_Gateway SHALL read the Student_Model's preferred answer length, explanation style, and topic confidence before dispatching the generation request.
2. WHEN a student's topic confidence for a subject area falls below 40, THE Answer_Generator SHALL include a foundational definition and a worked example in the response, even if not explicitly requested.
3. WHEN a student's topic confidence for a subject area exceeds 75, THE Answer_Generator SHALL omit introductory definitions and use technical vocabulary without simplification.
4. WHEN the student's preferred explanation style is "Visual", THE Answer_Generator SHALL include diagram labels, structured tables, or ASCII-art representations where applicable.
5. THE Student_Model SHALL update the student's preferred answer length signal after each interaction where the student explicitly requests a shorter or longer answer.

#### Correctness Properties

- **Invariant:** FOR ALL Answer_Generator invocations, the Student_Model snapshot used SHALL be the most recent persisted version at the time of the call — the generator SHALL NOT use stale profile data older than 5 minutes.

---

### FR-027: Long-Term Academic Memory (No Re-Asking)

**User Story:** As a student, I want the system to remember my university, subjects, exam dates, weak topics, and preferences permanently, so that I never have to provide the same context twice.

#### Acceptance Criteria

1. THE Backend SHALL persist all context established during onboarding, Study_Sessions, and profile updates in the Student_Model and associated records.
2. WHEN any AI agent requires student context (university, semester, subject, exam date, weak topics, preferred style), THE Backend SHALL retrieve it from the Student_Model without prompting the student.
3. THE System SHALL never display a context-gathering prompt for information already present in the Student_Model.
4. WHEN a student's exam date is set for a subject, THE Academic_Planner SHALL incorporate it into all subsequent scheduling decisions for that subject without re-asking.
5. THE Backend SHALL retain Student_Model data for a minimum of 24 months after the student's last login.

---

### FR-028: Weak Topic Detection and Tracking

**User Story:** As a student, I want the system to automatically identify which topics I struggle with, so that it can prioritize them in revision and practice without me having to guess my weak areas.

#### Acceptance Criteria

1. THE Student_Model SHALL flag a topic as "weak" when any of the following conditions are met: quiz accuracy for the topic falls below 60% in the last 3 attempts, the Answer Optimizer scores a student's answer below 5/10 for that topic twice, or the student explicitly marks the topic as weak.
2. WHEN a topic is flagged as weak, THE Academic_Planner SHALL increase the topic's weight in future Study_Session recommendations and flashcard scheduling.
3. THE App SHALL display the student's current weak topics in the Semester_Workspace and Subject_Workspace.
4. WHEN a topic's quiz accuracy improves above 75% in the last 3 attempts, THE Student_Model SHALL downgrade the topic from "weak" to "improving".
5. THE Student_Model SHALL log the reason for each weak-topic flag (quiz accuracy / answer quality / manual) for display in the Analytics section.

#### Correctness Properties

- **Invariant:** FOR ALL topics, the weak_flag SHALL be consistent with the stored quiz_accuracy and answer_optimizer_score history — no topic SHALL be flagged "weak" if the above thresholds have not been met.
- **Metamorphic:** A topic that is flagged "weak" and then answered correctly 3 times in a row SHALL have its weak_flag status set to "improving", never to a stronger "weak" classification.

---

## Feature Area 10: AI Behavior Rules (Cross-Cutting)

### FR-029: Context Reuse — Never Re-Ask Known Information

**User Story:** As a student, I want every AI agent to use the context I've already provided, so that I'm never asked "which subject?" or "which semester?" in any workflow after onboarding.

#### Acceptance Criteria

1. THE System SHALL not present any prompt asking for semester, subject, university, or exam date when that information is already stored in the Student_Model.
2. WHEN a student initiates any workflow (Study, PYQ, Answer, Flashcard, Homework), THE Backend SHALL pre-populate the workflow context from the Student_Model and the active Subject_Workspace.
3. THE AI_Gateway SHALL include the Student_Model context snapshot in every agent invocation request as a required parameter.
4. IF a workflow requires context that is genuinely unavailable in the Student_Model (e.g., a new exam date the student has not set), THEN THE App SHALL ask for only the missing field, not all context fields.

---

### FR-030: Source Grounding — Prefer Student's Own Notes

**User Story:** As a student, I want AI responses to cite my uploaded notes rather than generic web content, so that answers are relevant to how my subject is actually taught.

#### Acceptance Criteria

1. THE RAG_Engine SHALL always attempt Vector_Store retrieval against the student's uploaded Resources before generating a response.
2. WHEN relevant chunks are found in the student's notes (cosine similarity ≥ 0.70), THE Answer_Generator SHALL ground its response in those chunks and cite them.
3. WHEN a response uses general knowledge (no matching chunks found), THE Answer_Generator SHALL include a visible disclaimer: "This answer is based on general knowledge. Upload your subject notes for a more tailored response."
4. THE Quality_Verifier SHALL reject any response that contains a citation to a document not present in the student's Vector_Store.

---

### FR-031: AI Gateway — Model Routing

**User Story:** As the platform operator, I want AI tasks routed to the cheapest capable model, so that operational costs are controlled without degrading output quality.

#### Acceptance Criteria

1. THE AI_Gateway SHALL route each task type to a designated model tier: local/free models for OCR, embeddings, flashcard generation, and quiz generation; cloud/premium models for Answer Generation, Answer Optimizer scoring, and complex RAG reasoning.
2. THE AI_Gateway SHALL allow model assignments to be reconfigured per task type without a code deployment.
3. WHEN a designated model is unavailable, THE AI_Gateway SHALL fall back to the next configured model for that task and log the fallback event.
4. THE AI_Gateway SHALL record model name, latency, token count, and estimated cost for every agent invocation for operational monitoring.

#### Correctness Properties

- **Round-trip:** A model routing configuration written to THE AI_Gateway SHALL be read back without loss or modification when queried by the configuration API.

---

### FR-032: Quality Verification on AI Output

**User Story:** As a student, I want AI-generated content to be checked before it's shown to me, so that I don't study from answers that are factually wrong or structurally incomplete.

#### Acceptance Criteria

1. THE Quality_Verifier SHALL run on every Answer_Generator, PYQ_Engine answer, and Homework_Agent output before it is returned to the student.
2. THE Quality_Verifier SHALL check: factual consistency with retrieved source chunks (if any), absence of fabricated citations, word count within target range, and structural completeness for the selected format.
3. WHEN the Quality_Verifier detects a violation, THE Backend SHALL either automatically regenerate the response (for fixable issues) or return the response with a visible quality warning to the student.
4. THE Quality_Verifier SHALL complete its checks within 3 seconds to stay within overall response latency budgets.
5. THE Backend SHALL log all Quality_Verifier rejections and the specific violation type for monitoring and model improvement.

---

## Feature Area 11: Resource Auto-Intelligence (Post-Upload Generation)

### FR-033: Automatic Resource Intelligence Generation

**User Story:** As a student, I want the system to automatically generate summaries, key topics, and expected exam questions from every document I upload, so that I get study value from my material immediately without manually asking for it.

#### Acceptance Criteria

1. WHEN a Resource finishes processing (OCR, knowledge graph, embeddings complete), THE Backend SHALL automatically trigger generation of: a summary (≤ 200 words), a key-topics list (5–15 bullet points), a flashcard set (per FR-020), a definition list, a viva question set (5–10 questions), and a set of expected exam questions (3–7 questions per unit covered).
2. THE Backend SHALL run automatic generation tasks asynchronously without blocking the student's access to the resource.
3. WHEN auto-generation for a resource completes, THE App SHALL surface the generated content in the corresponding Subject_Workspace tabs (Notes overview, Flashcards, PYQs).
4. THE App SHALL display per-resource generation status ("Generating smart content…", "Ready") and allow the student to re-trigger generation if it fails.
5. WHEN a resource is deleted, THE Backend SHALL remove all auto-generated content associated with that resource, including embeddings and flashcards.

#### Correctness Properties

- **Invariant:** FOR ALL Resources with status "Ready", the associated flashcard set, summary, and key-topics list SHALL exist and be non-empty in the Backend.

---

## Feature Area 12: Camera Notes (MVP Scope)

### FR-034: Photograph-to-Note Pipeline

**User Story:** As a student, I want to photograph whiteboard or handwritten notes and have them automatically cleaned up and organized, so that I can capture lecture content on the go without typing.

#### Acceptance Criteria

1. THE App SHALL provide a Camera Notes capture mode accessible from the Semester_Workspace quick-action bar.
2. WHEN the student captures a photo via Camera Notes, THE App SHALL upload the image as a Resource and route it through the Document_Processor OCR pipeline (FR-005).
3. WHEN OCR completes for a Camera Notes image, THE Backend SHALL apply text cleaning (remove artifacts, normalize whitespace, correct common OCR errors) before storing the extracted text.
4. THE Backend SHALL automatically trigger Resource Intelligence generation (FR-033) for every Camera Notes Resource upon OCR completion.
5. IF the captured image quality is too low for OCR (confidence below 40%), THEN THE App SHALL prompt the student to retake the photo with guidance on lighting and focus.

---

## Feature Area 13: Notifications and Study Reminders

### FR-035: Context-Specific Smart Notifications

**User Story:** As a student, I want notifications that are specific and actionable (e.g., "Your DBMS exam is in 4 days — practice these 5 questions"), so that reminders actually help me take the right action.

#### Acceptance Criteria

1. THE App SHALL request notification permissions during onboarding.
2. WHERE the student has granted notification permissions, THE Academic_Planner SHALL send context-specific push notifications including at minimum: exam countdown reminders (7 days, 3 days, 1 day before), due flashcard review reminders, and homework due-date reminders.
3. WHEN an exam countdown notification is sent, it SHALL include the top-3 recommended practice questions for that exam derived from the PYQ_Engine priority list.
4. THE App SHALL never send a generic "time to study" notification — all notifications SHALL reference specific subjects, topics, or tasks from the student's current data.
5. THE App SHALL allow the student to configure notification preferences (enable/disable per type, quiet hours) in Settings.
6. IF the student has no study activity for 48 hours and has upcoming exams within 7 days, THEN THE Academic_Planner SHALL send a re-engagement notification referencing the nearest exam.

---

## Feature Area 14: Analytics Dashboard (MVP Foundation)

### FR-036: Per-Subject Analytics

**User Story:** As a student, I want to see my learning progress and exam readiness for each subject, so that I can make informed decisions about where to spend more study time.

#### Acceptance Criteria

1. THE App SHALL provide an Analytics tab within each Subject_Workspace displaying: knowledge coverage percentage by unit, weak/strong unit list, total study time logged, total flashcard reviews, quiz accuracy trend (last 7 days), and current exam readiness score (0–100).
2. THE Analytics Agent SHALL compute the exam readiness score from: knowledge coverage (30%), revision consistency (20%), quiz accuracy (25%), PYQ coverage (15%), and study session frequency (10%).
3. WHEN the student's exam readiness score changes by ≥ 5 points in either direction, THE App SHALL display a delta indicator ("↑ 7 points this week") on the Analytics tab.
4. THE App SHALL display an improvement curve graph showing the exam readiness score over the past 30 days.

---

### FR-037: Semester-Level Academic Health Score

**User Story:** As a student, I want a single composite score reflecting my overall academic health this semester, so that I can tell at a glance if I'm on track without reviewing every subject individually.

#### Acceptance Criteria

1. THE App SHALL display an Academic Health Score (0–100) on the Semester_Workspace home screen.
2. THE Analytics Agent SHALL compute the Academic Health Score as a weighted aggregate of per-subject exam readiness scores, homework completion rate, and revision consistency.
3. WHEN the Academic Health Score drops below 50, THE App SHALL surface a prompt recommending the highest-impact action (e.g., "You haven't revised DBMS in 8 days — start a 20-minute session").
4. THE Academic Health Score SHALL update within 5 minutes of any Study_Session completion, quiz submission, or flashcard review batch.

#### Correctness Properties

- **Invariant:** THE Academic Health Score SHALL always be a value in the range [0, 100] inclusive.
- **Metamorphic:** Completing a study session for any subject SHALL NOT decrease the Academic Health Score below its pre-session value.

---

## Feature Area 15: Data Integrity and Security

### FR-038: Data Isolation Between Students

**User Story:** As a student, I want my uploaded notes and generated content to be completely private, so that no other student can access my academic material.

#### Acceptance Criteria

1. THE Backend SHALL enforce row-level data isolation so that all API responses return only data belonging to the authenticated student.
2. THE Vector_Store SHALL scope all embedding queries by student identifier — cross-student retrieval SHALL be architecturally impossible without an explicit admin override.
3. THE Backend SHALL validate the authenticated user's identity on every API request before returning any student-owned resource, note, flashcard, or profile data.
4. IF an API request attempts to access a resource belonging to a different student, THEN THE Backend SHALL return HTTP 403 and log the access attempt.

#### Correctness Properties

- **Invariant:** FOR ALL API responses, every returned record SHALL have an owner_id equal to the authenticated student's user identifier.

---

### FR-039: Secure File Storage

**User Story:** As a student, I want my uploaded files stored securely, so that they are not accessible by unauthenticated parties.

#### Acceptance Criteria

1. THE Backend SHALL store all uploaded Resources in object storage using server-side encryption at rest.
2. THE Backend SHALL generate time-limited pre-signed URLs (expiry ≤ 1 hour) for file access rather than exposing permanent public URLs.
3. WHEN a pre-signed URL is requested for a Resource, THE Backend SHALL verify that the requesting student is the Resource's owner before issuing the URL.
4. THE Backend SHALL enforce HTTPS for all data in transit between the App, Backend, and object storage.

---

## Feature Area 16: Offline Access (MVP Foundation)

### FR-040: Offline Flashcard Review

**User Story:** As a student, I want to review flashcards without an internet connection, so that I can study on the bus or in areas with poor connectivity.

#### Acceptance Criteria

1. THE App SHALL download and cache the student's due flashcards for the next 24 hours when an internet connection is available.
2. WHILE the device is offline, THE App SHALL allow the student to review downloaded flashcards and record ratings locally.
3. WHEN the device reconnects to the internet, THE App SHALL synchronize offline flashcard ratings to the Backend and update spaced-repetition intervals accordingly.
4. THE App SHALL display an "Offline mode" indicator when the device has no internet connection.
5. WHEN offline sync completes, THE App SHALL confirm to the student that locally recorded ratings have been saved.

#### Correctness Properties

- **Round-trip:** A flashcard rating recorded offline and then synced SHALL produce the same spaced-repetition interval update as if the rating had been submitted online in real time.
- **Idempotence:** Syncing the same offline session data twice (e.g., due to a retry) SHALL NOT produce duplicate rating records or incorrect interval calculations.

---

## Non-Goals (Explicitly Out of Scope for MVP)

The following features are deferred to post-MVP phases per `idea.md` Section 20 and 22:

- Faculty dashboard and question-paper generation tools
- Parent dashboard
- Group study and peer collaboration
- Placement / career mode
- Coding-lab hint engine
- Research-paper assistant
- Voice-based Viva Engine (Teacher Mode) — deferred to Phase 3
- Practical file generator — deferred to Phase 4
- Smart Revision Engine with forgetting-curve scheduling — deferred to Phase 4
- Multi-university content scaling
- Professional certification content (AWS, Oracle, Cisco)

---

## Appendix: Requirement Coverage Map

| Requirement | idea.md Section    | Workflow              |
| ----------- | ------------------ | --------------------- |
| FR-001      | §22 Phase 1        | Auth                  |
| FR-002      | §8 Onboarding      | Onboarding            |
| FR-003      | §8, §22 Phase 1    | File Upload           |
| FR-004      | §8, §11            | Auto-classification   |
| FR-005      | §21 OCR            | Document Processing   |
| FR-006      | §11, §21           | Knowledge Graph       |
| FR-007      | §21 pgvector       | Vector Search         |
| FR-008      | §8 Step 3          | Upload UX             |
| FR-009      | §9                 | Semester Workspace    |
| FR-010      | §10                | Subject Workspace     |
| FR-011      | §14 Goal Modes     | Study Chat            |
| FR-012      | §22 Phase 1        | RAG Chat              |
| FR-013      | §19 Study Sessions | Session Persistence   |
| FR-014–016  | §17.2              | PYQ Engine            |
| FR-017–019  | §17.3, §17.4       | Answer Generation     |
| FR-020–022  | §17.8              | Flashcard Engine      |
| FR-023–024  | §17.6              | Homework              |
| FR-025–028  | §12, §13, §16      | Student Digital Twin  |
| FR-029–032  | §18                | AI Behavior Rules     |
| FR-033      | §11                | Resource Intelligence |
| FR-034      | §19 Camera Notes   | Camera Notes          |
| FR-035      | §19 Notifications  | Notifications         |
| FR-036–037  | §17.12             | Analytics             |
| FR-038–039  | §21 Auth/Storage   | Security              |
| FR-040      | §19 Offline Mode   | Offline Access        |
