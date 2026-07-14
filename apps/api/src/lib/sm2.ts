/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * Rating:
 * 0 - Again
 * 1 - Hard
 * 2 - Good
 * 3 - Easy
 */

export interface SM2Result {
  intervalDays: number;
  easeFactor: number;
  dueDate: Date;
}

export function calculateSM2(
  rating: number,
  currentIntervalDays: number,
  currentEaseFactor: number
): SM2Result {
  let intervalDays: number;
  let easeFactor: number;

  if (rating === 0) {
    // Again
    intervalDays = 1;
    easeFactor = Math.max(1.3, currentEaseFactor - 0.2);
  } else {
    // Calculate new ease factor
    // EF = EF + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02))
    // Our ratings: 1=Hard, 2=Good, 3=Easy. SM2 maps them slightly differently, but we can simplify:
    if (rating === 1) easeFactor = currentEaseFactor - 0.15; // Hard
    else if (rating === 2) easeFactor = currentEaseFactor; // Good
    else easeFactor = currentEaseFactor + 0.15; // Easy

    easeFactor = Math.max(1.3, Math.min(2.5, easeFactor));

    if (currentIntervalDays === 0) {
      intervalDays = 1;
    } else if (currentIntervalDays === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(currentIntervalDays * easeFactor);
    }
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + intervalDays);

  return { intervalDays, easeFactor, dueDate };
}
