/**
 * @workspace/shared — barrel export
 *
 * Central entry point for all shared types, utilities, and constants
 * used across apps/api and apps/mobile.
 */

// Types
export type { User, Session, RegisterPayload, LoginPayload, AuthResponse } from './types/auth.js';

export type { AcademicProfile, Subject, OnboardingPayload } from './types/academic.js';

export type {
  FileType,
  ResourceStatus,
  Resource,
  ResourceChunk,
  ProcessingStageLabel,
} from './types/resource.js';

export type { GoalMode, StudySession, ChatMessage, Citation } from './types/study.js';

export type { PriorityLabel, PYQQuestion, AnswerFormat, AnswerBankEntry } from './types/pyq.js';

export type {
  AnswerLengthPreference,
  StylePreference,
  LearningPace,
  WeakFlag,
  WeakReason,
  StudentModel,
  StudentTopicProfile,
} from './types/student.js';

export type { CardType, ReviewRating, Flashcard, SM2Input, SM2Output } from './types/flashcard.js';

// Utilities
export {
  isValidPassword,
  isAllowedFileType,
  MAX_FILE_SIZE_BYTES,
  isFileSizeAllowed,
  isValidSemester,
} from './utils/validation.js';

export { addDays, today, isPast, isToday } from './utils/date.js';

// Constants
export {
  MAX_UPLOAD_SIZE_BYTES,
  DEFAULT_RAG_TOP_K,
  RAG_MIN_SIMILARITY,
  CITATION_MIN_SIMILARITY,
  QUICK_DOUBT_MAX_WORDS,
  WORD_CEILING,
  WORD_COUNT_TOLERANCE,
  FLASHCARD_MIN_PER_300_WORDS,
  FLASHCARD_MAX_PER_RESOURCE,
  SM2_EASE_MIN,
  SM2_EASE_MAX,
  SM2_EASE_DEFAULT,
  SM2_INTERVAL_DEFAULT,
  SESSION_INACTIVITY_TIMEOUT_MS,
  PYQ_PRIORITY_HIGH_THRESHOLD,
  PYQ_PRIORITY_MEDIUM_THRESHOLD,
  RAG_MAX_SESSION_HISTORY,
  WEAK_TOPIC_QUIZ_ACCURACY_THRESHOLD,
  IMPROVING_TOPIC_QUIZ_ACCURACY_THRESHOLD,
} from './utils/constants.js';
