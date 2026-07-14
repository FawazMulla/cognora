// Shared application constants

/** Maximum file upload size in bytes (50 MB) — FR-003.3 */
export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

/** Default number of RAG chunks to retrieve — FR-007.3 */
export const DEFAULT_RAG_TOP_K = 5;

/** Minimum cosine similarity for RAG chunk retrieval */
export const RAG_MIN_SIMILARITY = 0.5;

/** Minimum cosine similarity for grounded citations */
export const CITATION_MIN_SIMILARITY = 0.7;

/** Maximum words for Quick Doubt mode responses — FR-011.4 */
export const QUICK_DOUBT_MAX_WORDS = 150;

/** Word ceilings per mark value — FR-017.2 */
export const WORD_CEILING: Record<number, number> = {
  2: 80,
  5: 250,
  10: 600,
};

/** Allowed word count tolerance (±15%) — FR-017 invariant */
export const WORD_COUNT_TOLERANCE = 0.15;

/** Flashcard generation: minimum cards per 300 words — FR-020.3 */
export const FLASHCARD_MIN_PER_300_WORDS = 1;

/** Flashcard generation: maximum cards per resource — FR-020.3 */
export const FLASHCARD_MAX_PER_RESOURCE = 50;

/** SM-2 ease factor bounds — design §4.4 */
export const SM2_EASE_MIN = 1.3;
export const SM2_EASE_MAX = 2.5;
export const SM2_EASE_DEFAULT = 2.5;
export const SM2_INTERVAL_DEFAULT = 1;

/** Study session inactivity timeout in ms (30 min) — FR-013.1 */
export const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/** PYQ priority thresholds — FR-015.4 */
export const PYQ_PRIORITY_HIGH_THRESHOLD = 3;
export const PYQ_PRIORITY_MEDIUM_THRESHOLD = 2;

/** Maximum study sessions in RAG context — FR-013.4 */
export const RAG_MAX_SESSION_HISTORY = 10;

/** Weak topic detection thresholds — FR-028 */
export const WEAK_TOPIC_QUIZ_ACCURACY_THRESHOLD = 0.6;
export const IMPROVING_TOPIC_QUIZ_ACCURACY_THRESHOLD = 0.75;
