import { create } from 'zustand';

/**
 * Zustand store for the offline operation queue.
 *
 * When the device has no network connection, flashcard review ratings are
 * held in this queue. On reconnect, the app calls
 * POST /api/flashcards/sync with the full queue (idempotent — each entry
 * carries a client-generated UUID to prevent duplicates server-side).
 *
 * FR-040: Offline mode — pending reviews must survive app restarts.
 *         MMKV persistence is wired via the `persist` middleware in a
 *         follow-up task; the store is functional in-memory here.
 */

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface PendingReview {
  /** Client-generated UUID to ensure idempotency on sync. */
  clientId: string;
  flashcardId: string;
  rating: ReviewRating;
  reviewedAt: string; // ISO 8601 timestamp
}

export interface OfflineState {
  /** Queue of flashcard reviews awaiting server sync. */
  pendingReviews: PendingReview[];
  /** Add a review to the queue (called while offline). */
  enqueueReview: (review: PendingReview) => void;
  /** Remove synced reviews from the queue by their clientIds. */
  dequeueReviews: (clientIds: string[]) => void;
  /** Clear the entire queue (used after a full successful sync). */
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  pendingReviews: [],

  enqueueReview: (review) =>
    set((state) => ({
      pendingReviews: [...state.pendingReviews, review],
    })),

  dequeueReviews: (clientIds) =>
    set((state) => ({
      pendingReviews: state.pendingReviews.filter(
        (r) => !clientIds.includes(r.clientId),
      ),
    })),

  clearQueue: () => set({ pendingReviews: [] }),
}));
