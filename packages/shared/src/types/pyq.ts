// PYQ (Previous Year Questions) types

export type PriorityLabel = 'High' | 'Medium' | 'Low';

export interface PYQQuestion {
  id: string;
  userId: string;
  subjectId: string;
  resourceId: string;
  canonicalId?: string;
  questionText: string;
  markValue?: number;
  examYear?: string;
  unitHeader?: string;
  priorityLabel?: PriorityLabel;
  repeatCount: number;
  knowledgeNodeId?: string;
  createdAt: Date;
}

export type AnswerFormat =
  'topper' | 'university' | 'concise' | 'revision' | 'bullet' | 'definition';

export interface AnswerBankEntry {
  id: string;
  pyqQuestionId: string;
  userId: string;
  format: AnswerFormat;
  markValue?: number;
  content: string;
  keyPoints: string[];
  invalidatedAt?: Date;
  createdAt: Date;
}
