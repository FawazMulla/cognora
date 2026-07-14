// Study session & RAG types

export type GoalMode = 'study' | 'exam' | 'revision' | 'quick_doubt' | 'crash_course';

export interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  goalMode: GoalMode;
  startedAt: Date;
  endedAt?: Date;
  durationSecs?: number;
  topicsCovered: string[];
  questionsAsked: number;
  weakConcepts: string[];
  quizScore?: number;
  profileSnapshot?: Record<string, unknown>;
  createdAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export interface Citation {
  documentName: string;
  resourceId: string;
  pageNumber: number;
}
