import type { DocumentExtractionResult, DocumentChunk } from './types';

export class AcademicChunker {
  /**
   * Generates overlapping academic chunks with strict page and section coordinate retention.
   */
  public static chunkDocument(
    extraction: DocumentExtractionResult,
    targetTokens: number = 350,
    overlapTokens: number = 50
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const maxChars = targetTokens * 4;
    const overlapChars = overlapTokens * 4;

    let currentChunkText = '';
    let currentChunkPage = 1;
    let currentChunkSection = 'Overview';
    let chunkIndex = 0;

    for (const section of extraction.sections) {
      const sectionText = section.content.trim();
      if (!sectionText) continue;

      currentChunkPage = section.pageNumber;
      if (section.sectionTitle) currentChunkSection = section.sectionTitle;

      // If appending this section exceeds target chunk size and we already have content
      if (currentChunkText.length + sectionText.length > maxChars && currentChunkText.length > 0) {
        chunks.push({
          chunkIndex: chunkIndex++,
          pageNumber: currentChunkPage,
          content: currentChunkText.trim(),
          tokenCount: Math.ceil(currentChunkText.length / 4),
          sectionTitle: currentChunkSection,
          metadata: {
            documentId: extraction.documentId,
            filename: extraction.metadata.filename
          }
        });

        // Retain overlap from end of current chunk
        const overlapSlice = currentChunkText.slice(-overlapChars);
        currentChunkText = overlapSlice + '\n' + sectionText;
      } else {
        currentChunkText += (currentChunkText ? '\n\n' : '') + sectionText;
      }
    }

    // Flush final chunk
    if (currentChunkText.trim().length > 0) {
      chunks.push({
        chunkIndex: chunkIndex++,
        pageNumber: currentChunkPage,
        content: currentChunkText.trim(),
        tokenCount: Math.ceil(currentChunkText.length / 4),
        sectionTitle: currentChunkSection,
        metadata: {
          documentId: extraction.documentId,
          filename: extraction.metadata.filename
        }
      });
    }

    return chunks;
  }
}

