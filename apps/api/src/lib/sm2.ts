/**
 * FSRS-4.5 (Free Spaced Repetition Scheduler)
 * The modern successor to SM-2, used by Anki since 2023.
 * Models the forgetting curve using: R = e^(-t/S)
 * where R = Retrievability, t = elapsed days, S = Stability
 */

export interface FSRSResult {
  intervalDays: number;
  easeFactor: number;      // Kept for backward compatibility (maps to stability)
  stability: number;       // How many days until R drops to 90%
  difficulty: number;      // 1.0 (easy) to 10.0 (hard)
  retrievability: number;  // Current R value (0.0 to 1.0)
  dueDate: Date;
  grade: 'again' | 'hard' | 'good' | 'easy';
}

export interface SM2Result {
  intervalDays: number;
  easeFactor: number;
  dueDate: Date;
}

// FSRS-4.5 default weights (trained on 20M reviews)
const FSRS_WEIGHTS: number[] = [
  0.4072, 1.1829, 3.1262, 15.4722,
  7.2102, 0.5316, 1.0651, 0.0589,
  1.5330, 0.1544, 1.0040, 1.9813,
  0.0953, 0.2975, 2.2042, 0.2407,
  2.9466, 0.5034, 0.6567
];

const DESIRED_RETENTION = 0.90; // Target 90% retrievability

/**
 * Main FSRS-4.5 scheduling function.
 * Rating: 0=Again, 1=Hard, 2=Good, 3=Easy
 */
export function calculateFSRS(
  rating: number,
  currentIntervalDays: number,
  currentStability: number,
  currentDifficulty: number,
  elapsedDays: number
): FSRSResult {
  const grades: FSRSResult['grade'][] = ['again', 'hard', 'good', 'easy'];
  const grade = grades[Math.min(rating, 3)] || 'good';

  const w = FSRS_WEIGHTS;
  const initialStabilities = [w[0] ?? 0.4, w[1] ?? 1.2, w[2] ?? 3.1, w[3] ?? 15.4];

  let newStability: number;
  let newDifficulty: number;

  if (currentIntervalDays === 0) {
    // First review — initialize from rating
    newStability = initialStabilities[Math.min(rating, 3)] ?? (w[2] ?? 3.1);
    newDifficulty = initDifficulty(rating);
  } else {
    // Subsequent reviews
    const retrievability = computeRetrievability(elapsedDays, currentStability);
    newDifficulty = updateDifficulty(currentDifficulty, rating);

    if (rating === 0) {
      // Again — forgetting stability penalty
      newStability = forgettingStability(currentStability, currentDifficulty, retrievability);
    } else {
      // Hard / Good / Easy — recall stability gain
      newStability = recallStability(currentStability, currentDifficulty, retrievability, rating);
    }
  }

  // Clamp values to valid ranges
  newStability = Math.max(0.1, Math.min(36500, newStability));
  newDifficulty = Math.max(1.0, Math.min(10.0, newDifficulty));

  // Calculate interval: solve R = DESIRED_RETENTION for t
  // R = (0.9)^(t/S) → t = S * log(R) / log(0.9)
  let intervalDays: number;
  if (rating === 0) {
    intervalDays = 1; // Always reset to tomorrow for "Again"
  } else {
    intervalDays = Math.round(newStability * Math.log(DESIRED_RETENTION) / Math.log(0.9));
    intervalDays = Math.max(1, intervalDays);
    
    // Apply ±5% fuzz to avoid review date spikes
    const fuzz = 1 + (Math.random() - 0.5) * 0.1;
    intervalDays = Math.round(intervalDays * fuzz);
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + intervalDays);

  const currentRetrievability = currentIntervalDays > 0
    ? computeRetrievability(elapsedDays, currentStability)
    : 1.0;

  return {
    intervalDays,
    easeFactor: newStability, // Map stability → easeFactor for DB backward compat
    stability: newStability,
    difficulty: newDifficulty,
    retrievability: currentRetrievability,
    dueDate,
    grade
  };
}

/**
 * Backward-compatible SM-2 wrapper.
 * New code should call calculateFSRS directly.
 */
export function calculateSM2(
  rating: number,
  currentIntervalDays: number,
  currentEaseFactor: number
): SM2Result {
  const fsrs = calculateFSRS(
    rating,
    currentIntervalDays,
    currentEaseFactor,   // Use easeFactor as stability proxy for legacy cards
    5.0,                 // Default difficulty (mid-range)
    currentIntervalDays  // Assume full interval elapsed
  );
  return {
    intervalDays: fsrs.intervalDays,
    easeFactor: fsrs.easeFactor,
    dueDate: fsrs.dueDate
  };
}

// ==================== FSRS Helper Functions ====================

/**
 * Forgetting curve: R = (0.9)^(elapsed/stability)
 */
function computeRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(0.9, elapsedDays / stability);
}

/**
 * Initial difficulty based on first rating.
 * D₀(r) = w₄ - exp(w₅ * (r - 1)) + 1
 */
function initDifficulty(rating: number): number {
  const w = FSRS_WEIGHTS;
  return Math.max(1, Math.min(10, (w[4] ?? 7.2) - Math.exp((w[5] ?? 0.53) * (rating - 1)) + 1));
}

/**
 * Difficulty update: linear mean reversion toward initDifficulty
 * D' = D - w₆ * (r - 3) then revert toward D₀
 */
function updateDifficulty(d: number, rating: number): number {
  const w = FSRS_WEIGHTS;
  const delta = -(w[6] ?? 1.06) * (rating - 3);
  // Mean reversion: D' = w₇ * D₀(4) + (1 - w₇) * (D + delta)
  const d0Easy = initDifficulty(3);
  const newD = (w[7] ?? 0.05) * d0Easy + (1 - (w[7] ?? 0.05)) * (d + delta);
  return Math.max(1, Math.min(10, newD));
}

/**
 * Stability after successful recall.
 * S'_r = S * (e^(w₈) * (11 - D) * S^(-w₉) * (e^(w₁₀ * (1 - R)) - 1) * w₁₁(r) + 1)
 */
function recallStability(s: number, d: number, r: number, rating: number): number {
  const w = FSRS_WEIGHTS;
  // Rating multipliers: Hard=w15, Good=1, Easy=w16
  const ratingMultiplier = rating === 1 ? (w[15] ?? 0.24) : rating === 3 ? (w[16] ?? 2.94) : 1.0;
  const stabilityGain = Math.exp(w[8] ?? 1.53) * (11 - d) * Math.pow(s, -(w[9] ?? 0.15)) * (Math.exp((1 - r) * (w[10] ?? 1.0)) - 1) * ratingMultiplier;
  return s * (stabilityGain + 1);
}

/**
 * Stability after forgetting (rating=0).
 * S'_f = w₁₃ * D^(-w₁₄) * ((S + 1)^w₁₅ - 1) * e^(w₁₆ * (1 - R))
 */
function forgettingStability(s: number, d: number, r: number): number {
  const w = FSRS_WEIGHTS;
  return (w[11] ?? 1.98) * Math.pow(d, -(w[12] ?? 0.09)) * (Math.pow(s + 1, w[13] ?? 0.29) - 1) * Math.exp((1 - r) * (w[14] ?? 2.2));
}

/**
 * Compute the forgetting curve data points for visualization
 * Returns retrievability at each day for the next 30 days
 */
export function getForgettingCurve(stability: number, days: number = 30): { day: number; retrievability: number }[] {
  return Array.from({ length: days + 1 }, (_, day) => ({
    day,
    retrievability: parseFloat(computeRetrievability(day, stability).toFixed(3))
  }));
}
