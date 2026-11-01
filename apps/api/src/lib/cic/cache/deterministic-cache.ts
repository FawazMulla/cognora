import crypto from 'crypto';

export interface CacheEntry<T> {
  key: string;
  data: T;
  createdAt: number;
  hitCount: number;
  expiresAt: number;
}

export class DeterministicAnswerCache {
  private static cache = new Map<string, CacheEntry<any>>();
  private static MAX_ENTRIES = 500;
  private static DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generates a stable cryptographic fingerprint for an academic query
   */
  public static generateKey(params: {
    query: string;
    marks?: number | undefined;
    subjectCode?: string | undefined;
    intent?: string | undefined;
    language?: string | undefined;
  }): string {
    const normalized = `${params.query.trim().toLowerCase()}|${params.marks || 10}|${params.subjectCode || 'ANY'}|${params.intent || 'ANSWER'}|${params.language || 'english'}`;
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Immediate zero-delay cache lookup
   */
  public static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.data as T;
  }

  /**
   * Store item with eviction if cache size exceeds limit
   */
  public static set<T>(key: string, data: T, ttlMs = this.DEFAULT_TTL_MS): void {
    if (this.cache.size >= this.MAX_ENTRIES) {
      // Evict oldest or least accessed entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      key,
      data,
      createdAt: Date.now(),
      hitCount: 0,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public static getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.MAX_ENTRIES,
    };
  }

  public static clear(): void {
    this.cache.clear();
  }
}
