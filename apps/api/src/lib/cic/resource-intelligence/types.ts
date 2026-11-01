// Academic Resource Intelligence Types
// Defines the 10-stage lifecycle, extracted structures, and syllabus classification contracts

export type IngestionStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'EXTRACTING'
  | 'OCR_PROCESSING'
  | 'CLASSIFYING'
  | 'MAPPING'
  | 'INDEXING'
  | 'READY'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED';

export type SectionType =
  | 'heading'
  | 'paragraph'
  | 'bullet'
  | 'table'
  | 'formula'
  | 'code';

export interface ExtractedSection {
  pageNumber: number;
  sectionTitle?: string | undefined;
  content: string;
  sectionType: SectionType;
  headingLevel?: number | undefined;
  startOffset?: number | undefined;
  endOffset?: number | undefined;
}

export interface DocumentMetadata {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  pageCount: number;
  extractedAt: string;
}

export interface DocumentExtractionResult {
  documentId: string;
  metadata: DocumentMetadata;
  sections: ExtractedSection[];
  rawText: string;
  qualityScore: number; // 0 to 100
  warnings: string[];
}

export interface AcademicClassification {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  moduleNumber: number;
  moduleTitle: string;
  topicId?: string | undefined;
  topicTitle?: string | undefined;
  confidence: number; // 0.0 to 1.0
  requiresUserConfirmation: boolean;
  courseOutcomes: string[];
  matchedKeywords: string[];
}

export interface DocumentChunk {
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
  sectionTitle?: string;
  metadata: {
    documentId: string;
    filename: string;
    subjectCode?: string;
    moduleNumber?: number;
    topicId?: string;
  };
}
