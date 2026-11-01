// Academic Knowledge Management Types

export type AcademicSourceType =
  | 'OFFICIAL_SYLLABUS'
  | 'UNIVERSITY_PYQ'
  | 'FACULTY_MATERIAL'
  | 'STUDENT_UPLOAD'
  | 'TEXTBOOK'
  | 'EXTERNAL_EDUCATIONAL'
  | 'AI_GENERATED';

export type CitationVerificationStatus =
  | 'VERIFIED'
  | 'OFFICIAL_SYLLABUS'
  | 'UNVERIFIED'
  | 'NOT_FOUND';

export interface AcademicCitation {
  sourceId: string;
  sourceTitle: string;
  sourceType: AcademicSourceType;
  pageNumber?: number | undefined;
  sectionHeading?: string | undefined;
  extractedSnippet: string;
  sourceUrl?: string | undefined;
  verificationStatus: CitationVerificationStatus;
}

export interface AcademicEvidence {
  citations: AcademicCitation[];
  sufficientEvidence: boolean;
  unsupportedClaimsDetected: boolean;
  evidenceSummary: string;
}
