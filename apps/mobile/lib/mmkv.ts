import { MMKV } from 'react-native-mmkv';

/**
 * MMKV instance for offline cache storage.
 *
 * Used for:
 *  - Caching flashcards due in the next 24 hours (offline review)
 *  - Storing the offline flashcard review rating queue
 *  - General non-sensitive app state (subject list cache, etc.)
 *
 * FR-040: Offline mode — flashcard reviews are cached locally and synced
 *         on reconnect via POST /api/flashcards/sync.
 */
export const storage = new MMKV({
  id: 'ai-academic-workspace',
});

// ---------------------------------------------------------------------------
// Typed helpers for common use-cases
// ---------------------------------------------------------------------------

/** Serialise and store a value under the given key. */
export function setItem<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

/** Retrieve and deserialise a value by key. Returns null if not found. */
export function getItem<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (raw === undefined) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Remove a value by key. */
export function removeItem(key: string): void {
  storage.delete(key);
}
