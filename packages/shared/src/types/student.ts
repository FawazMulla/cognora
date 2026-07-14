// Student Digital Twin & analytics types

export type AnswerLengthPreference = 'short' | 'medium' | 'long';
export type StylePreference = 'text' | 'visual' | 'bullet';
export type LearningPace = 'slow' | 'standard' | 'fast';
export type WeakFlag = 'none' | 'weak' | 'improving';
export type WeakReason = 'quiz_accuracy' | 'answer_quality' | 'manual';

export interface StudentModel {
  id: string;
  userId: string;
  preferredAnswerLength: AnswerLengthPreference;
  preferredStyle: StylePreference;
  learningPace: LearningPace;
  academicHealthScore: number;
  updatedAt: Date;
}

export interface StudentTopicProfile {
  id: string;
  userId: string;
  subjectId: string;
  topic: string;
  confidence: number;
  weakFlag: WeakFlag;
  weakReason?: WeakReason;
  definitionErrors: number;
  diagramErrors: number;
  numericalErrors: number;
  lastRevisedAt?: Date;
  revisionCount: number;
  updatedAt: Date;
}
