import { createHash } from 'crypto';
import type { DocumentExtractionResult, ExtractedSection, DocumentMetadata, SectionType } from './types';

export class AcademicDocumentExtractor {
  /**
   * Extracts structured academic sections, headings, formulas, and tables from raw input.
   */
  public static extractFromText(
    filename: string,
    rawContent: string,
    mimeType: string = 'text/plain'
  ): DocumentExtractionResult {
    const documentId = `doc_${createHash('sha256').update(rawContent).digest('hex').substring(0, 16)}`;
    const sha256 = createHash('sha256').update(rawContent).digest('hex');

    // Detect simulated or explicit page breaks
    const rawPages = rawContent.split(/\f|--- Page \d+ ---|\n{3,}(?=[A-Z0-9\s]{4,}\n[-=]{3,})/i);
    const pages = rawPages.length > 1 ? rawPages : this.chunkIntoVirtualPages(rawContent);

    const sections: ExtractedSection[] = [];
    const warnings: string[] = [];
    let currentSectionTitle = 'Introduction & Overview';
    let totalWordCount = 0;

    pages.forEach((pageText, pIdx) => {
      const pageNumber = pIdx + 1;
      const lines = pageText.split('\n');

      let currentParagraph = '';

      for (let l = 0; l < lines.length; l++) {
        const line = lines[l]?.trim() || '';
        if (!line) {
          if (currentParagraph) {
            sections.push(this.classifyParagraph(currentParagraph, pageNumber, currentSectionTitle));
            totalWordCount += currentParagraph.split(/\s+/).length;
            currentParagraph = '';
          }
          continue;
        }

        // Check if heading
        if (this.isHeading(line)) {
          if (currentParagraph) {
            sections.push(this.classifyParagraph(currentParagraph, pageNumber, currentSectionTitle));
            totalWordCount += currentParagraph.split(/\s+/).length;
            currentParagraph = '';
          }

          currentSectionTitle = line.replace(/^[#\d.\-\s]+/, '').trim();
          sections.push({
            pageNumber,
            sectionTitle: currentSectionTitle,
            content: line,
            sectionType: 'heading',
            headingLevel: line.startsWith('#') ? (line.match(/^#+/)?.[0].length || 2) : 2
          });
          continue;
        }

        // Check if table row (markdown pipe or tab-separated)
        if (line.includes('|') || line.split(/\t/).length >= 3) {
          if (currentParagraph) {
            sections.push(this.classifyParagraph(currentParagraph, pageNumber, currentSectionTitle));
            totalWordCount += currentParagraph.split(/\s+/).length;
            currentParagraph = '';
          }

          sections.push({
            pageNumber,
            sectionTitle: currentSectionTitle,
            content: line,
            sectionType: 'table'
          });
          continue;
        }

        // Check if formula
        if (this.isFormula(line)) {
          if (currentParagraph) {
            sections.push(this.classifyParagraph(currentParagraph, pageNumber, currentSectionTitle));
            totalWordCount += currentParagraph.split(/\s+/).length;
            currentParagraph = '';
          }

          sections.push({
            pageNumber,
            sectionTitle: currentSectionTitle,
            content: line,
            sectionType: 'formula'
          });
          continue;
        }

        // Check if bullet point
        if (/^[\*\-•]\s+|^\d+\.\s+/.test(line)) {
          if (currentParagraph) {
            sections.push(this.classifyParagraph(currentParagraph, pageNumber, currentSectionTitle));
            totalWordCount += currentParagraph.split(/\s+/).length;
            currentParagraph = '';
          }

          sections.push({
            pageNumber,
            sectionTitle: currentSectionTitle,
            content: line,
            sectionType: 'bullet'
          });
          continue;
        }

        // Accumulate body text
        currentParagraph += (currentParagraph ? ' ' : '') + line;
      }

      if (currentParagraph) {
        sections.push(this.classifyParagraph(currentParagraph, pageNumber, currentSectionTitle));
        totalWordCount += currentParagraph.split(/\s+/).length;
      }
    });

    // Compute quality metrics
    const qualityScore = this.computeExtractionQuality(rawContent, sections, totalWordCount, warnings);

    const metadata: DocumentMetadata = {
      filename,
      mimeType,
      sizeBytes: Buffer.byteLength(rawContent, 'utf8'),
      sha256,
      pageCount: pages.length,
      extractedAt: new Date().toISOString()
    };

    return {
      documentId,
      metadata,
      sections,
      rawText: rawContent,
      qualityScore,
      warnings
    };
  }

  private static chunkIntoVirtualPages(text: string, wordsPerPage: number = 380): string[] {
    const words = text.split(/\s+/);
    if (words.length <= wordsPerPage) return [text];

    const pages: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }
    return pages;
  }

  private static isHeading(line: string): boolean {
    if (line.startsWith('#')) return true;
    if (/^(Module|Unit|Chapter|Section|Part)\s+[0-9IVXLCDM]+/i.test(line)) return true;
    if (/^[A-Z0-9\s:\-\.]{4,60}$/.test(line) && line.split(/\s+/).length <= 8) return true;
    return false;
  }

  private static isFormula(line: string): boolean {
    if (line.includes('$$') || line.includes('\\[') || line.includes('\\begin{equation}')) return true;
    if (/[=+\-*/^]{2,}/.test(line) && /[PVO]\([A-Za-z0-9_,\s]+\)/.test(line)) return true;
    if (/(\∑|\∏|\∫|\√|\±|\≤|\≥|\≠|\∈|\∉|\∪|\∩)/.test(line)) return true;
    return false;
  }

  private static classifyParagraph(text: string, pageNumber: number, sectionTitle: string): ExtractedSection {
    let sectionType: SectionType = 'paragraph';
    if (this.isFormula(text)) sectionType = 'formula';
    else if (text.startsWith('```') || text.includes('function ') || text.includes('public class ')) sectionType = 'code';

    return {
      pageNumber,
      sectionTitle,
      content: text,
      sectionType
    };
  }

  private static computeExtractionQuality(
    rawText: string,
    sections: ExtractedSection[],
    wordCount: number,
    warnings: string[]
  ): number {
    if (!rawText || rawText.trim().length === 0) {
      warnings.push("Document appears empty or unreadable");
      return 0;
    }

    let score = 100;
    if (wordCount < 50) {
      warnings.push("Extracted word count is extremely low (< 50 words)");
      score -= 30;
    }

    const nonPrintableCount = (rawText.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
    if (nonPrintableCount > 20) {
      warnings.push("Detected binary or unprintable control characters");
      score -= 25;
    }

    if (sections.length === 0) {
      warnings.push("Zero structural sections parsed");
      score -= 40;
    }

    return Math.max(10, Math.min(100, score));
  }
}

