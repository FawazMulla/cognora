/**
 * Date utility helpers
 */

/**
 * Add a number of days to a given date and return a new Date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Return today's date with time zeroed out.
 */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check whether a date is in the past (strictly before today).
 */
export function isPast(date: Date): boolean {
  return date < today();
}

/**
 * Check whether a date is today.
 */
export function isToday(date: Date): boolean {
  const t = today();
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === t.getTime();
}
