// Flashcard & spaced repetition types

export type CardType = 'basic' | 'concept' | 'formula' | 'revision';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  userId: string;
  subjectId: string;
  sourceResourceId: string;
  sourceChunkIndex: number;
  cardType: CardType;
  front: string;
  back: string;
  originalFront?: string;
  originalBack?: string;
  isStudentCurated: boolean;
  isArchived: boolean;
  // SM-2 spaced repetition fields
  intervalDays: number;
  easeFactor: number;
  dueDate: Date;
  reviewCount: number;
  correctRecallRate: number;
  lastReviewedAt?: Date;
  createdAt: Date;
}

export interface SM2Input {
  intervalDays: number;
  easeFactor: number;
  rating: ReviewRating;
}

export interface SM2Output {
  intervalDays: number;
  easeFactor: number;
  dueDate: Date;
}
