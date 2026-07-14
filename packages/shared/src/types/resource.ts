// Resource & document types

export type FileType = 'pdf' | 'pptx' | 'jpeg' | 'png' | 'webp';

export type ResourceStatus =
  | 'pending'
  | 'classifying'
  | 'ocr'
  | 'embedding'
  | 'graphing'
  | 'generating'
  | 'ready'
  | 'error'
  | 'unreadable';

export interface Resource {
  id: string;
  userId: string;
  subjectId: string;
  filename: string;
  storageUrl: string;
  fileType: FileType;
  sha256Hash: string;
  sizeBytes: number;
  status: ResourceStatus;
  errorMessage?: string;
  createdAt: Date;
}

export interface ResourceChunk {
  id: string;
  resourceId: string;
  userId: string;
  subjectId: string;
  chunkIndex: number;
  pageNumber?: number;
  content: string;
  tokenCount?: number;
  createdAt: Date;
}

export type ProcessingStageLabel =
  | 'Reading document'
  | 'Understanding chapters'
  | 'Extracting key concepts'
  | 'Mapping syllabus'
  | 'Building workspace';
