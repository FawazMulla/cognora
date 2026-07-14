/**
 * Password policy validation (FR-001.8)
 * Min 8 chars, at least one uppercase, one lowercase, one digit
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
}

/**
 * Validate allowed file types for upload (FR-003.1)
 */
const ALLOWED_FILE_TYPES = new Set(['pdf', 'ppt', 'pptx', 'jpeg', 'jpg', 'png', 'webp']);

export function isAllowedFileType(extension: string): boolean {
  return ALLOWED_FILE_TYPES.has(extension.toLowerCase().replace(/^\./, ''));
}

/**
 * Validate file size does not exceed 50 MB (FR-003.3)
 */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function isFileSizeAllowed(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/**
 * Validate semester range (1–10)
 */
export function isValidSemester(semester: number): boolean {
  return Number.isInteger(semester) && semester >= 1 && semester <= 10;
}
