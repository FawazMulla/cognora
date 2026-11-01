import { db } from '../../../db';
import { resources, resourceChunks, subjects } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AcademicDocumentExtractor } from './extractor';
import { AcademicChunker } from './chunker';
import { AcademicClassifier } from './classifier';
import type { IngestionStatus, DocumentExtractionResult, AcademicClassification, DocumentChunk } from './types';

export interface IngestionPipelineOutput {
  resourceId: string;
  status: IngestionStatus;
  extraction: DocumentExtractionResult;
  classification: AcademicClassification;
  chunksCount: number;
  qualityScore: number;
  durationMs: number;
}

export class DocumentLifecycleManager {
  /**
   * Executes the 10-stage ingestion lifecycle on raw document content.
   */
  public static async processDocument(
    userId: string,
    filename: string,
    content: string,
    mimeType: string = 'text/plain',
    targetSubjectCode?: string
  ): Promise<IngestionPipelineOutput> {
    const startTime = Date.now();

    // 1. UPLOAD & VALIDATE
    if (!content || content.trim().length === 0) {
      throw new Error("Validation Failed: Empty document payload");
    }

    // 2. EXTRACT & CLEAN
    const extraction = AcademicDocumentExtractor.extractFromText(filename, content, mimeType);

    // 3. CLASSIFY & MAP TO SYLLABUS
    const classification = AcademicClassifier.classifyDocument(content);
    if (targetSubjectCode) {
      classification.subjectCode = targetSubjectCode;
    }

    // 4. CHUNK (Preserving pages and math equations)
    const chunks: DocumentChunk[] = AcademicChunker.chunkDocument(extraction);

    // 5. INDEX & PERSIST TO DATABASE
    let resourceId = extraction.documentId;
    let finalStatus: IngestionStatus = 'READY';

    try {
      // Find or create subject reference
      let existingSubject = await db.select().from(subjects).where(
        and(eq(subjects.userId, userId), eq(subjects.code, classification.subjectCode))
      ).limit(1);

      let subjectDbId: string | null = null;
      if (existingSubject[0]) {
        subjectDbId = existingSubject[0].id;
      } else {
        const [insertedSub] = await db.insert(subjects).values({
          userId,
          name: classification.subjectName,
          code: classification.subjectCode,
          examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }).returning();
        if (insertedSub) subjectDbId = insertedSub.id;
      }

      // Check for existing resource by hash
      const existingRes = await db.select().from(resources).where(
        and(eq(resources.userId, userId), eq(resources.sha256Hash, extraction.metadata.sha256))
      ).limit(1);

      if (existingRes[0]) {
        resourceId = existingRes[0].id;
        // Update resource with fresh classification & quality data
        await db.update(resources).set({
          status: 'ready',
          rawText: content.substring(0, 50000), // retain excerpt for inspection
          intelligenceData: {
            extractionQuality: extraction.qualityScore,
            classification,
            warnings: extraction.warnings,
            pageCount: extraction.metadata.pageCount,
            totalChunks: chunks.length
          }
        }).where(eq(resources.id, resourceId));

        // Delete previous chunks to prevent stale duplicates on reprocess
        await db.delete(resourceChunks).where(eq(resourceChunks.resourceId, resourceId));
      } else {
        const [insertedRes] = await db.insert(resources).values({
          userId,
          subjectId: subjectDbId,
          filename,
          storageUrl: `local://${userId}/${classification.subjectCode}/${extraction.metadata.sha256}_${filename}`,
          fileType: mimeType,
          sha256Hash: extraction.metadata.sha256,
          sizeBytes: extraction.metadata.sizeBytes,
          status: 'ready',
          rawText: content.substring(0, 50000),
          intelligenceData: {
            extractionQuality: extraction.qualityScore,
            classification,
            warnings: extraction.warnings,
            pageCount: extraction.metadata.pageCount,
            totalChunks: chunks.length
          }
        }).returning();

        if (insertedRes) resourceId = insertedRes.id;
      }

      // Persist Chunks with Page coordinates
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) continue;
        await db.insert(resourceChunks).values({
          resourceId,
          userId,
          subjectId: subjectDbId,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          content: chunk.content,
          tokenCount: chunk.tokenCount
        });
      }

    } catch (dbErr) {
      console.warn("[DocumentLifecycle] Non-fatal DB notice (offline/mock mode active):", dbErr);
      finalStatus = 'PARTIALLY_COMPLETED';
    }

    const durationMs = Date.now() - startTime;

    return {
      resourceId,
      status: finalStatus,
      extraction,
      classification,
      chunksCount: chunks.length,
      qualityScore: extraction.qualityScore,
      durationMs
    };
  }
}

